# prompts

## Ralph Wiggum Prompt Template for Ticket-Based Development

Complete guide with battle-tested prompt templates for using Ralph Wiggum in Claude Code.

### Quick Start: Complete a Single Ticket

```bash
/ralph-loop "
TICKET ASSIGNMENT & DISCOVERY (Phase 1)
- Read planning/tickets.md
- Identify next incomplete ticket (first unchecked [ ] in priority order)
- Read full ticket requirements and acceptance criteria
- Identify all [ ] checkboxes that need completion

CONTEXT & PLANNING (Phase 2)
- Read Phase Overview in tickets.md to find 'Relevant Documentation' section
- Read those specific planning docs (ARCHITECTURE.md, API.md, FRONTEND.md, etc.)
- Note: programming language, test framework, test command, project structure
- Note: file locations where changes will be made
- Identify any existing code patterns to follow

TDD SETUP (Phase 3)
- Create feature branch: git checkout -b feature/TICKET-ID
  Example: git checkout -b feature/SSG-005
- Create/open test file in appropriate location (from planning docs)
- Write test code for EACH acceptance criterion (check the [ ] items)
- Run test command from TESTING.md - tests should FAIL initially

IMPLEMENTATION (Phase 4)
- Read existing code in relevant files
- Implement minimal code to pass tests
- Follow patterns and conventions from planning docs
- Do NOT over-engineer or add extra features
- Mark completed [ ] checkboxes in test code comments as you go
- AS EACH TEST PASSES:
  * Mark the corresponding [ ] as [x] in planning/tickets.md for this ticket
  * Do NOT commit yet - just update the file to track progress

TEST & ITERATE (Phase 5)
LOOP until ALL tests pass:
  1. Run: npm test (frontend) or pytest api/tests (backend)
  2. Read error messages carefully
  3. Fix ONE specific issue at a time
  4. Re-run tests
  5. If any test passes:
     - Update planning/tickets.md: mark that requirement's [ ] as [x]
     - Do not commit yet, just track progress
  6. If ALL tests passing, break loop

COMPLETION & HANDOFF (Phase 6)
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

CRITICAL RULES (from AGENTS.md)
- NEVER stop at git commit - ALWAYS push immediately
- Test locally before committing
- If test fails, DO NOT commit - fix and re-test
- Mark ticket complete in tickets.md BEFORE committing
- Update GitHub issue status BEFORE committing

OUTPUT
Success: <promise>DONE</promise> (ticket complete, tested, committed, pushed)
Blocked: <promise>BLOCKED</promise> (document blocker, update ticket, push progress)
" --max-iterations 25
```

## Best Practices

### DO ✅

1. **Be explicit about locations**
```
Tickets: planning/tickets.md
Specs: planning/ARCHITECTURE.md, planning/API.md, planning/FRONTEND.md, etc.
Tests: npm test (frontend) or pytest api/tests (backend)
Test Strategy: planning/TESTING.md
Documentation: planning/README.md (navigation hub)
```

2. **Always reference relevant docs**
```
For SSG-005 (Template API):
- Read: ARCHITECTURE.md, API.md, DATABASE.md, INFRASTRUCTURE.md
- Language: Python/FastAPI
- Test: pytest api/tests
- Location: api/endpoints.py, api/models.py
```

3. **Define clear, measurable success**
```
Success = ALL acceptance criteria [ ] checked + all tests passing +
          committed to feature branch + pushed to origin +
          GitHub issue marked complete
```

4. **TDD: Write tests FIRST**
```
1. Read acceptance criteria (check the [ ] items)
2. Write test that reflects each criterion
3. Tests should fail initially
4. Then implement to make tests pass
```

5. **Use completion promises with context**
```
Success: <promise>DONE</promise>
Details: SSG-005 complete, 4 tests passing, pushed to feature/SSG-005

Blocked: <promise>BLOCKED</promise>
Reason: WASM integration requires research (ATP-001 blocker)
```

6. **Branch naming convention**
```
Feature ticket: git checkout -b feature/TICKET-ID
Example: feature/SSG-005, feature/ATP-003
Branch pushed? Yes → verify with: git log origin/feature/TICKET-ID
```

7. **Commit message format (Conventional Commits)**
```
feat(TICKET-ID): brief one-line description

- Completed requirement 1
- Completed requirement 2
- Passes all acceptance criteria

Fixes: TICKET-ID
```

8. **Update BOTH tracking locations continuously**
```
AS EACH TEST PASSES (during Phase 5):
- In planning/tickets.md: Mark the [ ] requirement as [x]
- This shows progress and helps Ralph see what's done

Before commit (Phase 6):
- Verify ALL [ ] items in requirements marked [x]
- Verify ALL [ ] items in acceptance criteria marked [x]
```

9. **Update GitHub issue status (REQUIRED before pushing)**
```
Before pushing (Phase 6):
- Open GitHub issue: gh issue view <ISSUE_NUMBER> --web
- Click Projects → Set status to "Done"
- Add comment: "✅ Implemented in feature/TICKET-ID
  - All acceptance criteria met
  - Tests passing
  - Ready for review"
- Do NOT push until GitHub issue is updated
```

