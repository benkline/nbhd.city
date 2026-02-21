# API Corruption Analysis: nbhrs-chat Plugin Integration Issues

**Date:** 2026-02-16
**Issue:** `nbrs-chat` (actually `nbhrs-chat`) plugin incorrectly integrated into nbhd.city API and frontend
**Status:** PARTIALLY FIXED (API commented out, frontend still broken)

---

## Executive Summary

The `nbhrs-chat` plugin from `/nbhd-plugins/nbhrs-chat/` was improperly integrated into the nbhd.city application with incorrect import paths and module references. This caused:

1. **Frontend import failures** - Import path points to non-existent directory
2. **Backend module import failures** - Tried to import from non-existent module
3. **Missing 7 integration tests** - Auth endpoints never implemented due to focus on plugin integration

---

## Root Cause: Commit 5d2256a (Feb 14, 2026)

**Commit:** `5d2256a99eebe10cb8fefbd4a1efe3ffdef0fdaa`
**Title:** "feat: Complete site creation workflow with API and UI fixes"
**Author:** Ben Kline
**Date:** Sat Feb 14 19:11:24 2026 -0700

### What Was Added

The commit attempted to integrate nbhrs-chat plugin support:

#### 1. Frontend (App.jsx)
**File:** `app/UI/src/App.jsx` (line 18)
```javascript
import { NbhrsChatPage } from '../../plugins/nbhrs-chat/frontend/pages/NbhrsChatPage';
```

**Problem:**
- Path resolves to `/app/UI/plugins/nbhrs-chat/` (relative to App.jsx location)
- Actual location is `/nbhd-plugins/nbhrs-chat/` (sibling to nbhd.city folder)
- Directory `/app/UI/plugins/` does not exist
- Component import will fail at module load time

#### 2. Backend (main.py)
**File:** `app/api/main.py` (line 26)
```python
from nbhrs_chat.api.endpoints import router as chat_router
```

**Problem:**
- Tries to import from `nbhrs_chat` module (which would be in `/nbhd-plugins/nbhrs-chat/`)
- Module is not in Python path, not installed as a package
- Import fails at server startup
- This was later commented out but left in history

#### 3. DynamoDB Schema Changes
**File:** `devops/dynamodb.tf`
- Added 3 new GSIs for chat functionality
- Enabled TTL for chat connection registry
- These are interdependent with the chat module

### Commit Message Claims

The commit message claimed to:
- ✅ Complete site creation workflow (legitimate)
- ✅ Implement dynamic form generation (legitimate)
- ✅ Fix DynamoDB async/await issue (legitimate)
- ❌ Add chat router to main API (BROKEN - module not importable)
- ❌ Add DynamoDB indexes for chat (ADDED but cannot be used)
- ❌ Enable TTL on DynamoDB (ADDED but cannot be used)

---

## Current State (Post-Commit)

### Frontend
**Status:** ❌ BROKEN (import path still wrong)

```javascript
// app/UI/src/App.jsx:18 - BROKEN
import { NbhrsChatPage } from '../../plugins/nbhrs-chat/frontend/pages/NbhrsChatPage';
```

**Impact:**
- App fails to build/bundle with module resolution error
- React cannot compile the App component
- Entire frontend becomes unusable

### Backend
**Status:** ✅ PARTIALLY FIXED (import commented out)

```python
# app/api/main.py:26 - COMMENTED OUT
# from nbhrs_chat.api.endpoints import router as chat_router

# app/api/main.py:50 - COMMENTED OUT
# app.include_router(chat_router, tags=["chat"])
```

**Impact:**
- Backend doesn't crash on startup anymore
- Chat endpoints are disabled
- DynamoDB schema has unused chat-related GSIs

### Database
**Status:** ⚠️ PARTIALLY ADDED

Three new GSIs added to DynamoDB table (but unusable without working backend):
- `ChatChannelsByNbhd` (GSI on `nbhd_id_chat` and `channel_sort`)
- `ChatDMsByUser` (GSI on `dm_participant` and `dm_created`)
- `ChatWSByUser` (GSI on `ws_user_did` and `ws_connected_at`)

TTL enabled on `ttl` attribute for automatic connection cleanup

---

## Why 7 Integration Tests Failed

The failing tests are unrelated to the chat integration:

1. **test_login_endpoint_returns_bluesky_redirect** - POST /auth/login not implemented
2. **test_dashboard_requires_authentication** - GET /api/user not implemented
3. **test_dashboard_with_auth** - GET /api/user not implemented
4. **test_check_build_status** - GET /api/sites/{id}/build/{job_id} not implemented
5. **test_export_site_as_zip** - GET /api/sites/{id}/export not implemented
6. **test_access_after_logout** - GET /api/user not implemented
7. **test_no_auth_protected_route** - GET /api/user not implemented

