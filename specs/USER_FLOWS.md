# nbhd.city User Flows

**Last Updated:** 2026-02-14
**Status:** Planning & Integration Testing

---

## Overview

This document maps all primary user flows in nbhd.city, from initial login through site creation, editing, and publishing. Each flow includes decision points, error states, and acceptance criteria for integration testing.

---

## Flow 1: Authentication & Onboarding

### 1.1 Initial Landing
**Actor:** Anonymous User
**Entry Point:** `GET /`
**Goal:** Learn about nbhd.city and decide to join

**Steps:**
1. User visits homepage
2. Views public neighborhood directory (if available)
3. Sees "Sign In" button
4. Clicks "Sign In with BlueSky"

**Acceptance Criteria:**
- [ ] Homepage loads without authentication
- [ ] Sign-in button visible and clickable
- [ ] Clicking sign-in redirects to `/auth/login` or BlueSky OAuth

---

### 1.2 BlueSky OAuth Login
**Actor:** Anonymous User
**Entry Point:** `GET /login` or `POST /auth/login`
**Goal:** Authenticate via BlueSky

**Steps:**
1. User clicks login on homepage
2. User is redirected to `POST /auth/login`
3. Backend generates OAuth URL with PKCE code verifier
4. User is redirected to BlueSky for authorization
5. User authorizes nbhd.city on BlueSky
6. BlueSky redirects back to `/auth/callback?code=...&state=...`
7. Backend exchanges code for access token
8. Backend creates JWT token
9. User is redirected to `/dashboard` with JWT in storage/header

**API Calls:**
- `POST /auth/login` → Returns BlueSky OAuth URL
- `GET /auth/callback?code=...&state=...` → Exchanges code for JWT

**Acceptance Criteria:**
- [ ] `POST /auth/login` returns 302 redirect to BlueSky OAuth
- [ ] Invalid/expired codes return 401 Unauthorized
- [ ] Successful callback exchanges code for JWT token
- [ ] JWT token is valid for 7 days
- [ ] User profile data is fetched from BlueSky and stored
- [ ] Redirect to dashboard on successful login

---

### 1.3 Dashboard Access
**Actor:** Authenticated User
**Entry Point:** `GET /dashboard`
**Goal:** View user's neighborhoods and sites

**Steps:**
1. User lands on dashboard (protected route)
2. Dashboard loads user profile
3. Dashboard displays user's sites
4. Dashboard displays user's neighborhoods
5. User sees "Create Site" button
6. User sees "Create Neighborhood" button (optional)

**API Calls:**
- `GET /api/user` → Get current user profile
- `GET /api/sites` → List user's sites
- `GET /api/neighborhoods` → List user's neighborhoods (optional)

**Acceptance Criteria:**
- [ ] Dashboard protected - redirects to login if no JWT
- [ ] User profile loads correctly
- [ ] Sites list displays with title, template, created_at
- [ ] Empty state shown if no sites exist
- [ ] Action buttons are present and clickable

---

## Flow 2: Site Creation

### 2.1 Select Template
**Actor:** Authenticated User
**Entry Point:** `POST /api/sites` or UI flow
**Goal:** Choose a template for new site

**Steps:**
1. User clicks "Create Site" on dashboard
2. Template gallery loads with all available templates
3. User sees template previews (if available)
4. User clicks on a template to select

**API Calls:**
- `GET /api/templates` → List all templates
- `GET /api/templates/{id}/preview` → Get template preview image

**Acceptance Criteria:**
- [ ] All templates are listed with name, description
- [ ] Template previews load correctly
- [ ] Templates can be filtered by type (optional)
- [ ] User can select a template

---

### 2.2 Configure Site
**Actor:** Authenticated User
**Entry Point:** Template selected
**Goal:** Set site name and template-specific config

**Steps:**
1. User enters site title
2. User fills in template-specific configuration (varies by template)
   - Blog: author, description, accent_color
   - Portfolio: tagline, featured_projects
   - Newsletter: subtitle, email_address
3. User can preview changes in real-time (WASM)
4. User clicks "Create Site"

**API Calls:**
- `POST /api/sites` with body:
  ```json
  {
    "title": "My Blog",
    "template": "blog",
    "config": {
      "site_title": "My Blog",
      "author": "Alice",
      "description": "Tech thoughts",
      "accent_color": "#007bff"
    }
  }
  ```

**Acceptance Criteria:**
- [ ] Site title is required
- [ ] Config is validated against template schema
- [ ] Invalid config returns 400 with error details
- [ ] Successful creation returns 201 with site_id
- [ ] Site is stored in DynamoDB
- [ ] User is redirected to site editor

---

