# TEST-LOGIN-LOGOUT-001: Logout Flow & Session Cleanup

**Status:** 📋 Ready to Implement
**Depends On:** TEST-LOGIN-OAUTH-001 ✅
**Tests Feature:** FL-9.5 (Logout Flow & Session Cleanup)
**Framework:** Playwright E2E
**Duration:** 20-30 seconds

---

## Overview

Validates secure logout process with complete session cleanup on both frontend and backend. Tests proper token invalidation, local storage clearing, and redirect behavior.

---

## Test Cases

### TEST-LOGIN-LOGOUT-001-HP: Complete Logout Flow

**Steps:**
1. User logged in (JWT in localStorage)
2. Navigate to user menu
3. Click "Logout" button
4. Optional confirmation dialog shown
5. Confirm logout
6. POST `/app/app/api/auth/logout` called
7. Backend invalidates session token
8. Backend clears refresh tokens
9. Frontend clears localStorage
10. Redirect to `/login`
11. Success message: "You've been logged out"
12. User cannot access protected pages

**Expected Results:**
- ✅ Logout button visible in menu
- ✅ Backend session invalidated
- ✅ Tokens cleared from localStorage
- ✅ Redirect to login page
- ✅ Success message displayed
- ✅ Cannot access dashboard after logout

---

### TEST-LOGIN-LOGOUT-001-HP2: Access Protected Page After Logout

**Steps:**
1. User logs out (as above)
2. Try to navigate to `/dashboard` directly
3. System detects no valid JWT
4. Redirect to `/login`
5. Display message: "Session expired. Please log in."

**Expected Results:**
- ✅ Cannot access protected pages without JWT
- ✅ Automatic redirect to login
- ✅ Clear message about session expiration

---

### TEST-LOGIN-LOGOUT-001-HP3: API Calls After Logout

**Steps:**
1. User logs out
2. Frontend tries to make API call (e.g., refresh user profile)
3. API endpoint returns 401 Unauthorized
4. Frontend receives error, no data returned

**Expected Results:**
- ✅ API calls rejected after logout
- ✅ No data leakage
- ✅ Proper 401 response

---

### TEST-LOGIN-LOGOUT-001-E1: Logout API Fails

**Setup:** Mock logout endpoint to return 500

**Steps:**
1. User clicks logout
2. Backend returns 500 error
3. Display error: "Logout failed. Please try again or clear browser data."
4. Offer "Clear Data" button to force logout locally
5. User can still clear session locally

**Expected Results:**
- ✅ Error message displayed
- ✅ Force logout option available
- ✅ Can recover by clearing data
- ✅ Session cleaned up locally

---

### TEST-LOGIN-LOGOUT-001-E2: Automatic Logout on Inactivity

**Setup:** Inactivity timeout set to 30 minutes

**Steps:**
1. User logged in, idle for 30+ minutes
2. Attempt to interact with app
3. System detects expired/invalid token
4. Automatic logout triggered
5. Redirect to login page
6. Message: "Your session has expired. Please log in again."
7. Clear all tokens from storage

**Expected Results:**
- ✅ Automatic logout on expiration
- ✅ Clear user-friendly message
- ✅ Tokens completely cleared
- ✅ Can log back in normally

---

## Implementation Example

```typescript
// tests/frontend-login/logout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TEST-LOGIN-LOGOUT-001: Logout Flow', () => {
  test('HP: Complete logout flow', async ({ page }) => {
    // Setup: Login first
    // (assume OAuth flow completes)

    // Navigate to user menu
    await page.click('[data-testid="user-menu-button"]');

    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();

    // Mock logout endpoint
    await page.route('**/auth/logout', route => {
      route.resolve({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Click logout
    await logoutButton.click();

    // Confirm if dialog shown
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Verify redirect to login
    await page.waitForURL('**/login');

    // Verify success message
    await expect(page.locator('text=logged out')).toBeVisible();

    // Verify JWT cleared
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('HP2: Cannot access dashboard after logout', async ({ page }) => {
    // After logout (from previous test)
    // Try to navigate to dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login');
  });

  test('HP3: API calls rejected after logout', async ({ page }) => {
    // After logout, all tokens cleared
    const response = await page.evaluate(() =>
      fetch('/api/user/profile')
        .then(r => ({ status: r.status }))
    );

    // Should return 401
    expect(response.status).toBe(401);
  });

  test('E1: Logout API fails', async ({ page }) => {
    // Mock logout to fail
    await page.route('**/auth/logout', route => {
      route.resolve({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    // Attempt logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('button:has-text("Logout")');

    // Verify error message
    await expect(page.locator('text=Logout failed')).toBeVisible();

    // Offer force logout option
    const clearButton = page.locator('button:has-text("Clear Data")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      // Verify manual cleanup works
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeNull();
    }
  });

  test('E2: Automatic logout on inactivity', async ({ page }) => {
    // Simulate expired token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'expired.token');
      localStorage.setItem('token_expires_at', Date.now().toString());
    });

    // Try to navigate to protected page
    await page.goto('/dashboard');

    // Should redirect to login with session expired message
    await page.waitForURL('**/login');
    await expect(page.locator('text=session has expired')).toBeVisible();
  });
});
```

---

## Success Criteria

- ✅ Logout button visible and functional
- ✅ Backend session invalidated
- ✅ Frontend tokens cleared
- ✅ Redirect to login page
- ✅ Protected pages inaccessible after logout
- ✅ API calls rejected after logout
- ✅ Error handling graceful
- ✅ All 5 test cases pass

---

## Related Tickets

- **Implemented by:** FL-9.5 (Logout Flow)
- **Uses:** FL-9.2 (OAuth login), FL-9.3 (Session management)
- **Related tests:** TEST-LOGIN-SESSIONS-001, TEST-COMPOSITION-FRONTEND-LOGIN

---

**Acceptance:** All test cases passing ✅
