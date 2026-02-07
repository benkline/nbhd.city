# TEST-COMPOSITION-01: Full Signup → Neighborhood Creation Workflow

**Status:** 📋 Ready to Implement
**Depends On:** TEST-AUTH-001 ✅, TEST-USER-001 ✅, TEST-NBHD-001 ✅
**Tests Feature:** Complete Phase 1 user journey
**Framework:** Playwright E2E
**Duration:** 120-150 seconds

---

## Overview

Comprehensive end-to-end test that chains all Phase 1 features together. Validates complete user journey from login through neighborhood creation and joining.

---

## Test Scenario: Alice's Complete Journey

### Phase 1: OAuth Login (45 seconds)

**Story:** Alice logs in via BlueSky OAuth

**Steps:**
1. Navigate to home page
2. Click "Login with BlueSky"
3. Complete OAuth flow with test account `alice.bsky.social`
4. Approve permissions
5. Redirect to dashboard

**Checkpoints:**
- ✅ JWT stored in localStorage
- ✅ Redirect to `/dashboard`
- ✅ Display name shows "Alice"
- ✅ Avatar loaded from BlueSky

---

### Phase 2: Profile Creation (15 seconds)

**Story:** Alice completes her profile with BlueSky data sync

**Steps:**
1. Navigate to `/settings`
2. Verify profile form pre-populated with BlueSky data
3. Update display name: "Alice" → "Alice Developer"
4. Update location: "San Francisco, CA"
5. Update bio: "Building communities online 🚀"
6. Click Save
7. Verify success toast

**Checkpoints:**
- ✅ Profile data persisted to database
- ✅ BlueSky handle visible
- ✅ DID generated and stored
- ✅ All updates reflected in GET `/api/user`

---

### Phase 3: Create First Neighborhood (20 seconds)

**Story:** Alice creates her first neighborhood as admin

**Steps:**
1. Navigate to `/dashboard`
2. Click "Create Neighborhood"
3. Fill form:
   - Name: "Alice's Neighborhood"
   - Description: "Community space for testing"
   - Privacy: "public"
4. Click Create
5. Verify neighborhood created

**Checkpoints:**
- ✅ Neighborhood record created in DynamoDB
- ✅ Alice is admin (role="admin")
- ✅ Alice appears in members list with admin badge
- ✅ Slug generated: "alices-neighborhood"
- ✅ Member count = 1

---

### Phase 4: Join Existing Neighborhood (15 seconds)

**Story:** Alice joins an existing neighborhood as a regular member

**Setup:** "Downtown Collective" neighborhood pre-seeded

**Steps:**
1. Navigate to `/neighborhoods` directory
2. Find "Downtown Collective"
3. Click to view details
4. Click "Join Neighborhood"
5. Verify membership created

**Checkpoints:**
- ✅ Membership role="member" (not admin)
- ✅ Button changes to "Leave"
- ✅ Alice appears in members list without admin badge
- ✅ Member count incremented
- ✅ POST `/api/neighborhoods/{id}/join` returns 200

---

### Phase 5: Create Second Neighborhood (20 seconds)

**Story:** Alice creates another neighborhood (still admin)

**Steps:**
1. Navigate to `/dashboard`
2. Click "Create Neighborhood"
3. Fill form:
   - Name: "Tech Community"
   - Description: "For technology enthusiasts"
   - Privacy: "public"
4. Click Create
5. Verify neighborhood created

**Checkpoints:**
- ✅ Second neighborhood created
- ✅ Alice is admin of both
- ✅ Dashboard shows both neighborhoods
- ✅ Correct roles displayed

---

## Final Dashboard State

**What should be visible:**

```
Your Neighborhoods (3 total):

1. Alice's Neighborhood
   You are an admin
   [Edit] [View] [Leave]

2. Tech Community
   You are an admin
   [Edit] [View] [Leave]

3. Downtown Collective
   You are a member
   [View] [Leave]
```

---

## Database State Verification

**User Record:**
```json
{
  "id": "user-alice",
  "display_name": "Alice Developer",
  "bluesky_handle": "alice.bsky.social",
  "location": "San Francisco, CA",
  "bio": "Building communities online 🚀",
  "did": "did:plc:abc123xyz...",
  "created_at": "2026-02-07T10:00:00Z"
}
```

