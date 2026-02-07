# nbhd.city Phase 9: Integration Tests - Master Plan

**Last Updated:** 2026-02-07
**Status:** Planning - Ready for Implementation
**Framework:** Playwright (E2E), Vitest (Components), Pytest (API)
**Coverage Target:** 80%+ backend, 70%+ frontend
**Total Tests Designed:** 200+ atomic tests + compositions

---

## Quick Summary

This document defines comprehensive integration tests spanning all 9 development phases. Tests are organized by phase and include:

- **TEST-SETUP**: Infrastructure and test utilities
- **Phase 1-9 Tests**: Atomic tests validating individual features
- **Composition Tests**: End-to-end workflow validation (one per phase)
- **Test Mapping**: Traceability to original feature tickets

**Total Expected Duration:** ~5-6 hours for full test suite

---

## TEST-SETUP: Playwright Infrastructure & Test Data

**Blocking Ticket:** All phases depend on this

### Requirements

- [ ] Install Playwright (`npm install -D @playwright/test`)
- [ ] Create `/tests/` directory structure
- [ ] Set up test fixtures (auth, API client, database)
- [ ] Implement seed data script (populate test database)
- [ ] Create factory functions (generate test users, sites, content)
- [ ] Configure environment variables (API_URL, TEST_USER_PASSWORD, etc.)
- [ ] Set up test database (DynamoDB local or test instance)
- [ ] Configure CI/CD runner (GitHub Actions)

### Files to Create

```
tests/
├── fixtures/
│   ├── auth.ts           # Login helpers
│   ├── api-client.ts     # HTTP client with auth
│   ├── test-data.ts      # Factory functions
│   └── db.ts             # Database utilities
├── helpers/
│   ├── assertions.ts     # Custom matchers
│   └── polling.ts        # Async polling utilities
├── seed-data.sql         # Initial test data
└── global-setup.ts       # Database setup before tests
```

### Acceptance Criteria

- [ ] Playwright installed and configured
- [ ] Can authenticate test user and get JWT
- [ ] Seed data loads successfully
- [ ] Test database isolated from production
- [ ] CI/CD pipeline executes tests on commit
- [ ] HTML test reports generated after each run

---

## Phase 1: MVP Foundation - Authentication & Neighborhoods

**Maps to tickets:** Core auth/users/neighborhoods (Phase 1 MVP)

### TEST-AUTH-001: BlueSky OAuth Login Flow

**Tests:** SSG-Phase-1 authentication feature
**Framework:** Playwright E2E
**Duration:** 5-8 seconds

**5 Test Cases:**
1. ✓ Happy path: OAuth → JWT stored → dashboard loads
2. ✓ Failed credentials: Error shown, no JWT created
3. ✓ OAuth timeout: Session cleaned, can retry
4. ✓ Network error on callback: Error message, can retry
5. ✓ CSRF state mismatch: Prevented, session terminated

**Acceptance Criteria:** All test cases pass, JWT format valid, no partial logins

---

### TEST-USER-001: User Profile Creation & BlueSky Sync

**Tests:** User profile feature (Phase 1)
**Framework:** Playwright E2E
**Duration:** 15-20 seconds

**4 Test Cases:**
1. ✓ Happy path: Profile loads, BlueSky data synced
2. ✓ Missing fields: Validation error, form disabled
3. ✓ API failure: Error shown, data preserved
4. ✓ Unauthenticated: 401 redirect to login

**Acceptance Criteria:** Profile persists, BlueSky data syncs, DID generated

---

### TEST-NBHD-001: Create & Join Neighborhoods

**Tests:** Neighborhood CRUD (Phase 1)
**Framework:** Playwright E2E
**Duration:** 25-30 seconds

**6 Test Cases:**
1. ✓ Create neighborhood: Slug generated, user is admin
2. ✓ Join neighborhood: User added as member (not admin)
3. ✓ Duplicate name: 409 error, prevented
4. ✓ Invalid name: Validation error (too short)
5. ✓ Private neighborhood: Permission denied
6. ✓ Non-existent neighborhood: 404 error

**Acceptance Criteria:** Neighborhoods create/join work, member counts accurate

---

### TEST-COMPOSITION-01: Full Signup → Neighborhood Flow

