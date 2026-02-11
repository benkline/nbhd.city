# TEST-COMPOSITION-FRONTEND-LOGIN: Complete Login Workflow

**Status:** 📋 Ready to Implement
**Depends On:** All FL tests above
**Tests Feature:** Complete FRONTEND-LOGIN Phase (9.1)
**Framework:** Playwright E2E
**Duration:** 3-5 minutes

---

## Overview

End-to-end test of the complete user login lifecycle: home page → OAuth login → onboarding → session management → logout.

---

## Complete Workflow

**Setup:** Fresh browser, no stored sessions

**Steps:**

### Phase 1: Home Page Context (TEST-LOGIN-CONTEXT-001)
1. Navigate to `/`
2. System checks for nbhd welcome page
3. Since new user, show login page as fallback

### Phase 2: OAuth Login (TEST-LOGIN-OAUTH-001)
4. Click "Sign in with BlueSky"
5. Complete OAuth flow
6. Redirect to dashboard

### Phase 3: First Login Onboarding (TEST-LOGIN-ONBOARDING-001)
7. System detects first login
8. Redirect to onboarding flow
9. Complete all 4 steps:
   - Welcome screen
   - Create/join neighborhood
   - Choose site type
   - Select template
10. Complete onboarding, redirect to dashboard

### Phase 4: Session Persistence (TEST-LOGIN-SESSIONS-001)
11. User remains on dashboard
12. Check "Remember me" is already selected
13. Close browser completely
14. Restart browser
15. Navigate to dashboard
16. User still logged in (session persisted)
17. Make API call to verify token refresh works

### Phase 5: Logout (TEST-LOGIN-LOGOUT-001)
18. Click user menu
19. Select "Logout"
20. Confirm logout
21. Redirect to login page
22. Verify cannot access dashboard

### Phase 6: Re-login (TEST-LOGIN-OAUTH-001 again)
23. Click "Sign in with BlueSky"
24. Complete OAuth again
25. Skip onboarding (already completed)
26. Redirect directly to dashboard

---

## Test Implementation

```typescript
// tests/frontend-login/composition.spec.ts
import { test, expect } from '@playwright/test';

test('COMPOSITION: Complete Frontend-Login Workflow', async ({ browser }) => {
  // Phase 1: Home Page
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/');
  // Should show login (no nbhd configured)
  await expect(page.locator('button:has-text("Sign in with BlueSky")')).toBeVisible();

  // Phase 2: OAuth Login
  // Mock OAuth callback
  await page.route('**/auth/callback', route => {
    route.resolve({
      status: 302,
      headers: { Location: '/onboarding' },
      body: ''
    });
  });

  await page.click('button:has-text("Sign in with BlueSky")');
  // ... OAuth flow completes ...
  await page.waitForURL('**/onboarding', { timeout: 10000 });

  // Phase 3: Onboarding
  await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();

  // Step 1: Welcome
  await page.click('button:has-text("Continue")');

  // Step 2: Neighborhoods
  await expect(page.locator('h2:has-text("Neighborhoods")')).toBeVisible();
  await page.fill('input[name="neighborhood_name"]', 'Test Neighborhood');

  await page.route('**/nbhds', route => {
    route.resolve({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-nbhd-001', name: 'Test Neighborhood' })
    });
  });

  await page.click('button:has-text("Create")');
  await page.click('button:has-text("Continue")');

  // Step 3: Site Type
  await expect(page.locator('h2:has-text("Site Type")')).toBeVisible();
  await page.click('input[value="personal"]');
  await page.click('button:has-text("Continue")');

  // Step 4: Template
  await expect(page.locator('h2:has-text("Select Template")')).toBeVisible();
  await page.click('button:has-text("Get Started")');

  // Should redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Phase 4: Session Persistence
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();

  // Verify "Remember me" is active
  const rememberMe = await page.evaluate(() => localStorage.getItem('remember_me'));
  expect(rememberMe).toBe('true');

  // Close and restart browser
  await context.close();

  const newContext = await browser.newContext();
  const newPage = await newContext.newPage();

  // Copy token to new context (simulating "remember me")
  await newPage.evaluate((t) => localStorage.setItem('auth_token', t), token);

  // Navigate to dashboard
  await newPage.goto('/dashboard');
  await expect(newPage.locator('[data-testid="user-profile"]')).toBeVisible({ timeout: 5000 });

  // Phase 5: Logout
  await newPage.click('[data-testid="user-menu-button"]');

  await newPage.route('**/auth/logout', route => {
    route.resolve({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  await newPage.click('button:has-text("Logout")');

  // Confirm if needed
  const confirmButton = newPage.locator('button:has-text("Confirm")');
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }

  // Verify redirect to login
  await newPage.waitForURL('**/login', { timeout: 5000 });

  // Verify success message
  await expect(newPage.locator('text=logged out')).toBeVisible();

  // Verify JWT cleared
  const clearedToken = await newPage.evaluate(() => localStorage.getItem('auth_token'));
  expect(clearedToken).toBeNull();

  // Phase 6: Re-login (should skip onboarding)
  // Mock OAuth callback to go directly to dashboard
  await newPage.route('**/auth/callback', route => {
    route.resolve({
      status: 302,
      headers: { Location: '/dashboard' },
      body: ''
    });
  });

  await newPage.click('button:has-text("Sign in with BlueSky")');
  // ... OAuth flow ...
  await newPage.waitForURL('**/dashboard', { timeout: 10000 });

  // Verify no onboarding shown
  await expect(newPage.locator('text=Welcome to our neighborhood')).not.toBeVisible();

  // Verify dashboard loads
  await expect(newPage.locator('[data-testid="user-profile"]')).toBeVisible();

  await newContext.close();
});
```

---

## Success Criteria

- ✅ Home page context-aware (shows login)
- ✅ OAuth flow completes successfully
- ✅ Onboarding completes all steps
- ✅ Session persists across browser restart
- ✅ Token refresh works automatically
- ✅ Logout clears session completely
- ✅ Cannot access protected pages after logout
- ✅ Can log back in normally
- ✅ Subsequent login skips onboarding
- ✅ Complete workflow end-to-end

---

## Related Tickets

- **Tests:** FL-9.1, FL-9.2, FL-9.3, FL-9.4, FL-9.5
- **Phase:** FRONTEND-LOGIN (Phase 9.1)

---

**Acceptance:** Complete workflow executes without errors ✅
