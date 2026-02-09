# TEST-LOGIN-CONTEXT-001: Context-Aware Home Page

**Status:** 📋 Ready to Implement
**Depends On:** TEST-SETUP ✅
**Tests Feature:** FL-9.1 (Context-Aware Home Page)
**Framework:** Playwright E2E
**Duration:** 20-30 seconds

---

## Overview

Validates that the home page displays appropriate content based on context:
- If a neighborhood has a welcome page configured, display it
- Otherwise, show the login page
- Proper loading states and error handling

---

## Test Cases

### TEST-LOGIN-CONTEXT-001-HP1: Display Nbhd Welcome Page When Configured

**Setup:** Create neighborhood with welcome content

**Steps:**
1. Navigate to home page (`/`)
2. Verify loading state displays
3. API fetches nbhd welcome content
4. Home page renders welcome page component
5. Welcome content displays (markdown rendered)
6. Navigation shows neighborhood info

**Expected Results:**
- ✅ Welcome page displays without login prompt
- ✅ Markdown renders correctly (headers, links, etc)
- ✅ No login form visible
- ✅ Unauthenticated users can view welcome
- ✅ Loading state clears after content loads

---

### TEST-LOGIN-CONTEXT-001-HP2: Display Login Page When No Nbhd Configured

**Setup:** No neighborhood with welcome page configured

**Steps:**
1. Navigate to home page (`/`)
2. Verify loading state displays
3. API call returns 404 (no welcome content)
4. Home page falls back to login page
5. Login form displays with OAuth button

**Expected Results:**
- ✅ Login page displays as fallback
- ✅ "Login with BlueSky" button visible
- ✅ No error message (404 is expected)
- ✅ Unauthenticated users see login
- ✅ Authenticated users see dashboard

---

### TEST-LOGIN-CONTEXT-001-HP3: Logged-In User Redirect

**Setup:** User is authenticated (JWT in localStorage)

**Steps:**
1. Navigate to home page (`/`)
2. System detects valid JWT
3. Redirect to `/dashboard` instead of home page
4. Dashboard loads with user's profile

**Expected Results:**
- ✅ Authenticated users bypass home page
- ✅ Redirect happens automatically
- ✅ Dashboard displays correctly
- ✅ No flash of login/welcome page

---

### TEST-LOGIN-CONTEXT-001-E1: API Fetch Timeout

**Setup:** Mock API timeout on welcome content fetch

**Steps:**
1. Navigate to home page
2. Loading state displays
3. API call times out after 5 seconds
4. System shows "Unable to load welcome page"
5. Falls back to login form below error

**Expected Results:**
- ✅ Timeout handled gracefully
- ✅ User-friendly error message
- ✅ Can still access login
- ✅ Retry button available

---

### TEST-LOGIN-CONTEXT-001-E2: Invalid Neighborhood ID

**Setup:** Configure invalid neighborhood ID in settings

**Steps:**
1. Navigate to home page
2. API returns 404 (nbhd not found)
3. System falls back to login page
4. Console shows debug info (but no error to user)

**Expected Results:**
- ✅ Graceful fallback
- ✅ No error shown to user
- ✅ Login page functional
- ✅ Admin can fix in settings

---

## Implementation Example

```typescript
// tests/frontend-login/context-aware-home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TEST-LOGIN-CONTEXT-001: Context-Aware Home Page', () => {
  test('HP1: Display nbhd welcome page when configured', async ({ page }) => {
    // Mock API to return welcome content
    await page.route('**/api/nbhds/*/content/welcome', route => {
      route.resolve({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: '# Welcome to our neighborhood!',
          created_at: new Date().toISOString()
        })
      });
    });

    await page.goto('/');

    // Verify loading state
    await expect(page.locator('[data-testid="home-loading"]')).toBeVisible();

    // Wait for content to load
    await page.waitForTimeout(500);

    // Verify welcome content displays
    await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();

    // Verify no login form
    await expect(page.locator('button:has-text("Login with BlueSky")')).not.toBeVisible();
  });

  test('E1: API fetch timeout', async ({ page }) => {
    // Mock timeout
    await page.route('**/api/nbhds/*/content/welcome', route => {
      route.abort('timedout');
    });

    await page.goto('/');

    // Wait for error to display
    await expect(page.locator('text=Unable to load')).toBeVisible({ timeout: 6000 });

    // Fallback to login should be available
    await expect(page.locator('button:has-text("Login with BlueSky")')).toBeVisible();
  });
});
```

---

## Test Data

| Data | Value | Notes |
|------|-------|-------|
| Welcome Content | Markdown string | Use valid markdown format |
| Neighborhood ID | test-nbhd-001 | From fixtures |
| Timeout | 5 seconds | Max wait for API |
| JWT | Valid token | For authenticated user test |

---

## Success Criteria

- ✅ All 5 test cases pass
- ✅ Welcome page displays when configured
- ✅ Login page shows as fallback
- ✅ Authenticated users redirect to dashboard
- ✅ Error handling graceful
- ✅ No flaky tests (pass 3 consecutive runs)

---

## Related Tickets

- **Implemented by:** FL-9.1 (Context-Aware Home Page)
- **Uses:** NBHD-003 (Welcome Page UI), NBHD-002 (Nbhd Content API)
- **Related tests:** TEST-LOGIN-OAUTH-001, TEST-COMPOSITION-FRONTEND-LOGIN

---

**Acceptance:** All test cases passing ✅