**Tests:** Complete Phase 1 workflow
**Framework:** Playwright E2E
**Duration:** 120-150 seconds

**5 Phases:**
1. OAuth login + profile creation
2. Create first neighborhood (admin)
3. Join existing neighborhood (member)
4. Create second neighborhood (admin)
5. Verify dashboard shows all memberships

**Acceptance Criteria:** Full workflow completes, no data loss, all records created

---

## Phase 2: AT Protocol Foundation - Records & CIDs

**Maps to tickets:** ATP-FOUND-001 through ATP-FOUND-004

### TEST-CID-001: CID Generation & Validation

**Tests:** ATP-FOUND-002 (CID utilities)
**Framework:** Pytest API
**Duration:** 2 seconds

**7 Test Cases:**
1. ✓ Valid CID format: Starts with `bafy`, base32
2. ✓ Deterministic: Same content = same CID
3. ✓ Unique: Different content = different CID
4. ✓ Edge case: Unicode content
5. ✓ Large content: 10KB+ still generates valid CID
6. ✓ Null content: Error handled
7. ✓ Type validation: Rejects invalid input

**Acceptance Criteria:** CIDs generated correctly, immutable, deterministic

---

### TEST-RKEY-001: Record Key Generation & Sorting

**Tests:** ATP-FOUND-003 (rkey utilities)
**Framework:** Pytest API
**Duration:** 10 seconds

**8 Test Cases:**
1. ✓ Format: Base32, 13 characters
2. ✓ Chronological sorting: Newer rkeys sort later
3. ✓ No collisions: 1000+ generations unique
4. ✓ TID format: Timestamp + random bits
5. ✓ URL-safe: No special characters
6. ✓ Timestamp precision: Microsecond level
7. ✓ Global uniqueness: Across processes
8. ✓ Sorting stability: Multiple creates in same second

**Acceptance Criteria:** rkeys sortable, unique, TID format verified

---

### TEST-RECORD-001: AT Protocol CRUD Operations

**Tests:** ATP-FOUND-004 (record CRUD)
**Framework:** Pytest API
**Duration:** 8 seconds

**13 Test Cases:**
1. ✓ Create: 201 with CID/rkey
2. ✓ Read by URI: 200 OK
3. ✓ Update: New version, old linked
4. ✓ Delete: Soft delete (marked but kept)
5. ✓ Query: List by collection
6. ✓ Pagination: Works with 100+ records
7. ✓ Missing $type: 400 error
8. ✓ Null values: 400 error
9. ✓ Unauthorized: 401 error
10. ✓ Not found: 404 error
11. ✓ Duplicate creation: 409 conflict
12. ✓ Update non-existent: 404 error
13. ✓ Version history: Linked records trackable

**Acceptance Criteria:** All CRUD ops work, versioning maintained, errors handled

---

### TEST-COMPOSITION-02: Full Record Lifecycle

**Tests:** Complete AT Protocol workflow
**Framework:** Pytest API
**Duration:** 2-3 seconds

**8 Phases:**
1. Create record (v1) with CID/rkey
2. Verify created record
3. Update to new version (v2)
4. Verify version history
5. Delete (soft)
6. Verify deletion state
7. Query records
8. Verify chronological order

**Acceptance Criteria:** Lifecycle complete, history maintained, soft delete works

---

## Phase 3: Template System - Gallery & Configuration

**Maps to tickets:** SSG-001, SSG-002, SSG-004, SSG-005, SSG-006

### TEST-TEMPLATE-001: Browse Template Gallery

**Tests:** SSG-001 (Template Gallery UI) + SSG-005 (Template API)
**Framework:** Playwright E2E
**Duration:** 5-8 seconds

**Test Cases:**
1. ✓ Gallery loads: 3+ templates visible
2. ✓ Metadata displays: Name, description, tags
3. ✓ Select button works: Navigates to config form
4. ✓ API failure: 500 error shown gracefully
5. ✓ Empty gallery: No templates message

**Acceptance Criteria:** Gallery renders, templates selectable, API works

---

### TEST-TEMPLATE-002: Create Site from Template

**Tests:** SSG-002 (Config Form) + SSG-006 (Site Config API)
**Framework:** Playwright E2E
**Duration:** 15-20 seconds