10. **Always push immediately after commit**
```
NEVER stop at git commit
ALWAYS run: git push origin feature/TICKET-ID
Verify: git log origin/feature/TICKET-ID -1 shows your commit
```

### DON'T ❌

1. **Vague ticket selection**
```
❌ "Work on Phase 2"
✅ "Implement SSG-005: Template Management API (next unchecked ticket in tickets.md)"
```

2. **Missing test framework info**
```
❌ "Write tests"
✅ "Write pytest tests in api/tests/unit/, use fixtures from conftest.py"
```

3. **Incomplete documentation review**
```
❌ Read: ARCHITECTURE.md
✅ Read: ARCHITECTURE.md, API.md, DATABASE.md, INFRASTRUCTURE.md (from Phase 2 section)
```

4. **No iteration plan**
```
❌ --max-iterations 5 (too low, likely to get stuck)
✅ --max-iterations 25 (allows room for debugging)
```

5. **Forgetting git workflow from AGENTS.md**
```
❌ Complete work, commit, stop
✅ Complete work, test, commit, PUSH, mark tickets complete, update GitHub
```

6. **Not checking existing code patterns**
```
❌ Create new patterns/conventions
✅ Read existing code in project, match conventions from planning/FRONTEND.md or ARCHITECTURE.md
```

7. **Over-scoping work**
```
❌ "While I'm here, also refactor this other module"
✅ Implement EXACTLY what's in the ticket, nothing more
```

8. **Missing error handling in blocked scenarios**
```
❌ "Research AT Protocol" (no specific goal)
✅ "Complete ATP-001 first (AT Protocol research ticket)" or
   "BLOCKED on WASM integration - needs research in ATP-001"
```

9. **Not pushing if test fails**
```
❌ Commit code even if tests fail
✅ If test fails: fix code, re-run tests, THEN commit+push
```

10. **Forgetting to update both tickets.md AND GitHub**
```
❌ Only mark complete in tickets.md
✅ Mark complete in tickets.md AND update GitHub issue status
```

---

## Ticket Workflow Checklist

### Discovery & Setup
- [ ] Read planning/tickets.md - identify TICKET-ID and next incomplete ticket
- [ ] Read "Relevant Documentation" section for your phase
- [ ] Read each relevant planning doc - note language, frameworks, locations
- [ ] Find corresponding GitHub issue number: `gh issue list | grep TICKET-ID`

### Development (TDD)
- [ ] Create feature branch: `git checkout -b feature/TICKET-ID`
- [ ] Write tests for ALL acceptance criteria [ ]
- [ ] Run tests - should FAIL initially

### Implementation & Progress Tracking
- [ ] Implement code to pass tests
- [ ] Run tests - iterate until EACH test passes
- [ ] **AS EACH TEST PASSES:** Mark corresponding [ ] as [x] in planning/tickets.md
- [ ] Continue until ALL tests PASS

### Completion (Before Commit)
- [ ] Verify in planning/tickets.md: ALL [ ] items for ticket marked [x]
- [ ] Review: `git diff HEAD` shows only expected changes (no extra refactoring)
- [ ] Create commit with proper Conventional Commits format

### Update Both Tracking Systems (CRITICAL)
- [ ] Update planning/tickets.md: ALL [ ] items as [x]
- [ ] Update GitHub issue (#NN):
  - [ ] Run: `gh issue view <ISSUE_NUMBER> --web`
  - [ ] Set Project status to "Done"
  - [ ] Add comment with implementation summary
  - [ ] Verify status changed on GitHub

### Push (MANDATORY & FINAL)
- [ ] Create commit with message
- [ ] Push to origin: `git push origin feature/TICKET-ID`
- [ ] Verify: `git log origin/feature/TICKET-ID -1` shows your commit
- [ ] Do NOT proceed if push fails - debug and retry

---

## Common Pitfalls & Solutions

### Pitfall: Tests pass but feature doesn't work
- **Solution:** Re-read acceptance criteria - tests may not fully capture requirement
- Example: API test passes, but frontend integration missing

### Pitfall: Tests fail with "missing module"
- **Solution:** Check test fixture setup in conftest.py or test setup files
- Run: `pip install -r api/requirements.txt` (backend) or `npm install` (frontend)

### Pitfall: "BLOCKED on research"
- **Solution:** Reference specific blocker ticket
- Example: "BLOCKED on ATP-001 (AT Protocol research) - need DID spec clarity"
- Push what you can, document the blocker, request help

### Pitfall: Forgot to push
- **Solution:** Push immediately with `git push origin feature/TICKET-ID`
- Verify: `git log origin/BRANCH-NAME -1` shows your commit

### Pitfall: Accidentally committed to main/develop
- **Solution:** Reset locally, create proper branch, re-push
- `git reset HEAD~1` (undo commit)
- `git checkout -b feature/TICKET-ID` (create branch)
- `git commit ...` (recommit)
- `git push origin feature/TICKET-ID` (push correct branch)