### 2.3 Site Created
**Actor:** Authenticated User
**Entry Point:** Site creation successful
**Goal:** Site is ready for editing

**Steps:**
1. Site is created with status "draft"
2. User is redirected to site editor
3. Site editor loads with current configuration
4. User sees preview of site

**Acceptance Criteria:**
- [ ] New site appears in user's sites list
- [ ] Site editor loads correctly
- [ ] Configuration matches what user entered
- [ ] Preview renders without errors

---

## Flow 3: Site Editing

### 3.1 Load Site Editor
**Actor:** Authenticated User (site owner)
**Entry Point:** `GET /site-editor/{site_id}`
**Goal:** Edit existing site configuration

**Steps:**
1. User clicks on site from dashboard
2. Site editor page loads
3. Current configuration is populated in form
4. Preview of site is shown (WASM)

**API Calls:**
- `GET /api/sites/{id}` → Get site details and config
- `GET /api/templates/{template_id}/schema` → Get template schema for validation

**Acceptance Criteria:**
- [ ] Site editor protected - only owner can edit
- [ ] Non-owner gets 403 Forbidden
- [ ] Non-existent site returns 404
- [ ] Configuration loads correctly
- [ ] Template schema is loaded for validation

---

### 3.2 Update Configuration
**Actor:** Authenticated User (site owner)
**Entry Point:** Site editor open
**Goal:** Modify site configuration

**Steps:**
1. User modifies configuration fields
2. User saves changes (auto-save or manual save)
3. Changes are validated against schema
4. Changes are stored
5. Preview updates to reflect changes

**API Calls:**
- `PUT /api/sites/{id}` with updated config

**Acceptance Criteria:**
- [ ] Config changes are persisted
- [ ] Invalid config returns 400
- [ ] Preview updates in real-time
- [ ] User can undo/revert changes (optional)
- [ ] Concurrent edits don't conflict (optimistic locking)

---

### 3.3 Preview Site
**Actor:** Authenticated User (site owner)
**Entry Point:** Site editor open
**Goal:** See how site will look

**Steps:**
1. User sees live preview in editor (WASM or iframe)
2. User updates config
3. Preview updates automatically
4. User can view full preview in new tab/window

**Acceptance Criteria:**
- [ ] Preview renders without errors
- [ ] Preview updates when config changes
- [ ] Preview shows actual content
- [ ] Mobile/desktop responsiveness is visible

---

## Flow 4: Site Building & Publishing

### 4.1 Trigger Build
**Actor:** Authenticated User (site owner)
**Entry Point:** Site editor or dashboard
**Goal:** Build static site from configuration

**Steps:**
1. User clicks "Build Site" button
2. Build job is created
3. Lambda function is invoked asynchronously
4. User sees "Building..." status
5. Build completes (success or error)
6. User sees build status and URL

**API Calls:**
- `POST /api/sites/{id}/build` → Trigger build
- `GET /api/sites/{id}/build/{job_id}` → Poll for status

**Response:**
```json
{
  "data": {
    "job_id": "build-123",
    "status": "queued",
    "started_at": "2026-02-14T10:00:00Z"
  },
  "meta": { "timestamp": "...", "request_id": "..." }
}
```

**Acceptance Criteria:**
- [ ] Build triggered returns 202 Accepted
- [ ] job_id is returned and can be used to check status
- [ ] Build status is stored in DynamoDB
- [ ] Lambda is invoked with correct parameters
- [ ] Build completes in reasonable time (< 5 minutes)
- [ ] Failed builds return error message

---

### 4.2 Monitor Build Progress
**Actor:** Authenticated User (site owner)
**Entry Point:** Build triggered
**Goal:** Track build progress

**Steps:**
1. User polls `GET /api/sites/{id}/build/{job_id}`
2. Backend returns current status (queued, building, success, error)
3. If success, URL is returned
4. If error, error message is returned

**Response:**
```json
{
  "data": {
    "job_id": "build-123",
    "status": "success",
    "url": "https://my-blog.nbhd.city/",
    "completed_at": "2026-02-14T10:02:00Z"
  }
}
```

**Acceptance Criteria:**
- [ ] Status endpoint returns correct status
- [ ] URL is returned when build succeeds
- [ ] Error message is returned when build fails
- [ ] Non-owner cannot access build status
- [ ] Status persists across requests

---

### 4.3 Published Site Access
**Actor:** Public User or Site Owner
**Entry Point:** Build completed, URL is public
**Goal:** View published static site

**Steps:**
1. Build completes successfully
2. Site is deployed to subdomain (e.g., my-blog.nbhd.city)
3. Public users can view site at that URL
4. Site is static, fast-loading

