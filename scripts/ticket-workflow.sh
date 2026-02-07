#!/bin/bash

# Ralph Loop Ticket Workflow Automation
# Implements the ticket-based development workflow from prompts.md
# Usage: ./scripts/ticket-workflow.sh <command> [options]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/.ticket-progress.json"
TICKETS_FILE="$PROJECT_ROOT/tickets/tickets.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

get_current_ticket() {
    if command -v jq &> /dev/null; then
        jq -r '.current_ticket' "$PROGRESS_FILE" 2>/dev/null || echo ""
    else
        grep '"current_ticket"' "$PROGRESS_FILE" | sed 's/.*: "\(.*\)".*/\1/' | head -1
    fi
}

get_current_branch() {
    if command -v jq &> /dev/null; then
        jq -r '.current_branch' "$PROGRESS_FILE" 2>/dev/null || echo ""
    else
        grep '"current_branch"' "$PROGRESS_FILE" | sed 's/.*: "\(.*\)".*/\1/' | head -1
    fi
}

get_ticket_status() {
    local ticket=$1
    if command -v jq &> /dev/null; then
        jq -r ".tickets.\"$ticket\".status" "$PROGRESS_FILE" 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

# ============================================================================
# MAIN COMMANDS
# ============================================================================

cmd_status() {
    log_info "📊 Ticket Workflow Status"
    echo ""

    if [ ! -f "$PROGRESS_FILE" ]; then
        log_warn "No progress file found at $PROGRESS_FILE"
        return 1
    fi

    local current_ticket=$(get_current_ticket)
    local current_branch=$(get_current_branch)

    echo -e "${BLUE}Current Ticket:${NC} $current_ticket"
    echo -e "${BLUE}Current Branch:${NC} $current_branch"
    echo ""

    if command -v jq &> /dev/null; then
        echo -e "${BLUE}Completed Tickets:${NC}"
        jq -r '.tickets | to_entries[] | select(.value.status == "completed") | "  ✓ \(.key): \(.value.summary)"' "$PROGRESS_FILE"

        echo ""
        echo -e "${BLUE}Pending Tickets:${NC}"
        jq -r '.tickets | to_entries[] | select(.value.status == "pending") | "  ○ \(.key): \(.value.summary)"' "$PROGRESS_FILE"

        echo ""
        echo -e "${BLUE}Latest Session:${NC}"
        jq -r '.latest_session_fixes | "  \(.date): \(.summary)"' "$PROGRESS_FILE"
    fi
}

cmd_next() {
    log_info "🎫 Finding next ticket..."
    echo ""

    if [ ! -f "$TICKETS_FILE" ]; then
        log_error "Tickets file not found at $TICKETS_FILE"
        return 1
    fi

    # Find first unchecked ticket
    local next_ticket=$(grep -E '^\[[ ]\]' "$TICKETS_FILE" | head -1)

    if [ -z "$next_ticket" ]; then
        log_warn "No pending tickets found!"
        return 1
    fi

    echo -e "${BLUE}Next Ticket:${NC}"
    echo "$next_ticket"
}

cmd_start() {
    local ticket=$1

    if [ -z "$ticket" ]; then
        log_error "Usage: ticket-workflow.sh start <TICKET-ID>"
        return 1
    fi

    log_info "🚀 Starting ticket: $ticket"

    # Create feature branch
    local branch="feature/$ticket"
    log_info "Creating branch: $branch"

    if git rev-parse --quiet --verify "$branch" > /dev/null 2>&1; then
        log_warn "Branch $branch already exists, switching to it"
        git checkout "$branch"
    else
        git checkout -b "$branch"
    fi

    log_success "Started ticket $ticket on branch $branch"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Read planning/tickets.md for ticket requirements"
    echo "2. Read relevant documentation (ARCHITECTURE.md, API.md, etc.)"
    echo "3. Write tests for acceptance criteria"
    echo "4. Run tests: npm test (frontend) or pytest api/tests (backend)"
    echo "5. Implement code to pass tests"
    echo "6. Update planning/tickets.md as tests pass"
}

cmd_progress() {
    local ticket=$1
    local note=$2

    if [ -z "$ticket" ] || [ -z "$note" ]; then
        log_error "Usage: ticket-workflow.sh progress <TICKET-ID> \"<note>\""
        return 1
    fi

    log_info "📝 Recording progress for $ticket"

    if command -v jq &> /dev/null; then
        # Add to work_log if using jq
        jq --arg ticket "$ticket" --arg note "$note" --arg ts "$TIMESTAMP" \
            '.tickets[$ticket].work_log += ["\($ts): \($note)"]' \
            "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && \
            mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

        log_success "Progress recorded for $ticket"
    else
        log_warn "jq not available - manual progress tracking needed"
        echo "Note: $note"
    fi
}

cmd_complete() {
    local ticket=$1

    if [ -z "$ticket" ]; then
        log_error "Usage: ticket-workflow.sh complete <TICKET-ID>"
        return 1
    fi

    log_info "✅ Marking ticket as complete: $ticket"

    # Update progress file
    if command -v jq &> /dev/null; then
        jq --arg ticket "$ticket" --arg ts "$TIMESTAMP" \
            '.tickets[$ticket].status = "completed" | .tickets[$ticket].completed_date = ($ts | split("T")[0])' \
            "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && \
            mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
    fi

    log_info "Verifying changes..."

    # Show what will be committed
    local files_changed=$(git diff --name-only | wc -l)
    echo -e "${BLUE}Files changed:${NC} $files_changed"
    echo ""

    # Recommend next steps
    echo -e "${BLUE}Before pushing:${NC}"
    echo "1. Verify all tests pass"
    echo "2. Run: git diff HEAD to review changes"
    echo "3. Update planning/tickets.md - mark ticket requirements complete"
    echo "4. Create commit: git commit -m 'feat($ticket): ...'"
    echo "5. Push: git push origin feature/$ticket"
}

cmd_record() {
    local session_note=$1

    if [ -z "$session_note" ]; then
        log_error "Usage: ticket-workflow.sh record \"<session notes>\""
        return 1
    fi

    log_info "📋 Recording session work"

    if command -v jq &> /dev/null; then
        jq --arg note "$session_note" --arg ts "$TIMESTAMP" \
            '.session_notes = $note | .session_started = $ts' \
            "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && \
            mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

        log_success "Session recorded"
    fi
}

cmd_summary() {
    local ticket=$1
    local summary=$2

    if [ -z "$ticket" ] || [ -z "$summary" ]; then
        log_error "Usage: ticket-workflow.sh summary <TICKET-ID> \"<summary>\""
        return 1
    fi

    log_info "📌 Updating summary for $ticket"

    if command -v jq &> /dev/null; then
        jq --arg ticket "$ticket" --arg summary "$summary" \
            '.tickets[$ticket].summary = $summary' \
            "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && \
            mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

        log_success "Summary updated for $ticket"
    fi
}

cmd_help() {
    cat << 'EOF'
Ralph Loop Ticket Workflow Automation

USAGE: ./scripts/ticket-workflow.sh <command> [options]

COMMANDS:

  status              Show current workflow status and ticket history

  next                Find the next pending ticket from planning/tickets.md

  start <TICKET-ID>   Start working on a ticket
                      - Creates feature branch
                      - Switches to branch
                      - Shows next steps

  progress <ID> <note>
                      Record progress during ticket work
                      - Adds entry to work log
                      - Tracks what was done

  complete <ID>       Mark ticket as complete
                      - Updates status in progress file
                      - Shows push instructions

  record <notes>      Record session notes
                      - Updates session summary
                      - Timestamp added automatically

  summary <ID> <text> Update ticket summary
                      - Store work description

  help                Show this help message

WORKFLOW:

  1. Check status:   ./scripts/ticket-workflow.sh status
  2. Find next:      ./scripts/ticket-workflow.sh next
  3. Start ticket:   ./scripts/ticket-workflow.sh start SSG-011
  4. Do work...
  5. Record notes:   ./scripts/ticket-workflow.sh progress SSG-011 "Completed form validation"
  6. Mark complete:  ./scripts/ticket-workflow.sh complete SSG-011
  7. Commit & push:  git commit ... && git push origin feature/SSG-011

DOCUMENTATION:

  - Read: prompts.md                    (Detailed workflow guide)
  - Read: planning/tickets.md           (All tickets and requirements)
  - Check: .ticket-progress.json        (Detailed work history)

EOF
}

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

main() {
    local command=${1:-help}

    case "$command" in
        status)   cmd_status ;;
        next)     cmd_next ;;
        start)    cmd_start "$2" ;;
        progress) cmd_progress "$2" "$3" ;;
        complete) cmd_complete "$2" ;;
        record)   cmd_record "$2" ;;
        summary)  cmd_summary "$2" "$3" ;;
        help)     cmd_help ;;
        *)        log_error "Unknown command: $command"; cmd_help; exit 1 ;;
    esac
}

main "$@"
