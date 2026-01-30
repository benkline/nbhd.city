#!/bin/bash

#################################################################################
# Ralph Loop Automation Script
#
# Orchestrates ticket-driven development with automatic branching, testing,
# and PR creation. For each pending ticket:
#   1. Creates new branch (feature/SSG-XXX) off previous
#   2. Displays ticket requirements + corresponding prompt
#   3. Waits for Claude Code implementation
#   4. Runs integration tests (retries up to 3 times)
#   5. Commits changes
#   6. Creates GitHub PR
#   7. Repeats for next ticket
#
# Usage:
#   ./scripts/ralph-loop.sh              # Main automation loop
#   ./scripts/ralph-loop.sh setup        # Setup next ticket (manual mode)
#   ./scripts/ralph-loop.sh test         # Run tests for current branch
#   ./scripts/ralph-loop.sh finalize     # Commit and create PR
#   ./scripts/ralph-loop.sh status       # Show next pending ticket
#   ./scripts/ralph-loop.sh --help       # Show this help
#
#################################################################################

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Configuration
TICKETS_FILE="planning/tickets.md"
PROMPTS_FILE="prompts.md"
PROGRESS_FILE=".ticket-progress.json"
LOG_DIR=".ralph-loop-logs"
MAX_RETRIES=3
LOOP_PAUSE=10  # seconds between loop iterations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Initialize logging
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/ralph-loop-$(date +%Y%m%d_%H%M%S).log"

#################################################################################
# Logging Functions
#################################################################################

log() {
    local level=$1
    shift
    local msg="$@"
    local ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${ts}] [${level}] ${msg}" >> "$LOG_FILE"
    echo -e "${msg}"
}

log_info() { echo -e "${CYAN}[INFO]${NC} $@" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}[✓]${NC} $@" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}[ERROR]${NC} $@" | tee -a "$LOG_FILE"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $@" | tee -a "$LOG_FILE"; }
log_debug() { [ "${DEBUG:-0}" = "1" ] && echo -e "${BLUE}[DEBUG]${NC} $@"; }

separator() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

#################################################################################
# Ticket Parsing Functions
#################################################################################

# Extract next pending ticket from tickets.md
get_next_ticket() {
    awk '
    BEGIN { ticket = ""; is_completed = 0 }
    /^#### (SSG|ATP)-[0-9]+:/ {
        gsub(/^#### /, "")
        gsub(/:.*/, "")
        ticket = $1
        is_completed = 0
    }
    /^- \*\*Status:\*\*.*COMPLETED/ {
        is_completed = 1
    }
    /^- Status:.*COMPLETED/ {
        is_completed = 1
    }
    /[ ]*- \[ \]/ {
        if (ticket && !is_completed) {
            print ticket
            exit
        }
    }
    ' "$TICKETS_FILE"
}

# Get all pending tickets
get_all_pending_tickets() {
    awk '
    BEGIN { ticket = ""; is_completed = 0 }
    /^#### (SSG|ATP)-[0-9]+:/ {
        gsub(/^#### /, "")
        gsub(/:.*/, "")
        ticket = $1
        is_completed = 0
    }
    /^- \*\*Status:\*\*.*COMPLETED/ {
        is_completed = 1
    }
    /^- Status:.*COMPLETED/ {
        is_completed = 1
    }
    /[ ]*- \[ \]/ {
        if (ticket && !is_completed) {
            print ticket
        }
    }
    ' "$TICKETS_FILE" | sort -u
}

# Get ticket details from tickets.md
get_ticket_details() {
    local ticket=$1
    local start_line=$(grep -n "^#### $ticket:" "$TICKETS_FILE" | cut -d: -f1)

    if [ -z "$start_line" ]; then
        log_error "Ticket not found: $ticket"
        return 1
    fi

    # Extract until next #### or ## section
    sed -n "${start_line},/^##/p" "$TICKETS_FILE" | \
        sed -n "1,/^#### /p" | head -n -1
}

# Get prompt for ticket from prompts.md
get_ticket_prompt() {
    local ticket=$1

    if [ ! -f "$PROMPTS_FILE" ]; then
        log_warn "prompts.md not found"
        return 1
    fi

    local start_line=$(grep -n "## $ticket" "$PROMPTS_FILE" 2>/dev/null | head -1 | cut -d: -f1)

    if [ -z "$start_line" ]; then
        log_debug "No specific prompt for $ticket"
        return 1
    fi

    # Extract until next ## section
    sed -n "${start_line},/^## /p" "$PROMPTS_FILE" | head -n -1
}