**Acceptance Criteria:**
- [ ] Published site is accessible at public URL
- [ ] Site renders correctly
- [ ] Site is served over HTTPS
- [ ] Site is fast (< 2s load time)
- [ ] Site works offline (static)

---

## Flow 5: Site Deletion

### 5.1 Delete Site
**Actor:** Authenticated User (site owner)
**Entry Point:** Dashboard or site editor
**Goal:** Remove site

**Steps:**
1. User clicks "Delete Site" button
2. Confirmation dialog appears
3. User confirms deletion
4. Site is deleted from DynamoDB
5. Site is removed from user's dashboard
6. Published version is removed from CDN/subdomain

**API Calls:**
- `DELETE /api/sites/{id}` → Delete site

**Acceptance Criteria:**
- [ ] Delete requires confirmation
- [ ] Only owner can delete
- [ ] Site is removed from list immediately
- [ ] Published version is unpublished
- [ ] Non-existent site returns 404
- [ ] Successful delete returns 204 No Content

---

## Flow 6: Site Export

### 6.1 Export Site
**Actor:** Authenticated User (site owner)
**Entry Point:** Site editor or dashboard
**Goal:** Download site as ZIP file

**Steps:**
1. User clicks "Export Site" button
2. Export is prepared (configuration + assets)
3. ZIP file is generated
4. User downloads ZIP

**API Calls:**
- `GET /api/sites/{id}/export` → Download ZIP file

**Response:**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="my-blog-export.zip"
[binary ZIP content]
```

**Acceptance Criteria:**
- [ ] Export returns ZIP file
- [ ] ZIP contains config.json
- [ ] ZIP contains template files
- [ ] ZIP contains any custom content
- [ ] Only owner can export
- [ ] Export filename includes site name and date

---

## Flow 7: Logout

### 7.1 User Logout
**Actor:** Authenticated User
**Entry Point:** Dashboard
**Goal:** End session

**Steps:**
1. User clicks "Logout" button
2. Frontend removes JWT token from storage
3. User is redirected to homepage
4. Session is cleared

**API Calls:**
- Optional: `POST /auth/logout` → Clear server-side session

**Acceptance Criteria:**
- [ ] JWT token is removed from storage
- [ ] User cannot access protected routes after logout
- [ ] Redirect to homepage on logout
- [ ] Subsequent API calls without token return 401

---

## Error Scenarios

### Common Error States

**No Authentication:**
- User tries to access protected route without token
- Returns 401 Unauthorized
- Redirect to login page

**Invalid Template:**
- User tries to create site with non-existent template
- Returns 400 Bad Request
- Error message explains valid templates

**Invalid Configuration:**
- User provides config that doesn't match schema
- Returns 400 Bad Request
- Error details show which fields failed validation

**Authorization Error:**
- User tries to access/edit another user's site
- Returns 403 Forbidden
- Error message: "You don't have permission to access this resource"

**Not Found:**
- User tries to access non-existent site/template
- Returns 404 Not Found
- Error message: "Site not found"

**Build Failure:**
- Lambda build process fails (invalid 11ty config, etc)
- Returns error message with details
- User can retry build

---

## Testing Matrix

| Flow | Scenario | Test Name |
|------|----------|-----------|
| 1.1 | Happy Path | `test_landing_page_public` |
| 1.2 | Login Success | `test_login_redirects_to_bluesky` |
| 1.2 | Login Callback | `test_login_callback_exchanges_code` |
| 1.3 | Dashboard Access | `test_dashboard_requires_auth` |
| 1.3 | Dashboard Loads | `test_dashboard_loads_sites` |
| 2.1 | List Templates | `test_list_templates_on_create` |
| 2.2 | Create Site | `test_create_site_success` |
| 2.2 | Create Site Validation | `test_create_site_invalid_config` |
| 3.1 | Edit Site | `test_edit_site_success` |
| 3.1 | Edit Unauthorized | `test_edit_site_unauthorized` |
| 3.2 | Update Config | `test_update_site_config` |
| 3.3 | Preview | `test_preview_renders` |
| 4.1 | Build Triggered | `test_build_site_returns_202` |
| 4.2 | Check Build Status | `test_build_status_success` |
| 4.2 | Build Failure | `test_build_failure_returns_error` |
| 5.1 | Delete Site | `test_delete_site` |
| 6.1 | Export Site | `test_export_site_as_zip` |
| 7.1 | Logout | `test_logout` |

---

## See Also

- [API.md](./API.md) - API endpoint reference
- [FRONTEND.md](./FRONTEND.md) - Frontend architecture
- [DATABASE.md](./DATABASE.md) - Data model reference
