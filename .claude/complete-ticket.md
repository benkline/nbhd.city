# Complete a Single Ticket

Complete guide to implement a development ticket using the 8-phase workflow.

## Quick Start

Follow these phases and complete these steps to add a new feature to the project:

**CLEAR CONTEXT (Phase 1)**
- Create a subagent to clear the context window to conduct the following steps with

**TICKET ASSIGNMENT & DISCOVERY (Phase 2)**
- Read planning/tickets.md
- Identify first incomplete ticket (first unchecked [ ] in priority order) - this is your currently assigned ticket
- Read full ticket requirements and acceptance criteria
- Identify all [ ] checkboxes that need completion

**CONTEXT & PLANNING (Phase 3)**
- Read Phase Overview for the currently assigned ticket in tickets.md to find 'Relevant Documentation' section
- Read those specific planning docs (ARCHITECTURE.md, API.md, FRONTEND.md, etc.)
- Note: programming language, test framework, test command, project structure
- Note: file locations where changes will be made
- Identify any existing code patterns to follow

**TDD SETUP (Phase 4)**
- Branch off of develop: git checkout develop && git pull
- Create feature branch: git checkout -b feature/TICKET-ID
  Example: git checkout -b feature/SSG-005
- Set up test venv environment: `source ~/.venvs/nbhd/bin/activate`
- Create/open test file in appropriate location (from planning docs)
- Write test code for EACH acceptance criterion (check the [ ] items)
- Run test command from TESTING.md - tests should FAIL initially

**IMPLEMENTATION (Phase 5)**
- Read existing code in relevant files
- Implement minimal code to pass tests
- Follow patterns and conventions from planning docs
- Do NOT over-engineer or add extra features
- Mark completed [ ] checkboxes in test code comments as you go
- AS EACH TEST PASSES:
  * Mark the corresponding [ ] as [x] in planning/tickets.md for this ticket
  * Do NOT commit yet - just update the file to track progress

**TEST & ITERATE (Phase 6)**
LOOP until ALL tests pass:
  1. Run: npm test (frontend) or pytest api/tests (backend)
  2. Read error messages carefully
  3. Fix ONE specific issue at a time
  4. Re-run tests
  5. If any test passes:
     - Update planning/tickets.md: mark that requirement's [ ] as [x]
     - Do not commit yet, just track progress
  6. If ALL tests passing, break loop

**FOLLOW-UP TERRAFORM/INFRASTRUCTURE TICKET creation (Phase 7)**
- IF ticket creates new Lambda functions, S3 buckets, CloudFront distributions, or other AWS resources:
  * Check planning/tickets.md - is there already a TICKET-ID-INFRA ticket?
  * IF NOT, create new ticket using format: TICKET-ID-INFRA with -INFRA suffix
  * Review code implementation to identify infrastructure needed:
    - Lambda functions → needs packaging, IAM role, CloudWatch logs
    - S3 operations → needs bucket creation, policy configuration, versioning
    - CloudFront → needs distribution setup, cache behaviors, origins
    - DynamoDB → needs table configuration, GSI setup, permissions
    - API Gateway → needs routes, Lambda permissions
  * Copy infrastructure ticket template from similar completed -INFRA tickets (e.g., SSG-009-INFRA, SSG-016-INFRA)
  * Update template with:
    - Description of AWS resources to create
    - Detailed Requirements section with all [ ] checkboxes for Terraform/IaC
    - Acceptance Criteria section (resources deployed, functional testing)
    - Implementation Files listing new/modified .tf files needed
    - Estimate: typically S/M depending on complexity
    - Add "Depends On: TICKET-ID (code implementation)" reference
  * Insert ticket in appropriate section of planning/tickets.md (Phase 2e for build pipeline)
  * DO NOT implement infrastructure in this phase - just create the ticket for future infrastructure work
  * Commit infrastructure ticket to same feature branch: git add planning/tickets.md && git commit
- IF ticket is purely code/frontend with no infrastructure requirements:
  * Skip Phase 7 - proceed directly to Phase 8 (Completion & Handoff)

**COMPLETION & HANDOFF (Phase 8)**
- UPDATE BOTH TRACKING LOCATIONS:
  * In planning/tickets.md: Verify ALL [ ] items for this ticket are marked [x]
  * In GitHub issue (#NN): Use 'gh issue view <issue> --web' to verify and update
    - Click issue to open on GitHub.com
    - Click "Projects" on right sidebar
    - Set status to "Done"
    - Add comment: "Implemented in feature/TICKET-ID - all acceptance criteria met"
    - Link any related issues if applicable
- Review requirements met: 'git diff HEAD~1' shows changes match ticket scope
- Create commit (MANDATORY):
  git add .
  git commit -m 'feat(TICKET-ID): brief description

  - Completed requirement 1
  - Completed requirement 2
  - Passes all acceptance criteria

  Fixes: TICKET-ID

  🤖 Generated with Claude Code

  Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>'
- Push IMMEDIATELY: git push origin feature/TICKET-ID

## Critical Rules (from AGENTS.md)
- NEVER stop at git commit - ALWAYS push immediately
- Test locally before committing
- If test fails, DO NOT commit - fix and re-test
- Mark ticket complete in tickets.md BEFORE committing
- **CRITICAL**: ALWAYS create a pull request whenever you modify planning/tickets.md
  * Use `gh pr create` with descriptive title and summary
  * Include details of which tickets were updated and why
  * This ensures all planning changes are tracked and reviewed

## Output
Success: <promise>DONE</promise> (ticket complete, tested, committed, pushed)
Blocked: <promise>BLOCKED</promise> (document blocker, update ticket, push progress)
