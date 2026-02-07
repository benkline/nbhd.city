# TEST-SETUP: Playwright Infrastructure & Test Data

**Status:** 📋 Ready to Implement
**Priority:** 🔴 BLOCKING - All phases depend on this
**Type:** Infrastructure/Setup
**Framework:** Playwright, Vitest, Pytest
**Estimate:** 4-6 hours

---

## Overview

This ticket establishes the complete test infrastructure required for all 9 phases of integration testing. All other test tickets depend on successful completion of this setup.

---

## Requirements

### Installation & Dependencies
- [ ] Install Playwright: `npm install -D @playwright/test @playwright/test@latest`
- [ ] Install Testing Library: `npm install -D @testing-library/react @testing-library/jest-dom`
- [ ] Install Vitest: `npm install -D vitest`
- [ ] Install Pytest fixtures and helpers
- [ ] Add test scripts to `package.json`

### Test Fixture Creation
- [ ] Create `/tests/fixtures/auth.ts` - BlueSky OAuth mock and login helpers
- [ ] Create `/tests/fixtures/api-client.ts` - HTTP client with JWT authentication
- [ ] Create `/tests/fixtures/test-data.ts` - Factory functions for test users, neighborhoods, sites
- [ ] Create `/tests/fixtures/db.ts` - Database utilities (seed, cleanup, queries)

### Test Utilities
- [ ] Create `/tests/helpers/assertions.ts` - Custom Playwright matchers
- [ ] Create `/tests/helpers/polling.ts` - Async polling utilities
- [ ] Create `/tests/helpers/mocks.ts` - MSW (Mock Service Worker) handlers
- [ ] Create `/tests/global-setup.ts` - Pre-test database population

### Configuration Files
- [ ] Create `playwright.config.ts` - Base URL, timeouts, reporters, CI/CD settings
- [ ] Create `vitest.config.ts` - Test environment, coverage, reporters
- [ ] Create `jest.config.js` or update existing - For unit tests
- [ ] Create `.env.test` - Test environment variables

### Seed Data
- [ ] Create test database snapshot with:
  - [ ] 3 test user accounts (different roles)
  - [ ] 5 test neighborhoods with various configurations
  - [ ] 10 test sites (personal and project types)
  - [ ] 20+ test blog posts with AT Protocol metadata
  - [ ] Template library (3+ test templates)
- [ ] Implement seed data loading script: `npm run test:seed`
- [ ] Implement database cleanup script: `npm run test:cleanup`

### CI/CD Integration
- [ ] Create GitHub Actions workflow: `.github/workflows/test.yml`
- [ ] Configure test execution on: push, pull request
- [ ] Setup test report generation (HTML, JSON, JUnit)
- [ ] Configure test result artifacts storage
- [ ] Add coverage thresholds and reporting

### Documentation
- [ ] Create `/tests/README.md` with:
  - [ ] Setup instructions
  - [ ] Running tests locally
  - [ ] Running specific test files/cases
  - [ ] Debugging tests
  - [ ] Writing new tests
  - [ ] Test naming conventions
- [ ] Document test data factories
- [ ] Document test fixture usage

---

## Acceptance Criteria

- ✅ Playwright installed and configured
- ✅ Test user can authenticate and receive JWT token
- ✅ Seed data loads successfully into test database
- ✅ Test database isolated from production/development
- ✅ All test scripts work: `npm test`, `npm run test:seed`, `npm run test:cleanup`
- ✅ CI/CD pipeline runs tests on commit
- ✅ HTML test reports generated after each run
- ✅ Coverage reports generated (showing baseline metrics)
- ✅ Can run tests locally and in CI/CD with same results
- ✅ Documentation complete and accurate

---

## Test Files to Create

```
tests/
├── fixtures/
│   ├── auth.ts              # Login helpers, OAuth mock
│   ├── api-client.ts        # HTTP client with JWT
│   ├── test-data.ts         # Factory functions
│   └── db.ts                # Database utilities
├── helpers/
│   ├── assertions.ts        # Custom matchers
│   ├── polling.ts           # Async polling utilities
│   └── mocks.ts             # MSW handlers
├── seed-data/
│   ├── users.json           # Test user fixtures
│   ├── neighborhoods.json   # Test neighborhood fixtures
│   ├── sites.json           # Test site fixtures
│   └── load-seed.ts         # Loading script
├── global-setup.ts          # Pre-test setup
├── README.md                # Documentation
└── .env.test                # Test environment variables
```

---

## Implementation Checklist

### Week 1: Core Setup
- [ ] Day 1: Install dependencies, create fixture directory
- [ ] Day 2: Implement auth fixtures and login helpers
- [ ] Day 3: Create API client and database utilities
- [ ] Day 4: Setup test data factories
- [ ] Day 5: Create seed data and loading scripts

### Week 2: Configuration & CI/CD
- [ ] Day 1: Create config files (Playwright, Vitest, Jest)
- [ ] Day 2: Setup GitHub Actions workflow
- [ ] Day 3: Configure test reporting
- [ ] Day 4: Write documentation
- [ ] Day 5: Verify all setup works locally and in CI/CD

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Test script execution | All scripts pass without errors |
| Database setup time | < 10 seconds |
| CI/CD test execution | < 30 minutes for full suite |
| Coverage baseline | Establish initial metrics |
| Documentation completeness | 100% of components covered |

---

## Dependencies

- Node.js 18+
- npm 8+
- Git
- GitHub Actions access

---

## Notes

- This setup is the foundation for all 9 phases
- Once complete, individual phase tests can run independently
- Test data should be deterministic (same seed = same data)
- Fixtures should be reusable across all phases
- CI/CD should prevent merging if tests fail

---

**Next Steps:** Once TEST-SETUP is complete, move to PHASE-1 tests.