**Test Cases:**
1. ✓ Form renders: All schema fields present
2. ✓ Fill and submit: Site created with 201
3. ✓ Redirect: Navigates to dashboard
4. ✓ Validation errors: Required fields enforced
5. ✓ Duplicate name: 409 conflict

**Acceptance Criteria:** Sites create from templates, config validates

---

### TEST-CONFIG-001: Configure Site Settings

**Tests:** SSG-002 (Config form) + SSG-006 (Site config storage)
**Framework:** Playwright E2E
**Duration:** 12-15 seconds

**Test Cases:**
1. ✓ Load existing config: Form pre-populates
2. ✓ Modify fields: Changes save
3. ✓ Validation: Length limits enforced
4. ✓ Submit: PUT succeeds
5. ✓ Persist: Changes appear in dashboard

**Acceptance Criteria:** Config loads, modifies, persists correctly

---

### TEST-COMPOSITION-03: Full Template → Configuration Flow

**Tests:** Complete template selection and configuration
**Framework:** Playwright E2E
**Duration:** 50-60 seconds

**Workflow:**
1. Browse gallery
2. Select template
3. Load config form
4. Fill all fields
5. Create site
6. Edit configuration
7. Verify dashboard updates

**Acceptance Criteria:** Full workflow succeeds, data persists

---

## Phase 4: Template Analysis - Custom Templates

**Maps to tickets:** SSG-008, SSG-009, SSG-010

### TEST-CUSTOM-TEMPLATE-001: Register Custom Template from GitHub

**Tests:** SSG-008 (Custom Template Registration API)
**Framework:** Pytest + Playwright
**Duration:** 30-45 seconds

**Test Cases:**
1. ✓ Valid URL: 202 Accepted, template_id returned
2. ✓ Invalid URL: 400 bad request
3. ✓ Private repo: 202 initially, fails during analysis
4. ✓ Unsupported domain: 400 error
5. ✓ GitHub rate limit: Graceful error handling
6. ✓ GitLab/Bitbucket: Also supported

**Acceptance Criteria:** URL validation, async invocation, error handling

---

### TEST-SCHEMA-001: Verify Schema Inference from Template

**Tests:** SSG-009 (Template Analyzer Lambda)
**Framework:** Pytest
**Duration:** 10 seconds

**Test Cases:**
1. ✓ Blog template: Schema inferred with title, date, tags
2. ✓ Required fields: >80% occurrence detected
3. ✓ Type inference: String, date, array detected
4. ✓ No frontmatter: Empty schema with warning
5. ✓ Multiple types: Content types inferred separately

**Acceptance Criteria:** Schemas inferred correctly, types accurate

---

### TEST-ANALYZER-001: Template Analysis Job Status Polling

**Tests:** SSG-008 (status endpoint) + SSG-009 (Lambda)
**Framework:** Playwright E2E
**Duration:** 15-30 seconds

**Test Cases:**
1. ✓ Initial status: "analyzing"
2. ✓ Polling interval: Every 1-5 seconds
3. ✓ Status transitions: pending → analyzing → ready
4. ✓ Timeout: 60 second max
5. ✓ Failure: Status "failed" with error message
6. ✓ Network error: Retry with backoff

**Acceptance Criteria:** Polling works, timeouts handled, errors clear

---

### TEST-COMPOSITION-04: Full Custom Template Workflow

**Tests:** End-to-end template registration and selection
**Framework:** Playwright E2E
**Duration:** 60 seconds

**Workflow:**
1. Register GitHub URL
2. Wait for analysis (polling)
3. Template ready
4. Select from gallery
5. Load config form
6. Create site

**Acceptance Criteria:** Template lifecycle complete

---

## Phase 5: Content Management - Posts & Publishing

**Maps to tickets:** SSG-011, SSG-012, SSG-013, SSG-014

### TEST-CONTENT-001: Create New Blog Post

**Tests:** SSG-012 (Content Editor UI) + SSG-011 (Content API)
**Framework:** Playwright E2E
**Duration:** 5-35 seconds

**7 Happy Path + 5 Error Cases:**
1. ✓ Editor loads: All fields present
2. ✓ Markdown preview: Live update <500ms
3. ✓ Frontmatter fields: Title, date, tags, author
4. ✓ Auto-save: Every 30 seconds to localStorage
5. ✓ Publish as draft: Saves without BlueSky
6. ✓ BlueSky toggle: Shows/hides summary
7. ✓ Publish: Creates AT Protocol record

