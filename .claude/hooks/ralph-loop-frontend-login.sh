#!/bin/bash

# Ralph Loop Hook for Frontend-Login Phase
# This script runs after each iteration to check progress and manage PRs

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Ralph Loop Frontend-Login Hook ===${NC}"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# If on a feature branch, check if work is done
if [[ $CURRENT_BRANCH =~ ^feature/FL- ]]; then
  echo -e "${YELLOW}On feature branch: $CURRENT_BRANCH${NC}"

  # Check git status
  if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✓ All changes committed${NC}"

    # Check if branch is pushed
    if git rev-parse --verify origin/$CURRENT_BRANCH &>/dev/null; then
      echo -e "${GREEN}✓ Branch pushed to origin${NC}"

      # Check if PR exists
      PR_COUNT=$(gh pr list --head "$CURRENT_BRANCH" --json number | wc -l)
      if [ "$PR_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ PR created${NC}"
        echo -e "${YELLOW}Next: Return to develop and continue to next ticket${NC}"
      else
        echo -e "${YELLOW}PR not found, creating...${NC}"
        # PR creation will be done by the main process
      fi
    else
      echo -e "${YELLOW}Branch not pushed yet${NC}"
    fi
  else
    echo -e "${YELLOW}Uncommitted changes found:${NC}"
    git status --short
  fi
fi

echo -e "${BLUE}=== End Ralph Loop Hook ===${NC}"
