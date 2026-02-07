# TEST-AUTH-001: BlueSky OAuth Login Flow

**Status:** 📋 Ready to Implement
**Depends On:** TEST-SETUP ✅
**Tests Feature:** Phase 1 BlueSky OAuth Authentication
**References:** See [tickets.md](../../tickets.md#phase-1-mvp-foundation) for feature details
**Framework:** Playwright E2E
**Duration:** 50-65 seconds per test

---

## Overview

Validates complete BlueSky OAuth login flow. Tests the critical path for user authentication and JWT token management.

---

## Test Cases

### TEST-AUTH-001-HP: Happy Path - Successful Login

**Steps:**
1. Navigate to home page (`/`)
2. Verify "Login with BlueSky" button visible
3. Click login button
4. Redirect to bluesky.com/auth with correct OAuth parameters
5. Fill BlueSky credentials (test account)
6. Click "Authorize" for permissions
7. BlueSky redirects to `/auth/callback?code=...&state=...`
8. API exchanges code for JWT token
9. Redirect to `/dashboard`
10. Verify JWT stored in localStorage
11. Verify user profile displayed on dashboard
12. Verify no errors in console

**Expected Results:**
- ✅ JWT present in localStorage (format: `^eyJ[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$`)
- ✅ Redirect chain: home → bluesky.com → dashboard
- ✅ User profile loaded and displayed
- ✅ No 401/403 errors
- ✅ User record created in DynamoDB

---

### TEST-AUTH-001-E1: Failed BlueSky Credentials

**Setup:** Test BlueSky account with wrong password

**Steps:**
1. Navigate to home page
2. Click login button
3. On BlueSky, enter wrong password
4. BlueSky displays error "Invalid credentials"
5. User can click back/retry
6. Verify NO redirect to nbhd.city
7. Verify NO JWT created locally

**Expected Results:**
- ✅ Login fails gracefully
- ✅ No token in localStorage
- ✅ User can retry login

---

### TEST-AUTH-001-E2: OAuth Timeout

**Setup:** OAuth session expires without user authorization

**Steps:**
1. Initiate login flow
2. Don't authorize for 10+ minutes
3. Session expires on BlueSky side
4. Verify old state token invalidated
5. User attempts to return to app
6. Verify 400 error or redirect to login

**Expected Results:**
- ✅ Session state cleaned up
- ✅ Can restart login fresh
- ✅ CSRF protection maintained

---

### TEST-AUTH-001-E3: Network Error on Callback

**Setup:** Mock POST `/auth/callback` to return 500

**Steps:**
1. Complete BlueSky authorization
2. Redirect to `/auth/callback` but API returns 500
3. Verify error message displayed: "Authentication failed"
4. Verify form preserved
5. User can retry (login again)

**Expected Results:**
- ✅ Error message clear and user-friendly
- ✅ No partial auth state
- ✅ Retry works correctly

---

### TEST-AUTH-001-E4: CSRF State Mismatch

**Setup:** Callback with mismatched state parameter (prevents CSRF)

**Steps:**
1. Initiate login (generates state token)
2. Mock callback with different state value
3. API validates and rejects mismatch
4. Verify 400 error
5. Verify session terminated
6. User must restart login

**Expected Results:**
- ✅ CSRF attack prevented
- ✅ Clear error message
- ✅ Session cleanup complete

---

## Playwright Implementation Example

```typescript
// tests/phase-1/auth-001.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TEST-AUTH-001: BlueSky OAuth Login', () => {
  test('HP: Happy path - successful login', async ({ page, context }) => {
    // Navigate to home
    await page.goto('/');

    // Find and click login button
    const loginButton = page.locator('button:has-text("Login with BlueSky")');
    await expect(loginButton).toBeVisible();

    // Click triggers OAuth redirect
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      loginButton.click()
    ]);

    // Complete OAuth on BlueSky
    await popup.fill('input[name="username"]', 'test-user.bsky.social');
    await popup.fill('input[name="password"]', process.env.BLUESKY_TEST_PASSWORD);
    await popup.click('button:has-text("Sign in")');

    // Click authorize
    await popup.click('button:has-text("Authorize")');

    // Return to main window and verify redirect
    await page.waitForURL('**/dashboard');

    // Verify JWT in localStorage
    const jwt = await page.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(jwt).toMatch(/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

    // Verify user displayed
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('E1: Failed credentials', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.locator('button:has-text("Login with BlueSky")');
    await loginButton.click();

    // Wrong password on BlueSky
    // ... (mock or use test account with wrong password)

    // Verify no redirect
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain('dashboard');

    // Verify no token
    const jwt = await page.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(jwt).toBeNull();
  });

  // Additional test cases...
});
```

---

## Test Data Requirements

| Data | Value | Notes |
|------|-------|-------|
| Test BlueSky Account | `test-alice.bsky.social` | Valid account for testing |
| Test Password | Set in `.env.test` | Never commit credentials |
| OAuth Callback URL | `http://localhost:3000/auth/callback` | Configured in BlueSky app settings |
| JWT TTL | 7 days | Standard expiration |

---

## Success Criteria

- ✅ All 5 test cases pass
- ✅ No flaky tests (pass 3 consecutive runs)
- ✅ JWT token format validated
- ✅ CSRF protection verified
- ✅ Error messages user-friendly
- ✅ No sensitive data logged

---

## Related Tickets

- **Implemented by:** Phase 1 MVP foundation
- **Used by:** All subsequent phases (depends on auth)
- **Related tests:** TEST-USER-001, TEST-NBHD-001, TEST-COMPOSITION-01

---

## Notes

- BlueSky OAuth is real integration (not mocked) - requires test account
- JWT token should be validated on every API call
- CSRF protection is critical for security
- OAuth flow timeout should be reasonable (10+ minutes acceptable)

---

**Acceptance:** All test cases passing + no flaky tests ✅
