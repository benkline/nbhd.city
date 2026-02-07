# Integration Tests - Master Index

**Status:** 📋 Planning Phase Complete - Ready for Implementation
**Total Tests:** 200+ atomic + 9 composition tests
**Total Duration:** ~5-6 hours full suite
**Organization:** Kanban-style folders (Pending → In Progress → Completed)

---

## 📊 Kanban Board Structure

```
tickets/
├── integration-tickets/          # 📋 All test specifications
│   ├── MASTER-PLAN.md           # Complete planning document
│   ├── INDEX.md                 # This file
│   │
│   ├── SETUP/                   # 🔴 BLOCKING - Must complete first
│   │   └── TEST-SETUP.md        # Infrastructure & fixtures
│   │
│   ├── PHASE-1/                 # 📕 MVP Foundation
│   │   ├── TEST-AUTH-001.md     # BlueSky OAuth login
│   │   ├── TEST-USER-001.md     # User profile & sync
│   │   ├── TEST-NBHD-001.md     # Neighborhood CRUD
│   │   └── TEST-COMPOSITION-01.md  # Full signup workflow
│   │
│   ├── PHASE-2/                 # 📗 AT Protocol Records
│   │   ├── TEST-CID-001.md
│   │   ├── TEST-RKEY-001.md
│   │   ├── TEST-RECORD-001.md
│   │   └── TEST-COMPOSITION-02.md
│   │
│   ├── PHASE-3/                 # 📘 Template System
│   │   ├── TEST-TEMPLATE-001.md
│   │   ├── TEST-TEMPLATE-002.md
│   │   ├── TEST-CONFIG-001.md
│   │   └── TEST-COMPOSITION-03.md
│   │
│   ├── PHASE-4/                 # 📙 Custom Templates
│   │   ├── TEST-CUSTOM-TEMPLATE-001.md
│   │   ├── TEST-SCHEMA-001.md
│   │   ├── TEST-ANALYZER-001.md
│   │   └── TEST-COMPOSITION-04.md
│   │
│   ├── PHASE-5/                 # 📕 Content Management
│   │   ├── TEST-CONTENT-001.md
│   │   ├── TEST-CONTENT-002.md
│   │   ├── TEST-CONTENT-003.md
│   │   └── TEST-COMPOSITION-05.md
│   │
│   ├── PHASE-6/                 # 📗 Build Pipeline
│   │   ├── TEST-BUILD-001.md
│   │   ├── TEST-BUILD-002.md
│   │   ├── TEST-DEPLOY-001.md
│   │   ├── TEST-EXPORT-001.md
│   │   └── TEST-COMPOSITION-06.md
│   │
│   ├── PHASE-7/                 # 📘 Neighborhood CMS
│   │   ├── TEST-WELCOME-001.md
│   │   ├── TEST-ANNOUNCEMENT-001.md
│   │   ├── TEST-SITE-TYPE-001.md
│   │   ├── TEST-CMS-VIEW-001.md
│   │   └── TEST-COMPOSITION-07.md
│   │
│   ├── PHASE-8/                 # 📙 Build Pipeline UI
│   │   ├── TEST-BUILD-TRIGGER-001.md
│   │   ├── TEST-BUILD-POLLER-001.md
│   │   ├── TEST-BUILD-HISTORY-001.md
│   │   └── TEST-COMPOSITION-08.md
│   │
│   └── PHASE-9/                 # 📕 AT Protocol Federation
│       ├── TEST-DID-001.md
│       ├── TEST-DID-BLUESKY-001.md
│       ├── TEST-PDS-001.md
│       ├── TEST-EXPORT-ATPROTO-001.md
│       └── TEST-COMPOSITION-09.md
│
├── completed/                    # ✅ Completed feature phases
│   ├── tickets.md               # Original Phase 1-8 features (MOVED HERE)
│   └── ticket-list.md           # Feature priority list (MOVED HERE)
│
├── tickets.md                   # Original (kept for reference)
└── ticket-list.md              # Original (kept for reference)
```

---

## 📋 Test Ticket Template

Each test ticket follows this structure:

```markdown
# TEST-XXX-YYY: Test Name

**Status:** 📋 Ready / 🔄 In Progress / ✅ Complete
**Depends On:** [Other tests]
**Tests Feature:** [Which phase feature]
**Framework:** Playwright/Vitest/Pytest
**Duration:** [Estimated time]

## Overview
## Test Cases
### Scenario 1 (Happy Path)
### Scenario 2 (Error Case)
## Implementation Example
## Success Criteria
## Notes
```

---

## 🎯 Execution Order

### Week 1: Infrastructure & Phase 1-2
1. **TEST-SETUP** (4-6 hours) - 🔴 BLOCKING
2. **Phase 1 Tests** (20 min)
   - TEST-AUTH-001
   - TEST-USER-001
   - TEST-NBHD-001
   - TEST-COMPOSITION-01
3. **Phase 2 Tests** (22 sec)
   - TEST-CID-001
   - TEST-RKEY-001
   - TEST-RECORD-001
   - TEST-COMPOSITION-02

