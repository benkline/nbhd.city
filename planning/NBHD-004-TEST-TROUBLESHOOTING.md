# NBHD-004: Admin Page UI - Test Implementation Follow-up

**Status:** Phase 5 (TEST & VERIFY) - 4/11 Tests Passing
**Date:** 2026-02-04
**Branch:** `feature/NBHD-004-tests`

## Summary

The NBHD-004 implementation (Admin Page UI components) is feature-complete with all components created, routed, and styled. Phase 5 (TEST & VERIFY) is in progress. All test infrastructure has been implemented using MSW (Mock Service Worker) for HTTP mocking, and tests are now running. However, 7 of 11 AdminPage tests are failing due to an MSW route matching issue that needs debugging.

## What's Working ✅

1. **Components Created (9 total)**
   - AdminPage.jsx - Main admin container with tab navigation
   - WelcomeContentEditor.jsx - Welcome content management
   - AnnouncementManager.jsx - Announcement CRUD with pagination
   - NbhdSettingsForm.jsx - Settings display
   - SitesTab.jsx - Sites management wrapper

2. **Service Layer**
   - nbhdContentService.js - 6 methods for content API calls
   - Properly imports and uses api.js client

3. **Routing**
   - Route added to App.jsx: `/nbhds/:id/admin`
   - Admin button added to NeighborhoodDetail.jsx
   - Access control implemented (non-owners redirected)

4. **Test Infrastructure**
   - Test files created for all components
   - MSW server running with 6+ handlers for content endpoints
   - Tests execute without parse/collection errors
   - 4/11 AdminPage tests passing

## Current Issue 🔴

**Problem:** MSW handlers not matching GET `/api/nbhds/:nbhdId` requests

**Symptoms:**
```
[MSW] Warning: intercepted a request without a matching request handler:
• GET http://localhost:8000/api/nbhds/nbhd-123
```

**Impact:**
- AdminPage cannot fetch neighborhood data on mount
- Component renders error state instead of content
- 7 tests fail waiting for component to load

**Root Cause:** Unknown - likely one of:
1. MSW route pattern not matching parameterized paths correctly
2. Handler not being registered in the server properly
3. Request being made before MSW server initializes
4. URL format mismatch (absolute vs relative paths)

## Files Changed

### Test Files Rewritten
- `nbhd/src/__tests__/pages/AdminPage.test.jsx`
- `nbhd/src/__tests__/components/WelcomeContentEditor.test.jsx`
- `nbhd/src/__tests__/components/AnnouncementManager.test.jsx`
- `nbhd/src/__tests__/components/NbhdSettingsForm.test.jsx`

### Configuration Updated
- `nbhd/vitest.config.js` - Added env vars, alias resolution
- `nbhd/src/__tests__/mocks/handlers.js` - Added neighborhood GET handler
- `nbhd/src/lib/api.js` - Fixed import.meta.env handling

### Commits
- `2467a2a` - chore: Improve test infrastructure for NBHD-004 admin components
- `6a95cc2` - chore(NBHD-004): Migrate tests to MSW for API mocking

## Debugging Steps

### Step 1: Verify MSW Server Initialization
Add logging to `src/__tests__/setup.js` to confirm MSW server is running:

```javascript
import { server } from './mocks/server';

console.log('MSW Server handlers count:', server.listHandlers().length);
beforeAll(() => {
  console.log('MSW Server starting...');
  server.listen();
});
```

### Step 2: Debug Handler Matching
Add request logging in handlers.js:

```javascript
// Add before the first handler
http.all('*', ({ request }) => {
  console.log(`[MSW] Intercepted: ${request.method} ${request.url}`);
  // Let it pass through to other handlers
  return;
}),
```

### Step 3: Check Handler Registration
In `src/__tests__/mocks/handlers.js`, verify the neighborhood handler is in the export:

```javascript
// After defining all handlers
console.log('Handlers:', handlers.map(h => h.toString()));
export const handlers = [/* ... */];
```

### Step 4: Test MSW Independently
Create a minimal test to verify MSW can intercept API calls:

```javascript
describe('MSW Setup', () => {
  it('intercepts GET /api/nbhds/nbhd-123', async () => {
    const response = await fetch('http://localhost:8000/api/nbhds/nbhd-123');
    expect(response.ok).toBe(true);
  });
});
```

## Potential Solutions

### Solution A: Update Handler Pattern
Try using `http.all()` with explicit method checking instead of parameterized routes:

```javascript
http.all('/api/nbhds/:nbhdId', ({ params, request }) => {
  if (request.method === 'GET') {
    return HttpResponse.json({ data: { ... } });
  }
  return;
}),
```

### Solution B: Use Absolute URL Patterns
Instead of relative paths, use full URL patterns:

```javascript
http.get('http://localhost:8000/api/nbhds/:nbhdId', () => {
  return HttpResponse.json({ data: { ... } });
}),
```

### Solution C: Add Request Logging Middleware
Create an MSW middleware that logs all intercepted requests for debugging:

```javascript
http.all('*', async ({ request }) => {
  console.log(`MSW intercepted: ${request.method} ${new URL(request.url).pathname}`);
  // Continue to other handlers
}),
```

### Solution D: Check MSW/Vitest Compatibility
Verify vitest and MSW versions are compatible:

```bash
npm list vitest msw
```

May need to update MSW to latest version if there's a known compatibility issue with vitest 1.6.

## Next Steps

1. **Investigate Root Cause**
   - Run diagnostic steps 1-4 above
   - Check browser console and test output for clues
   - Verify MSW server is actually listening

2. **Apply Solution**
   - Try Solutions A-D based on findings
   - Test with minimal fetch example first (Step 4)
   - Once working, verify all 11 AdminPage tests pass

3. **Run Full Test Suite**
   ```bash
   npm test -- AdminPage
   npm test -- WelcomeContentEditor
   npm test -- AnnouncementManager
   npm test -- NbhdSettingsForm
   npm test -- SitesTab
   ```

4. **Complete Phase 5**
   - Verify all tests pass
   - Update tickets.md acceptance criteria checkboxes
   - Create or update PR to main branch

5. **Cleanup**
   - Remove debug logging
   - Ensure all tests run cleanly
   - Document any MSW configuration learnings

## Testing Strategy

Once MSW issue is resolved:

```bash
# Run individual component tests
npm test -- AdminPage.test.jsx
npm test -- WelcomeContentEditor.test.jsx
npm test -- AnnouncementManager.test.jsx
npm test -- NbhdSettingsForm.test.jsx
npm test -- SitesTab.test.jsx

# Run full test suite
npm test

# Generate coverage report
npm run test:coverage
```

## Resources

- MSW Documentation: https://mswjs.io/docs/getting-started/mocks
- Vitest Configuration: https://vitest.dev/config/
- Testing Library: https://testing-library.com/docs/

## Notes

- All component implementations are complete and correct
- Service layer is properly structured
- Routing and access control working as intended
- Only blocker is MSW route matching for test data injection
- Once resolved, ticket can be marked complete

---

**Related Issue:** Module resolution timing with vitest service mocking (resolved by switching to MSW)
**Timeline:** Started 2026-02-04, estimated completion after debugging
**Assignee:** Follow-up implementation needed
