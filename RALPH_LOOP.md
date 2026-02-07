# Ralph Loop Automation 🔄

Automated ticket-driven development with continuous testing, branching, and PR creation.

**Now integrated with /next-ticket skill for mandatory quality guardrails.**

## What It Does

The Ralph Loop script orchestrates the complete development workflow for each ticket using the `/next-ticket` skill:

```
Ticket Found
    ↓
/next-ticket TICKET-ID
    ├─ Phase 1: Select & Load
    ├─ Phase 2: Plan Implementation (PAUSE - Review Required)
    ├─ Phase 3: Implement (MANDATORY: Verify Branch)
    ├─ Phase 4: Test & Verify (MANDATORY: Tests Must Pass)
    ├─ Phase 5: Publish PR (Final Verification)
    └─ Phase 6: Cleanup (Return to develop)
    ↓
Next Ticket
```

The script automates the loop, but `/next-ticket` skill provides:
- ✅ Mandatory branch verification
- ✅ Blocked tests (won't proceed without passing tests)
- ✅ Planning phase checkpoint
- ✅ Environment issue handling (offer debug together)
- ✅ Automatic cleanup (return to develop)

## Quick Start

### Recommended: Use /next-ticket Skill Directly

For individual tickets, use the /next-ticket skill directly:

```bash
/next-ticket TICKET-ID
```

This guides you through all 6 phases with mandatory quality checkpoints:
1. Load ticket requirements
2. Review plan (pauses for approval)
3. Implement (verifies branch)
4. Test (blocks if failing)
5. Publish PR
6. Return to develop

### Continuous Mode (Fully Automated Ralph Loop)

For continuous automated processing of multiple tickets:

```bash
./scripts/ralph-loop.sh
```

This runs forever, processing all pending tickets:
1. Detects next pending ticket
2. Invokes `/next-ticket TICKET-ID`
3. /next-ticket handles phases 1-6 with mandatory guardrails
4. Pauses for you to run `claude-code` to implement (if needed)
5. /next-ticket automatically runs tests and blocks if failing
6. /next-ticket creates PR and cleans up
7. Ralph Loop repeats for next ticket

### Manual Mode (Per-Ticket with Checkpoints)

For single-ticket workflow with full control:

```bash
# Use /next-ticket skill for complete, checked workflow
/next-ticket TICKET-ID

# Or manually step through:
git checkout develop && git pull
git checkout -b feature/TICKET-ID
claude-code  # implement
/next-ticket  # or continue with /next-ticket to test/publish
```

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/ralph-loop.sh` | **Main loop** - Continuous automation (recommended) |
| `./scripts/ralph-loop.sh setup` | Create branch for next ticket + show requirements |
| `./scripts/ralph-loop.sh test` | Run tests with automatic retries (up to 3 attempts) |
| `./scripts/ralph-loop.sh finalize` | Commit changes and create GitHub PR |
| `./scripts/ralph-loop.sh status` | Show next pending ticket |
| `./scripts/ralph-loop.sh list` | List all pending tickets |
| `./scripts/ralph-loop.sh --help` | Show help message |

## How It Works

### 1. Branching Strategy

Each ticket gets its own clean branch (enforced by /next-ticket):
- `feature/NBHD-002` (off `develop`)
- `feature/NBHD-003` (off `develop`, NOT chained)
- `feature/NBHD-004` (off `develop`, NOT chained)
- etc.

**Important**: Each branch is independent, based on current `develop`. The /next-ticket skill ensures:
- ✅ You checkout correct branch before implementing (Phase 3)
- ✅ You return to develop after each PR (Phase 6)
- ✅ No branch reuse across tickets (enforced)

### 2. Ticket Detection

Ralph Loop script reads `planning/tickets.md` and looks for:
- Tickets with pending requirements `[ ]`
- Skips tickets marked `[x]` (COMPLETED)
- Processes in order found

### 3. Test Validation (via /next-ticket Phase 4)

/next-ticket BLOCKS implementation if tests fail:

```
Tests Run (ATTEMPT 1)
  ├─ PASS: Proceed to Phase 5 (Publish)
  └─ FAIL: BLOCK, offer to debug together
      ↓
   Contact user with error details
      ↓
   Wait for user to fix + rerun tests
      ↓
   Tests Pass: Proceed to Phase 5
```

**No automatic retries**: Tests must pass. If environment issues:
- /next-ticket offers: "Can we run tests together?"
- Won't push code without passing tests

### 4. PR Creation (via /next-ticket Phase 5)

After Phase 4 (tests pass), /next-ticket:
- Verifies final state
- Commits with proper message format
- Pushes to `origin/feature/TICKET-ID`
- Creates GitHub PR via `gh` CLI
- Cleans up (Phase 6: checkout develop)

## Integration with Claude Code & /next-ticket

The Ralph Loop script uses the `/next-ticket` skill which coordinates the workflow:

### Workflow:
1. Ralph Loop detects next pending ticket
2. Ralph Loop invokes: `/next-ticket TICKET-ID`
3. /next-ticket handles ALL phases:
   - **Phase 1**: Load ticket requirements
   - **Phase 2**: Planning (PAUSE - review required before proceeding)
   - **Phase 3**: Implementation (MANDATORY: verifies correct branch)
   - **Phase 4**: Testing (MANDATORY: blocks if tests fail, won't push untested code)
   - **Phase 5**: Publishing PR (final verification)
   - **Phase 6**: Cleanup (checkout develop for next ticket)
4. For implementation, Ralph Loop pauses and waits for you to run `claude-code`
5. Claude Code implements the ticket
6. `/next-ticket` handles the rest automatically

### In Continuous Mode:
```
Ralph Loop Iteration 1:
  /next-ticket NBHD-002
    ├─ Phase 2 PAUSE: Review plan? [Y/n]
    ├─ Phase 3: Verify branch feature/NBHD-002
    ├─ Phase 4: Test must pass (blocks if fail)
    ├─ Phase 5: Create PR
    └─ Phase 6: Checkout develop
  ↓
Ralph Loop Iteration 2: Next ticket...
```

### Mandatory Guardrails (via /next-ticket):

- ✅ **Phase 2 Checkpoint**: Plan must be reviewed before implementation
- ✅ **Phase 3 Branch Check**: Must verify correct branch before implementing
- ✅ **Phase 4 Test Block**: Cannot proceed without passing tests
  - Environment issues: Offers to debug together
  - Code issues: Blocks, requires fixes
- ✅ **Phase 5 Verification**: Final check before pushing
- ✅ **Phase 6 Cleanup**: Automatically returns to develop

### Why This Design?

- **Mandatory quality gates**: /next-ticket enforces best practices
- **No untested code**: Phase 4 blocks if tests fail
- **Branch safety**: Phase 3 verifies correct branch
- **Context preservation**: Claude Code keeps full conversation history per ticket
- **Better UX**: You can see requirements and review plan before implementation
- **Safer**: Tests are required to pass; won't push broken code
- **Flexible**: Works with manual implementation too (no claude-code needed)

## File Structure

```
scripts/
  └── ralph-loop.sh          # Main automation script
  └── ticket-workflow.sh     # Helper functions

planning/
  ├── tickets.md             # Ticket definitions + status
  ├── prompts.md             # Implementation prompts
  └── ...                    # Other planning docs

.ralph-loop-logs/
  └── ralph-loop-*.log       # Logs for each run
```

## Environment Variables

```bash
# Enable debug output
DEBUG=1 ./scripts/ralph-loop.sh

# Change max test retry attempts (default: 3)
MAX_RETRIES=5 ./scripts/ralph-loop.sh

# Change loop pause duration (default: 10 seconds)
LOOP_PAUSE=30 ./scripts/ralph-loop.sh
```

## Requirements

- **git** - For branching and commits
- **pytest** - For running integration tests
- **gh** (GitHub CLI) - For creating PRs
- **python 3.11+** - For tests
- **claude-code** (optional) - For implementation step

Install `gh`:
```bash
brew install gh  # macOS
# or: choco install gh  (Windows), sudo apt install gh (Linux)
```

## Logs

All activity logged to `.ralph-loop-logs/`:

```bash
# View latest log
tail -f .ralph-loop-logs/ralph-loop-*.log

# Search for errors
grep ERROR .ralph-loop-logs/*.log

# View full session
cat .ralph-loop-logs/ralph-loop-20260129_213000.log
```

## Workflow Example

### Session 1: Using /next-ticket Directly (Recommended)

```bash
$ /next-ticket NBHD-002

╔════════════════════════════════════════════════════════════════════╗
║  PHASE 1: SELECT & LOAD TICKET
╚════════════════════════════════════════════════════════════════════╝

Loading ticket: NBHD-002
✓ Nbhd Content API

╔════════════════════════════════════════════════════════════════════╗
║  PHASE 2: PLAN IMPLEMENTATION
╚════════════════════════════════════════════════════════════════════╝

[Plan details...]

⚠️  MANDATORY CHECKPOINT BEFORE PROCEEDING:
🛑 STOP HERE - DO NOT PROCEED WITHOUT USER APPROVAL

Actions:
  1. REVIEW the plan above with the user
  2. Get explicit approval to continue
```

You review the plan. Once approved, /next-ticket continues:

```bash
╔════════════════════════════════════════════════════════════════════╗
║  PHASE 3: IMPLEMENT CODE CHANGES
╚════════════════════════════════════════════════════════════════════╝

⚠️  MANDATORY BRANCH CHECK
Expected branch: feature/NBHD-002

Starting implementation...
👉 Run claude-code to implement this ticket
```

You open another terminal:
```bash
$ claude-code
# ... implement NBHD-002 ...
# ... when done, Ctrl+D to exit ...
```

Back in /next-ticket terminal:

```bash
╔════════════════════════════════════════════════════════════════════╗
║  PHASE 4: TEST AND VERIFY (CRITICAL - CANNOT BE SKIPPED)
╚════════════════════════════════════════════════════════════════════╝

Running tests for NBHD-002...

===================== test session starts ======================
...
======================== 23 passed in 0.15s ========================

✓ All tests passed!

╔════════════════════════════════════════════════════════════════════╗
║  PHASE 5: PUBLISH PR
╚════════════════════════════════════════════════════════════════════╝

Creating PR for NBHD-002...

✓ PR #88: https://github.com/benkline/nbhd.city/pull/88

╔════════════════════════════════════════════════════════════════════╗
║  PHASE 6: CLEANUP & RESET
╚════════════════════════════════════════════════════════════════════╝

🔄 RETURN TO DEVELOP BRANCH FOR NEXT TICKET:
1. git checkout develop
2. git pull origin develop
3. Verify: develop ✓

✨ Ticket NBHD-002 Complete!
```

### Session 2: Ralph Loop Continuous (Multiple Tickets)

```bash
$ ./scripts/ralph-loop.sh

[INFO] Starting Ralph Loop Automation

[INFO] Iteration 1: Processing NBHD-002
/next-ticket NBHD-002
  [... all 6 phases with mandatory checks ...]
  ✓ Completed: NBHD-002
  ✓ PR created
  ✓ Returned to develop

[INFO] Iteration 2: Processing NBHD-003
/next-ticket NBHD-003
  [... all 6 phases ...]
  ✓ Completed: NBHD-003

[INFO] Iteration 3: Processing NBHD-004
/next-ticket NBHD-004
  [... all 6 phases ...]
```

Ralph Loop continues automatically through all pending tickets.

## Troubleshooting

### Tests Keep Failing

```bash
# Run with debug output
DEBUG=1 ./scripts/ralph-loop.sh

# View full test output
tail -100 .ralph-loop-logs/ralph-loop-*.log | grep -A 50 "FAILED"

# Manually fix issues
# (edit code in your IDE)

# Retry tests
./scripts/ralph-loop.sh test
```

### PR Creation Failed

The script will warn but continue. You can create manually:
```bash
gh pr create --title "feat(SSG-015): Implementation" --base develop --head feature/SSG-015
```

### Branch Already Exists

The script will checkout the existing branch. To start fresh:
```bash
git branch -D feature/SSG-015
./scripts/ralph-loop.sh setup
```

### All Tests Passing But Something's Wrong

The script relies on integration tests. If tests pass but something's not right:
1. Review the test results in logs
2. Check Git diff: `git diff develop..feature/SSG-015`
3. Run tests locally: `pytest api/tests/integration/ -v`

## Advanced Usage

### Process Specific Ticket

```bash
# Create and setup specific ticket
git checkout develop
git pull origin develop
git checkout -b feature/SSG-015
claude-code  # implement
./scripts/ralph-loop.sh test
./scripts/ralph-loop.sh finalize
```

### Resume After Failure

If the script pauses:
```bash
# Fix the issues in your editor
# Then resume tests
./scripts/ralph-loop.sh test

# If still failing, manually edit and retry
# ... make edits ...
./scripts/ralph-loop.sh test

# When passing:
./scripts/ralph-loop.sh finalize
```

### Check Progress

```bash
# See all pending tickets
./scripts/ralph-loop.sh list

# See next ticket
./scripts/ralph-loop.sh status

# View progress file
cat .ticket-progress.json | jq '.tickets'
```

## Performance

- Branch creation: ~1s
- Test execution: ~5-15s (depends on test suite)
- PR creation: ~2-3s
- **Total per ticket: ~20-30s** (excluding implementation time)

With 10 pending tickets: ~5-10 minutes of automation per full loop.

## Limitations & Notes

1. **Cannot auto-invoke Claude Code**: The script can't spawn new Claude instances (would be circular). Instead, it pauses and waits for you to run `claude-code` manually.

2. **Manual implementation required**: The implementation step still needs human (or Claude) intervention. The script only automates branching, testing, and PR creation.

3. **Simple retry logic**: The script retries 3 times but doesn't auto-fix complex issues. For complex failures, you need to manually debug.

4. **Tests must pass**: The script only moves forward when tests pass. If tests are flaky, you might need to adjust test reliability.

5. **Linear branch dependency**: Each branch depends on the previous one. Parallel development requires manual branch management.

## Future Enhancements

- [ ] Auto-detect simple failures and suggest fixes
- [ ] Parallel ticket processing with merge strategy
- [ ] Integration with CI/CD pipeline (run tests in GitHub Actions)
- [ ] Slack notifications for PR creation
- [ ] Automatic code review summaries
- [ ] Performance metrics and dashboards

## Support

For issues with the script:

```bash
# Enable debug mode
DEBUG=1 ./scripts/ralph-loop.sh

# Check logs
tail -f .ralph-loop-logs/ralph-loop-*.log

# Test individual commands
./scripts/ralph-loop.sh status
./scripts/ralph-loop.sh list
```

For implementation issues, run Claude Code:
```bash
claude-code
```

---

**Happy automating! 🚀**
