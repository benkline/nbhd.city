# TEST-LOGIN-OAUTH-001: Enhanced OAuth Login Flow

**Status:** 📋 Ready to Implement
**Depends On:** TEST-SETUP ✅
**Tests Feature:** FL-9.2 (Enhanced OAuth Login Flow)
**Framework:** Playwright E2E
**Duration:** 30-50 seconds

---

## Overview

Validates BlueSky OAuth login with comprehensive error handling, CSRF protection, and proper session setup. Tests the complete OAuth flow from login button to authenticated dashboard.

---

## Test Cases

### TEST-LOGIN-OAUTH-001-HP: Complete OAuth Flow to Dashboard

**Steps:**
1. Navigate to login page
2. Verify "Sign in with BlueSky" button visible
3. Click login button
4. Redirect to BlueSky OAuth authorization page
5. Authorize app (or use test account)
6. BlueSky redirects to `/auth/callback?code=...&state=...`
7. Backend exchanges code for JWT
8. Frontend stores JWT in localStorage
9. Redirect to `/dashboard`
10. User profile displays with BlueSky handle

**Expected Results:**
- ✅ OAuth button visible and clickable
- ✅ Proper redirect to BlueSky
- ✅ JWT stored in localStorage (valid JWS format)
- ✅ Redirect chain: login → bluesky.com → dashboard
- ✅ User profile loaded with BlueSky data
- ✅ No console errors

---

### TEST-LOGIN-OAUTH-001-E1: Invalid OAuth Code

**Setup:** Mock callback with invalid/expired code

**Steps:**
1. Initiate OAuth flow
2. Redirect to callback with invalid code
3. Backend returns 400 "Invalid authorization code"
4. Frontend displays error: "Authentication failed. Please try again."
5. User can click "Try Again" to restart login

**Expected Results:**
- ✅ Error message clear and user-friendly
- ✅ No partial authentication state
- ✅ Can restart login flow
- ✅ No JWT created

---

### TEST-LOGIN-OAUTH-001-E2: CSRF State Mismatch

**Setup:** Mock callback with different state parameter

**Steps:**
1. Initiate OAuth (generates state token)
2. Callback with mismatched state value
3. Backend rejects (CSRF protection)
4. Display error: "Security validation failed. Please log in again."
5. Session terminated

**Expected Results:**
- ✅ CSRF attack prevented
- ✅ Clear error message
- ✅ No JWT created
- ✅ Session cleaned up

---

### TEST-LOGIN-OAUTH-001-E3: Network Timeout During Exchange

**Setup:** Mock `/auth/callback` to timeout

**Steps:**
1. Complete BlueSky authorization
2. Redirect to callback, API times out
3. Display error: "Authentication service unavailable. Please try again."
4. User can retry

**Expected Results:**
- ✅ Graceful timeout handling
- ✅ Helpful error message
- ✅ Retry functionality works
- ✅ No partial state

---

### TEST-LOGIN-OAUTH-001-E4: BlueSky Denies Authorization

**Setup:** User clicks "Deny" on BlueSky

**Steps:**
1. OAuth flow initiated
2. User clicks "Deny" on BlueSky
3. BlueSky redirects to `/auth/callback?error=access_denied`
4. Frontend displays: "Authorization denied. You can try again."
5. Login button available to retry

**Expected Results:**
- ✅ Error message non-threatening
- ✅ Can retry login
- ✅ No token created
- ✅ No console errors

---

## Implementation Example

```typescript
// tests/frontend-login/oauth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TEST-LOGIN-OAUTH-001: Enhanced OAuth Login Flow', () => {
  test('HP: Complete OAuth flow to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Verify button visible
    const loginButton = page.locator('button:has-text("Sign in with BlueSky")');
    await expect(loginButton).toBeVisible();

    // Mock OAuth callback
    await page.route('**/auth/callback*', route => {
      if (route.request().url().includes('code=valid')) {
        route.resolve({
          status: 302,
          headers: { Location: '/dashboard' },
          body: ''
        });
      }
    });

    // Click login
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify JWT stored
    const jwt = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(jwt).toMatch(/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

    // Verify profile displayed
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('E2: CSRF state mismatch', async ({ page }) => {
    await page.goto('/login');

    // Mock mismatched state
    await page.route('**/auth/callback*', route => {
      if (route.request().url().includes('state=wrong')) {
        route.resolve({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'state_mismatch' })
        });
      }
    });

    // Simulate redirect with wrong state
    await page.goto('/auth/callback?code=test&state=wrong');

    // Verify error message
    await expect(page.locator('text=Security validation failed')).toBeVisible();
  });
});
```

---

## Success Criteria

- ✅ OAuth flow completes successfully
- ✅ JWT format validated
- ✅ CSRF protection verified
- ✅ Error messages user-friendly
- ✅ All 5 test cases pass
- ✅ No flaky tests

---

## Related Tickets

- **Implemented by:** FL-9.2 (Enhanced OAuth Login Flow)
- **Uses:** BlueSky OAuth integration (Phase 1)
- **Related tests:** TEST-LOGIN-SESSIONS-001, TEST-COMPOSITION-FRONTEND-LOGIN

---

**Acceptance:** All test cases passing ✅
