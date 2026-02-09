# TEST-LOGIN-SESSIONS-001: Persistent Sessions & Token Refresh

**Status:** 📋 Ready to Implement
**Depends On:** TEST-LOGIN-OAUTH-001 ✅
**Tests Feature:** FL-9.3 (Persistent Sessions & Token Refresh)
**Framework:** Playwright E2E
**Duration:** 45-60 seconds

---

## Overview

Validates session persistence across browser restarts, token refresh mechanism, and "remember me" functionality. Tests automatic token refresh before expiration and graceful handling of expired sessions.

---

## Test Cases

### TEST-LOGIN-SESSIONS-001-HP1: Session Persists After Browser Restart

**Setup:** User logs in with "Remember me" checked

**Steps:**
1. Login with BlueSky OAuth
2. Check "Remember me" checkbox
3. Close browser completely
4. Restart browser
5. Navigate to `/dashboard`
6. User still logged in (no redirect to login)
7. Dashboard loads with user profile
8. JWT valid in localStorage

**Expected Results:**
- ✅ User logged in after restart
- ✅ No redirect to login page
- ✅ JWT still valid
- ✅ Session metadata matches stored value

---

### TEST-LOGIN-SESSIONS-001-HP2: Automatic Token Refresh

**Setup:** Token expiration in 2 minutes

**Steps:**
1. Login with valid JWT (exp: 2 min)
2. Make API call at 1.5 min mark (before expiry)
3. System detects token will expire soon
4. Calls POST `/app/app/api/auth/refresh` to get new token
5. API returns new JWT (7 day expiration)
6. Old token replaced in localStorage
7. API call succeeds with new token
8. User unaware of refresh (seamless)

**Expected Results:**
- ✅ Token refreshed before expiry
- ✅ New token stored in localStorage
- ✅ API calls succeed without interruption
- ✅ User doesn't see refresh happening
- ✅ Old refresh token validated

---

### TEST-LOGIN-SESSIONS-001-HP3: Inactivity Warning & Timeout

**Setup:** Configure 15 min inactivity timeout

**Steps:**
1. User logged in and idle for 15 minutes
2. Warning modal displays: "Session expires in 2 minutes due to inactivity"
3. User can click "Stay Logged In" to extend session
4. Or session auto-logs out after 2 more minutes
5. Redirect to login with message "Session expired"

**Expected Results:**
- ✅ Inactivity timeout enforced
- ✅ Warning appears before logout
- ✅ User can extend session
- ✅ Auto-logout works if no action
- ✅ Graceful redirect to login

---

### TEST-LOGIN-SESSIONS-001-E1: Token Refresh Fails

**Setup:** Backend returns 401 on refresh attempt

**Steps:**
1. User has expired token
2. Attempt to make API call
3. System tries to refresh token
4. Backend returns 401 (refresh token invalid)
5. Frontend detects auth failure
6. Redirect to login with message "Session expired. Please log in again."
7. Clear localStorage tokens

**Expected Results:**
- ✅ Graceful logout on refresh failure
- ✅ Clear message to user
- ✅ Tokens cleared from storage
- ✅ Can log in again normally

---

### TEST-LOGIN-SESSIONS-001-E2: Network Error During Refresh

**Setup:** Network request to refresh endpoint fails

**Steps:**
1. Token needs refresh
2. Network error occurs
3. System retries with exponential backoff (100ms, 200ms, 400ms)
4. After 3 retries, show error: "Connection error. Please refresh page or log in again."
5. User can manually refresh or logout

**Expected Results:**
- ✅ Retry mechanism works
- ✅ Exponential backoff applied
- ✅ User notified after retries exhausted
- ✅ Can recover by refreshing page

---

## Implementation Example

```typescript
// tests/frontend-login/sessions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TEST-LOGIN-SESSIONS-001: Persistent Sessions', () => {
  test('HP1: Session persists after browser restart', async ({ page }) => {
    // Login with remember me
    await page.goto('/login');
    await page.click('button:has-text("Sign in with BlueSky")');

    // Wait for OAuth callback and dashboard
    await page.waitForURL('**/dashboard');

    // Check "Remember me"
    const rememberCheckbox = page.locator('input[type="checkbox"][name="remember_me"]');
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check();
    }

    // Get token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Simulate browser restart by creating new page context
    const context = await page.context().browser()!.newContext();
    const newPage = await context.newPage();

    // Copy localStorage (simulating "remember me")
    await newPage.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, token);

    // Navigate to dashboard
    await newPage.goto('/dashboard');

    // Verify still logged in
    await expect(newPage.locator('[data-testid="user-profile"]')).toBeVisible();

    await newPage.close();
  });

  test('HP2: Automatic token refresh', async ({ page }) => {
    // Mock refresh endpoint
    await page.route('**/auth/refresh', route => {
      route.resolve({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        })
      });
    });

    // Login
    await page.goto('/login');
    // ... complete OAuth flow ...

    // Make API call (triggers refresh check)
    const response = await page.evaluate(() =>
      fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      }).then(r => r.json())
    );

    expect(response).toBeTruthy();
  });

  test('E1: Token refresh fails', async ({ page }) => {
    // Mock refresh to fail
    await page.route('**/auth/refresh', route => {
      route.resolve({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid refresh token' })
      });
    });

    // Set expired token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'expired.token.here');
    });

    // Try to navigate to protected page
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login');

    // Verify error message
    await expect(page.locator('text=Session expired')).toBeVisible();
  });
});
```

---

## Success Criteria

- ✅ Session persists with "Remember me"
- ✅ Tokens refresh automatically
- ✅ Inactivity timeout works
- ✅ Refresh failures handled gracefully
- ✅ Network errors retried correctly
- ✅ All 5 test cases pass

---

## Related Tickets

- **Implemented by:** FL-9.3 (Persistent Sessions & Token Refresh)
- **Uses:** FL-9.2 (OAuth login), Backend session API
- **Related tests:** TEST-LOGIN-OAUTH-001, TEST-COMPOSITION-FRONTEND-LOGIN

---

**Acceptance:** All test cases passing ✅