Error cases:
- Missing title: Validation error
- Invalid date: Error message
- Network failure: Draft preserved
- Page reload: Draft recovered
- BlueSky not linked: Error message

**Acceptance Criteria:** Editor works, auto-save functions, validation enforced

---

### TEST-CONTENT-002: Edit Existing Blog Post

**Tests:** SSG-011 (Content API) + SSG-012 (Editor)
**Framework:** Playwright E2E
**Duration:** 3-10 seconds

**4 Happy Path + 3 Error Cases:**
1. ✓ Load existing: Form pre-populates
2. ✓ Modify content: Changes display
3. ✓ Update: Save succeeds
4. ✓ Verify: Dashboard shows updated content

Error cases:
- Concurrent edits: Conflict detection
- Unsaved changes: Warning dialog
- API failure: Retry enabled

**Acceptance Criteria:** Edit workflow complete, conflicts handled

---

### TEST-CONTENT-003: Publish with BlueSky Integration

**Tests:** SSG-013 (Dual Record Creation)
**Framework:** Playwright E2E
**Duration:** 3-8 seconds

**4 Happy Path + 3 Error Cases:**
1. ✓ Generate summary: 300 char limit
2. ✓ Create AT records: blog.post + bsky.feed.post
3. ✓ Link facets: URL in summary
4. ✓ Verify BlueSky: Post appears

Error cases:
- Summary too long: Auto-truncate
- BlueSky API fail: Save locally, retry
- Account not linked: Error with setup link

**Acceptance Criteria:** BlueSky integration works, records linked

---

### TEST-COMPOSITION-05: Full Content Workflow

**Tests:** Complete content creation → editing → publishing
**Framework:** Playwright E2E
**Duration:** ~90 seconds

**Workflow:**
1. Create draft (with auto-save)
2. Edit and enhance
3. Enable BlueSky
4. Publish
5. Verify on site
6. Verify BlueSky post

**Acceptance Criteria:** Full workflow succeeds, content appears everywhere

---

## Phase 6: Build Pipeline & Deployment

**Maps to tickets:** SSG-015, SSG-016, SSG-017, SSG-018

### TEST-BUILD-001: Trigger Site Build

**Tests:** SSG-015 (Build Trigger API)
**Framework:** Playwright E2E
**Duration:** 2-5 seconds

**1 Happy Path + 4 Error Cases:**
1. ✓ Click deploy: Dialog shown
2. ✓ Confirm: POST /app/api/sites/{id}/build
3. ✓ 202 response: job_id returned
4. ✓ Button disabled: Prevent duplicate

Error cases:
- No content: 400 error "no content"
- Site not found: 404 error
- Permission denied: 403 error
- Build in progress: 409 conflict

**Acceptance Criteria:** Build triggers, async invoked, errors handled

---

### TEST-BUILD-002: Monitor Build Status & Logs

**Tests:** SSG-015 (Status endpoint) + SSG-016 (Lambda)
**Framework:** Playwright E2E
**Duration:** 180 seconds

**Test Cases:**
1. ✓ Poll every 5 seconds: Until completion
2. ✓ Status lifecycle: pending → running → completed
3. ✓ Logs display: Real-time updates
4. ✓ Elapsed time: Counter increments
5. ✓ Stop polling: On completion/failure
6. ✓ Manual refresh: Debounced
7. ✓ Network error: Retry with backoff
8. ✓ Timeout: 30 min max duration

**Acceptance Criteria:** Polling works, logs display, timeouts handled

---

### TEST-DEPLOY-001: Verify Site Deployed to Subdomain

**Tests:** SSG-017 (Subdomain Routing) + SSG-016 (Build Lambda)
**Framework:** Playwright E2E
**Duration:** 20-30 seconds

**Test Cases:**
1. ✓ Page loads: HTTP 200 at subdomain
2. ✓ Content displays: All posts visible
3. ✓ Navigation works: Links functional
4. ✓ Assets load: CSS, images, JS
5. ✓ Responsive: Mobile layout works
6. ✓ Cache invalidation: New content appears