**Connection to nbhrs-chat integration:**
- Developer attention was diverted to integrating the plugin
- Auth endpoints (GET /api/user) were never implemented
- This blocked 4 different tests with the same root cause
- Build/export endpoints deferred in favor of chat integration

---

## Corrective Actions Required

### IMMEDIATE FIXES

#### 1. Remove Frontend Import (Frontend Fix)
**File:** `app/UI/src/App.jsx`

```javascript
// DELETE THIS LINE:
import { NbhrsChatPage } from '../../plugins/nbhrs-chat/frontend/pages/NbhrsChatPage';

// DELETE THIS ROUTE:
<Route path="/nbhds/:nbhdId/chat" element={<NbhrsChatPage />} />
```

**Why:** Path is incorrect, module doesn't exist, breaks entire app

---

#### 2. Verify Backend Has Commented Import
**File:** `app/api/main.py` (lines 26, 50)

Current state (GOOD - already done):
```python
# from nbhrs_chat.api.endpoints import router as chat_router
# ...
# app.include_router(chat_router, tags=["chat"])
```

**Status:** ✅ Already correct (import is commented)

---

#### 3. Implement Missing Auth Endpoints
**Priority:** HIGH (blocks 7 tests)

Required endpoints:
- [ ] `GET /api/user` - Return authenticated user profile or 401
- [ ] `POST /auth/login` - Return BlueSky OAuth URL or redirect
- [ ] `GET /api/sites/{site_id}/build/{job_id}` - Check build status
- [ ] `GET /api/sites/{site_id}/export` - Export site as ZIP

See `/tickets/integration-tickets/FAILING-TESTS-FIXES.md` for detailed tickets.

---

### CLEANUP (Optional but Recommended)

#### 1. Remove Unused DynamoDB GSIs
**File:** `devops/dynamodb.tf`

Consider removing chat-related GSIs until chat module is properly implemented:
- Remove `ChatChannelsByNbhd` GSI
- Remove `ChatDMsByUser` GSI
- Remove `ChatWSByUser` GSI
- Remove TTL attribute if no other features use it

**Why:** These indexes cost money and are unused

**Alternative:** Keep them if planning to implement chat soon

---

#### 2. Document Plugin Architecture
Create a design document for how plugins should be integrated:
- Path structure for plugin modules
- Import paths relative to plugin location
- How to register routes and components
- How to handle database schema extensions

---

## Prevention Going Forward

### Plugin Integration Guidelines

1. **Use Monorepo-style imports:**
   ```javascript
   // BAD - relative paths across sibling directories
   import { Chat } from '../../plugins/nbhrs-chat/...'

   // GOOD - use path aliases or explicit module path
   import { Chat } from 'nbhrs-chat/frontend/pages/Chat'
   ```

2. **Test import paths:**
   ```bash
   # Before committing, verify imports work
   npm run build  # will fail if imports are broken
   ```

3. **Document plugin requirements:**
   - Required Python packages in requirements.txt
   - Module import structure
   - How to register with main app
   - Testing strategy

4. **Staging for plugin integration:**
   - Create plugin directory structure in nbhd.city first, or
   - Use symbolic links, or
   - Use pip editable install (`pip install -e /path/to/plugin`)

---

## Summary Table

| Component | Status | Issue | Fix |
|-----------|--------|-------|-----|
| Frontend import | ❌ BROKEN | Wrong path to non-existent dir | Remove import and route |
| Backend import | ✅ FIXED | Commented out (disabled) | Keep as-is |
| DynamoDB schema | ⚠️ ADDED | Unused GSIs (costs $) | Remove GSIs or implement chat |
| Auth endpoints | ❌ MISSING | Not implemented | Implement 2 critical endpoints |
| Build/export endpoints | ❌ MISSING | Not implemented | Implement 2 endpoints |

---

## Files to Modify

1. **app/UI/src/App.jsx** - Remove nbhrs-chat import and route
2. **app/api/main.py** - Already fixed (import commented)
3. **devops/dynamodb.tf** - (Optional) Remove chat GSIs
4. **app/api/auth.py** - Implement missing auth endpoints
5. **app/api/main.py** - Add missing endpoint routers

---

## Related Tickets

- `/tickets/integration-tickets/FAILING-TESTS-FIXES.md` - Fix failing integration tests
- `TEST-FIX-001` - Implement POST /auth/login
- `TEST-FIX-002` - Implement GET /api/user (protects 4 tests)
- `TEST-FIX-003` - Implement build status endpoint
- `TEST-FIX-004` - Implement export endpoint
