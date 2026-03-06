# nbhd.city Development Tickets - Detailed Descriptions

**Last Updated:** 2026-03-06
**Format:** Detailed ticket specifications and acceptance criteria
**Priority Reference:** See [ticket-list.md](./ticket-list.md) for priority order and timeline

---

## Quick Reference

- **Priority Order & Timeline:** See **[ticket-list.md](./ticket-list.md)**
- **Completed Tickets Archive:** See **[completed/COMPLETED.md](./completed/COMPLETED.md)** (31 tickets completed)

This document contains detailed descriptions, requirements, and acceptance criteria for all tickets.

📦 **Note:** Completed tickets have been archived to [tickets/completed/COMPLETED.md](./completed/COMPLETED.md) for easier reference. This file contains all 31 completed tickets arranged by completion date (most recent first).

---

## Phase Overview

The development roadmap is organized into 9 sequential phases:

Completed 
1. **Phase 1** - MVP Foundation ✅ COMPLETE
2. **Phase 2** - AT Protocol Foundation (ATP-FOUND-001 to 004) - foundational for everything
3. **Phase 3** - Template System & Site Config APIs (SSG-001, 002, 004, 005, 006)
4. **Phase 4** - Template Analysis System (SSG-007, 008, 009, 010)
5. **Phase 5** - Content Management (SSG-011, 012, 013, 014)
6. **Phase 6** - Build Pipeline & Deployment (SSG-015, 016, 017, 018 + infrastructure)
7. **Phase 7** - Nbhd CMS & Admin Features (NBHD-001 through SITES-003)
8. **Phase 8** - Build Pipeline UI Completion (BUILD-001, 002, 003)

Curretly working on
9. **Phase 9** - Testing and Refinement
10. **Phase 10** - Full AT Protocol Federation (ATP-001 through ATP-010)

---

## 🆕 NEW: Phase 11 - 11ty Project URL Upload & Content Workflow (SSG-019 through SSG-027)

**Status:** PENDING
**Timeline:** Next priority
**Objective:** Enable users to upload 11ty GitHub project URLs, automatically analyze frontmatter, build dynamic CMS UI, add content, and deploy to S3

**Workflow**: GitHub URL → Analyze → Infer Schema → Dynamic CMS → Add Content → Deploy to S3

---

### SSG-019: Template URL Upload Component

**Description:** Create frontend component for users to enter and analyze an 11ty GitHub project URL. Shows analysis progress and inferred schema before site creation.