**Acceptance Criteria:** Site accessible, content correct, responsive

---

### TEST-EXPORT-001: Export Site as ZIP

**Tests:** SSG-018 (Site Export Endpoint)
**Framework:** Playwright E2E
**Duration:** 5-10 seconds

**Test Cases:**
1. ✓ Export button: Downloads ZIP
2. ✓ ZIP structure: _site/, README.md
3. ✓ Content: All files present
4. ✓ Integrity: Extractable and valid
5. ✓ Size: Reasonable bounds

**Acceptance Criteria:** ZIP exports correctly, portable

---

### TEST-COMPOSITION-06: Full Build → Deploy → Verify

**Tests:** Complete build pipeline workflow
**Framework:** Playwright E2E
**Duration:** 300-600 seconds (actual build time)

**13 Steps:**
1. Create site
2. Add content
3. Trigger build
4. Monitor logs
5. Build completes
6. Visit site URL
7. Verify content
8. Navigate pages
9. Export ZIP
10. Extract and verify
11. Confirm deployment
12. Verify cache invalidation
13. Confirm subdomain routing

**Acceptance Criteria:** Full pipeline works end-to-end

---

## Phase 7: Neighborhood CMS & Admin Features

**Maps to tickets:** NBHD-001 through NBHD-005, SITES-001, SITES-002, SITES-003

### TEST-WELCOME-001: Create/Publish Welcome Page

**Tests:** NBHD-003 (Welcome Page UI) + NBHD-002 (Welcome API)
**Framework:** Playwright E2E
**Duration:** 30-45 seconds

**Test Cases:**
1. ✓ Navigate to admin: Welcome tab active
2. ✓ Edit markdown: Content loads
3. ✓ Preview updates: Live <500ms
4. ✓ Save: POST creates AT record
5. ✓ Persist: Data reloads correctly
6. ✓ Public access: Visible at /nbhds/{id}/welcome
7. ✓ Unsaved changes: Warning dialog

**Acceptance Criteria:** Welcome content works, AT metadata correct

---

### TEST-ANNOUNCEMENT-001: Create/Manage Announcements

**Tests:** NBHD-002 (Announcement API) + NBHD-004 (Admin UI)
**Framework:** Playwright E2E
**Duration:** 25-35 seconds

**Test Cases:**
1. ✓ Create: Form submits, 201 response
2. ✓ List: Newest first, paginated
3. ✓ Edit: Changes saved
4. ✓ Delete: Soft delete, removed from list
5. ✓ Expiration: Expired announcements filtered
6. ✓ Public view: Visible at /nbhds/{id}/welcome

**Acceptance Criteria:** Announcement CRUD works, expiration enforced

---

### TEST-SITE-TYPE-001: Personal vs Project Sites

**Tests:** SITES-001, SITES-002, SITES-003
**Framework:** Playwright E2E
**Duration:** 20-30 seconds

**Test Cases:**
1. ✓ Personal site: No neighborhood required
2. ✓ Project site: Neighborhood selection required
3. ✓ Validation: Missing nbhd_id rejected
4. ✓ Filtering: API supports site_type filter
5. ✓ Dashboard: Both types visible

**Acceptance Criteria:** Site types work, validation enforced

---

### TEST-CMS-VIEW-001: CMS View with Filters & Search

**Tests:** NBHD-005 (CMS View)
**Framework:** Playwright E2E
**Duration:** 30-40 seconds

**Test Cases:**
1. ✓ CMS loads: All records displayed
2. ✓ Filter by type: Only matching records shown
3. ✓ Search: Records filtered by content
4. ✓ Pagination: Large datasets paginated
5. ✓ Record details: AT metadata inspector
6. ✓ Admin only: Non-admins blocked with 403

**Acceptance Criteria:** CMS functional, filters work, admin access enforced

---

### TEST-COMPOSITION-07: Full Neighborhood Admin Workflow

**Tests:** Complete admin experience
**Framework:** Playwright E2E
**Duration:** 60-90 seconds

**Workflow:**
1. Create neighborhood
2. Access admin page
3. Create welcome content
4. Create announcements
5. Create project site
6. View in CMS
7. Verify public pages
8. Verify data persistence

**Acceptance Criteria:** Complete admin workflow succeeds

