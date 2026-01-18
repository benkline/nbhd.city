# Agent Instructions
1. Create a new git branch before starting work on an ticket
2. Complete all tasks in the assigned ticket. one at a time. 
3. Write and run tests for each task to check if the task is actually done before before marking it complete. 
4. Once tests pass, mark the task complete in the tickets.md file AND in the associated github issue.
5. Update existing documentation to reflect changes. 
5. When all tasks in the ticket are complete, git add, git commit, and git push all changes of the completed ticket to the origin github 

## Landing the Plane (Session Completion)
**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.
**MANDATORY WORKFLOW:**
1. **File issues for remaining work** - Create github issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
6. **Verify** - All changes committed AND pushed

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

