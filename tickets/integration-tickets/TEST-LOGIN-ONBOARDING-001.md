# TEST-LOGIN-ONBOARDING-001: User Onboarding Flow

**Status:** 📋 Ready to Implement
**Depends On:** TEST-LOGIN-OAUTH-001 ✅
**Tests Feature:** FL-9.4 (User Onboarding After First Login)
**Framework:** Playwright E2E
**Duration:** 60-90 seconds

---

## Overview

Validates complete onboarding experience for first-time users after OAuth login. Tests step progression, data prefilling, and proper completion state tracking.

---

## Test Cases

### TEST-LOGIN-ONBOARDING-001-HP: Complete Onboarding Flow

**Steps:**
1. New user completes OAuth login
2. System detects first login (no profile completion)
3. Redirect to `/onboarding` instead of dashboard
4. Step 1: Welcome with BlueSky profile (auto-populated)
5. Click "Continue" → Step 2: Join/Create neighborhoods
6. Create test neighborhood
7. Click "Continue" → Step 3: Site type preference
8. Select "Personal site"
9. Click "Continue" → Step 4: Template selection
10. Select template
11. Click "Get Started"
12. Redirect to `/dashboard`
13. Verify onboarding_completed flag set

**Expected Results:**
- ✅ All 4 steps display correctly
- ✅ Profile data pre-filled from BlueSky
- ✅ Can create neighborhood during onboarding
- ✅ Site type selection works
- ✅ Template selection works
- ✅ Dashboard accessible after completion
- ✅ Onboarding not shown on next login

---

### TEST-LOGIN-ONBOARDING-001-HP2: Skip Onboarding

**Steps:**
1. New user in onboarding
2. Click "Skip for now" button on Step 1
3. Redirect directly to `/dashboard`
4. Mark as onboarding_completed with minimal setup

**Expected Results:**
- ✅ Can skip onboarding any time
- ✅ Still marked as completed
- ✅ Not shown again
- ✅ Dashboard fully functional

---

### TEST-LOGIN-ONBOARDING-001-HP3: Re-access Onboarding from Settings

**Steps:**
1. User completed onboarding previously
2. Navigate to `/settings`
3. Click "View Setup Guide"
4. Onboarding flow shows again (read-only or editable)
5. Can update neighborhood or site preferences
6. Return to dashboard

**Expected Results:**
- ✅ Can access onboarding from settings
- ✅ Can re-do setup steps
- ✅ Changes persist to profile
- ✅ Returns to dashboard after

---

### TEST-LOGIN-ONBOARDING-001-E1: Network Error During Onboarding

**Setup:** Mock neighborhood creation to fail

**Steps:**
1. In onboarding Step 2
2. Try to create neighborhood
3. API returns 500 error
4. Display error: "Failed to create neighborhood. Please try again."
5. Can retry creation

**Expected Results:**
- ✅ Error message clear
- ✅ Form preserved
- ✅ Can retry without restarting onboarding
- ✅ No partial state

---

### TEST-LOGIN-ONBOARDING-001-E2: Returning User Not Shown Onboarding

**Setup:** User with onboarding_completed = true logs in

**Steps:**
1. User logs in with BlueSky OAuth
2. System detects onboarding already completed
3. Redirect directly to `/dashboard`
4. No onboarding flow shown

**Expected Results:**
- ✅ Onboarding skipped for returning users
- ✅ Dashboard loads immediately
- ✅ Faster repeat login experience

---

## Implementation Example

```typescript
// tests/frontend-login/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TEST-LOGIN-ONBOARDING-001: Onboarding Flow', () => {
  test('HP: Complete onboarding flow', async ({ page }) => {
    // Setup: Mock first-time user after OAuth
    await page.goto('/onboarding');

    // Step 1: Welcome
    await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();
    await expect(page.locator('[data-testid="bluesky-handle"]')).toContainText('user.bsky.social');

    // Continue to step 2
    await page.click('button:has-text("Continue")');

    // Step 2: Neighborhoods
    await expect(page.locator('h2:has-text("Neighborhoods")')).toBeVisible();
    await page.fill('input[name="neighborhood_name"]', 'Test Neighborhood');

    // Mock neighborhood creation
    await page.route('**/nbhds', route => {
      route.resolve({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-nbhd-001', name: 'Test Neighborhood' })
      });
    });

    await page.click('button:has-text("Create")');

    // Continue to step 3
    await page.click('button:has-text("Continue")');

    // Step 3: Site Type
    await expect(page.locator('h2:has-text("Site Type")')).toBeVisible();
    await page.click('input[value="personal"]');

    // Continue to step 4
    await page.click('button:has-text("Continue")');

    // Step 4: Template
    await expect(page.locator('h2:has-text("Select Template")')).toBeVisible();
    await page.click('button:has-text("Get Started")');

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard');

    // Verify onboarding_completed flag
    const user = await page.evaluate(() =>
      fetch('/api/user/profile').then(r => r.json())
    );
    expect(user.onboarding_completed).toBe(true);
  });

  test('HP2: Skip onboarding', async ({ page }) => {
    await page.goto('/onboarding');

    // Click skip
    await page.click('button:has-text("Skip for now")');

    // Should go to dashboard
    await page.waitForURL('**/dashboard');

    // Verify still marked as completed
    const user = await page.evaluate(() =>
      fetch('/api/user/profile').then(r => r.json())
    );
    expect(user.onboarding_completed).toBe(true);
  });

  test('E1: Network error during onboarding', async ({ page }) => {
    await page.goto('/onboarding');

    // Go to step 2
    await page.click('button:has-text("Continue")');

    // Mock neighborhood creation to fail
    await page.route('**/nbhds', route => {
      route.resolve({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.fill('input[name="neighborhood_name"]', 'Test');
    await page.click('button:has-text("Create")');

    // Verify error message
    await expect(page.locator('text=Failed to create')).toBeVisible();
  });
});
```

---

## Success Criteria

- ✅ All 4 onboarding steps complete
- ✅ Profile data pre-filled correctly
- ✅ Can skip and resume
- ✅ Neighborhoods/sites created properly
- ✅ Completion flag set correctly
- ✅ Returning users skip onboarding
- ✅ All 5 test cases pass

---

## Related Tickets

- **Implemented by:** FL-9.4 (User Onboarding)
- **Uses:** FL-9.2 (OAuth login), NBHD-001 (Neighborhoods), SSG-001 (Templates)
- **Related tests:** TEST-LOGIN-OAUTH-001, TEST-COMPOSITION-FRONTEND-LOGIN

---

**Acceptance:** All test cases passing ✅