---

## Phase 8: Build Pipeline UI Completion

**Maps to tickets:** BUILD-001, BUILD-002, BUILD-003

### TEST-BUILD-TRIGGER-001: Build Trigger Button

**Tests:** BUILD-001 (Deploy button)
**Framework:** Vitest + React Testing Library
**Duration:** 60 seconds

**10 Test Cases:**
1. ✓ Button visible in dashboard
2. ✓ Dialog shown on click
3. ✓ Confirmation text clear
4. ✓ API call on confirm: POST /app/api/sites/{id}/build
5. ✓ Loading state: Button disabled
6. ✓ Success message: With job_id
7. ✓ Error message: On failure
8. ✓ Prevent duplicate: Already building
9. ✓ Cancel dismisses: No API call
10. ✓ Callback invoked: onBuildTriggered

**Acceptance Criteria:** Button works, confirmation required, errors handled

---

### TEST-BUILD-POLLER-001: Build Status Poller

**Tests:** BUILD-002 (Status display component)
**Framework:** Vitest with fake timers
**Duration:** 180 seconds

**16 Test Cases:**
1. ✓ Fetch on mount: Initial status
2. ✓ Poll interval: Every 5 seconds
3. ✓ Status display: With icons/colors
4. ✓ Logs update: In real-time
5. ✓ Elapsed time: Counter increments
6. ✓ State transitions: pending → running → completed
7. ✓ Stop polling: On completion
8. ✓ Error display: On failure
9. ✓ Retry button: Resumes polling
10. ✓ Network error: Backoff + retry
11. ✓ Timeout: 30 minute max
12. ✓ Cleanup: On unmount
13. ✓ Manual refresh: Debounced
14. ✓ Close button: Calls onClose
15. ✓ Responsive: Mobile layout
16. ✓ Accessibility: ARIA labels

**Acceptance Criteria:** Polling works, UI updates, cleanup proper

---

### TEST-BUILD-HISTORY-001: Build History Dashboard

**Tests:** BUILD-003 (History table component)
**Framework:** Vitest + React Testing Library
**Duration:** 120 seconds

**11 Test Cases:**
1. ✓ Display list: Past builds shown
2. ✓ Sort by date: Newest first
3. ✓ Status badges: Color-coded
4. ✓ Duration formatted: MM:SS or human-readable
5. ✓ Pagination: Next/Previous buttons
6. ✓ Page indicator: "Page 1 of 3"
7. ✓ Disable buttons: At boundaries
8. ✓ Click row: Open detail view
9. ✓ Detail view: Show full logs
10. ✓ Empty state: No builds message
11. ✓ API error: Error message shown

**Acceptance Criteria:** History displays, pagination works, details visible

---

### TEST-COMPOSITION-08: Full Build UI Workflow

**Tests:** End-to-end build UI flow
**Framework:** Playwright E2E
**Duration:** 120 seconds

**Workflow:**
1. Render dashboard
2. Click deploy button
3. Confirm in dialog
4. BuildStatusPoller appears
5. Manual refresh mid-build
6. Auto-polling continues
7. Build completes
8. View history
9. Verify past builds

**Acceptance Criteria:** Full UI flow works end-to-end

---

## Phase 9: AT Protocol Federation

**Maps to tickets:** ATP-001 through ATP-010

### TEST-DID-001: Member DID Creation & Verification

**Tests:** ATP-003 (DID Registration)
**Framework:** Playwright E2E + Pytest
**Duration:** 120 seconds

**8 Test Cases:**
1. ✓ Signup generates DID: format `did:plc:*`
2. ✓ Stored in profile: Persistent
3. ✓ Persists across sessions: Unchanged
4. ✓ DID document retrievable: .well-known/did.json
5. ✓ Public key valid: Cryptographically sound
6. ✓ Unique DIDs: No collisions
7. ✓ Generation failure: Fallback/retry
8. ✓ Private key secure: Not in API response

**Acceptance Criteria:** DIDs generated, stored, verified, secure

---

### TEST-DID-BLUESKY-001: DID to BlueSky Handle Mapping

**Tests:** ATP-004 (DID to BlueSky Mapping)
**Framework:** Playwright E2E
**Duration:** 900 seconds (15 min)