**Requirements:**
- [ ] Create `TemplateURLInput.jsx` component in `app/UI/src/components/SiteBuilder/`
- [ ] Input field for GitHub URL (validation: https://github.com/...)
- [ ] "Analyze Template" button triggers analysis
- [ ] Show progress states: Cloning (30%), Validating (50%), Analyzing (80%), Complete (100%)
- [ ] Display analysis results:
  - Content types discovered (posts, pages, projects, etc.)
  - Inferred schema fields with types
  - Sample frontmatter values from actual files
- [ ] Show action buttons: "Create Site", "Customize Schema", "Cancel"
- [ ] Display error messages if analysis fails
- [ ] Integrate into `SiteEditor.jsx` as initial step (before template gallery)
- [ ] Handle network errors and timeout gracefully

**Acceptance Criteria:**
- [ ] Component renders correctly with input field
- [ ] URL validation prevents invalid URLs
- [ ] Progress updates show real-time analysis status
- [ ] Results display all discovered content types
- [ ] Inferred schema shows field names, types, and examples
- [ ] User can proceed to site creation with analyzed template
- [ ] User can cancel and return to template gallery
- [ ] Errors display clearly with retry option
- [ ] Mobile responsive design

**Type:** Frontend
**Estimate:** M
**Depends On:** SSG-020 (API endpoint)
**Status:** PENDING

---

### SSG-020: Template Analysis API Endpoint

**Description:** Create backend API endpoints to trigger and track template analysis jobs asynchronously.

**Requirements:**
- [ ] Add `POST /api/templates/analyze-url` endpoint
  - Input: `{ "github_url": "https://github.com/..." }`
  - Output: `{ "template_id": "uuid", "status": "analyzing" }`
  - Validates GitHub URL format
  - Creates template record in DynamoDB
  - Invokes `template_analyzer` Lambda asynchronously
  - Returns immediately (async job)
- [ ] Add `GET /api/templates/{template_id}/analysis-status` endpoint
  - Returns current job progress
  - Output: `{ "status": "analyzing|ready|failed", "progress": 0-1.0, "content_types": {...}, "error": "..." }`
  - Polls DynamoDB for job status
- [ ] Store analysis job in DynamoDB:
  - Key: `TEMPLATE#{template_id}#ANALYSIS`
  - Fields: status, progress, started_at, completed_at, error
- [ ] Store template metadata in DynamoDB:
  - Key: `TEMPLATE#{template_id}#METADATA`
  - Fields: github_url, commit_sha, analysis_date, inferred_fields
- [ ] Authentication: Only allow authenticated users
- [ ] Error handling: Return clear error messages

**Acceptance Criteria:**
- [ ] POST endpoint accepts valid GitHub URL
- [ ] Returns template_id immediately
- [ ] Lambda is invoked asynchronously
- [ ] Status endpoint returns job progress
- [ ] Analysis metadata stored in DynamoDB
- [ ] Error responses are descriptive
- [ ] Handles concurrent analysis jobs

**Type:** Backend
**Estimate:** S
**Depends On:** None
**Status:** PENDING

---

### SSG-021: Enhanced Template Analyzer Lambda

**Description:** Enhance existing `template_analyzer` Lambda to validate 11ty projects, scan frontmatter, infer content schemas, and store results.

**Requirements:**
- [ ] Validate 11ty project structure:
  - [ ] Check for `eleventy.config.js` or `.eleventy.js`
  - [ ] Check for `package.json` with 11ty dependency
  - [ ] Return error if not valid 11ty project
- [ ] Clone repository:
  - [ ] Use shallow clone (--depth 1) for speed
  - [ ] Clone to `/tmp/` with unique directory
  - [ ] Capture commit SHA
- [ ] Scan for content:
  - [ ] Find content directories: `content/`, `src/`, `posts/`, `_posts/`, `pages/`
  - [ ] Recursively find all `.md` and `.mdx` files
  - [ ] Skip node_modules, .git, etc.
- [ ] Parse frontmatter:
  - [ ] Extract YAML frontmatter from each markdown file
  - [ ] Handle TOML and JSON frontmatter variants
  - [ ] Group files by structure (same fields = same content type)
- [ ] Infer JSON schema:
  - [ ] Analyze all frontmatter samples
  - [ ] Detect field types: string, date, array, boolean, object
  - [ ] Mark required vs optional fields
  - [ ] Generate JSON schema for each content type
  - [ ] Include min/max length, enum options if found
- [ ] Store in DynamoDB:
  - [ ] Update `TEMPLATE#{template_id}#METADATA` with: github_url, commit_sha, analysis_date
  - [ ] Store `TEMPLATE#{template_id}#CONTENT_TYPES` with inferred schemas
  - [ ] Store `TEMPLATE#{template_id}#SAMPLES` with example records
- [ ] Update status in DynamoDB:
  - [ ] Set status to "ready" on success
  - [ ] Set status to "failed" with error message on failure
  - [ ] Update progress field: 0.1 → 0.3 → 0.5 → 0.8 → 1.0
- [ ] Cleanup:
  - [ ] Delete temporary clone directory
  - [ ] Handle cleanup on errors

**Acceptance Criteria:**
- [ ] Validates 11ty projects correctly
- [ ] Rejects non-11ty repositories
- [ ] Finds content files in standard directories
- [ ] Parses YAML, TOML, and JSON frontmatter
- [ ] Groups files into correct content types
- [ ] Infers accurate JSON schemas
- [ ] Stores results in DynamoDB
- [ ] Completes within 5-minute Lambda timeout
- [ ] Handles large repositories gracefully
- [ ] Errors logged and tracked

**Type:** Backend (Lambda)
**Estimate:** L
**Depends On:** SSG-020
**Status:** PENDING
**Notes:** Extends existing `app/lambda/template_analyzer/handler.py`

---

### SSG-022: Dynamic Schema Service

**Description:** Create frontend service to fetch template schemas and transform them into form fields and validators.

**Requirements:**
- [ ] Create `app/UI/src/services/dynamicSchemaService.js`
- [ ] Implement `getContentTypeSchema(siteId, contentType)`:
  - [ ] Fetch template metadata from API
  - [ ] Fetch inferred schema for content type
  - [ ] Return normalized schema object
- [ ] Implement `getFieldType(schemaField)`:
  - [ ] Map JSON schema types to React component types
  - [ ] Handle string, date, array, boolean, object
  - [ ] Support custom field types
- [ ] Implement `generateFormFields(schema)`:
  - [ ] Create form field definitions from schema
  - [ ] Include validation rules
  - [ ] Include placeholder/help text
- [ ] Implement `validateContent(content, schema)`:
  - [ ] Validate required fields
  - [ ] Validate types
  - [ ] Validate field constraints (min/max)
  - [ ] Return validation errors
- [ ] Implement `transformToRecord(content, schema)`:
  - [ ] Convert form data to DynamoDB record format
  - [ ] Separate frontmatter from content
  - [ ] Ensure AT Protocol record structure
- [ ] Export all utilities for use in components

**Acceptance Criteria:**
- [ ] Schema fetching works correctly
- [ ] Form fields generated from schema
- [ ] Validation enforces required fields
- [ ] Type validation prevents errors
- [ ] Supports all common field types
- [ ] Records transform to correct format
- [ ] Error messages are helpful
- [ ] Handles edge cases

**Type:** Frontend (Service)
**Estimate:** M
**Depends On:** SSG-020, SSG-021
**Status:** PENDING

---

### SSG-023: Template Schema to CMS Integration

**Description:** Integrate inferred template schema into CMS components to provide dynamic forms based on analyzed frontmatter.

**Requirements:**
- [ ] Update `EnhancedContentEditor.jsx`:
  - [ ] Load schema for current site's template
  - [ ] Pass schema to `FrontmatterForm`
  - [ ] Display all inferred fields
  - [ ] Show field help text and descriptions
  - [ ] Validate content against schema before save
- [ ] Update `FrontmatterForm.jsx`:
  - [ ] Accept schema prop
  - [ ] Dynamically generate form fields from schema
  - [ ] Use appropriate input types (text, date, select, array)
  - [ ] Show field labels and help text
  - [ ] Display validation errors in real-time
- [ ] Update `ContentBrowser.jsx`:
  - [ ] Show inferred content type fields in list view
  - [ ] Allow filtering by schema fields
  - [ ] Display sample values in preview
- [ ] Update `SiteContentManager.jsx`:
  - [ ] Load template schema on mount
  - [ ] Pass schema to child components
  - [ ] Display content types based on analysis
- [ ] Ensure backward compatibility:
  - [ ] Support templates without analysis
  - [ ] Fall back to generic forms if schema missing

**Acceptance Criteria:**
- [ ] CMS loads inferred schema correctly
- [ ] Form fields match schema exactly
- [ ] All field types render appropriately
- [ ] Validation works before saving
- [ ] Required fields marked clearly
- [ ] Help text displays for guidance
- [ ] Works with old templates (no schema)
- [ ] Content displays with correct fields
- [ ] Filtering works by schema fields

**Type:** Frontend
**Estimate:** M
**Depends On:** SSG-022, SSG-023
**Status:** PENDING

---

### SSG-024: Content Save & Retrieval API Integration

**Description:** Ensure existing content APIs correctly store and retrieve content with inferred schema fields, and integrate with build pipeline.

**Requirements:**
- [ ] Verify `POST /api/content` endpoint:
  - [ ] Accepts frontmatter matching inferred schema
  - [ ] Stores in DynamoDB as AT Protocol record
  - [ ] Format: `RECORD#app.nbhd.blog.{type}#{rkey}`
  - [ ] Includes all frontmatter fields
  - [ ] Generates CID for immutability
  - [ ] Returns stored record with URI
- [ ] Verify `GET /api/content?type={type}&site_id={siteId}`:
  - [ ] Returns all records of content type
  - [ ] Filters by site_id
  - [ ] Includes full frontmatter
  - [ ] Supports pagination
- [ ] Ensure build pipeline fetches content:
  - [ ] Lambda queries: `RECORD#app.nbhd.blog.post#*`
  - [ ] Filters by site_id
  - [ ] Transforms to 11ty format
  - [ ] Preserves all frontmatter fields
- [ ] Content record structure in DynamoDB:
  ```
  {
    "PK": "USER#{user_did}",
    "SK": "RECORD#app.nbhd.blog.post#{rkey}",
    "uri": "at://...",
    "cid": "bafy...",
    "value": {
      "site_id": "site-uuid",
      "title": "Post Title",
      "content": "# Markdown...",
      "slug": "post-slug",
      "frontmatter": {
        "date": "2026-03-06",
        "tags": ["tag1", "tag2"],
        ... all schema fields
      }
    },
    "created_at": "2026-03-06T...",
    "updated_at": "2026-03-06T..."
  }
  ```

**Acceptance Criteria:**
- [ ] Content saves with all schema fields
- [ ] Frontmatter stored separately
- [ ] Records have valid AT Protocol URIs
- [ ] Content retrievable by type and site
- [ ] Build Lambda finds content correctly
- [ ] Transforms to 11ty format work
- [ ] No data loss during save/retrieve

**Type:** Backend (Integration)
**Estimate:** S
**Depends On:** SSG-021, SSG-022
**Status:** PENDING

---

### SSG-025: Build Trigger and Status UI

**Description:** Integrate build trigger button and real-time build status into site CMS dashboard.

**Requirements:**
- [ ] Integrate `BuildTriggerButton.jsx` into `ContentManagementDashboard`:
  - [ ] Show "Build & Deploy" button
  - [ ] Show last build status and timestamp
  - [ ] Disable button while build in progress
  - [ ] Show build log/errors if available
- [ ] Integrate `BuildStatusPoller.jsx`:
  - [ ] Poll `GET /api/sites/{siteId}/build/{jobId}` every 2 seconds
  - [ ] Stop polling when build completes
  - [ ] Update progress bar: 0% → Running → 100%
- [ ] Integrate `BuildHistory.jsx`:
  - [ ] Show past 10 builds
  - [ ] Display status: queued, running, completed, failed
  - [ ] Show build duration
  - [ ] Show output URL on success
- [ ] Add build events display:
  - [ ] Clone template (stage 1)
  - [ ] Fetch content (stage 2)
  - [ ] Inject data files (stage 3)
  - [ ] Install dependencies (stage 4)
  - [ ] Run 11ty build (stage 5)
  - [ ] Upload to S3 (stage 6)
  - [ ] Invalidate CloudFront (stage 7)
  - [ ] Complete (stage 8)
- [ ] Success messaging:
  - [ ] Show deployment URL on completion
  - [ ] Allow copy-to-clipboard for URL
  - [ ] Show "Site is live at: https://..."
- [ ] Error handling:
  - [ ] Display error message if build fails
  - [ ] Show which stage failed
  - [ ] Show error log details
  - [ ] Allow retry

**Acceptance Criteria:**
- [ ] Build button visible in dashboard
- [ ] Button disables during build
- [ ] Status updates in real-time
- [ ] Progress shows current stage
- [ ] Success shows live URL
- [ ] Errors display clearly
- [ ] Retry works after failure
- [ ] History shows multiple builds

**Type:** Frontend
**Estimate:** M
**Depends On:** SSG-024
**Status:** PENDING

---

### SSG-026: Build Pipeline & S3 Infrastructure Verification

**Description:** Verify and enhance Terraform configuration to ensure S3 bucket, CloudFront, and Lambda permissions are correctly set up for content deployment.

**Requirements:**
- [ ] Verify S3 bucket exists and is configured:
  - [ ] Check `devops/sites_storage.tf`
  - [ ] Bucket: `nbhd-city-sites-{account_id}`
  - [ ] Versioning enabled
  - [ ] Public access blocked
  - [ ] CORS configured for subdomains
  - [ ] Lifecycle rules for cleanup
- [ ] Verify CloudFront distribution:
  - [ ] Check `devops/sites_cdn.tf`
  - [ ] Distribution configured
  - [ ] Origin Access Control (OAC) for S3
  - [ ] Wildcard domain: `*.nbhd.city`
  - [ ] Cache invalidation enabled
- [ ] Verify Lambda execution role:
  - [ ] Check `devops/iam.tf`
  - [ ] Lambda has `s3:PutObject` permission
  - [ ] Lambda has `s3:GetObject` permission
  - [ ] Lambda has `cloudfront:CreateInvalidation` permission
  - [ ] Lambda has DynamoDB query/scan permissions
- [ ] Verify Lambda environment variables:
  - [ ] `S3_BUCKET` set correctly
  - [ ] `CLOUDFRONT_DISTRIBUTION_ID` set correctly
  - [ ] `DYNAMODB_TABLE` set correctly
- [ ] Verify DNS configuration:
  - [ ] Check `devops/dns.tf`
  - [ ] Wildcard DNS points to CloudFront
  - [ ] SSL certificate for `*.nbhd.city`
- [ ] Add/update Terraform outputs:
  - [ ] S3 bucket name
  - [ ] CloudFront distribution ID
  - [ ] CloudFront domain name
  - [ ] Site domain pattern

**Acceptance Criteria:**
- [ ] All infrastructure exists in Terraform
- [ ] S3 bucket is properly configured
- [ ] CloudFront distribution works
- [ ] Lambda has all required permissions
- [ ] Environment variables are set
- [ ] DNS resolves wildcard domains
- [ ] SSL certificate is valid
- [ ] Test: Can upload file to S3 and access via CloudFront

**Type:** DevOps (Terraform)
**Estimate:** M
**Depends On:** None (Verification task)
**Status:** PENDING
**Notes:** Check against `devops/sites_storage.tf`, `devops/sites_cdn.tf`, `devops/iam.tf`

---

### SSG-027: End-to-End Workflow Testing

**Description:** Write comprehensive integration tests covering the complete workflow from URL upload to deployed site.

**Requirements:**
- [ ] Test scenario 1: Analyze valid 11ty template
  - [ ] POST to `/api/templates/analyze-url` with valid GitHub URL
  - [ ] Poll `/api/templates/{id}/analysis-status` until complete
  - [ ] Verify schema is inferred correctly
  - [ ] Verify content types are identified
- [ ] Test scenario 2: Create site from analyzed template
  - [ ] User completes analysis
  - [ ] User creates site with inferred template
  - [ ] Site configuration stored in DynamoDB
  - [ ] CMS loads with inferred schema
- [ ] Test scenario 3: Add content via CMS
  - [ ] User opens SiteContentManager
  - [ ] Creates new post with inferred fields
  - [ ] Fills all required fields
  - [ ] Saves content to DynamoDB
  - [ ] Verify record structure is correct
- [ ] Test scenario 4: Build and deploy
  - [ ] User clicks "Build & Deploy"
  - [ ] POST to `/api/sites/{id}/build` succeeds
  - [ ] Lambda is invoked
  - [ ] Content fetched from DynamoDB
  - [ ] 11ty build completes
  - [ ] Output uploaded to S3
  - [ ] CloudFront invalidated
  - [ ] Site is live at subdomain
- [ ] Test scenario 5: Update content and rebuild
  - [ ] User edits post
  - [ ] Saves changes
  - [ ] Triggers new build
  - [ ] Changes appear on live site
- [ ] Test edge cases:
  - [ ] Invalid GitHub URLs rejected
  - [ ] Non-11ty repositories fail analysis
  - [ ] Missing required fields caught
  - [ ] Build failure handled gracefully
  - [ ] Multiple content types handled
  - [ ] Large content records handled
- [ ] Write tests in:
  - [ ] `app/api/tests/integration/test_11ty_url_workflow.py`
  - [ ] `app/UI/src/components/SiteBuilder/__tests__/`

**Acceptance Criteria:**
- [ ] All 5 main scenarios pass
- [ ] All edge cases handled correctly
- [ ] No data loss
- [ ] Errors logged and reported
- [ ] Performance acceptable (< 5 min end-to-end)
- [ ] Tests documented
- [ ] Tests pass in CI/CD

**Type:** Testing
**Estimate:** L
**Depends On:** SSG-019, SSG-020, SSG-021, SSG-022, SSG-023, SSG-024, SSG-025, SSG-026
**Status:** PENDING

---

### FL-9.3: Persistent Sessions & Token Refresh

**Description:** Implement session persistence and BlueSky OAuth token refresh to keep users logged in across browser sessions.

**Requirements:**
- [ ] Implement token refresh endpoint: `POST /app/app/api/auth/refresh`
- [ ] Store BlueSky OAuth refresh token securely in backend (encrypted in DynamoDB)
- [ ] Detect session expiration and automatically attempt refresh
- [ ] Create `useAuth()` hook that checks session validity on app load
- [ ] Implement token refresh logic before API calls (check expiry, refresh if needed)
- [ ] Add "remember me" option during login (30-day persistence)
- [ ] Store session metadata (expires_at, last_activity) in DynamoDB
- [ ] Clear expired sessions from DynamoDB
- [ ] Add session timeout warning before logout (15 min inactivity)
- [ ] Graceful degradation if refresh fails (redirect to login)

**Acceptance Criteria:**
- [ ] User stays logged in after browser restart if "remember me" was checked
- [ ] Expired tokens are refreshed automatically without user action
- [ ] Session timeout warning appears after 15 minutes of inactivity
- [ ] Token refresh only happens once per expiration (no duplicate requests)
- [ ] Refresh fails gracefully and redirects to login
- [ ] Session metadata stored correctly in DynamoDB
- [ ] Old sessions cleaned up from database

**Type:** Frontend + Backend
**Estimate:** M
**Depends On:** FL-9.2
**Status:** PENDING
**Tests:** `tickets/integration-tickets/PHASE-10/TEST-LOGIN-SESSIONS-001.md`

---

### FL-9.4: User Onboarding After First Login

**Description:** Create onboarding flow for first-time users after BlueSky OAuth login.

**Requirements:**
- [ ] Detect first-time login (check if user profile exists in DynamoDB)
- [ ] Redirect to `OnboardingFlow.jsx` page on first login
- [ ] Step 1: Welcome message with BlueSky profile summary
- [ ] Step 2: Create or join neighborhoods (show options)
- [ ] Step 3: Choose site type preference (personal/project)
- [ ] Step 4: Invite to template selection (create first site)
- [ ] Store onboarding completion status in user profile
- [ ] Allow users to skip onboarding and go to dashboard
- [ ] Add "view onboarding" link in settings for future reference
- [ ] Pre-populate user data from BlueSky OAuth response (handle, display_name, avatar)

**Acceptance Criteria:**
- [ ] First-time users see onboarding flow
- [ ] Returning users skip onboarding and go to dashboard
- [ ] All onboarding steps display correctly
- [ ] Users can skip onboarding and go directly to dashboard
- [ ] Profile data pre-filled from BlueSky
- [ ] Onboarding status stored and respected
- [ ] Users can re-access onboarding from settings
- [ ] All neighborhoods/sites created during onboarding are functional

**Type:** Frontend + Backend
**Estimate:** L
**Depends On:** FL-9.2, Phase 7 (neighborhoods & sites)
**Status:** PENDING
**Tests:** `tickets/integration-tickets/PHASE-10/TEST-LOGIN-ONBOARDING-001.md`

---

### FL-9.5: Logout Flow & Session Cleanup

**Description:** Implement secure logout with session cleanup and proper redirect.

**Requirements:**
- [ ] Add logout button to user menu/navigation
- [ ] Call `POST /app/app/api/auth/logout` on logout click
- [ ] Backend invalidates session token in DynamoDB
- [ ] Backend clears any stored refresh tokens
- [ ] Frontend clears all stored session data (localStorage, cookies)
- [ ] Redirect to login page after logout
- [ ] Optional: Show "logged out successfully" message
- [ ] Optional: Offer "sign in again" button on login page
- [ ] Handle logout during inactive session (automatic cleanup)
- [ ] Prevent API calls after logout

**Acceptance Criteria:**
- [ ] Logout button visible in navigation
- [ ] Clicking logout calls backend endpoint
- [ ] Session invalidated on backend (tokens cleared)
- [ ] Frontend clears local session storage
- [ ] User redirected to login page
- [ ] User cannot access protected pages after logout
- [ ] API calls rejected after logout (401 Unauthorized)
- [ ] Automatic logout works after inactivity timeout

**Type:** Frontend + Backend
**Estimate:** S
**Depends On:** FL-9.2, FL-9.3
**Status:** PENDING
**Tests:** `tickets/integration-tickets/PHASE-10/TEST-LOGIN-LOGOUT-001.md`

## Testing & Documentation

#### TEST-001: Phase 2 Integration Tests
- **Description:** Write integration tests for static sites + PDS
- **Requirements:**
  - [ ] Test template selection → config → build workflow
  - [ ] Test site deployment to subdomain
  - [ ] Test DID creation and management
  - [ ] Test data export/import
  - [ ] E2E tests for key user flows
- **Acceptance Criteria:**
  - [ ] All critical paths covered by tests
  - [ ] Tests pass locally and in CI/CD
  - [ ] Coverage > 70% for new code
- **Type:** Testing
- **Estimate:** L

#### DOC-001: Static Sites User Guide
- **Description:** Documentation for creating and managing static sites
- **Requirements:**
  - [ ] Step-by-step guide for selecting template
  - [ ] Configuration instructions
  - [ ] Preview and publishing workflow
  - [ ] Troubleshooting guide
  - [ ] Examples for each template type
- **Acceptance Criteria:**
  - [ ] Guide is clear and accessible
  - [ ] All features documented
  - [ ] Examples work as described
- **Type:** Documentation
- **Estimate:** M



### Repository & Data Storage

#### ATP-005: Personal Data Repository (PDS) Implementation
- **Description:** Implement nbhd as AT Protocol PDS for members
- **Requirements:**
  - [ ] Create PDS service that speaks AT Protocol
  - [ ] Store member data in AT Protocol format
  - [ ] Implement PDS endpoints (getRepo, etc)
  - [ ] Data types: profiles, posts, follows
  - [ ] Replicate/sync with BlueSky network
- **Acceptance Criteria:**
  - [ ] nbhd can be queried as AT Protocol PDS
  - [ ] Member data retrievable via AT Protocol APIs
  - [ ] BlueSky can verify data from nbhd PDS
  - [ ] Proper error handling
- **Type:** Backend/Infrastructure
- **Estimate:** XL (complex new feature)

#### ATP-006: Data Sync from blueSky Firehose
- **Description:** Stream member posts/activities into nbhd PDS
- **Requirements:**
  - [ ] Subscribe to BlueSky firehose (or relevant subset)
  - [ ] Capture posts by neighborhood members
  - [ ] Store in PDS format
  - [ ] Update member timelines
  - [ ] Handle rate limiting and errors
- **Acceptance Criteria:**
  - [ ] Posts from BlueSky appear in nbhd
  - [ ] Sync is near real-time
  - [ ] No data loss
  - [ ] Handles network failures gracefully
- **Type:** Backend
- **Estimate:** L

### Data Export & Portability

#### ATP-007: AT Protocol Data Export
- **Description:** Export member data in standard AT Protocol format
- **Requirements:**
  - [ ] Endpoint: `GET /app/app/api/user/export/atproto`
  - [ ] Exports all user data as AT Protocol records
  - [ ] Includes profiles, posts, follows, custom data
  - [ ] Downloadable ZIP or JSON
  - [ ] Supports data portability (GDPR right)
- **Acceptance Criteria:**
  - [ ] Export contains all user data
  - [ ] Format is AT Protocol compliant
  - [ ] Can be imported to other PDS
  - [ ] Includes metadata
- **Type:** Backend
- **Estimate:** M

#### ATP-008: Data Migration Between nbhds
- **Description:** Allow members to transfer data to different nbhd instances
- **Requirements:**
  - [ ] Import exported AT Protocol data
  - [ ] Map old DIDs to new DIDs
  - [ ] Preserve post history and metadata
  - [ ] Update BlueSky records
- **Acceptance Criteria:**
  - [ ] Member data successfully migrates
  - [ ] History preserved
  - [ ] BlueSky profile updated
  - [ ] No data loss
- **Type:** Backend
- **Estimate:** L

### Federation & Interoperability

#### ATP-009: PDS Federation Setup
- **Description:** Configure nbhd PDS to federate with BlueSky network
- **Requirements:**
  - [ ] Register nbhd PDS with AT Protocol network
  - [ ] Implement federation protocols
  - [ ] Handle PDS-to-PDS communication
  - [ ] Subscribe to federation events
- **Acceptance Criteria:**
  - [ ] nbhd visible as federated PDS
  - [ ] Can exchange data with other PDSs
  - [ ] Federation is discoverable
- **Type:** Infrastructure
- **Estimate:** 
---

#### DOC-002: AT Protocol PDS Architecture Document
- **Description:** Internal documentation on PDS implementation
- **Requirements:**
  - [ ] DID management flow
  - [ ] Data storage architecture
  - [ ] Federation overview
  - [ ] API reference
  - [ ] Troubleshooting
- **Acceptance Criteria:**
  - [ ] Complete reference for developers
  - [ ] All endpoints documented
  - [ ] Architecture clear
- **Type:** Documentation
- **Estimate:** M

---

## Phase 10.1: Custom Template UI Integration & Design System 🎨

**Status:** Pending
**Timeline:** Weeks TBD
**Depends On:** SSG-008, SSG-009, SSG-010 (feature implementation complete)

Complete UI integration of custom template registration with beautiful, modern design featuring harmonic circle animations and intuitive navigation patterns.

### Design System & Navigation Foundation

#### UI-DESIGN-001: Harmonic Circle Design System & Animations

**Description:** Create a comprehensive design system featuring animated intersecting circles (inspired by harmonic vibration patterns like Chladni plates) that form the visual foundation for all template-related UI components.

**Requirements:**
- [x] Create `HarmonicCircles.jsx` component - base SVG circle renderer
  - Generates N circles with configurable radii, positions, colors
  - Uses CSS transforms for smooth animations
  - Supports fade-in/fade-out transitions
  - Uses `@keyframes` for continuous harmonic oscillation
  - Responsive to viewport size
  - Zero-performance-cost initial render (lazy animation start)

- [x] Create `HarmonyPattern.jsx` - pattern generator
  - Creates intersection patterns from 3-7 circles
  - Generates Chladni-plate-like standing wave patterns
  - Circles animate at different frequencies (2s, 3s, 4s, 5s cycles)
  - Color gradients transition through harmonic spectrum

- [x] Create `CircleAnimationLibrary.ts` - reusable animation configs
  - `slideInFrom(direction, duration)` - circles slide in from edges
  - `fadeInCascade(staggerMs)` - cascade fade with stagger
  - `breathe(intensity, cycle)` - gentle pulsing animation
  - `rotate(speed, direction)` - orbital rotation patterns
  - `wave(amplitude, frequency)` - wave motion through circles

- [x] Create `HarmonyColors.ts` - color palette
  - Harmonic color progression (violet → indigo → blue → cyan → green → yellow → orange → red)
  - Complementary accent colors for status states
  - Accessibility-compliant contrast ratios

- [x] Create `useHarmonyAnimation.ts` - animation hook
  - Manages animation lifecycle (start, pause, stop, reset)
  - Handles performance optimization (requestAnimationFrame)
  - Supports staggered starts across children

**Acceptance Criteria:**
- [x] HarmonicCircles render smoothly without jank
- [x] Circle intersection patterns visible and intentional
- [x] Animations respect `prefers-reduced-motion` preference
- [x] All animations reusable across components
- [x] Colors meet WCAG AA contrast standards
- [x] Performance: 60fps on modern devices, graceful degradation on low-end
- [x] Animations can be disabled via `animationEnabled` prop globally

**Type:** Design System
**Estimate:** L (complex SVG + animation work)
**Status:** PENDING

**Implementation Files (Create):**
- `src/components/design/HarmonicCircles.jsx`
- `src/components/design/HarmonyPattern.jsx`
- `src/lib/HarmonyAnimation.ts`
- `src/lib/CircleAnimationLibrary.ts`
- `src/lib/HarmonyColors.ts`
- `src/hooks/useHarmonyAnimation.ts`
- `src/styles/HarmonyAnimations.css` (keyframes)

**Dependencies:** React, CSS3 animations, SVG

---

#### UI-NAV-001: Navigation Structure with Sidebar & Tab System

**Description:** Build modern navigation system with persistent sidebar (collapsible on mobile) and tabbed interface for template management, maintaining clear user flow and context.

**Requirements:**
- [x] Create `SideNavigation.jsx` component
  - Vertical sidebar with icon + label navigation
  - Collapsible on < 768px (mobile)
  - Sticky positioning
  - Active tab highlighting with circle indicator
  - Navigation items: Templates, Build History, Sites, Settings
  - Smooth collapse/expand animation (200ms)
  - Maintain scroll position per tab

- [x] Create `TopTabBar.jsx` component
  - Horizontal tabs across viewport top
  - Active tab underline (animated 200ms)
  - Responsive: hide on mobile, show on tablet+
  - Tab items: Browse, My Custom, Featured, Trending
  - Tab switching with harmonic circle fade transition (300ms)

- [x] Create `TemplateLayoutWrapper.jsx` - layout container
  - Combines sidebar + main content + tabs
  - Manages active section state
  - Handles mobile responsive behavior
  - Supports nested routes within tabs
  - Maintains scroll history per tab

- [x] Update `App.jsx` routing
  - Add `/templates` base route
  - Nested routes: `/templates/browse`, `/templates/my-custom`, etc.
  - Preserve scroll position on back navigation

**Acceptance Criteria:**
- [x] Sidebar visible and functional on desktop (> 768px)
- [x] Sidebar collapses to icons on tablet
- [x] Sidebar hidden on mobile (< 512px)
- [x] Tab switching smooth and intuitive
- [x] Active state clearly indicated in both sidebar + tabs
- [x] No layout shift when sidebar collapses
- [x] Scroll position preserved per tab
- [x] All navigation items clickable and functional

**Type:** Navigation/Layout
**Estimate:** M
**Status:** PENDING

**Implementation Files (Create):**
- `src/components/navigation/SideNavigation.jsx`
- `src/components/navigation/TopTabBar.jsx`
- `src/components/navigation/TemplateLayoutWrapper.jsx`
- `src/styles/SideNavigation.module.css`
- `src/styles/TopTabBar.module.css`
- Update: `src/App.jsx`

---

### Template Gallery & Custom Template Integration

#### UI-GALLERY-001: TemplateGallery Integration with CustomTemplateModal

**Description:** Wire CustomTemplateModal into TemplateGallery with smooth button affordance and success state management.

**Requirements:**
- [x] Add "Add Custom Template" button to TemplateGallery header
  - Button style: Rounded, with + icon
  - Uses HarmonicCircles for hover state
  - Circle pulses on hover (breathe animation)
  - On click: opens CustomTemplateModal

- [x] Update TemplateGallery.jsx
  - Import CustomTemplateModal
  - Add state: `showCustomModal`, `customTemplates`
  - Render modal: `<CustomTemplateModal isOpen={showCustomModal} onClose={...} onAdd={handleCustomTemplateAdded} />`
  - Handle onAdd: merge custom template into gallery
  - Show toast: "Template added! Analyzing..."

- [x] Enhance CustomTemplateModal styling
  - Add harmonic circle background (faded, 3-4 circles)
  - Fade animations on open/close (300ms)
  - Button hover states with circle indicators
  - Input focus: subtle circle glow effect

- [x] Handle analysis in-progress state
  - Track templates being analyzed
  - Show loading spinner (spinning circles animation)
  - Display progress percentage
  - Disable template selection until ready

**Acceptance Criteria:**
- [x] "Add Custom Template" button visible and clickable
- [x] CustomTemplateModal opens on button click
- [x] Modal backdrop has harmonic circle pattern
- [x] Form inputs have circle focus indicators
- [x] Submit button animated on hover
- [x] After submit, toast appears: "Template added! Analyzing..."
- [x] Template list updates immediately (showing "analyzing" state)
- [x] Template becomes selectable when analysis completes
- [x] Error state shows red circle indicators

**Type:** Frontend/Integration
**Estimate:** M
**Status:** PENDING

**Implementation Files (Modify):**
- `src/components/SiteBuilder/TemplateGallery.jsx` (update)
- `src/components/SiteBuilder/CustomTemplateModal.jsx` (enhance styles)
- `src/components/SiteBuilder/CustomTemplateModal.module.css` (update)

---

#### UI-GALLERY-002: Merge Custom + Built-in Templates with Cascade Animation

**Description:** Display custom and built-in templates together with beautiful cascade/stagger animations and visual distinction.

**Requirements:**
- [x] Create `TemplateCard.jsx` component (generalized for both types)
  - Shows template name, description, tags, preview
  - Template type badge: "Built-in" vs "Custom"
  - Status indicator for custom templates (analyzing, ready, failed)
  - Uses harmonic circles for background pattern (faded)
  - On hover: circles brighten/pulse (breathe animation)
  - Click: navigate to config form or show loading if analyzing

- [x] Update TemplateGallery to show both types
  - Fetch GET /api/templates (built-in)
  - Fetch GET /api/templates/custom (custom)
  - Merge arrays, sort by: custom first, then by popularity/date
  - Render with cascade animation (stagger 50ms per card)

- [x] Add visual separation
  - Section headers with harmonic circle accent
  - "Built-in Templates" section
  - "My Custom Templates" section
  - Custom templates section collapses if empty

- [x] Create `EmptyTemplateState.jsx`
  - Shows when no custom templates registered
  - Large harmonic circle pattern in center
  - Message: "No custom templates yet. Add one to get started!"
  - Link to CustomTemplateModal

**Acceptance Criteria:**
- [x] Both custom and built-in templates visible
- [x] Custom templates appear first
- [x] Cards render with staggered animation (200ms total for 6 cards)
- [x] Template type clearly indicated
- [x] Hover animation visible on all cards
- [x] Status badge shows for custom templates (analyzing, ready, failed)
- [x] Clicking custom template in "analyzing" state shows status
- [x] Empty state shows when no custom templates

**Type:** Frontend/Animation
**Estimate:** M
**Status:** PENDING

**Implementation Files (Create/Modify):**
- `src/components/SiteBuilder/TemplateCard.jsx` (new)
- `src/components/SiteBuilder/TemplateCard.module.css` (new)
- `src/components/SiteBuilder/EmptyTemplateState.jsx` (new)
- `src/components/SiteBuilder/TemplateGallery.jsx` (update)

---

#### UI-GALLERY-003: Template Status Indicators with Circle Progress

**Description:** Visual status indicators for custom templates using harmonic circle patterns to show analyzing, ready, and failed states.

**Requirements:**
- [x] Create `TemplateStatusBadge.jsx` component
  - Status: analyzing → ready → failed
  - Uses circles to show progress
  - "Analyzing" state: 3 pulsing circles (breathe animation)
  - "Ready" state: checkmark with circle highlight (fade in)
  - "Failed" state: error icon with red circles
  - Tooltip on hover with error message (if failed)

- [x] Create `AnalysisProgress.jsx` - detailed progress modal
  - Shows when clicking analyzing template
  - Displays: estimated time, current stage, retry button (if failed)
  - Background: animated harmonic circles
  - Shows actual analysis progress from API

- [x] Update TemplateCard to show status
  - Render TemplateStatusBadge for custom templates
  - Disable selection while analyzing
  - Show error message on failed analysis
  - Show "Re-analyze" button for failed templates

**Acceptance Criteria:**
- [x] Analyzing state shows 3 pulsing circles
- [x] Ready state shows checkmark with circle highlight
- [x] Failed state shows error with red circles
- [x] Status updates in real-time as analysis progresses
- [x] Clicking analyzing template opens progress modal
- [x] Error messages clear and actionable
- [x] Re-analyze button works on failed templates

**Type:** Frontend/Component
**Estimate:** M
**Status:** PENDING

**Implementation Files (Create):**
- `src/components/SiteBuilder/TemplateStatusBadge.jsx`
- `src/components/SiteBuilder/AnalysisProgress.jsx`
- `src/components/SiteBuilder/TemplateStatusBadge.module.css`
- `src/components/SiteBuilder/AnalysisProgress.module.css`

---

#### UI-GALLERY-004: Template Details & Management Modal

**Description:** Beautiful modal showing template details, schema preview, and management options (delete, re-analyze, share).

**Requirements:**
- [x] Create `TemplateDetailsModal.jsx`
  - Shows when clicking template card
  - Content:
    - Template name + description
    - Author + repository link
    - Inferred content types (posts, pages, etc.)
    - Schema fields with type indicators
    - Analysis timestamp + commit SHA
  - Harmonic circles in background (subtle, 2-3 circles)
  - Fade in/out animations (300ms)

- [x] Add action buttons
  - "Select Template" (primary) - navigates to config
  - "Delete" (secondary) - for custom templates only
  - "Re-analyze" (tertiary) - for failed/stale templates
  - "Share" (link) - for public templates

- [x] Create deletion confirmation modal
  - Asks for confirmation before deleting
  - Shows warning about losing saved site configurations
  - Delete button styled with red circle accent

**Acceptance Criteria:**
- [x] Modal opens smoothly with fade animation
- [x] All template details visible
- [x] Schema fields displayed clearly
- [x] Action buttons work correctly
- [x] Delete confirmation prevents accidental deletion
- [x] Re-analyze triggers Lambda and updates status
- [x] Share functionality works (copies link or opens share modal)

**Type:** Frontend/Component
**Estimate:** M
**Status:** PENDING

**Implementation Files (Create):**
- `src/components/SiteBuilder/TemplateDetailsModal.jsx`
- `src/components/SiteBuilder/DeleteTemplateConfirm.jsx`
- `src/components/SiteBuilder/TemplateDetailsModal.module.css`

---

### Configuration & Responsive Design

#### UI-RESPONSIVE-001: Mobile Optimization & Responsive Design

**Description:** Ensure all template UI components work beautifully on mobile, tablet, and desktop devices.

**Requirements:**
- [x] Mobile layout (< 512px)
  - Single-column template cards
  - Sidebar hidden (icon navigation in bottom bar)
  - Tabs vertical/stacked
  - Modal takes full screen (with bottom close button)
  - Touch-friendly button sizing (48px minimum)

- [x] Tablet layout (512px - 768px)
  - 2-column template grid
  - Sidebar icons only (no labels)
  - Tabs on top but responsive
  - Modal with side margins

- [x] Desktop layout (> 768px)
  - 3-column template grid
  - Full sidebar with labels
  - Tabs full width
  - Modal centered with backdrop

- [x] Touch interactions
  - Hover animations convert to active/tap states on touch devices
  - Long-press support for context menus
  - Smooth scroll behavior

**Acceptance Criteria:**
- [x] All components functional on mobile
- [x] No horizontal scroll on any device
- [x] Touch targets minimum 48px x 48px
- [x] Text readable at all sizes (no zoom needed)
- [x] Animations smooth on mobile (60fps)
- [x] Modal usable on small screens

**Type:** Frontend/Responsive
**Estimate:** S
**Status:** PENDING

**Implementation Files (Modify):**
- All UI-GALLERY-* components (add responsive styles)
- Create: `src/styles/responsive.css` (breakpoint utilities)

---

#### UI-PERF-001: Animation Performance & Optimization

**Description:** Ensure all harmonic circle animations perform smoothly across devices without causing jank or battery drain.

**Requirements:**
- [x] Profile animations with DevTools
  - FPS monitoring (target 60fps)
  - CPU usage tracking
  - Memory leak checks

- [x] Optimize SVG rendering
  - Use CSS transforms (not SVG attribute changes)
  - RequestAnimationFrame for smooth updates
  - Lazy load circle patterns (don't render off-screen)

- [x] Add performance budgets
  - Circle animation: < 20ms per frame
  - Modal open/close: < 300ms
  - Card cascade: < 500ms total

- [x] Implement graceful degradation
  - Disable animations on low-end devices (via motion detection)
  - Reduce circle count on mobile
  - Use CSS `will-change` carefully

**Acceptance Criteria:**
- [x] 60fps on modern devices (iPhone 12+, Pixel 4+, desktop)
- [x] Graceful 30fps on older devices (doesn't break)
- [x] No layout shifts during animations
- [x] No memory leaks (monitored with DevTools)
- [x] Battery usage minimal (< 5% increase during animation)

**Type:** Frontend/Performance
**Estimate:** M
**Status:** PENDING

---

## Phase 11: Advanced CMS Components

**Status:** In Progress
**Timeline:** Weeks TBD
**Depends On:** Phase 7 (Nbhd CMS & Admin Features) and Phase 8 (Build Pipeline UI)

Advanced content management components for rich editing experiences and content metadata management.

#### CMS-002: Content Browser Component

- **Description:** Build a content browsing and filtering component for viewing all published content
- **Status:** COMPLETED
- **Type:** Frontend
- **Estimate:** M

#### CMS-003: Enhanced Content Editor with Markdown Support

- **Description:** Implement a comprehensive editor with three-column layout for markdown editing, frontmatter management, and live preview
- **Requirements:**
  - [x] Three-column layout: Editor | Frontmatter | Preview
  - [x] Markdown editor with toolbar (bold, italic, code, link, list, quote)
  - [x] Keyboard shortcuts: Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), Cmd/Ctrl+K (link)
  - [x] Live markdown preview with DOMPurify sanitization
  - [x] Frontmatter form based on template schema
  - [x] Auto-slug generation from title
  - [x] Publishing controls sidebar (status, BlueSky toggle, auto-rebuild)
  - [x] Scheduled publishing support
  - [x] Auto-save with 30-second interval
  - [x] Draft recovery from localStorage with key pattern: draft-{siteId}
  - [x] Character count and reading time display
  - [x] Unsaved changes warning on page unload

- **Acceptance Criteria:**
  - [x] AC1: Three-column layout with editor, preview, and controls
  - [x] AC2: Markdown toolbar with 6+ formatting actions
  - [x] AC3: Keyboard shortcuts work (Cmd/Ctrl+B, I, K)
  - [x] AC4: Live preview updates in real-time
  - [x] AC5: Frontmatter form renders based on template schema
  - [x] AC6: Auto-save works with 30-second interval
  - [x] AC7: Drafts recover from localStorage
  - [x] AC8: Unsaved changes warning on unload
  - [x] AC9: Character count and reading time display
  - [x] AC10: Publish button with validation

- **Type:** Frontend
- **Estimate:** M
- **Status:** COMPLETED 2026-02-20
- **PR:** #113 - https://github.com/nbhd-city/nbhd.city/pull/113

- **Implementation Files:**
  - `app/UI/src/components/CMS/EnhancedContentEditor.jsx` (356 lines) - Main three-column layout component with state management
  - `app/UI/src/components/CMS/MarkdownEditorToolbar.jsx` (82 lines) - Formatting toolbar with 6 actions
  - `app/UI/src/components/CMS/FrontmatterForm.jsx` (223 lines) - Dynamic form generator based on JSON schema
  - `app/UI/src/components/CMS/PublishingControls.jsx` (111 lines) - Publishing options sidebar
  - `app/UI/src/components/CMS/MarkdownPreview.jsx` (85 lines) - Live preview with frontmatter display
  - `app/UI/src/components/CMS/EnhancedContentEditor.module.css` - Comprehensive responsive styling
  - `app/UI/src/__tests__/components/CMS/EnhancedContentEditor.test.jsx` - Test suite with mocks

- **Technical Details:**
  - Markdown parsing using `marked` library
  - HTML sanitization using `DOMPurify`
  - Auto-save interval: 30 seconds
  - Reading time calculation: wordCount / 200 (words per minute)
  - Form validation: Required field checking against template schema
  - Event handling: Keyboard shortcuts with preventDefault
  - localStorage pattern: draft-{siteId} for recovery

#### CMS-006: Site Settings Manager Component

- **Description:** Component for managing site-wide settings and configuration with tab-based interface
- **Status:** IN PROGRESS
- **Type:** Frontend
- **Estimate:** M

#### CMS-007: Content Metadata Manager Component

- **Description:** Advanced metadata management for content records with publishing workflow
- **Status:** IN PROGRESS
- **Type:** Frontend
- **Estimate:** M

---

## Summary of New UI Phase

**Total Tickets:** 8
**Total Estimate:** 10-12 weeks
**Critical Path:** UI-DESIGN-001 → UI-NAV-001 → UI-GALLERY-001 → UI-GALLERY-002

These tickets can be worked in parallel with multiple subagents using git worktrees:
- Subagent 1: UI-DESIGN-001 (design system foundation)
- Subagent 2: UI-NAV-001 (navigation)
- Subagent 3: UI-GALLERY-001 (modal integration)
- Subagent 4: UI-GALLERY-002 & 003 (template display)
- Subagent 5: UI-GALLERY-004 (details modal)
- Subagent 6: UI-RESPONSIVE-001 & UI-PERF-001 (optimization)

---

**Detailed descriptions end here. See [ticket-list.md](./ticket-list.md) for priority order and timeline.**

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

❯ /ralph-loop "use existing frontend components connecting them to existing apis /lambdas until there is a working flow to upload an 11ty e" --completion-promise "DON