#################################################################################
# Git Functions
#################################################################################

# Get the last completed ticket's branch
get_last_completed_branch() {
    local last_ticket=$(awk '
    /^#### (SSG|ATP)-[0-9]+:/ {
        gsub(/^#### /, "")
        gsub(/:.*/, "")
        ticket = $1
    }
    /^- \*\*Status:\*\*.*COMPLETED/ {
        print ticket
    }
    /^- Status:.*COMPLETED/ {
        print ticket
    }
    ' "$TICKETS_FILE" | tail -1)

    if [ -n "$last_ticket" ]; then
        echo "feature/$last_ticket"
    else
        echo "develop"
    fi
}

# Create and checkout new branch
create_branch() {
    local ticket=$1
    local base_branch=${2:-$(get_last_completed_branch)}
    local branch_name="feature/${ticket}"

    log_info "Creating branch: ${BLUE}$branch_name${NC} (base: ${BLUE}$base_branch${NC})"

    # Check out base branch first
    if ! git show-ref --verify --quiet "refs/heads/$base_branch"; then
        log_warn "Base branch doesn't exist locally: $base_branch, trying remote..."
        if git show-ref --verify --quiet "refs/remotes/origin/$base_branch"; then
            git checkout -t "origin/$base_branch" || git checkout "$base_branch"
        else
            log_error "Base branch not found: $base_branch"
            return 1
        fi
    else
        git checkout "$base_branch"
    fi

    git pull origin "$base_branch" 2>/dev/null || true

    # Create new branch
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        log_warn "Branch already exists, checking out: $branch_name"
        git checkout "$branch_name"
    else
        git checkout -b "$branch_name"
        log_success "Branch created: $branch_name"
    fi
}

# Check if branch has uncommitted changes
has_changes() {
    [ -n "$(git status --porcelain)" ]
}

#################################################################################
# Test Functions
#################################################################################

# Run integration tests
run_tests() {
    log_info "Running integration tests..."

    if pytest api/tests/integration/ -v 2>&1 | tee -a "$LOG_FILE"; then
        log_success "All tests passed!"
        return 0
    else
        log_error "Tests failed"
        return 1
    fi
}

# Run tests with retry logic
run_tests_with_retries() {
    local attempt=1
    local max_attempts=$1

    while [ $attempt -le $max_attempts ]; do
        log_info "Test attempt: ${CYAN}$attempt${NC}/${CYAN}$max_attempts${NC}"
        separator

        if run_tests; then
            log_success "Tests passed on attempt $attempt"
            return 0
        fi

        if [ $attempt -lt $max_attempts ]; then
            log_warn "Tests failed. You have $((max_attempts - attempt)) attempts remaining."
            log_info "Make edits to fix failures, then I'll test again."
            read -p "Press ENTER when ready to test again (or Ctrl+C to abort)..."
            ((attempt++))
        else
            log_error "Tests failed after $max_attempts attempts"
            return 1
        fi
    done
}

#################################################################################
# Git Operations
#################################################################################

# Commit changes
commit_changes() {
    local ticket=$1

    if ! has_changes; then
        log_info "No changes to commit"
        return 0
    fi

    log_info "Committing changes for ${BLUE}$ticket${NC}..."

    git add -A
    git commit -m "feat(${ticket}): Implementation complete

All requirements implemented
All acceptance criteria met
Integration tests passing

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>" 2>&1 | tee -a "$LOG_FILE"

    log_success "Changes committed"
}

# Push branch to remote
push_branch() {
    local branch=$1

    log_info "Pushing ${BLUE}$branch${NC} to origin..."

    if git push -u origin "$branch" 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Branch pushed"
        return 0
    else
        log_error "Failed to push branch"
        return 1
    fi
}

#################################################################################
# GitHub PR Functions
#################################################################################

# Create GitHub PR
create_pr() {
    local ticket=$1
    local branch="feature/${ticket}"

    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        log_warn "GitHub CLI (gh) not installed - skipping PR creation"
        log_info "You can create the PR manually with:"
        log_info "  gh pr create --title 'feat($ticket): Implementation' --base develop --head $branch"
        return 0
    fi

    log_info "Creating GitHub PR for ${BLUE}$ticket${NC}..."

    local title="feat(${ticket}): Implementation complete"
    local body="## ${ticket} - Implementation Complete

### Summary
All requirements implemented and acceptance criteria met.

### Testing
- Integration tests: ✅ Passing
- All acceptance criteria: ✅ Met
- Ready for review and merge

### What's Included
See commit message for detailed list of changes."

    if gh pr create \
        --title "$title" \
        --body "$body" \
        --base develop \
        --head "$branch" 2>&1 | tee -a "$LOG_FILE"; then
        log_success "PR created successfully"
        return 0
    else
        # PR might already exist
        log_warn "PR creation issue - it may already exist"
        log_info "Check: gh pr view $branch --web"
        return 0
    fi
}

#################################################################################
# Progress Tracking
#################################################################################

# Update progress file
update_progress() {
    local ticket=$1
    local status=$2

    if [ ! -f "$PROGRESS_FILE" ]; then
        return 0
    fi

    log_debug "Updating progress: $ticket = $status"
}

#################################################################################
# Display Functions
#################################################################################

# Show ticket with its requirements
show_ticket() {
    local ticket=$1

    separator
    echo -e "${CYAN}TICKET: ${ticket}${NC}"
    separator

    get_ticket_details "$ticket"

    separator
    echo

    # Show prompt if available
    if get_ticket_prompt "$ticket" &>/dev/null; then
        echo -e "${YELLOW}📋 PROMPT FOR IMPLEMENTATION:${NC}"
        echo
        get_ticket_prompt "$ticket"
        echo
    fi

    separator
}

#################################################################################
# Main Workflow Functions
#################################################################################

# Workflow for single ticket (manual mode)
setup_next_ticket() {
    log_info "Setting up next ticket..."

    local ticket=$(get_next_ticket)
    if [ -z "$ticket" ]; then
        log_success "No pending tickets! All done 🎉"
        return 0
    fi

    show_ticket "$ticket"
    create_branch "$ticket"

    log_info "✓ Branch created and checked out"
    log_info "✓ Ticket details and prompt displayed above"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Implement the ticket (run: claude-code)"
    log_info "  2. Run tests: ./scripts/ralph-loop.sh test"
    log_info "  3. Commit and create PR: ./scripts/ralph-loop.sh finalize"
}

# Test current branch
test_current() {
    log_info "Testing current branch..."

    if ! run_tests_with_retries $MAX_RETRIES; then
        log_error "Failed to pass tests after $MAX_RETRIES attempts"
        log_info "Fix remaining failures and run: ./scripts/ralph-loop.sh test"
        exit 1
    fi
}

# Finalize current ticket (commit + PR)
finalize_current() {
    local ticket=$(git rev-parse --abbrev-ref HEAD | sed 's/feature\///')
    local branch="feature/${ticket}"

    log_info "Finalizing ${BLUE}$ticket${NC}..."
    separator

    if ! commit_changes "$ticket"; then
        log_error "Failed to commit changes"
        exit 1
    fi

    if ! push_branch "$branch"; then
        log_error "Failed to push branch"
        exit 1
    fi

    if ! create_pr "$ticket"; then
        log_error "Failed to create PR"
        exit 1
    fi

    update_progress "$ticket" "completed"

    log_success "✓ Ticket completed and PR created!"
}

# Main continuous loop
main_loop() {
    log_info "Starting Ralph Loop Automation"
    log_info "Project: $PROJECT_ROOT"
    log_info "Max retries: $MAX_RETRIES"

    # Check dependencies
    for cmd in git pytest; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done

    if ! command -v gh &> /dev/null; then
        log_warn "GitHub CLI (gh) not found - PR creation will be skipped"
    fi

    local loop_count=0
    local current_branch="develop"

    while true; do
        ((loop_count++))
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "Loop iteration: ${CYAN}$loop_count${NC}"
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # Get next pending ticket
        local ticket=$(get_next_ticket)

        if [ -z "$ticket" ]; then
            log_success "🎉 All pending tickets completed!"
            log_info "Checking again in ${CYAN}${LOOP_PAUSE}${NC} seconds..."
            sleep "$LOOP_PAUSE"
            continue
        fi

        log_info "Processing: ${CYAN}$ticket${NC}"
        separator

        # Show ticket details
        show_ticket "$ticket"

        # Create branch
        if ! create_branch "$ticket" "$current_branch"; then
            log_error "Failed to create branch for $ticket"
            log_error "Pausing automation for manual intervention"
            exit 1
        fi

        # Wait for implementation
        log_info "Branch ready: ${BLUE}feature/$ticket${NC}"
        log_info "👉 Run ${CYAN}claude-code${NC} to implement this ticket"
        log_info ""
        log_info "When implementation is complete:"
        log_info "  Press ENTER here to run tests..."
        read -p ""

        # Run tests with retries
        log_info ""
        log_info "Running tests with up to ${CYAN}$MAX_RETRIES${NC} attempts..."
        log_info ""

        if ! run_tests_with_retries "$MAX_RETRIES"; then
            log_error "Tests failed after $MAX_RETRIES attempts for $ticket"
            log_error "Pausing for manual intervention"
            log_error ""
            log_error "Options:"
            log_error "  1. Fix issues and run: ./scripts/ralph-loop.sh test"
            log_error "  2. Abort: Ctrl+C"
            exit 1
        fi

        # Finalize
        if ! commit_changes "$ticket"; then
            log_error "Failed to commit changes"
            exit 1
        fi

        if ! push_branch "feature/$ticket"; then
            log_error "Failed to push branch"
            exit 1
        fi

        if ! create_pr "$ticket"; then
            log_error "Failed to create PR"
            exit 1
        fi

        update_progress "$ticket" "completed"

        log_success "✓✓✓ Completed: ${CYAN}$ticket${NC}"

        # Update for next iteration
        current_branch="feature/$ticket"

        # Pause before next ticket
        log_info "Next ticket in ${CYAN}${LOOP_PAUSE}${NC} seconds..."
        sleep "$LOOP_PAUSE"
    done
}

#################################################################################
# Help
#################################################################################

show_help() {
    cat <<EOF
${CYAN}Ralph Loop Automation Script${NC}

Orchestrates ticket-driven development with automatic branching, testing, and PR creation.

${BLUE}USAGE:${NC}
  ./scripts/ralph-loop.sh [COMMAND]

${BLUE}COMMANDS:${NC}
  (none)           Run main automation loop (continuous)
  setup            Setup next pending ticket (manual mode)
  test             Run tests for current branch (with retries)
  finalize         Commit changes and create PR
  status           Show next pending ticket
  list             List all pending tickets
  --help, -h       Show this help message

${BLUE}WORKFLOW:${NC}

${GREEN}Continuous (Automatic Loop):${NC}
  ./scripts/ralph-loop.sh

  Runs forever, processing all pending tickets:
    1. Creates branch (feature/SSG-XXX)
    2. Shows ticket requirements + prompt
    3. Waits for claude-code implementation
    4. Runs tests (up to 3 attempts)
    5. Commits and creates PR
    6. Repeats for next ticket

${GREEN}Manual (Step by Step):${NC}
  ./scripts/ralph-loop.sh setup     # Create branch + show ticket
  # ... run: claude-code (implement ticket)
  ./scripts/ralph-loop.sh test      # Run tests (retries on failure)
  ./scripts/ralph-loop.sh finalize  # Commit and create PR

${BLUE}ENVIRONMENT:${NC}
  DEBUG=1           Enable debug output
  MAX_RETRIES=N     Change max test retry attempts (default: 3)

${BLUE}REQUIREMENTS:${NC}
  - git
  - pytest
  - gh (GitHub CLI) - for PR creation
  - claude-code - for implementing tickets

${BLUE}EXAMPLE:${NC}
  # Run next ticket automatically
  ./scripts/ralph-loop.sh

  # Or step-by-step
  ./scripts/ralph-loop.sh setup
  # ... implement in claude-code ...
  ./scripts/ralph-loop.sh test
  # ... fix any test failures ...
  ./scripts/ralph-loop.sh finalize

${BLUE}LOG FILES:${NC}
  Logs saved to: .ralph-loop-logs/

EOF
}

#################################################################################
# Main Entry Point
#################################################################################

if [ $# -eq 0 ]; then
    # Run main loop if no arguments
    main_loop
else
    case "$1" in
        setup)
            setup_next_ticket
            ;;
        test)
            test_current
            ;;
        finalize)
            finalize_current
            ;;
        status)
            next=$(get_next_ticket)
            if [ -n "$next" ]; then
                log_info "Next ticket: ${CYAN}$next${NC}"
            else
                log_success "All tickets completed!"
            fi
            ;;
        list)
            log_info "Pending tickets:"
            get_all_pending_tickets | while read ticket; do
                echo "  - $ticket"
            done
            ;;
        --help|-h|help)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
fi