**6 Test Cases:**
1. ✓ Link BlueSky: OAuth flow
2. ✓ Create mapping: Bidirectional lookup
3. ✓ Profile sync: Data from BlueSky
4. ✓ Handle unique: Prevent duplicates
5. ✓ Unlink: Remove mapping
6. ✓ Verify: Both DIDs linked

**Acceptance Criteria:** Linking works, data syncs, uniqueness enforced

---

### TEST-PDS-001: Query Member Data as PDS

**Tests:** ATP-005 (PDS Implementation)
**Framework:** Pytest + Playwright
**Duration:** 1080 seconds (18 min)

**7 Test Cases:**
1. ✓ GET /xrpc/com.atproto.repo.getRepo: Returns profile
2. ✓ GET /xrpc/...listRecords: Lists posts, follows
3. ✓ Federation format: URIs, CIDs, timestamps
4. ✓ Access control: Unauthorized → 403
5. ✓ Invalid DID: 404 response
6. ✓ Large dataset: Pagination works
7. ✓ Cross-PDS query: Federation between instances

**Acceptance Criteria:** XRPC endpoints work, federation format correct

---

### TEST-EXPORT-ATPROTO-001: Export Data in AT Protocol Format

**Tests:** ATP-007 (Data Export)
**Framework:** Playwright E2E
**Duration:** 600 seconds (10 min)

**8 Test Cases:**
1. ✓ JSON export: All records included
2. ✓ ZIP export: Portable archive
3. ✓ Metadata: Export timestamp, DID, statistics
4. ✓ Records: Valid NDJSON format
5. ✓ Blobs: Avatars, images included
6. ✓ Import compatibility: Can re-import
7. ✓ Timeout handling: Async for large datasets
8. ✓ Data integrity: All records present

**Acceptance Criteria:** Export works, portable, completeness verified

---

### TEST-COMPOSITION-09: Full Federation & Portability Workflow

**Tests:** End-to-end federation scenario
**Framework:** Playwright E2E
**Duration:** 2700 seconds (45 min)

**Workflow:**
1. Signup generates DID
2. Link BlueSky account
3. Publish blog post
4. Create additional records (follows, likes)
5. Query as PDS
6. Verify federation format
7. Export data
8. Simulate import to different PDS
9. Verify portability

**Acceptance Criteria:** Full federation flow works end-to-end

---

## Test Execution Plan

### Phase-by-Phase Timeline

| Phase | Tests | Duration | Week |
|-------|-------|----------|------|
| TEST-SETUP | Infrastructure | 2-4 hours | 1 |
| Phase 1 | 16 tests | 20 min | 1 |
| Phase 2 | 29 tests | 22 sec | 1 |
| Phase 3 | 10+ tests | 45 min | 1 |
| Phase 4 | Async tests | 60 min | 2 |
| Phase 5 | 23 tests | 90 min | 2 |
| Phase 6 | 18 tests | 10-30 min | 2 |
| Phase 7 | 45+ tests | 180 min | 2-3 |
| Phase 8 | 38 tests | 8 min (components) | 3 |
| Phase 9 | 30 tests | 100 min | 3 |

### Running Tests

```bash
# Install dependencies
npm install -D @playwright/test @testing-library/react vitest

# Run all tests
npm test

# Run specific phase
npm test -- --grep "Phase 1"

# Run with UI
npm test -- --ui

# Debug specific test
npm test -- --debug -g "TEST-AUTH-001"

# Generate HTML report
npm test && npx playwright show-report
```

---

## Coverage Targets

| Layer | Target | Notes |
|-------|--------|-------|
| Backend API | 80%+ | Critical endpoints, error cases |
| Frontend Components | 70%+ | Main workflows, user interactions |
| Integration | 100% critical paths | All user journeys must work |

---

## Success Criteria

- [ ] All 200+ tests passing
- [ ] No flaky tests (pass 3 consecutive runs)
- [ ] HTML reports generated
- [ ] Coverage targets met
- [ ] CI/CD pipeline integrated
- [ ] All acceptance criteria verified
- [ ] Data integrity confirmed
- [ ] Error handling validated

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Status:** Ready for Implementation

For detailed test specifications, see individual phase sections above. Each test includes specific acceptance criteria, test data requirements, and error cases to be validated.