### Week 2: Phases 3-4
4. **Phase 3 Tests** (45 min)
5. **Phase 4 Tests** (60 min - async polling)

### Week 3: Phases 5-6
6. **Phase 5 Tests** (90 min)
7. **Phase 6 Tests** (10-30 min + actual build time)

### Week 4: Phases 7-8
8. **Phase 7 Tests** (180 min)
9. **Phase 8 Tests** (8 min + component tests)

### Week 5: Phase 9 + Integration
10. **Phase 9 Tests** (100 min)
11. **CI/CD Integration**
12. **Full Suite Validation**

---

## 📊 Test Coverage by Phase

| Phase | Feature Tickets | Tests | Duration | Status |
|-------|-----------------|-------|----------|--------|
| SETUP | Infrastructure | 1 setup | 4-6h | 📋 |
| 1 | MVP Foundation | 4 | 20 min | 📋 |
| 2 | AT Protocol | 4 | 22 sec | 📋 |
| 3 | Templates | 4 | 45 min | 📋 |
| 4 | Custom Templates | 4 | 60 min | 📋 |
| 5 | Content Mgmt | 4 | 90 min | 📋 |
| 6 | Build Pipeline | 5 | 10-30 min | 📋 |
| 7 | CMS & Admin | 5 | 180 min | 📋 |
| 8 | Build UI | 4 | 8 min | 📋 |
| 9 | Federation | 5 | 100 min | 📋 |

**Total:** 40 test files + 1 setup = 41 test specifications

---

## 🔗 Test Dependencies

```
TEST-SETUP
    ↓
Phase 1 (Auth + User + Neighborhoods)
    ↓
Phase 2 (AT Protocol Records)
    ↓
Phase 3 (Templates)
    ↓
Phase 4 (Custom Templates)
    ↓
Phase 5 (Content Management)
    ↓
Phase 6 (Build Pipeline)
    ↓
Phase 7 (CMS & Admin)
    ↓
Phase 8 (Build UI)
    ↓
Phase 9 (Federation)
```

Each phase can begin once its dependencies complete. Some phases can run in parallel after Phase 2.

---

## 🎓 Test Ticket Format

Each test ticket should include:

✅ **Test ID & Name**
```
# TEST-XXX-YYY: Descriptive Test Name
```

✅ **Metadata**
```
**Status:** 📋 Ready to Implement
**Depends On:** TEST-SETUP ✅
**Tests Feature:** [Feature ticket reference]
**Framework:** Playwright/Vitest/Pytest
**Duration:** Estimated time
```

✅ **Overview**
- What is being tested
- Why it matters
- User scenario

✅ **Test Cases**
- Happy path
- Error cases (3-5 scenarios)
- Edge cases

✅ **Implementation Example**
- Code snippet showing how to write the test
- Playwright selectors or API calls
- Assertions

✅ **Success Criteria**
- Checklist of passing conditions

✅ **Related Tickets**
- Links to implemented features
- Links to other test tickets

---

## 📝 How to Use This Structure

### For Developers Implementing Tests

1. **Start with TEST-SETUP**
   - Create test infrastructure
   - Set up Playwright config
   - Implement test fixtures

2. **Follow phase order**
   - Can't test features that don't exist yet
   - Each phase builds on previous ones
   - Dependency chain ensures proper order

3. **Use test tickets as specs**
   - Each ticket is a complete test specification
   - Follow the format exactly
   - Reference implementation examples

4. **Update status as you work**
   - 📋 Ready to Implement (default)
   - 🔄 In Progress (when started)
   - ✅ Complete (when passing)

### For Project Managers

1. **Track progress with folders**
   - `integration-tickets/` = Pending tests
   - Move completed test folders to `completed/` as they pass
   - Visual representation of test completion

2. **Monitor dependencies**
   - TEST-SETUP must complete first
   - Phase order matters
   - Can parallelize after Phase 2

3. **Coverage metrics**
   - 200+ tests planned
   - Track % complete: tests passing / 200+
   - Target: 100% by end of Phase 9

---

## 📚 Test Ticket Examples

### Ready to Use as Templates:
- ✅ `SETUP/TEST-SETUP.md` - Infrastructure setup
- ✅ `PHASE-1/TEST-AUTH-001.md` - Playwright E2E test
- ✅ `PHASE-1/TEST-COMPOSITION-01.md` - Composition test

### To Create (follow same pattern):
- PHASE-2 through PHASE-9 test files
- Each phase has 4-5 atomic tests + 1 composition test
- Use existing examples as template

---

## 🚀 Getting Started

1. **Read MASTER-PLAN.md** for complete overview
2. **Start with TEST-SETUP** - This is blocking everything else
3. **Create test files** for each phase following template format
4. **Move tickets** to `completed/` folder as tests pass
5. **Update status** in each ticket file

---

## 📞 Reference

- **Full Test Plan:** `MASTER-PLAN.md`
- **Setup Instructions:** `SETUP/TEST-SETUP.md`
- **Feature Details:** `../../tickets.md`
- **Feature Status:** `../../ticket-list.md`

---

**Last Updated:** 2026-02-07
**Status:** ✅ Planning Complete - Ready for Implementation
