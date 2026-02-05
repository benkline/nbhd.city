---
name: next-ticket
description: The phases and steps for claude to complete to add a new feature to the project.
---

# Instructions
Follow these phases and complete these steps to add a new feature to the project:

## PHASE 1: TICKET ASSIGNMENT & DISCOVERY
- Carefully read the planning/tickets.md document. Look at the actual unchecked [ ] items in priority order.
- Identify the first incomplete ticket (first unchecked [ ] in priority order) - this is your currently assigned ticket
- Pause to confirm the currently assigned ticket with the user
- Read full ticket requirements and acceptance criteria
- Identify all [ ] checkboxes within the ticket that need completion

## PHASE 2: CONTEXT & PLANNING
- Read Phase Overview for the currently assigned ticket in tickets.md to find 'Relevant Documentation' section
- Read those specific planning docs (ARCHITECTURE.md, API.md, FRONTEND.md, etc.)
- Note: programming language, test framework, test command, project structure
- Note: file locations where changes will be made
- Identify any existing code patterns to follow
- Enter plan mode and think hard to create a plan on how to best complete ticket.
- **MANDATORY CHECKPOINT BEFORE PROCEEDING:**
  🛑 **STOP HERE - DO NOT PROCEED WITHOUT USER APPROVAL**
  - Pause to share plan with user
  - Wait for explicit user approval before moving to Phase 3

## PHASE 3: TDD SETUP (MANDATORY: VERIFY BRANCH)
- **MANDATORY BRANCH CHECK:**
  * Run: `git status` to verify current branch
  * Expected branch: `feature/TICKET-ID` (e.g., `feature/NBHD-002`)
  * If on WRONG branch: STOP, checkout correct branch with `git checkout develop && git pull && git checkout -b feature/TICKET-ID`
  * If branch already exists: Use versioned name: `feature/TICKET-ID-v2`
- Set up test venv environment: `source ~/.venvs/nbhd/bin/activate`
- Create/open test file in appropriate location (from planning docs)
- Write test code for EACH acceptance criterion (check the [ ] items)
- Run test command from TESTING.md - tests should FAIL initially

## PHASE 4: IMPLEMENTATION
- Read existing code in relevant files
- Implement minimal code to pass tests
- Follow patterns and conventions from planning docs
- Do NOT over-engineer or add extra features
- Mark completed [ ] checkboxes in test code comments as you go
- AS EACH TEST PASSES:
  * Mark the corresponding [ ] as [x] in planning/tickets.md for this ticket
  * Do NOT commit yet - just update the file to track progress

## PHASE 5: TEST & VERIFY (CRITICAL - CANNOT BE SKIPPED)
**MANDATORY TEST BLOCK - TESTS MUST PASS BEFORE PROCEEDING:**

LOOP until ALL tests pass:
  1. Run: npm test (frontend) or pytest api/tests (backend)
  2. If tests FAIL:
     - Read error messages carefully
     - Identify if this is a CODE issue or ENVIRONMENT issue:
       * CODE ISSUE: Fix the code, re-run tests
       * ENVIRONMENT ISSUE: Offer "Can we run tests together? I need help with the environment setup."
     - 🛑 **BLOCK**: DO NOT proceed to Phase 6 until all tests pass
     - DO NOT push untested code
  3. If any test PASSES:
     - Update planning/tickets.md: mark that requirement's [ ] as [x]
  4. If ALL tests PASSING: Break loop, proceed to Phase 6

## PHASE 6: PUBLISH PR (FINAL VERIFICATION)
- Verify: All tests from Phase 5 passed ✅
- UPDATE BOTH TRACKING LOCATIONS:
  * In planning/tickets.md: Verify ALL [ ] items for this ticket are marked [x]
  * In GitHub issue (#NN): Use 'gh issue view <issue> --web' to verify and update
    - Click issue to open on GitHub.com
    - Click "Projects" on right sidebar
    - Set status to "Done"
    - Add comment: "Implemented in feature/TICKET-ID - all acceptance criteria met"
- Create commit (MANDATORY):
  git add .
  git commit -m 'feat(TICKET-ID): brief description

  - Completed requirement 1
  - Completed requirement 2
  - Passes all acceptance criteria

  Fixes: TICKET-ID

  Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>'
- Push to feature branch: git push origin feature/TICKET-ID
- Create GitHub PR using: gh pr create --base develop

## PHASE 7: CLEANUP & RESET
- 🔄 **RETURN TO DEVELOP BRANCH FOR NEXT TICKET:**
  1. git checkout develop
  2. git pull origin develop
  3. Verify: git status shows "On branch develop"

## CRITICAL RULES
- ✅ **Phase 2 Checkpoint**: Plan must be reviewed and approved before implementation
- ✅ **Phase 3 Branch Check**: ALWAYS verify correct branch before implementing
- ✅ **Phase 5 Test Block**: Cannot proceed without passing tests
  - Environment issues: Offer to debug together
  - Code issues: Block, requires fixes
- ✅ **Phase 7 Cleanup**: ALWAYS return to develop after PR
- **NEVER stop at git commit - ALWAYS push immediately after commit**
- **Test locally before committing**
- **If test fails, DO NOT commit - fix and re-test**
- **Mark ticket complete in tickets.md BEFORE committing**

## OUTPUT
Success: <promise>DONE</promise> (ticket complete, tested, committed, pushed, returned to develop)
Blocked: <promise>BLOCKED</promise> (document blocker, update ticket, push progress)