**Neighborhood Records:**
```json
[
  {
    "id": "alices-neighborhood",
    "name": "Alice's Neighborhood",
    "created_by": "user-alice",
    "member_count": 1,
    "created_at": "2026-02-07T10:05:00Z"
  },
  {
    "id": "tech-community",
    "name": "Tech Community",
    "created_by": "user-alice",
    "member_count": 1,
    "created_at": "2026-02-07T10:25:00Z"
  }
]
```

**Membership Records:**
```json
[
  {
    "user_id": "user-alice",
    "neighborhood_id": "alices-neighborhood",
    "role": "admin"
  },
  {
    "user_id": "user-alice",
    "neighborhood_id": "tech-community",
    "role": "admin"
  },
  {
    "user_id": "user-alice",
    "neighborhood_id": "downtown-collective",
    "role": "member"
  }
]
```

---

## Playwright Implementation

```typescript
// tests/phase-1/composition-01.spec.ts
import { test, expect } from '@playwright/test';

test('TEST-COMPOSITION-01: Full signup and neighborhood workflow', async ({
  page,
  context,
}) => {
  // Phase 1: Login
  await page.goto('/');
  const loginBtn = page.locator('button:has-text("Login with BlueSky")');
  // ... complete OAuth flow
  await page.waitForURL('**/dashboard');

  // Phase 2: Profile
  await page.goto('/settings');
  await page.fill('[name="displayName"]', 'Alice Developer');
  await page.fill('[name="location"]', 'San Francisco, CA');
  await page.fill('[name="bio"]', 'Building communities online 🚀');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Profile updated')).toBeVisible();

  // Phase 3: Create first neighborhood
  await page.goto('/dashboard');
  await page.click('button:has-text("Create Neighborhood")');
  await page.fill('[name="name"]', "Alice's Neighborhood");
  await page.fill('[name="description"]', 'Community space for testing');
  await page.click('button:has-text("Create")');
  await page.waitForURL('**/neighborhoods/alices-neighborhood');
  await expect(page.locator('text=You are an admin')).toBeVisible();

  // Phase 4: Join existing neighborhood
  await page.goto('/neighborhoods');
  const downtownCard = page.locator('[data-testid="neighborhood-card"]:has-text("Downtown Collective")');
  await downtownCard.click();
  await page.click('button:has-text("Join Neighborhood")');
  await expect(page.locator('text=You are a member')).toBeVisible();

  // Phase 5: Create second neighborhood
  await page.goto('/dashboard');
  await page.click('button:has-text("Create Neighborhood")');
  await page.fill('[name="name"]', 'Tech Community');
  await page.fill('[name="description"]', 'For technology enthusiasts');
  await page.click('button:has-text("Create")');
  await page.waitForURL('**/neighborhoods/tech-community');

  // Final verification
  await page.goto('/dashboard');
  const nbhdCards = page.locator('[data-testid="neighborhood-card"]');
  expect(await nbhdCards.count()).toBe(3);

  // Verify membership roles
  const alicesNbhd = page.locator('[data-testid="neighborhood-card"]:has-text("Alice\'s Neighborhood")');
  await expect(alicesNbhd.locator('text=You are an admin')).toBeVisible();

  const downtownNbhd = page.locator('[data-testid="neighborhood-card"]:has-text("Downtown Collective")');
  await expect(downtownNbhd.locator('text=You are a member')).toBeVisible();
});
```

---

## Success Criteria

- ✅ All 5 phases complete without errors
- ✅ No page redirects to login (auth persists)
- ✅ All UI state updates reflect database changes
- ✅ User record created with all fields
- ✅ 3 membership records created (2 admin, 1 member)
- ✅ Dashboard shows correct role badges
- ✅ Total execution < 150 seconds
- ✅ No flaky waits or timeouts

---

## Error Recovery

If any phase fails:
1. Clear localStorage and retry
2. Verify test data seeded correctly
3. Check database state
4. Review error logs

---

## Notes

- This test validates the complete auth chain
- Depends on successful completion of TEST-AUTH-001, TEST-USER-001, TEST-NBHD-001
- Tests real API calls (not mocked)
- Tests real database state (not in-memory)
- Should run after TEST-SETUP completes

---

**Status:** ✅ Ready to implement once Phase 1 atomic tests pass
