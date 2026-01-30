# Ralph Loop Automation 🔄

Automated ticket-driven development with continuous testing, branching, and PR creation.

## What It Does

The Ralph Loop script orchestrates the complete development workflow for each ticket:

```
Ticket Found
    ↓
Create Branch (feature/SSG-XXX off previous branch)
    ↓
Display Ticket Requirements + Prompt
    ↓
Invoke claude-code for implementation
    ↓
Run Integration Tests
    ├─ PASS: Commit → Push → Create PR → Next Ticket
    └─ FAIL: Retry up to 3 times
        ├─ PASS: Commit → Push → Create PR → Next Ticket
        └─ FAIL: Pause for manual intervention
```

## Quick Start

### Continuous Mode (Fully Automated Loop)

```bash
./scripts/ralph-loop.sh
```

This runs forever, processing all pending tickets:
1. Creates branch for next pending ticket
2. Displays requirements + prompt
3. Pauses for you to run `claude-code` to implement
4. Runs tests automatically (up to 3 attempts)
5. Commits and creates GitHub PR
6. Repeats for next ticket

### Manual Mode (Step-by-Step)

```bash
# 1. Setup next ticket (creates branch + shows requirements)
./scripts/ralph-loop.sh setup

# 2. Implement in Claude Code
claude-code  # You do the implementation

# 3. Run tests (with automatic retries)
./scripts/ralph-loop.sh test

# 4. Commit and create PR
./scripts/ralph-loop.sh finalize
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

Each ticket gets its own branch:
- `feature/SSG-011` (off `develop`)
- `feature/SSG-012` (off `feature/SSG-011`)
- `feature/SSG-013` (off `feature/SSG-012`)
- etc.

This creates a linear chain where each branch depends on the previous one.

### 2. Ticket Detection

The script reads `planning/tickets.md` and looks for:
- Tickets with `[ ]` (pending requirements)
- Skips tickets marked `COMPLETED`
- Processes in order found

### 3. Test Retry Logic

```
Test Run 1 (FAIL)
  ↓
Wait for your edits
  ↓
Test Run 2 (FAIL)
  ↓
Wait for your edits
  ↓
Test Run 3 (FAIL)
  ↓
PAUSE - Manual intervention needed
```

You get 3 attempts to fix test failures. After that, the script pauses.

### 4. PR Creation

After tests pass, the script:
- Commits with proper message format
- Pushes to `origin/feature/SSG-XXX`
- Creates GitHub PR via `gh` CLI
- Updates progress tracking

## Integration with Claude Code

The script **does NOT** run `claude-code` automatically (that would be circular 🔄). Instead:

### In Continuous Mode:
1. Script creates branch and shows requirements
2. Script pauses and displays:
   ```
   👉 Run claude-code to implement this ticket
   When implementation is complete:
   Press ENTER here to run tests...
   ```
3. You open another terminal and run `claude-code`
4. Claude Code implements the ticket
5. You press ENTER in the script terminal
6. Script runs tests automatically

### Why This Design?

- **Preserves context**: Claude Code keeps full conversation history per ticket
- **Better UX**: You can see requirements before implementing
- **Safer**: Tests are run automatically but you control implementation
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

### Session 1: Automatic Continuous Loop

```bash
$ ./scripts/ralph-loop.sh

[INFO] Starting Ralph Loop Automation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] Loop iteration: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] Processing: SSG-015

[INFO] TICKET: SSG-015
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Description: Site Build Trigger API
- Requirements:
  - [ ] POST /api/sites/{id}/build - Trigger build
  - [ ] GET /api/sites/{id}/builds/{job_id} - Get build status
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] Branch ready: feature/SSG-015
👉 Run claude-code to implement this ticket

When implementation is complete:
Press ENTER here to run tests...
```

At this point, you open another terminal:
```bash
$ claude-code
# ... implement SSG-015 ...
# ... when done, press Ctrl+D to exit Claude Code ...
```

Back in the script terminal, you press ENTER:

```bash
[INFO] Running tests with up to 3 attempts...

[INFO] Test attempt: 1/3
===================== test session starts ======================
...
======================== 12 passed in 0.03s ========================

[✓] All tests passed!
[✓] Changes committed
[✓] Branch pushed
[✓] PR created successfully
[✓] Completed: SSG-015

Next ticket in 10 seconds...
```

Script continues to next ticket automatically.

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
