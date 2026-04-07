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

The development roadmap is organized into 15 sequential phases:

**Completed**
1. **Phase 1** - MVP Foundation ✅ COMPLETE
2. **Phase 2** - AT Protocol Foundation (ATP-FOUND-001 to 004) - foundational for everything
3. **Phase 3** - Template System & Site Config APIs (SSG-001, 002, 004, 005, 006)
4. **Phase 4** - Template Analysis System (SSG-007, 008, 009, 010)
5. **Phase 5** - Content Management (SSG-011, 012, 013, 014)
6. **Phase 6** - Build Pipeline & Deployment (SSG-015, 016, 017, 018 + infrastructure)
7. **Phase 7** - Nbhd CMS & Admin Features (NBHD-001 through SITES-003)
8. **Phase 8** - Build Pipeline UI Completion (BUILD-001, 002, 003)
9. **Phase 9** - Testing and Refinement

**Current Work**
10. **Phase 12** - Template Creation & Analysis (SSG-019, 020, 021, 028) - Analyze 11ty repos and save templates
11. **Phase 13** - Site Creation (Planning) - Create sites from analyzed templates
12. **Phase 14** - Content Management (SSG-022, 023, 024) - Dynamic CMS based on template schema
13. **Phase 15** - Site Deployment (SSG-025, 026, 027) - Build, deploy, and serve sites

14. **Phase 16** - Full AT Protocol Federation (ATP-001 through ATP-010)
---

## Phase 12 - Template Creation & Analysis (SSG-019 through SSG-028)

**Status:** In Progress (Template Analysis Complete)
**Timeline:** Phase 12 (Current focus)
**Objective:** Enable users to upload 11ty GitHub project URLs, automatically analyze frontmatter, infer content schemas, and save analyzed templates to their library.

**Workflow**: GitHub URL → Analyze → Infer Schema → Save to Template Library

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
**Status:** COMPLETE
**Notes:** Component fully implemented (TemplateURLInput.jsx, 298 lines) with progress tracking and real-time polling

---

### SSG-020: Template Analysis API Endpoint

**Description:** Create backend API endpoints to trigger and track template analysis jobs asynchronously.

**Requirements:**
- [x] Add `POST /api/templates/analyze-url` endpoint
  - Input: `{ "github_url": "https://github.com/..." }`
  - Output: `{ "template_id": "uuid", "status": "analyzing" }`
  - Validates GitHub URL format (github.com only)
  - Creates template record in DynamoDB
  - Invokes `template_analyzer` Lambda asynchronously
  - Returns immediately (async job)
- [x] Add `GET /api/templates/{template_id}/analysis-status` endpoint
  - Returns current job progress
  - Output: `{ "status": "analyzing|ready|failed", "progress": 0-1.0, "content_types": {...}, "error": "..." }`
  - Polls DynamoDB for job status
- [x] Store analysis job in DynamoDB:
  - Key: `TEMPLATE#{template_id}#ANALYSIS`
  - Fields: status, progress, started_at, completed_at, error
- [x] Store template metadata in DynamoDB:
  - Key: `TEMPLATE#{template_id}#METADATA`
  - Fields: github_url, commit_sha, analysis_date, inferred_fields
- [x] Authentication: Only allow authenticated users
- [x] Error handling: Return clear error messages

**Acceptance Criteria:**
- [x] POST endpoint accepts valid GitHub URL
- [x] Returns template_id immediately
- [x] Lambda is invoked asynchronously
- [x] Status endpoint returns job progress
- [x] Analysis metadata stored in DynamoDB
- [x] Error responses are descriptive
- [x] Handles concurrent analysis jobs

**Type:** Backend
**Estimate:** S
**Depends On:** None
**Status:** COMPLETE

---

### SSG-021: Enhanced Template Analyzer Lambda

**Description:** Enhance existing `template_analyzer` Lambda to validate 11ty projects, scan frontmatter, infer content schemas, and store results.

**Requirements:**
- [x] Validate 11ty project structure:
  - [x] Check for `eleventy.config.js` or `.eleventy.js`
  - [x] Check for `package.json` with 11ty dependency
  - [x] Return error if not valid 11ty project
- [x] Clone repository:
  - [x] Use shallow clone (--depth 1) for speed
  - [x] Clone to `/tmp/` with unique directory
  - [x] Capture commit SHA
- [x] Scan for content:
  - [x] Find content directories: `content/`, `src/`, `posts/`, `_posts/`, `pages/`
  - [x] Recursively find all `.md` and `.mdx` files
  - [x] Skip node_modules, .git, etc.
- [x] Parse frontmatter:
  - [x] Extract YAML frontmatter from each markdown file
  - [x] Handle TOML and JSON frontmatter variants
  - [x] Group files by structure (same fields = same content type)
- [x] Infer JSON schema:
  - [x] Analyze all frontmatter samples
  - [x] Detect field types: string, date, array, boolean, object
  - [x] Mark required vs optional fields
  - [x] Generate JSON schema for each content type
  - [x] Include min/max length, enum options if found
- [x] Store in DynamoDB:
  - [x] Update `TEMPLATE#{template_id}#METADATA` with: github_url, commit_sha, analysis_date
  - [x] Store `TEMPLATE#{template_id}#CONTENT_TYPES` with inferred schemas
  - [x] Store `TEMPLATE#{template_id}#SAMPLES` with example records
- [x] Update status in DynamoDB:
  - [x] Set status to "ready" on success
  - [x] Set status to "failed" with error message on failure
  - [x] Update progress field: 0.1 → 0.3 → 0.5 → 0.8 → 1.0
- [x] Cleanup:
  - [x] Delete temporary clone directory
  - [x] Handle cleanup on errors

**Acceptance Criteria:**
- [x] Validates 11ty projects correctly
- [x] Rejects non-11ty repositories
- [x] Finds content files in standard directories
- [x] Parses YAML, TOML, and JSON frontmatter
- [x] Groups files into correct content types
- [x] Infers accurate JSON schemas
- [x] Stores results in DynamoDB
- [x] Completes within 5-minute Lambda timeout
- [x] Handles large repositories gracefully
- [x] Errors logged and tracked

**Type:** Backend (Lambda)
**Estimate:** L
**Depends On:** SSG-020
**Status:** COMPLETE
**Notes:** Lambda fully implemented with 19/23 tests passing

---

### SSG-028: Save Analyzed Template to User Library

**Description:** After successful analysis, save the inferred template to the user's personal template library for future site creation.

**Requirements:**
- [ ] Create API endpoint `POST /api/user/templates/save`
  - Input: `{ "template_id": "uuid", "name": "Custom Name", "description": "Template description" }`
  - Returns: `{ "saved_template_id": "uuid", "status": "saved" }`
- [ ] Create UI button "Save to My Templates" in analysis results display
- [ ] Store in DynamoDB under user's record:
  - Key: `USER#{user_did}#TEMPLATE#{template_id}`
  - Fields: name, description, template_id, analysis_date, analyzed_from (GitHub URL), schema
- [ ] Add "My Templates" section in template gallery
  - List all user's saved analyzed templates
  - Show preview of content types
  - Quick action to create site from template
- [ ] Update template gallery UI:
  - Distinguish between built-in and user templates
  - Show source GitHub URL for analyzed templates
  - Allow renaming/deleting user templates
- [ ] Display template metadata:
  - Analysis date
  - Number of content types discovered
  - Quick preview of schema

**Acceptance Criteria:**
- [x] Successfully analyzed templates can be saved
- [x] Saved templates appear in "My Templates" section
- [x] Users can create sites from saved templates
- [x] Template metadata is visible and accurate
- [x] Users can rename and delete their templates
- [x] Multiple users have separate template libraries
- [x] Concurrent saves handled correctly

**Type:** Backend + Frontend
**Estimate:** S
**Depends On:** SSG-019, SSG-020, SSG-021
**Status:** COMPLETE

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
**Status:** COMPLETE
**Notes:** Service fully implemented with 31 comprehensive tests (31/31 passing)

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
**Depends On:** SSG-022
**Status:** COMPLETE
**Notes:** EnhancedContentEditor and FrontmatterForm fully integrated with schema service. 21 integration tests all passing.

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
**Status:** COMPLETE
**Notes:** Content APIs fully integrated with schema support. 8/9 tests passing (1 skipped). All schema fields preserved in storage.

---

---

## Phase 13 - Site Creation (SSG-030 through SSG-035)

**Status:** Planning
**Timeline:** After Phase 12 (Template Analysis Complete)
**Objective:** Enable users to create new sites by selecting analyzed templates and configuring them with automatic schema setup.

**Workflow**: Select Template → Configure Site → Initialize Schema → CMS Ready

---

### SSG-030: Site Creation Wizard Component

**Description:** Create a multi-step wizard component for users to create new sites from analyzed templates with automatic schema initialization.

**Requirements:**
- [ ] Create `SiteCreationWizard.jsx` in `app/UI/src/components/SiteBuilder/`
- [ ] Step 1: Template Selection
  - [ ] Display both built-in gallery and user's analyzed templates
  - [ ] Show template metadata (analysis date, content types)
  - [ ] Show preview of inferred schema
  - [ ] Allow searching/filtering templates
  - [ ] Display template source (built-in or GitHub URL for analyzed)
- [ ] Step 2: Site Configuration
  - [ ] Site name (required)
  - [ ] Site slug (auto-generated, editable)
  - [ ] Site type selector: Personal or Project
  - [ ] If Project: show neighborhood selector (required)
  - [ ] Site tagline/description (optional)
  - [ ] Public/private toggle (default: public)
- [ ] Step 3: Schema Preview & Customization
  - [ ] Display inferred content types
  - [ ] Show fields for each content type
  - [ ] Allow field renaming/description editing (optional)
  - [ ] Show which fields are required
  - [ ] Preview sample form layout
- [ ] Step 4: Review & Create
  - [ ] Show summary of all settings
  - [ ] Display warning if no content types found
  - [ ] "Create Site" button invokes API
  - [ ] Show loading/progress while creating
- [ ] Navigation controls
  - [ ] Previous/Next buttons between steps
  - [ ] Skip customization option (go straight to default)
  - [ ] Cancel button returns to template gallery
- [ ] Error handling
  - [ ] Show validation errors clearly
  - [ ] Allow fixing and retrying
  - [ ] Display API errors with helpful messages
- [ ] Mobile responsive design
- [ ] Save wizard state to local storage (resume if user navigates away)

**Acceptance Criteria:**
- [ ] Wizard displays all 4 steps
- [ ] Template selection works with both gallery and analyzed templates
- [ ] Site configuration validates name/slug
- [ ] Schema preview shows inferred content types
- [ ] Create button successfully calls API
- [ ] Site appears in dashboard after creation
- [ ] Error messages are clear and actionable
- [ ] Mobile layout is usable

**Type:** Frontend (React Component)
**Estimate:** M
**Depends On:** SSG-028, SSG-031
**Status:** PENDING

---

### SSG-031: Site Configuration API Endpoint

**Description:** Create backend API endpoint to create new sites with template schema initialization.

**Requirements:**
- [ ] Create `POST /api/sites` endpoint
  - [ ] Input validation:
    - [ ] Site name required (1-100 chars)
    - [ ] Site slug required, must be URL-safe
    - [ ] Site type: "personal" or "project"
    - [ ] Template ID must exist in database
    - [ ] If project: nbhd_id must exist and user has access
  - [ ] Check slug uniqueness across all sites
  - [ ] Create site record in DynamoDB:
    ```
    {
      "PK": "SITE#{site_id}",
      "SK": "METADATA#v1",
      "site_id": "uuid",
      "name": "My Blog",
      "slug": "my-blog",
      "site_type": "personal|project",
      "user_id": "user_did",
      "nbhd_id": "optional-nbhd-id",
      "template_id": "template-uuid",
      "template_schema": { ... },
      "status": "draft",
      "created_at": "2026-03-08T...",
      "updated_at": "2026-03-08T..."
    }
    ```
  - [ ] Copy template schema to site record
  - [ ] Create site GSI index entry for fast lookup
  - [ ] Return created site object with metadata
- [ ] Create `GET /api/sites/{site_id}` endpoint
  - [ ] Return full site metadata
  - [ ] Include template schema
  - [ ] Include creation/update timestamps
  - [ ] Authentication: only owner can view (for personal) or any authenticated user (for project)
- [ ] Create `GET /api/sites?type=personal|project&page=0&limit=20` endpoint
  - [ ] List all sites for authenticated user
  - [ ] Filter by site type
  - [ ] Pagination support
  - [ ] Return summary (name, slug, type, last updated)
- [ ] Error responses
  - [ ] 400 for invalid input
  - [ ] 409 for duplicate slug
  - [ ] 403 for unauthorized nbhd access
  - [ ] 404 for missing template

**Acceptance Criteria:**
- [ ] Site creation succeeds with valid data
- [ ] Site slug must be unique
- [ ] Project sites require valid neighborhood
- [ ] Personal sites don't allow nbhd_id
- [ ] Site metadata stored correctly in DynamoDB
- [ ] Template schema copied to site
- [ ] Retrieval returns all metadata
- [ ] Listing works with filtering
- [ ] Error messages are descriptive

**Type:** Backend (API)
**Estimate:** S
**Depends On:** SSG-028
**Status:** COMPLETE ✅

---

### SSG-032: Site Dashboard & Management

**Description:** Create dashboard interface for users to manage their sites.

**Requirements:**
- [ ] Create `SiteDashboard.jsx` component
- [ ] Two main sections:
  - [ ] Personal Sites tab
    - [ ] Show all personal sites for user
    - [ ] Cards with: site name, slug, status, last updated
    - [ ] Quick actions: Open CMS, View Live, Settings, Delete
    - [ ] "New Site" button links to SiteCreationWizard
  - [ ] Project Sites tab
    - [ ] Filter by neighborhood dropdown
    - [ ] Show all project sites user can access
    - [ ] Same card layout as personal sites
    - [ ] Gray out if user not owner (view-only)
    - [ ] "New Project Site" button (for owners only)
- [ ] Site cards display:
  - [ ] Site type badge (🧑 Personal or 🏘️ Project)
  - [ ] Last build status
  - [ ] Live URL if published
  - [ ] Content count (posts, pages, etc.)
- [ ] Actions menu:
  - [ ] Edit Site Settings
  - [ ] Open Content Manager
  - [ ] View Live Site (if published)
  - [ ] View Build History
  - [ ] Delete Site (with confirmation)
- [ ] Empty state:
  - [ ] "No sites yet" message
  - [ ] "Create your first site" button
- [ ] Loading and error states
- [ ] Mobile responsive

**Acceptance Criteria:**
- [ ] Personal and project sites shown separately
- [ ] Filtering by neighborhood works
- [ ] Quick actions navigate correctly
- [ ] Site cards display all info
- [ ] Delete confirmation prevents accidents
- [ ] Mobile layout is clean
- [ ] Loading states show progress

**Type:** Frontend (React Component)
**Estimate:** M
**Depends On:** SSG-031
**Status:** PENDING

---

### SSG-033: Schema Initialization & Content Type Setup

**Description:** Automatically initialize site with discovered content types and set up default content type for blog posts.

**Requirements:**
- [ ] When site is created, extract content types from template schema
- [ ] Store content type definitions in DynamoDB:
  - [ ] Key: `SITE#{site_id}#CONTENT_TYPES`
  - [ ] Store all content types from template analysis
  - [ ] Mark which is primary (usually "post")
  - [ ] Include full JSON schema for each type
- [ ] API endpoint `GET /api/sites/{site_id}/content-types`
  - [ ] Return all content types for site
  - [ ] Include schema fields for each type
  - [ ] Include field validation rules
  - [ ] Identify primary content type
- [ ] Initialize default content structure:
  - [ ] Create default folders in 11ty template if needed
  - [ ] Document expected content directory structure
  - [ ] Create sample content files if applicable
- [ ] Frontend: Display content types in CMS
  - [ ] Show available content types
  - [ ] Quick links to create new content for each type
  - [ ] Count of existing content for each type

**Acceptance Criteria:**
- [ ] Content types correctly extracted from template
- [ ] Schema stored and retrievable
- [ ] All fields accessible for form generation
- [ ] Primary content type identified
- [ ] CMS displays content types
- [ ] Users can select type when creating content

**Type:** Backend + Frontend
**Estimate:** S
**Depends On:** SSG-030, SSG-031
**Status:** PENDING

---

### SSG-034: Site Settings & Configuration

**Description:** Create UI and API for users to modify site settings after creation.

**Requirements:**
- [ ] Create `SiteSettingsPage.jsx` component
- [ ] Settings sections:
  - [ ] Basic Info: site name, slug, tagline
  - [ ] Type & Visibility: site type, public/private toggle
  - [ ] Neighborhood (for project sites only)
  - [ ] Template Info: current template, analyze date
- [ ] API endpoint `PUT /api/sites/{site_id}`
  - [ ] Allow updating: name, tagline, visibility
  - [ ] Prevent changing: site_id, slug, type, template
  - [ ] Validate name not empty
  - [ ] Return updated site
- [ ] Confirmation dialogs:
  - [ ] Changing visibility (private → public or vice versa)
  - [ ] Updating name shows impact on URL structure
- [ ] Display immutable fields (slug, type, template) as info-only
- [ ] Save/Cancel buttons
- [ ] Success message on save

**Acceptance Criteria:**
- [ ] User can update name and description
- [ ] Changes saved to database
- [ ] Immutable fields protected from editing
- [ ] Visibility changes confirmed
- [ ] API validation works

**Type:** Frontend + Backend
**Estimate:** S
**Depends On:** SSG-031
**Status:** PENDING

---

### SSG-035: Site Creation & Deletion with Cascading Updates

**Description:** Handle complete site lifecycle including creation, initialization, and deletion with proper cleanup.

**Requirements:**
- [ ] Site Creation Process (orchestration):
  - [ ] Call SSG-031 to create site record
  - [ ] Initialize schema (SSG-033)
  - [ ] Create empty content collection in DynamoDB
  - [ ] Generate subdomain configuration (for S3/CloudFront)
  - [ ] Return complete site setup to frontend
  - [ ] All operations transactional (fail-safe)
- [ ] Site Deletion API `DELETE /api/sites/{site_id}`
  - [ ] Authentication: only owner can delete
  - [ ] Confirmation: require user to type site name
  - [ ] Cascade deletions:
    - [ ] Delete site metadata
    - [ ] Delete all content records for site
    - [ ] Delete build jobs for site
    - [ ] Delete build artifacts from S3 (if any)
    - [ ] Clean CloudFront invalidation cache
  - [ ] Return 204 on success
- [ ] Prevent accidental deletion:
  - [ ] Require explicit confirmation in UI
  - [ ] Delete archived data for 30 days (soft delete)
  - [ ] Allow restore within 30-day window
- [ ] Logging:
  - [ ] Log all site creation/deletion events
  - [ ] Include user, timestamp, site info

**Acceptance Criteria:**
- [ ] Site creation is atomic (all or nothing)
- [ ] Deletion removes all associated data
- [ ] CloudFront and S3 cleaned up
- [ ] Content records deleted
- [ ] Build jobs cleaned up
- [ ] Soft-delete allows recovery
- [ ] Logging captures all events

**Type:** Backend (API & Orchestration)
**Estimate:** M
**Depends On:** SSG-031, SSG-033
**Status:** PENDING

---

## Phase 14 - Content Management (SSG-022, 023, 024, SSG-036 through SSG-042)

**Status:** In Progress (Core APIs ready, expanding features)
**Timeline:** After Phase 13 (Site Creation)
**Objective:** Provide users with a dynamic CMS that adapts to their site's schema, enabling intuitive content creation with Bluesky integration.

**Key Workflow**: Fetch Schema → Generate Forms → Create Content → Validate → Store as AT Protocol Record (→ Cross-post to BlueSky)

---

### SSG-022: Dynamic Schema Service

**Description:** Create frontend service to fetch template schemas and transform them into form fields and validators.

**Requirements:**
- [ ] Create `app/UI/src/services/dynamicSchemaService.js`
- [ ] Implement `getContentTypeSchema(siteId, contentType)`:
  - [ ] Fetch site metadata from API
  - [ ] Fetch inferred schema for content type
  - [ ] Return normalized schema object
  - [ ] Cache results locally (30-minute TTL)
- [ ] Implement `getFieldType(schemaField)`:
  - [ ] Map JSON schema types to React component types
  - [ ] Handle: string, date, array, boolean, object
  - [ ] Support custom field types (image, video, etc.)
  - [ ] Return component type and props
- [ ] Implement `generateFormFields(schema)`:
  - [ ] Create form field definitions from schema
  - [ ] Include validation rules (required, minLength, pattern)
  - [ ] Include help text and labels
  - [ ] Order fields logically (required first)
  - [ ] Add placeholder text
- [ ] Implement `validateContent(content, schema)`:
  - [ ] Check required fields present
  - [ ] Validate field types match schema
  - [ ] Validate constraints (min/max length, patterns)
  - [ ] Return detailed validation errors
- [ ] Implement `transformToRecord(content, schema, siteId)`:
  - [ ] Convert form data to DynamoDB record format
  - [ ] Separate frontmatter from body content
  - [ ] Generate slug from title
  - [ ] Create AT Protocol URI structure
  - [ ] Return record ready for storage
- [ ] Export all utilities for component use

**Acceptance Criteria:**
- [ ] Schema fetching works with caching
- [ ] Form fields generated correctly from schema
- [ ] Validation enforces all constraints
- [ ] Type validation prevents errors
- [ ] Supports text, date, array, boolean fields
- [ ] Records transform to correct format
- [ ] Error messages are clear
- [ ] Handles edge cases (null values, empty arrays)

**Type:** Frontend (Service/Utility)
**Estimate:** M
**Depends On:** SSG-020, SSG-021, SSG-033
**Status:** PENDING

---

### SSG-023: Template Schema to CMS Integration

**Description:** Integrate inferred template schema into CMS components to provide dynamic forms based on analyzed frontmatter.

**Requirements:**
- [ ] Update `EnhancedContentEditor.jsx`:
  - [ ] Load schema on component mount
  - [ ] Pass schema to FrontmatterForm
  - [ ] Display all inferred fields dynamically
  - [ ] Show field help text and descriptions
  - [ ] Validate content against schema before save
  - [ ] Display validation errors inline
- [ ] Update `FrontmatterForm.jsx`:
  - [ ] Accept schema prop
  - [ ] Dynamically render form fields from schema
  - [ ] Use appropriate input types (text, date, select, array)
  - [ ] Show field labels and help text
  - [ ] Real-time validation feedback
  - [ ] Highlight required fields
- [ ] Update `ContentBrowser.jsx`:
  - [ ] Show inferred content type fields in list view
  - [ ] Display schema fields in table columns
  - [ ] Allow sorting by schema fields
  - [ ] Allow filtering by field values
  - [ ] Show sample frontmatter in preview
- [ ] Update `SiteContentManager.jsx`:
  - [ ] Load template schema on mount
  - [ ] Pass schema to child components
  - [ ] Display discovered content types
  - [ ] Count content by type
- [ ] Backward compatibility:
  - [ ] Support templates without analysis
  - [ ] Fall back to generic forms if schema missing
  - [ ] Default field set if analysis failed
- [ ] Mobile responsive forms

**Acceptance Criteria:**
- [ ] CMS loads inferred schema correctly
- [ ] Form fields match schema
- [ ] All field types render appropriately
- [ ] Validation works before saving
- [ ] Required fields marked with asterisk
- [ ] Help text displays
- [ ] Works with legacy templates
- [ ] Content displays with correct fields
- [ ] Filtering/sorting work
- [ ] Mobile forms are usable

**Type:** Frontend (React Components)
**Estimate:** M
**Depends On:** SSG-022
**Status:** PENDING

---

### SSG-024: Content Save & Retrieval API Integration

**Description:** Ensure content APIs correctly store and retrieve content with inferred schema fields integrated with build pipeline.

**Requirements:**
- [ ] Verify `POST /api/content` endpoint:
  - [ ] Accepts frontmatter matching inferred schema
  - [ ] Validates against schema before storing
  - [ ] Stores in DynamoDB as AT Protocol record
  - [ ] Format: `RECORD#app.nbhd.blog.{type}#{rkey}`
  - [ ] Includes all frontmatter fields
  - [ ] Generates CID for immutability
  - [ ] Stores site_id for filtering
  - [ ] Returns stored record with URI and metadata
- [ ] Verify `GET /api/content?type={type}&site_id={siteId}`:
  - [ ] Returns all records of content type
  - [ ] Filters by site_id
  - [ ] Includes full frontmatter
  - [ ] Supports pagination (limit, offset)
  - [ ] Supports sorting (by date, title, etc.)
- [ ] Verify `GET /api/content/{rkey}` endpoint:
  - [ ] Returns single content record
  - [ ] Includes full content and metadata
  - [ ] Includes AT Protocol URI and CID
- [ ] Verify `PUT /api/content/{rkey}` endpoint:
  - [ ] Update existing content
  - [ ] Validate against schema
  - [ ] Generate new CID
  - [ ] Update timestamps
  - [ ] Cascade update to build artifacts
- [ ] Build pipeline integration:
  - [ ] Lambda queries: `RECORD#app.nbhd.blog.{type}#*`
  - [ ] Filters by site_id
  - [ ] Transforms to 11ty format
  - [ ] Preserves all frontmatter fields
  - [ ] Maintains sort order
- [ ] Content record structure:
  ```
  {
    "PK": "USER#{user_did}",
    "SK": "RECORD#app.nbhd.blog.post#{rkey}",
    "uri": "at://did:plc:user123/app.nbhd.blog.post/rkey123",
    "cid": "bafy2bzaced...",
    "value": {
      "site_id": "site-uuid",
      "type": "post",
      "title": "Post Title",
      "content": "# Markdown...",
      "slug": "post-slug",
      "frontmatter": {
        "date": "2026-03-08",
        "tags": ["tag1", "tag2"],
        // ... all inferred schema fields
      }
    },
    "created_at": "2026-03-08T...",
    "updated_at": "2026-03-08T..."
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
- [ ] Pagination works correctly
- [ ] Updates generate new CID

**Type:** Backend (API Integration)
**Estimate:** S
**Depends On:** SSG-021, SSG-022
**Status:** PENDING

---

### SSG-036: Blog Post Content Editor

**Description:** Create specialized content editor for blog posts with rich markdown support and frontmatter handling.

**Requirements:**
- [ ] Create `BlogPostEditor.jsx` component
- [ ] Components:
  - [ ] Split-pane layout: Form on left, Preview on right
  - [ ] Title field (required, schema-driven)
  - [ ] Slug field (auto-generated from title, editable)
  - [ ] Date picker (required, schema-driven)
  - [ ] Tags input (array field, schema-driven)
  - [ ] Excerpt field (optional, schema-driven)
  - [ ] Featured image URL (optional, schema-driven)
  - [ ] Draft toggle (optional, defaults to false)
- [ ] Markdown Editor:
  - [ ] Use CodeMirror or similar for editing
  - [ ] Syntax highlighting for markdown
  - [ ] Live preview on right pane
  - [ ] Toolbar with common markdown buttons (bold, italic, links, code, etc.)
- [ ] Frontmatter Display:
  - [ ] Show all frontmatter fields as form
  - [ ] Fields dynamically generated from schema
  - [ ] Help text for each field
  - [ ] Real-time validation
- [ ] Preview Pane:
  - [ ] Render markdown in real-time
  - [ ] Show frontmatter values
  - [ ] Indicate invalid fields
- [ ] Actions:
  - [ ] Auto-save draft every 30 seconds (optional)
  - [ ] Manual save button: "Save Draft"
  - [ ] Publish button: "Publish" (with Bluesky option)
  - [ ] Delete button (with confirmation)
  - [ ] Cancel button
- [ ] Bluesky Integration:
  - [ ] "Publish to BlueSky" checkbox
  - [ ] BlueSky preview pane (shows formatted text)
  - [ ] Character count indicator (300 char limit)
  - [ ] Shows which excerpt will be used
  - [ ] Visual representation of facets
- [ ] Keyboard shortcuts:
  - [ ] Ctrl+S: Save draft
  - [ ] Ctrl+Enter: Publish

**Acceptance Criteria:**
- [ ] Editor loads with existing content or empty
- [ ] All frontmatter fields display and save
- [ ] Markdown editor works smoothly
- [ ] Preview updates in real-time
- [ ] Save creates/updates content record
- [ ] Publish validates before submitting
- [ ] BlueSky option shows/hides correctly
- [ ] Character count updates dynamically
- [ ] Auto-save works without disrupting user

**Type:** Frontend (React Component)
**Estimate:** L
**Depends On:** SSG-022, SSG-023, SSG-024
**Status:** PENDING

---

### SSG-037: Bluesky Post Summary Generation & Preview

**Description:** Implement smart BlueSky summary generation from blog post content with preview and validation.

**Requirements:**
- [ ] Create `blueskySummaryService.js`:
  - [ ] Implement `generateBlueskyText(postData)` function
  - [ ] Priority order for excerpt:
    1. Frontmatter "excerpt" field (if present)
    2. First paragraph extracted from markdown
    3. First 150 characters of content
  - [ ] Format: `New blog post: {title}\n\n{excerpt}\n\n🔗 {static_url}`
  - [ ] Ensure text ≤ 300 characters (required for BlueSky)
  - [ ] Truncate excerpt if needed, maintain word boundaries
  - [ ] Generate link facets for clickable URL
- [ ] Create `BlueSkyPreview.jsx` component:
  - [ ] Display formatted text as it will appear on BlueSky
  - [ ] Show character count (max 300)
  - [ ] Visual indicator if over limit (red)
  - [ ] Highlight link in blue
  - [ ] Show "Publish to BlueSky" toggle status
- [ ] Link Facet Generation:
  - [ ] Calculate byte positions for URL (UTF-8 encoding)
  - [ ] Create link facet structure
  - [ ] Validate facet format
- [ ] Integration in BlogPostEditor:
  - [ ] Show BlueSky preview when "Publish to BlueSky" checked
  - [ ] Update preview as user edits
  - [ ] Show truncation warning if needed
  - [ ] Allow hiding preview

**Acceptance Criteria:**
- [ ] Summary generation respects character limit
- [ ] Excerpt priority order followed
- [ ] Link facets created correctly
- [ ] Preview shows accurate format
- [ ] Character count updates in real-time
- [ ] Truncation preserves word boundaries
- [ ] URL always included in post

**Type:** Frontend (Service + Component)
**Estimate:** M
**Depends On:** SSG-036
**Status:** PENDING

---

### SSG-038: Dual Record Creation (Blog + BlueSky)

**Description:** Implement atomic creation of both blog post and BlueSky summary records with proper linking.

**Requirements:**
- [ ] Update `POST /api/content` endpoint to handle dual posting:
  - [ ] Input includes `publish_to_bluesky: boolean` flag
  - [ ] If flag true:
    - [ ] Create app.nbhd.blog.post record (full post)
    - [ ] Generate BlueSky summary
    - [ ] Create app.bsky.feed.post record (summary)
    - [ ] Link records with URIs
    - [ ] Both transactions atomic (all or nothing)
  - [ ] If flag false:
    - [ ] Create only app.nbhd.blog.post record
- [ ] Record Linking:
  - [ ] Blog post record includes `bluesky_post_uri` field
  - [ ] BlueSky record includes `blog_post_uri` field
  - [ ] Enables: update/delete blog → cascade to BlueSky
- [ ] API Response includes:
  - [ ] Blog post record with URI and CID
  - [ ] BlueSky post record (if created) with URI and CID
  - [ ] Both record metadata
  - [ ] Success status message
- [ ] Error Handling:
  - [ ] If blog post fails → no BlueSky post created
  - [ ] If BlueSky post fails → rollback blog post (transactional)
  - [ ] Clear error messages indicating which step failed
  - [ ] Retry mechanism for transient failures
- [ ] Logging:
  - [ ] Log all dual record creations
  - [ ] Track publish_to_bluesky decisions
  - [ ] Log any failures with details

**Acceptance Criteria:**
- [ ] Blog post created successfully
- [ ] BlueSky post created when flag is true
- [ ] Records linked correctly
- [ ] Transactions are atomic
- [ ] API response includes both records
- [ ] Error messages are clear
- [ ] No orphaned records on failure

**Type:** Backend (API)
**Estimate:** M
**Depends On:** SSG-024, SSG-037
**Status:** PENDING

---

### SSG-039: Content Type-Specific Editors

**Description:** Create specialized editors for different content types (projects, pages, etc.) beyond blog posts.

**Requirements:**
- [ ] Create generic framework in `ContentTypeEditorFactory.jsx`:
  - [ ] Load content type schema
  - [ ] Render appropriate editor based on type
  - [ ] Support custom editor components by type
- [ ] Create `ProjectEditor.jsx`:
  - [ ] Fields: title, description, image, link, tags (from schema)
  - [ ] Image picker (link or upload placeholder)
  - [ ] Preview of project card
- [ ] Create `PageEditor.jsx`:
  - [ ] Fields: title, content, tags (from schema)
  - [ ] Rich markdown editor
  - [ ] No date field (pages are static)
  - [ ] No Bluesky option
- [ ] Create base `GenericContentEditor.jsx`:
  - [ ] Handle any content type dynamically
  - [ ] Render all schema fields in order
  - [ ] Appropriate input for each field type
  - [ ] Validation based on schema
- [ ] Editor Selection:
  - [ ] CMS shows content type selector
  - [ ] User selects type → loads appropriate editor
  - [ ] Fallback to generic editor if specialized not found
- [ ] Each editor includes:
  - [ ] Save/Publish buttons
  - [ ] Delete with confirmation
  - [ ] Auto-save drafts
  - [ ] Keyboard shortcuts

**Acceptance Criteria:**
- [ ] Editors load based on content type
- [ ] All schema fields render
- [ ] Validation enforces schema rules
- [ ] Save stores correct record type
- [ ] Fallback editor works for unknown types
- [ ] Mobile responsive

**Type:** Frontend (React Components)
**Estimate:** M
**Depends On:** SSG-022, SSG-023
**Status:** PENDING

---

### SSG-040: Content Management Dashboard

**Description:** Create comprehensive dashboard for managing all site content with filtering, searching, and bulk actions.

**Requirements:**
- [ ] Create `ContentManagementDashboard.jsx`:
  - [ ] Top section: Quick stats
    - [ ] Total content count by type
    - [ ] Draft vs published counts
    - [ ] Last content update timestamp
  - [ ] Content browser section:
    - [ ] Table/grid view selector
    - [ ] Columns: Type, Title, Date, Status, Actions
    - [ ] Sort by: date, title, status
    - [ ] Filter by: content type, status (draft/published)
    - [ ] Search by title/content
    - [ ] Pagination (20 items per page)
  - [ ] Actions per item:
    - [ ] Edit: opens appropriate editor
    - [ ] View: shows published post (if exists)
    - [ ] Copy: duplicate content
    - [ ] Delete: with confirmation
  - [ ] Bulk actions:
    - [ ] Select multiple items
    - [ ] Bulk delete with confirmation
    - [ ] Bulk status change (draft ↔ published)
- [ ] Build integration section:
  - [ ] "Build & Deploy" button
  - [ ] Last build status/time
  - [ ] Build progress indicator
  - [ ] Link to build history
- [ ] Create content button:
  - [ ] Dropdown showing all content types
  - [ ] Select type → opens appropriate editor
- [ ] Mobile responsive:
  - [ ] Stack sections vertically
  - [ ] Simplified controls for touch

**Acceptance Criteria:**
- [ ] Dashboard loads with all content
- [ ] Filtering works correctly
- [ ] Sorting works for all columns
- [ ] Search finds content by title
- [ ] Actions open correct editors
- [ ] Bulk actions work safely
- [ ] Build button accessible
- [ ] Mobile layout functional

**Type:** Frontend (React Component)
**Estimate:** L
**Depends On:** SSG-024, SSG-036, SSG-039
**Status:** PENDING

---

### SSG-041: Content Search & Query Service

**Description:** Implement efficient content search and filtering with support for complex queries.

**Requirements:**
- [ ] Create `contentSearchService.js`:
  - [ ] Implement `searchContent(siteId, query, filters)`:
    - [ ] Full-text search on title and content
    - [ ] Filter by content type
    - [ ] Filter by status (draft/published)
    - [ ] Filter by date range
    - [ ] Filter by tags
    - [ ] Return paginated results
  - [ ] Implement `queryContentRecords(siteId, contentType)`:
    - [ ] Query specific content type
    - [ ] Order by date (newest first)
    - [ ] Return all fields
  - [ ] Implement efficient DynamoDB queries:
    - [ ] Use GSI where possible
    - [ ] Minimize scan operations
    - [ ] Cache frequent queries (5-minute TTL)
- [ ] Frontend search component:
  - [ ] Search input with autocomplete
  - [ ] Tag cloud for quick filtering
  - [ ] Date range picker
  - [ ] Content type checkboxes
  - [ ] Results update in real-time
- [ ] Performance:
  - [ ] Handle large content libraries (1000+ items)
  - [ ] Search completes in < 500ms
  - [ ] Graceful degradation if no results

**Acceptance Criteria:**
- [ ] Full-text search works
- [ ] Filtering by type works
- [ ] Filtering by status works
- [ ] Date range filtering works
- [ ] Results paginate correctly
- [ ] Search performant with many items
- [ ] Results sorted correctly

**Type:** Frontend Service + Backend
**Estimate:** M
**Depends On:** SSG-024
**Status:** PENDING

---

### SSG-042: Content Templates & Quick Publishing

**Description:** Allow users to create content templates and quickly publish using predefined templates.

**Requirements:**
- [ ] Content Template Storage:
  - [ ] Store template records in DynamoDB:
    - [ ] Key: `SITE#{site_id}#TEMPLATE#{template_id}`
    - [ ] Include: template name, content type, default fields
  - [ ] API endpoint `POST /api/sites/{site_id}/content-templates`
- [ ] Template Creator UI:
  - [ ] Button: "Save as Template"
  - [ ] When creating content, allow saving frontmatter + content structure
  - [ ] Template naming/description
  - [ ] Choose which fields to include
- [ ] Quick Publish UI:
  - [ ] Show saved templates in editor
  - [ ] Select template → pre-fill form
  - [ ] User customizes and publishes
- [ ] Default Templates:
  - [ ] Provide built-in templates for each type
  - [ ] Example: "Blog Post", "Quick Note", "Weekly Newsletter"
  - [ ] Customizable per site
- [ ] Delete/Manage Templates:
  - [ ] List all templates for site
  - [ ] Delete templates
  - [ ] Edit template defaults

**Acceptance Criteria:**
- [ ] Templates saved from existing content
- [ ] Templates pre-fill form correctly
- [ ] Default templates available
- [ ] Templates manageable (list, delete, edit)
- [ ] Quick publish workflow faster than manual

**Type:** Frontend + Backend
**Estimate:** M
**Depends On:** SSG-036
**Status:** PENDING

---

## Phase 15 - Site Deployment (SSG-025, 026, 027, SSG-043 through SSG-047)

**Status:** Pending
**Timeline:** After Phase 14 (Content Management)
**Objective:** Enable users to build and deploy their sites to S3 with automated 11ty builds, asset optimization, and CDN distribution.

**Key Workflow**: Build & Deploy → Clone Template → Fetch Content → Build 11ty → Upload S3 → Invalidate CDN → Live

---

### SSG-025: Build Trigger and Status UI

**Description:** Integrate build trigger button and real-time build status into site CMS dashboard.

**Requirements:**
- [ ] Create `BuildTriggerButton.jsx` component
  - [ ] "Build & Deploy" button in CMS dashboard
  - [ ] Disable while build in progress
  - [ ] Show spinner during build
  - [ ] Show last build timestamp
  - [ ] Show build status: pending, building, success, failed
- [ ] Create `BuildStatusPoller.jsx` component
  - [ ] Poll `GET /api/sites/{siteId}/build-job/{jobId}` every 2 seconds
  - [ ] Stop polling when build completes (success or failure)
  - [ ] Update progress bar: 0% → 50% → 100%
  - [ ] Show phase progress: Cloning → Fetching → Building → Uploading → Deploying
  - [ ] Display elapsed time
  - [ ] Handle polling failures gracefully
- [ ] Create `BuildHistory.jsx` component
  - [ ] Show list of past 10 builds
  - [ ] Columns: timestamp, status, duration, actions
  - [ ] Actions: View Logs, Retry, Delete
  - [ ] Pagination for older builds
  - [ ] Status indicators (green for success, red for failure)
- [ ] Integrate into SiteContentManager/Dashboard:
  - [ ] Show BuildTriggerButton at top
  - [ ] Show BuildStatusPoller when building
  - [ ] Show BuildHistory below
  - [ ] Maintain state across navigation
- [ ] Error handling:
  - [ ] Display build errors clearly
  - [ ] Suggest retry option
  - [ ] Link to detailed logs

**Acceptance Criteria:**
- [ ] Build button visible and functional
- [ ] Status updates in real-time
- [ ] Progress bar shows stages
- [ ] History loads previous builds
- [ ] Errors display clearly
- [ ] Mobile responsive
- [ ] Polling stops after completion

**Type:** Frontend (React Components)
**Estimate:** M
**Depends On:** SSG-044 (Build Job API)
**Status:** COMPLETE
**Notes:** All components fully implemented (BuildTriggerButton, BuildStatusPoller, BuildHistory) with real-time polling and error handling

---

### SSG-026: Build Pipeline & S3 Infrastructure Verification

**Description:** Verify and document complete build infrastructure including Lambda, S3, CloudFront configuration.

**Requirements:**
- [ ] Terraform Configuration Review:
  - [ ] Verify S3 bucket configuration:
    - [ ] Bucket versioning enabled
    - [ ] Encryption enabled
    - [ ] Access logging configured
    - [ ] Block public access (serve via CloudFront)
  - [ ] Verify CloudFront distribution:
    - [ ] Origin points to S3 bucket
    - [ ] HTTPS enforced
    - [ ] Cache behaviors configured
    - [ ] TTL settings (assets long, HTML short)
    - [ ] Compression enabled
  - [ ] Verify Lambda IAM role:
    - [ ] S3 read/write permissions
    - [ ] CloudFront invalidation permission
    - [ ] DynamoDB read permission
    - [ ] CloudWatch logs permission
- [ ] site_builder Lambda verification:
  - [ ] Function exists and is deployed
  - [ ] Environment variables configured:
    - [ ] DynamoDB table name
    - [ ] S3 bucket name
    - [ ] CloudFront distribution ID
  - [ ] Timeout set to 15 minutes
  - [ ] Memory set to 2GB minimum
  - [ ] Temp storage adequate (/tmp has 10GB)
- [ ] Build subdomain configuration:
  - [ ] DNS routing for *.nbhd.city
  - [ ] Points to CloudFront distribution
  - [ ] HTTPS certificate valid
  - [ ] CNAME records set up
- [ ] Documentation:
  - [ ] Document S3 bucket structure
  - [ ] Document CloudFront behaviors
  - [ ] Document Lambda environment setup
  - [ ] Create runbook for troubleshooting
- [ ] Testing:
  - [ ] Manual test: build a site end-to-end
  - [ ] Verify S3 upload
  - [ ] Verify CloudFront cache invalidation
  - [ ] Test site accessible at subdomain
  - [ ] Test HTTPS works
  - [ ] Test cache behavior (assets vs HTML)

**Acceptance Criteria:**
- [ ] All infrastructure reviewed
- [ ] S3 configured correctly
- [ ] CloudFront configured correctly
- [ ] Lambda has proper permissions
- [ ] Subdomain routing works
- [ ] HTTPS functional
- [ ] Cache behavior correct
- [ ] Manual end-to-end build succeeds

**Type:** DevOps / Backend
**Estimate:** M
**Depends On:** Existing infrastructure
**Status:** COMPLETE ✅

---

### SSG-043: Build Job API Endpoints

**Description:** Create API endpoints to trigger builds and track job status.

**Requirements:**
- [ ] Create `POST /api/sites/{site_id}/build` endpoint:
  - [ ] Input: optional `{ "force": true }` (skip cache)
  - [ ] Validate site exists
  - [ ] Check if build already in progress (prevent concurrent)
  - [ ] Create build job record in DynamoDB:
    ```
    {
      "PK": "SITE#{site_id}",
      "SK": "BUILD#{job_id}",
      "job_id": "uuid",
      "status": "queued",
      "triggered_by": "user_did",
      "triggered_at": "2026-03-08T...",
      "started_at": null,
      "completed_at": null,
      "duration": null,
      "phases": {
        "clone": { "status": "pending", "progress": 0 },
        "fetch": { "status": "pending", "progress": 0 },
        "build": { "status": "pending", "progress": 0 },
        "upload": { "status": "pending", "progress": 0 },
        "deploy": { "status": "pending", "progress": 0 }
      },
      "error": null
    }
    ```
  - [ ] Invoke `site_builder` Lambda asynchronously
  - [ ] Return job_id and status
- [ ] Create `GET /api/sites/{site_id}/build-job/{job_id}` endpoint:
  - [ ] Return full job record with progress
  - [ ] Include elapsed time
  - [ ] Include current phase status
  - [ ] Include error if failed
- [ ] Create `GET /api/sites/{site_id}/builds?limit=20` endpoint:
  - [ ] Return list of past builds (newest first)
  - [ ] Include status, timestamp, duration
  - [ ] Pagination support
- [ ] Create `POST /api/sites/{site_id}/build/{job_id}/cancel` endpoint:
  - [ ] Cancel in-progress build (if possible)
  - [ ] Return 404 if already completed

**Acceptance Criteria:**
- [ ] Build trigger creates job record
- [ ] Job status retrievable
- [ ] Build history accessible
- [ ] Lambda invoked correctly
- [ ] Job tracking functional
- [ ] Error messages clear

**Type:** Backend (API)
**Estimate:** M
**Depends On:** SSG-031
**Status:** PENDING

---

### SSG-044: Build Pipeline Orchestration Lambda

**Description:** Implement Lambda function that orchestrates complete build process from GitHub template to deployed site.

**Requirements:**
- [ ] Lambda: `app/lambda/site_builder/handler.py`
- [ ] Phase 1: Clone Template
  - [ ] Receive template GitHub URL and commit SHA from DynamoDB
  - [ ] Git clone --depth 1 to /tmp/clone_{random}/
  - [ ] Checkout specific commit SHA
  - [ ] Validate 11ty structure exists
  - [ ] Update job status: "clone" → "fetching" (30% progress)
- [ ] Phase 2: Fetch Content
  - [ ] Query DynamoDB: `RECORD#app.nbhd.blog.*#*` for site
  - [ ] Filter by site_id
  - [ ] Retrieve all content records
  - [ ] Group by content type
  - [ ] Update job status: "fetch" → "building" (50% progress)
- [ ] Phase 3: Transform to 11ty Format
  - [ ] Convert AT Protocol records to 11ty data structure
  - [ ] Create `_data/content.json` with all content
  - [ ] Structure by content type (posts, pages, projects, etc.)
  - [ ] Include all frontmatter fields
  - [ ] Convert markdown to HTML if needed
  - [ ] Update job status: 60% progress
- [ ] Phase 4: Install Dependencies
  - [ ] npm install from template's package.json
  - [ ] Install dependencies (2 minute timeout)
  - [ ] Update job status: 70% progress
- [ ] Phase 5: Build with 11ty
  - [ ] npx @11ty/eleventy to generate _site/
  - [ ] Capture build output and errors
  - [ ] Validate output exists
  - [ ] Update job status: "build" → "uploading" (80% progress)
- [ ] Phase 6: Upload to S3
  - [ ] aws s3 sync _site/ s3://nbhd-sites/{site_id}/{build_id}/
  - [ ] Enable versioning
  - [ ] Set cache headers:
    - [ ] HTML: no-cache, 1 hour max-age
    - [ ] Assets: cache for 1 year (immutable)
  - [ ] Update job status: "upload" → "deploying" (90% progress)
- [ ] Phase 7: Invalidate CDN
  - [ ] cloudfront.create_invalidation(distribution_id, paths=['/*'])
  - [ ] Wait for invalidation to complete (polling)
  - [ ] Update job status: "deploy" → "success" (100% progress)
- [ ] Error Handling:
  - [ ] Catch errors at each phase
  - [ ] Log detailed error message
  - [ ] Update job status: "failed"
  - [ ] Include error in response
  - [ ] Clean up temp files
- [ ] Logging:
  - [ ] Log each phase start/completion
  - [ ] Log timings
  - [ ] Log file counts
  - [ ] CloudWatch integration
- [ ] Cleanup:
  - [ ] Delete temp clone directory
  - [ ] Clean /tmp after success/failure

**Acceptance Criteria:**
- [ ] Builds trigger and complete successfully
- [ ] Status updates for each phase
- [ ] Content fetched and transformed correctly
- [ ] 11ty build succeeds
- [ ] Files uploaded to S3
- [ ] CloudFront invalidation works
- [ ] Site accessible after build
- [ ] Error handling graceful
- [ ] Temp files cleaned up
- [ ] Completes within timeout

**Type:** Backend (Lambda)
**Estimate:** XL
**Depends On:** SSG-026, SSG-024
**Status:** PENDING

---

### SSG-045: Build Output Validation & Error Handling

**Description:** Implement comprehensive validation of build outputs and clear error reporting.

**Requirements:**
- [ ] Validate 11ty Build Output:
  - [ ] Check _site/ directory exists
  - [ ] Check for index.html (site root)
  - [ ] Check all content pages exist
  - [ ] Validate HTML syntax (basic check)
  - [ ] Verify asset links are valid
- [ ] Validate S3 Upload:
  - [ ] Confirm all files uploaded
  - [ ] Verify file counts match _site/
  - [ ] Test S3 URLs are accessible
  - [ ] Validate HTTPS works
- [ ] Error Classification:
  - [ ] Template errors (invalid 11ty project)
  - [ ] Content errors (invalid frontmatter)
  - [ ] Build errors (npm install failed, 11ty failed)
  - [ ] Upload errors (S3 permission, network)
  - [ ] CloudFront errors (invalidation failed)
- [ ] Error Messages:
  - [ ] Clear, actionable error text
  - [ ] Suggest fixes (rebuild, check template, etc.)
  - [ ] Include relevant logs
  - [ ] Link to documentation
- [ ] Build Logs:
  - [ ] Store full build logs in S3:
    - [ ] Key: s3://nbhd-sites/{site_id}/{build_id}/build.log
  - [ ] API endpoint to retrieve logs: `GET /api/sites/{site_id}/build-logs/{job_id}`
  - [ ] Frontend: Display last 100 lines in UI
  - [ ] Full logs downloadable
- [ ] Retry Logic:
  - [ ] Identify transient vs permanent errors
  - [ ] Suggest retry for transient errors
  - [ ] API endpoint to retry failed build: `POST /api/sites/{site_id}/build/{job_id}/retry`

**Acceptance Criteria:**
- [ ] Build output validated completely
- [ ] S3 upload verified
- [ ] Errors classified correctly
- [ ] Error messages helpful
- [ ] Build logs stored and retrievable
- [ ] Retry mechanism works
- [ ] Frontend displays errors clearly

**Type:** Backend (Lambda)
**Estimate:** M
**Depends On:** SSG-044
**Status:** PENDING

---

### SSG-046: Build Artifacts & Site Preview

**Description:** Manage build artifacts and provide site preview capabilities.

**Requirements:**
- [ ] Build Artifacts Storage:
  - [ ] S3 structure: `s3://nbhd-sites/{site_id}/{build_id}/`
  - [ ] Latest symlink: `s3://nbhd-sites/{site_id}/latest/` → latest build_id
  - [ ] Retain last 10 builds for rollback
  - [ ] Archive older builds to Glacier (optional)
- [ ] Site Preview:
  - [ ] API endpoint `GET /api/sites/{site_id}/preview`
  - [ ] Returns URL for latest published site
  - [ ] Format: `https://{site_slug}.nbhd.city/`
  - [ ] Validates site is published
  - [ ] Returns 404 if never built
- [ ] Build Artifact Cleanup:
  - [ ] Lambda function runs daily
  - [ ] Deletes builds older than 30 days
  - [ ] Retains latest 10 builds
  - [ ] Log cleanup actions
- [ ] Rollback Capability:
  - [ ] API endpoint `POST /api/sites/{site_id}/rollback/{previous_build_id}`
  - [ ] Update CloudFront to serve previous build
  - [ ] Create new build job record for rollback
  - [ ] Alert user to invalidation
- [ ] Build Information Display:
  - [ ] Show build size
  - [ ] Show file count
  - [ ] Show build time
  - [ ] Show deployed timestamp

**Acceptance Criteria:**
- [ ] Artifacts stored in S3 correctly
- [ ] Latest link works
- [ ] Preview URL accessible
- [ ] Cleanup works
- [ ] Rollback functional
- [ ] Build info displayed

**Type:** Backend
**Estimate:** M
**Depends On:** SSG-044
**Status:** PENDING

---

### SSG-047: End-to-End Deployment Workflow Testing

**Description:** Comprehensive integration tests for complete site creation, content management, and deployment workflow.

**Requirements:**
- [ ] Test Scenario 1: Create Blog from Analyzed Template
  - [ ] Create site from known 11ty template
  - [ ] Verify site record in database
  - [ ] Verify schema initialized
- [ ] Test Scenario 2: Create Content with Schema Validation
  - [ ] Create blog post with all frontmatter fields
  - [ ] Verify content stored as AT Protocol record
  - [ ] Verify schema validation works
- [ ] Test Scenario 3: Build & Deploy Complete Workflow
  - [ ] Trigger build via API
  - [ ] Monitor job status
  - [ ] Verify site built successfully
  - [ ] Verify site deployed to S3
  - [ ] Verify CloudFront invalidation
  - [ ] Verify site accessible at subdomain
- [ ] Test Scenario 4: BlueSky Cross-posting
  - [ ] Create post with publish_to_bluesky=true
  - [ ] Verify blog post record created
  - [ ] Verify BlueSky post record created
  - [ ] Verify records linked
  - [ ] Verify BlueSky text format correct
  - [ ] Verify link facets present
- [ ] Test Scenario 5: Multiple Content Types
  - [ ] Create posts, pages, projects
  - [ ] Verify each type stored separately
  - [ ] Build with mixed content
  - [ ] Verify all types render
- [ ] Test Scenario 6: Error Cases
  - [ ] Invalid template URL
  - [ ] Missing required fields
  - [ ] Failed build (deliberate error)
  - [ ] S3 upload failure
  - [ ] Verify graceful error handling
- [ ] Test Scenario 7: Site Deletion
  - [ ] Delete site after deployment
  - [ ] Verify content records deleted
  - [ ] Verify build jobs cleaned up
  - [ ] Verify S3 artifacts deleted
  - [ ] Verify CloudFront cleaned
- [ ] Performance Tests:
  - [ ] Build time < 5 minutes
  - [ ] S3 upload < 2 minutes
  - [ ] CloudFront invalidation < 1 minute
  - [ ] Site accessible < 30 seconds after deploy
- [ ] Load Tests:
  - [ ] Concurrent builds on different sites
  - [ ] High content volume (1000+ posts)
  - [ ] Large template (100+ MB)

**Acceptance Criteria:**
- [ ] All scenarios pass
- [ ] Error handling works
- [ ] Performance targets met
- [ ] Load tests successful
- [ ] No data loss
- [ ] All cleanup verified

**Type:** Testing (Integration)
**Estimate:** L
**Depends On:** SSG-025, SSG-026, SSG-044, SSG-045, SSG-046
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
**Status:** COMPLETE ✅

---

## Phase 13 - Site Creation (Planning)

**Status:** PLANNING
**Timeline:** After Phase 12
**Objective:** Enable users to create new sites based on analyzed templates with full configuration and schema setup.

**Documentation:** See [docs/phase-13-site-creation.md](../docs/phase-13-site-creation.md)

Additional tickets to be created after planning discussion covering:
- Site creation wizard and workflow
- Template selection integration
- Site configuration and metadata
- Schema initialization for CMS
- Site setup API endpoints

---

## Phase 14 - Content Management (SSG-022, SSG-023, SSG-024)

**Status:** PENDING
**Timeline:** Phase 14
**Objective:** Provide users with a dynamic CMS that adapts to their site's schema.

**Documentation:** See [docs/phase-14-content-management.md](../docs/phase-14-content-management.md)

These tickets implement the dynamic content editor with schema-based forms and validation.

---

## Phase 15 - Site Deployment (SSG-025, SSG-026, SSG-027)

**Status:** PENDING
**Timeline:** Phase 15
**Objective:** Enable users to build and deploy sites to S3 with automated 11ty builds and CDN distribution.

**Documentation:** See [docs/phase-15-site-deployment.md](../docs/phase-15-site-deployment.md)

These tickets complete the build pipeline with real-time status UI and infrastructure verification.

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

## Phase 16 - Distributed Chat System (CHAT-001 through CHAT-025)

**Status:** Planning
**Timeline:** After Phase 15 (Site Deployment)
**Objective:** Implement a distributed, federated chat system using Elixir/Phoenix, AT Protocol, and BEAM clustering for real-time neighborhood messaging.

**Architecture:** Elixir/Phoenix + BEAM Distribution + AT Protocol Federation + Horde + Broadway

**See specs/**: `ADR-001-atproto-federation.md`, `beam-distribution.md`, `atproto-federation.md`, and Lexicon JSON schemas.

---

### CHAT-001: Elixir/Phoenix Project Setup & Scaffolding

**Description:** Initialize new Elixir/Phoenix project with clustering, AT Protocol, and distributed system dependencies.

**Requirements:**
- [ ] Create new Mix project: `mix new nbhd_chat --sup`
- [ ] Add core dependencies:
  - [ ] `phoenix` - Web framework
  - [ ] `phoenix_pubsub` - PubSub with :pg adapter
  - [ ] `libcluster` - Automatic node discovery
  - [ ] `horde` - Distributed registry and supervisor
  - [ ] `broadway` - Stream processing for firehose
  - [ ] `ecto` and `postgrex` - Database
  - [ ] `plug_crypto` - Cryptography utilities
  - [ ] `jason` - JSON encoding/decoding
  - [ ] `httpoison` or `req` - HTTP client
  - [ ] `ex_secp256k1` - Elliptic curve crypto for AT Protocol
  - [ ] `base32` - Base32 encoding for TIDs
- [ ] Configure Phoenix:
  - [ ] API-only mode (no HTML templates initially)
  - [ ] CORS for WebSocket and XRPC endpoints
  - [ ] Logging configuration
- [ ] Configure Ecto:
  - [ ] PostgreSQL database
  - [ ] Connection pooling
  - [ ] Migration setup
- [ ] Create Docker Compose for local dev (Postgres, Redis optional)
- [ ] Create supervision tree:
  - [ ] Phoenix.PubSub
  - [ ] Horde.Registry
  - [ ] Horde.DynamicSupervisor
  - [ ] Cluster.Supervisor (libcluster)
  - [ ] Firehose.Supervisor
- [ ] Setup configuration:
  - [ ] `config/runtime.exs` for environment variables
  - [ ] Erlang cookie management
  - [ ] Node naming convention
- [ ] Documentation:
  - [ ] Dev environment setup guide
  - [ ] Configuration reference

**Acceptance Criteria:**
- [ ] New Elixir project created and compiles
- [ ] All dependencies installed
- [ ] Supervision tree starts without errors
- [ ] Local dev environment runs with `iex -S mix phx.server`
- [ ] Docker Compose starts Postgres
- [ ] Database migrations run
- [ ] Node naming works (nbhd@hostname format)

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** None
**Status:** PENDING

---

### CHAT-002: AT Protocol DID Resolver

**Description:** Implement DID resolution for `did:plc` and `did:web` methods with caching.

**Requirements:**
- [ ] Create `Nbhd.DID.Resolver` module:
  - [ ] `resolve_did(did)` - Main resolver function
  - [ ] Support `did:plc:*` resolution via PLC directory
  - [ ] Support `did:web:*` resolution via HTTPS `/.well-known/did.json`
  - [ ] Parse DID Document (public key, services)
  - [ ] Extract signing keys (secp256k1, P-256)
- [ ] ETS-based caching:
  - [ ] Create `:did_cache` ETS table
  - [ ] Store resolved DIDs with 24-hour TTL
  - [ ] Implement cache eviction
  - [ ] Monitor cache stats
- [ ] Handle errors:
  - [ ] Network timeouts (with backoff)
  - [ ] Invalid DID format
  - [ ] Missing DID Document
  - [ ] Expired/revoked DIDs (future)
- [ ] HTTP client integration:
  - [ ] Respect HTTP timeouts (5 second max)
  - [ ] Handle redirects properly
  - [ ] Verify HTTPS certificates
- [ ] Testing:
  - [ ] Unit tests for did:plc resolution
  - [ ] Unit tests for did:web resolution
  - [ ] Cache hit/miss tests
  - [ ] Error case tests

**Acceptance Criteria:**
- [ ] DIDs resolve correctly
- [ ] Public keys extractable
- [ ] Caching works (verified with reduced HTTP calls)
- [ ] Errors handled gracefully
- [ ] Resolver completes in < 500ms for cached DIDs
- [ ] All tests passing

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-001
**Status:** PENDING

---

### CHAT-003: AT Protocol Repo Store (MST + CAR)

**Description:** Implement append-only repo store with Merkle Search Tree (MST) for content addressing.

**Requirements:**
- [ ] Create `Nbhd.Repo.Store` module:
  - [ ] Per-user repos stored in PostgreSQL
  - [ ] Append-only commit log
  - [ ] MST-backed record storage (stubbed initially)
  - [ ] Record key (rkey) generation using TID
- [ ] Implement commit creation:
  - [ ] `create_commit(user_did, records, signature)` function
  - [ ] Validate record format
  - [ ] Verify signature with user's signing key
  - [ ] Generate CID (content hash)
  - [ ] Store commit in database
  - [ ] Update repo root CID
- [ ] Database schema:
  - [ ] Users table (DID, signing key, repo root)
  - [ ] Commits table (CID, parent CID, records)
  - [ ] Records table (key, value, record type)
- [ ] CAR file serialization (MVP):
  - [ ] Serialize repo to CAR format
  - [ ] Include all blocks (records + MST)
  - [ ] Generate root block CID
- [ ] Signing & verification:
  - [ ] Verify commits are signed
  - [ ] Store & validate record signatures
  - [ ] Handle key rotation (future)
- [ ] Testing:
  - [ ] Commit creation and storage
  - [ ] MST structure (stubbed)
  - [ ] CID generation matches spec
  - [ ] CAR serialization

**Acceptance Criteria:**
- [ ] Commits created and stored
- [ ] Records retrievable by key
- [ ] CIDs match AT Protocol spec
- [ ] Signature verification works
- [ ] CAR files generate correctly
- [ ] Database schema sound

**Type:** Backend (Elixir)
**Estimate:** L
**Depends On:** CHAT-002
**Status:** PENDING

---

### CHAT-004: XRPC Router & Endpoints

**Description:** Implement XRPC HTTP RPC interface for AT Protocol method calls.

**Requirements:**
- [ ] Create `NbhdWeb.XRPC` router plug:
  - [ ] Handle POST to `/xrpc/{nsid}`
  - [ ] Parse Lexicon method definitions
  - [ ] Route to handler modules
  - [ ] Validate request/response against Lexicon schemas
  - [ ] Error responses (XRPCError format)
- [ ] Implement XRPC endpoints:
  - [ ] `app.nbhd.chat.sendMessage` - Create message record
  - [ ] `app.nbhd.chat.getMessage` - Retrieve message
  - [ ] `app.nbhd.chat.getRoom` - Retrieve room record
  - [ ] `app.nbhd.chat.createRoom` - Create room record
  - [ ] `com.atproto.repo.getRecord` - Get any record by URI
  - [ ] `com.atproto.repo.listRecords` - List records by collection
- [ ] Authentication:
  - [ ] Require AT Protocol JWT in Authorization header
  - [ ] Verify JWT signature with user's DID
  - [ ] Extract DID from token
- [ ] Handlers:
  - [ ] Store records in Repo via CHAT-003
  - [ ] Validate against Lexicon schemas
  - [ ] Generate URIs (at://did/collection/rkey)
  - [ ] Return signed records
- [ ] Lexicon Loading:
  - [ ] Load Lexicon definitions from JSON files
  - [ ] Store in ETS for fast lookup
  - [ ] Validate requests/responses
- [ ] Testing:
  - [ ] XRPC endpoint tests
  - [ ] JWT auth tests
  - [ ] Lexicon validation tests
  - [ ] Error response tests

**Acceptance Criteria:**
- [ ] XRPC endpoints callable via HTTP
- [ ] Records stored via sendMessage
- [ ] Records retrievable via getRecord
- [ ] JWT authentication required and verified
- [ ] Lexicon schemas enforced
- [ ] Error responses properly formatted

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-003
**Status:** PENDING

---

### CHAT-005: Firehose Producer & Consumer (Broadway)

**Description:** Implement WebSocket firehose consumer to stream AT Protocol events from peer PDSes.

**Requirements:**
- [ ] Create `Nbhd.Firehose.Producer` module:
  - [ ] WebSocket connection to peer PDS firehose
  - [ ] Handle firehose URI and credentials
  - [ ] Reconnect with exponential backoff on disconnect
  - [ ] Parse CAR-encoded blocks
  - [ ] Decode firehose events (JSON)
- [ ] Create `Nbhd.Firehose.Broadway` pipeline:
  - [ ] Broadway producer wrapping the WebSocket producer
  - [ ] Process events (decode, validate, route)
  - [ ] Batch events for efficiency
  - [ ] Handle backpressure
  - [ ] Emit events to PubSub
- [ ] Cursor persistence:
  - [ ] Store firehose cursor (sequence number)
  - [ ] Resume from last cursor on restart
  - [ ] PostgreSQL persistence (for production)
  - [ ] `:persistent_term` for fast lookup
- [ ] Event routing:
  - [ ] Route `app.nbhd.chat.message` events to room topics
  - [ ] Route other events appropriately
  - [ ] Validate event signatures
  - [ ] Store events in local Repo (optional cache)
- [ ] Error handling:
  - [ ] Handle malformed events
  - [ ] Handle network errors
  - [ ] Log all errors with context
  - [ ] Monitor pipeline health
- [ ] Testing:
  - [ ] Mock firehose WebSocket
  - [ ] Event parsing tests
  - [ ] Cursor persistence tests
  - [ ] Error case tests

**Acceptance Criteria:**
- [ ] Firehose connects successfully
- [ ] Events decoded correctly
- [ ] Events routed to PubSub
- [ ] Cursor persists across restarts
- [ ] Network failures handled gracefully
- [ ] Events validated before processing

**Type:** Backend (Elixir)
**Estimate:** L
**Depends On:** CHAT-002, CHAT-004
**Status:** PENDING

---

### CHAT-006: Horde-based Room Registry & Processes

**Description:** Implement distributed room process registry and management using Horde.

**Requirements:**
- [ ] Create `Nbhd.Room.Server` GenServer:
  - [ ] One GenServer per room (handles state)
  - [ ] Store room metadata (name, description, members)
  - [ ] Maintain message list (in-memory or per-room cache)
  - [ ] Handle `:send_message` cast
  - [ ] Handle `:add_member` cast
  - [ ] Handle `:remove_member` cast
  - [ ] Periodic persistence to database
- [ ] Create `Nbhd.Room.Registry` (Horde-backed):
  - [ ] Initialize Horde.Registry in application.ex
  - [ ] Register rooms by `room:{room_id}`
  - [ ] Auto-discoverable from any node
  - [ ] Handle cluster membership changes
- [ ] Create `Nbhd.Room.Supervisor` (Horde-backed):
  - [ ] Initialize Horde.DynamicSupervisor
  - [ ] Spawn room processes on demand
  - [ ] Auto-restart on failure
  - [ ] Rebalance across nodes
- [ ] Room initialization:
  - [ ] Create rooms from app.nbhd.chat.room records
  - [ ] Load existing members
  - [ ] Subscribe to PubSub topic
  - [ ] Update room state on remote messages
- [ ] Cross-node communication:
  - [ ] Send messages to rooms on any node via Horde
  - [ ] Broadcast within room via Phoenix.PubSub
  - [ ] Handle node failures gracefully
- [ ] Testing:
  - [ ] Horde registry lookup tests
  - [ ] Room process creation tests
  - [ ] Cross-node message sending
  - [ ] Failure/restart scenarios

**Acceptance Criteria:**
- [ ] Rooms register and are discoverable
- [ ] Can send messages to rooms on other nodes
- [ ] Room processes restart on failure
- [ ] State persists across restarts
- [ ] Horde rebalances on cluster changes
- [ ] All tests passing

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-001, CHAT-005
**Status:** PENDING

---

### CHAT-007: Phoenix.PubSub & Presence

**Description:** Configure cluster-wide PubSub and presence tracking.

**Requirements:**
- [ ] Configure Phoenix.PubSub:
  - [ ] Use `:pg` (process groups) adapter
  - [ ] Name as `Nbhd.PubSub`
  - [ ] Enable cluster-wide subscriptions
- [ ] Define PubSub topics:
  - [ ] `room:{room_id}` - Messages in room
  - [ ] `user:{did}` - DMs / notifications
  - [ ] `presence:{room_id}` - Presence events
  - [ ] `federation:{peer_node}` - Federation events
  - [ ] `system:broadcast` - Admin events
- [ ] Create `NbhdWeb.Presence` module:
  - [ ] Use Phoenix.Presence with CRDT tracking
  - [ ] Track user presence in rooms
  - [ ] Handle join/leave events
  - [ ] Eventually consistent across cluster
- [ ] Integration with Room.Server:
  - [ ] Publish messages to room topic
  - [ ] Subscribe to remote room messages
  - [ ] Update local state on remote events
- [ ] Phoenix Channel implementation:
  - [ ] Create `RoomChannel`
  - [ ] Handle join/leave
  - [ ] Handle message broadcasting
  - [ ] Track presence
  - [ ] WebSocket integration
- [ ] Testing:
  - [ ] PubSub topic tests
  - [ ] Presence tracking tests
  - [ ] Cross-node broadcasting tests
  - [ ] Channel join/leave tests

**Acceptance Criteria:**
- [ ] PubSub broadcasts across cluster
- [ ] Presence tracks users in real-time
- [ ] Messages broadcast to all subscribers
- [ ] Presence reconciles after network partition
- [ ] Channels handle WebSocket connections

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-006
**Status:** PENDING

---

### CHAT-008: Neighborhood Subdomain Routing & DNS Handles

**Description:** Implement DNS handle verification and subdomain-based neighborhood routing.

**Requirements:**
- [ ] DNS handle verification:
  - [ ] Create TXT record format: `_atproto.{nbhd}.nbhd.city` = `did={user_did}`
  - [ ] Implement DNS lookup for handle verification
  - [ ] Cache verified handles (with TTL)
  - [ ] Reject unverified handles
- [ ] DID Document generation:
  - [ ] Create `did:web:{nbhd}.nbhd.city` DID Document
  - [ ] Expose at `https://{nbhd}.nbhd.city/.well-known/did.json`
  - [ ] Include public keys for signing
  - [ ] Include service endpoints (XRPC, firehose)
- [ ] Subdomain routing:
  - [ ] Wildcard DNS: `*.nbhd.city` → load balancer
  - [ ] Extract subdomain (neighborhood) from Host header
  - [ ] Route requests to appropriate neighborhood handler
  - [ ] Validate neighborhood exists
- [ ] Handle resolution:
  - [ ] Map `ben.boise.nbhd.city` → user DID
  - [ ] Verify via DNS TXT record
  - [ ] Cache results
  - [ ] Return 404 for invalid handles
- [ ] Configuration:
  - [ ] Environment variables for root domain
  - [ ] Per-neighborhood configuration
  - [ ] DNS provider integration (optional automation)
- [ ] Testing:
  - [ ] Handle resolution tests
  - [ ] Subdomain routing tests
  - [ ] DID Document generation tests
  - [ ] DNS verification tests

**Acceptance Criteria:**
- [ ] Handles resolve correctly
- [ ] Subdomain routing works
- [ ] DID Documents valid and fetchable
- [ ] DNS verification enforced
- [ ] All tests passing

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-004, CHAT-006
**Status:** PENDING

---

### CHAT-009: Peer PDS Federation (Node-to-Node)

**Description:** Implement federation between two or more nbhd.city PDS nodes.

**Requirements:**
- [ ] Peer discovery:
  - [ ] Configure peer PDSes in runtime config
  - [ ] Validate peer certificates (HTTPS)
  - [ ] Establish connections on startup
  - [ ] Monitor peer health
- [ ] Message bridging:
  - [ ] Subscribe to rooms that have `federatedWith` URIs
  - [ ] Forward local messages to peer rooms
  - [ ] Receive remote messages via firehose consumer
  - [ ] Prevent message loops (track origins)
- [ ] User resolution across PDSes:
  - [ ] Resolve users from peer DIDs
  - [ ] Cache user profiles
  - [ ] Handle missing users gracefully
- [ ] Firehose subscriptions:
  - [ ] Connect to peer firehose
  - [ ] Subscribe to relevant collections
  - [ ] Maintain separate cursor per peer
- [ ] Testing:
  - [ ] Two-node federation setup
  - [ ] Message delivery between nodes
  - [ ] User resolution across nodes
  - [ ] Failure/recovery scenarios

**Acceptance Criteria:**
- [ ] Two nbhd.city nodes can federate
- [ ] Messages sync between nodes
- [ ] User profiles accessible across nodes
- [ ] Firehose connections stable
- [ ] Tests pass with multi-node setup

**Type:** Backend (Elixir)
**Estimate:** L
**Depends On:** CHAT-005, CHAT-008
**Status:** PENDING

---

### CHAT-010: Frontend - Chat UI (React Components)

**Description:** Create React components for chat interface.

**Requirements:**
- [ ] Create `ChatInterface.jsx`:
  - [ ] Room list sidebar
  - [ ] Message thread view
  - [ ] Message input box
  - [ ] User presence/members list
  - [ ] Real-time message updates
- [ ] Create `RoomList.jsx`:
  - [ ] List all rooms user is in
  - [ ] Unread message counts
  - [ ] Room search
  - [ ] Create room button
  - [ ] Join room button
- [ ] Create `MessageThread.jsx`:
  - [ ] Scrollable message history
  - [ ] Auto-scroll to latest message
  - [ ] Message timestamps
  - [ ] User avatars
  - [ ] Hover actions (edit, delete, reply)
- [ ] Create `MessageInput.jsx`:
  - [ ] Text input with markdown preview
  - [ ] Send button
  - [ ] Emoji picker (optional)
  - [ ] File upload (future)
  - [ ] Message drafts (auto-save)
- [ ] Create `MemberList.jsx`:
  - [ ] Show online members
  - [ ] User profiles on hover
  - [ ] Status indicators (online/idle/offline)
- [ ] WebSocket integration:
  - [ ] Connect to Phoenix Channel
  - [ ] Join room channel
  - [ ] Listen for new messages
  - [ ] Send messages via channel
  - [ ] Handle disconnections
- [ ] Styling:
  - [ ] Dark mode support
  - [ ] Mobile responsive
  - [ ] Accessibility (WCAG)
- [ ] Testing:
  - [ ] Component render tests
  - [ ] WebSocket integration tests
  - [ ] User interaction tests

**Acceptance Criteria:**
- [ ] Chat UI renders correctly
- [ ] Messages display in real-time
- [ ] Users can send/receive messages
- [ ] Member list shows online users
- [ ] Mobile layout responsive
- [ ] All tests passing

**Type:** Frontend (React)
**Estimate:** L
**Depends On:** CHAT-007
**Status:** PENDING

---

### CHAT-011: User Authentication & Authorization

**Description:** Implement AT Protocol JWT authentication for chat system.

**Requirements:**
- [ ] JWT token generation:
  - [ ] Create tokens after user login (via Bluesky OAuth)
  - [ ] Include user DID and signing key in token
  - [ ] Token expiration (24-48 hours)
  - [ ] Sign tokens with app secret
- [ ] JWT verification:
  - [ ] Verify token signature
  - [ ] Check expiration
  - [ ] Extract DID from token
  - [ ] Implement as Phoenix Plug
- [ ] Authorization rules:
  - [ ] User can only send messages as themselves
  - [ ] User can only read messages in rooms they're in
  - [ ] Moderators can delete messages
  - [ ] Room owners can manage members
- [ ] Integration with OAuth:
  - [ ] Reuse existing Bluesky OAuth
  - [ ] Generate JWT on successful login
  - [ ] Refresh tokens (optional)
- [ ] Session management:
  - [ ] Store active tokens in ETS
  - [ ] Invalidate on logout
  - [ ] Revoke on password change (future)
- [ ] Testing:
  - [ ] Token generation and verification
  - [ ] Authorization rule tests
  - [ ] Permission tests

**Acceptance Criteria:**
- [ ] JWTs generated and verified
- [ ] Authorization enforced
- [ ] Tokens expire correctly
- [ ] Unauthorized access prevented
- [ ] All tests passing

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-006
**Status:** PENDING

---

### CHAT-012: Room Management & Moderation

**Description:** Implement room creation, membership, and moderation features.

**Requirements:**
- [ ] Room creation:
  - [ ] Create app.nbhd.chat.room record
  - [ ] Owner is creator
  - [ ] Set visibility: public, neighborhood, invite
  - [ ] Initialize GenServer process via Horde
- [ ] Membership management:
  - [ ] Add/remove members
  - [ ] Store member roles (owner, moderator, member)
  - [ ] Track join date/time
  - [ ] Generate invite links (optional)
- [ ] Room settings:
  - [ ] Update name, description
  - [ ] Change visibility
  - [ ] Set/update avatar
  - [ ] Pin messages
  - [ ] Archive rooms
- [ ] Moderation features:
  - [ ] Delete messages (by moderator/owner)
  - [ ] Mute users (temporary silence)
  - [ ] Ban users (remove from room)
  - [ ] Edit/delete room
- [ ] API endpoints:
  - [ ] `POST /xrpc/app.nbhd.chat.createRoom`
  - [ ] `PUT /xrpc/app.nbhd.chat.updateRoom`
  - [ ] `DELETE /xrpc/app.nbhd.chat.deleteRoom`
  - [ ] `POST /xrpc/app.nbhd.chat.addMember`
  - [ ] `DELETE /xrpc/app.nbhd.chat.removeMember`
- [ ] Database schema:
  - [ ] Rooms table
  - [ ] Members table (with roles)
  - [ ] Moderation log
- [ ] Testing:
  - [ ] Room creation/deletion
  - [ ] Member management
  - [ ] Authorization checks
  - [ ] Moderation actions

**Acceptance Criteria:**
- [ ] Rooms can be created and deleted
- [ ] Members can be added/removed
- [ ] Roles enforced correctly
- [ ] Moderators can delete messages
- [ ] All operations audit-logged
- [ ] Tests passing

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-006, CHAT-011
**Status:** PENDING

---

### CHAT-013: Message History & Search

**Description:** Implement persistent message history with search capabilities.

**Requirements:**
- [ ] Message persistence:
  - [ ] Store all messages in PostgreSQL
  - [ ] Index by room_id, created_at
  - [ ] Paginate history retrieval
  - [ ] Support last N messages query
- [ ] Message search:
  - [ ] Full-text search on message text
  - [ ] Filter by author
  - [ ] Filter by date range
  - [ ] Filter by room
  - [ ] Search API endpoint
- [ ] History retrieval:
  - [ ] `GET /xrpc/app.nbhd.chat.getMessages?room={uri}&limit=50&cursor={cursor}`
  - [ ] Return paginated results
  - [ ] Support cursor-based pagination
- [ ] Database optimizations:
  - [ ] Index on (room_id, created_at)
  - [ ] Partial indexes for recent messages
  - [ ] Archive old messages (optional)
- [ ] Performance:
  - [ ] History retrieval < 500ms
  - [ ] Search < 1 second for typical queries
  - [ ] Support rooms with 100k+ messages
- [ ] Testing:
  - [ ] Message persistence tests
  - [ ] Pagination tests
  - [ ] Search tests
  - [ ] Performance tests

**Acceptance Criteria:**
- [ ] Messages persist correctly
- [ ] History retrievable
- [ ] Search works efficiently
- [ ] Pagination stable
- [ ] Tests passing

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-006
**Status:** PENDING

---

### CHAT-014: Integration with Blog Sites (AT Protocol Bridge)

**Description:** Create bridge between blog posts and chat system using AT Protocol records.

**Requirements:**
- [ ] Reference blog posts in chat:
  - [ ] Chat messages can reference blog post URIs
  - [ ] Create facets for post links
  - [ ] Render blog previews in chat (title, excerpt, link)
- [ ] Shared AT Protocol storage:
  - [ ] Blog posts stored as app.nbhd.blog.post records
  - [ ] Chat messages stored as app.nbhd.chat.message records
  - [ ] Both use same repo store and DID system
  - [ ] Cross-reference via at:// URIs
- [ ] Notification bridge (future):
  - [ ] Blog post published → notify in relevant rooms
  - [ ] Chat mentions → notify mentioned users
- [ ] Data model:
  - [ ] Messages can embed blog post references
  - [ ] Generate facets for embedded links
  - [ ] Store as structured data
- [ ] API integration:
  - [ ] Blog endpoints accessible from chat frontend
  - [ ] Chat context available on blog pages
  - [ ] Bidirectional linking
- [ ] Testing:
  - [ ] Blog reference linking
  - [ ] Facet generation
  - [ ] URI resolution

**Acceptance Criteria:**
- [ ] Chat can reference blog posts
- [ ] Links render with previews
- [ ] Facets valid and clickable
- [ ] Integration tests passing

**Type:** Backend (Elixir / Integration)
**Estimate:** M
**Depends On:** CHAT-006, Blog Phases complete
**Status:** PENDING

---

### CHAT-015: Rate Limiting & Abuse Prevention

**Description:** Implement rate limiting and spam prevention.

**Requirements:**
- [ ] Rate limiting:
  - [ ] Per-DID message rate limit (messages per minute)
  - [ ] Per-room flood protection
  - [ ] Per-IP connection rate limit
  - [ ] Configurable limits per room type
- [ ] Spam detection:
  - [ ] Duplicate message detection
  - [ ] Repeated mentions detection
  - [ ] Link spam filters
  - [ ] Suspicious patterns (future ML)
- [ ] Throttling strategies:
  - [ ] Implement Plug middleware
  - [ ] Use ETS for fast lookup
  - [ ] Exponential backoff for violators
  - [ ] Automatic unblock after timeout
- [ ] Moderation:
  - [ ] Flag suspicious messages
  - [ ] Manual review queue
  - [ ] Auto-delete spam (configurable)
  - [ ] Ban repeat offenders
- [ ] Monitoring:
  - [ ] Track rate limit violations
  - [ ] Alert on unusual patterns
  - [ ] Dashboard for abuse stats
- [ ] Testing:
  - [ ] Rate limit enforcement
  - [ ] Bypass for trusted users
  - [ ] Recovery from blocks

**Acceptance Criteria:**
- [ ] Rate limits enforced
- [ ] Spam prevented
- [ ] Legitimate users not blocked
- [ ] Patterns logged
- [ ] Tests passing

**Type:** Backend (Elixir)
**Estimate:** M
**Depends On:** CHAT-007
**Status:** PENDING

---

### CHAT-016: Firehose for Bluesky Integration (Optional)

**Description:** Publish nbhd.city chat to Bluesky firehose (optional interop).

**Requirements:**
- [ ] Broadcasting to Bluesky:
  - [ ] Publish app.nbhd.chat.message events to Bluesky relay (if enabled)
  - [ ] Subscribe to Bluesky firehose for Bluesky users in rooms
  - [ ] Sync messages bidirectionally
- [ ] Federation with Bluesky:
  - [ ] Bluesky users can access rooms via AT Protocol
  - [ ] nbhd.city users see Bluesky users' posts
  - [ ] Identity maintained across platforms
- [ ] Lexicon alignment:
  - [ ] Consider adopting shared chat Lexicons if they emerge
  - [ ] Maintain app.nbhd.* namespace for now
- [ ] Implementation (Phase 2):
  - [ ] Emit room events to Bluesky firehose
  - [ ] Handle Bluesky PDS integration
  - [ ] Test cross-platform messaging
- [ ] Testing:
  - [ ] Bluesky user participation
  - [ ] Event emission tests
  - [ ] Message sync tests

**Acceptance Criteria:**
- [ ] Events broadcast to Bluesky
- [ ] Bluesky users can participate
- [ ] Messages sync reliably
- [ ] Tests passing

**Type:** Backend (Elixir / Federation)
**Estimate:** L
**Depends On:** CHAT-005, CHAT-009
**Status:** PENDING

---

### CHAT-017: Admin Dashboard for Chat Management

**Description:** Create admin UI for managing rooms, users, and moderation.

**Requirements:**
- [ ] Create `AdminChatDashboard.jsx`:
  - [ ] Room management interface
  - [ ] User management interface
  - [ ] Moderation queue
  - [ ] Activity logs
  - [ ] System status
- [ ] Room management:
  - [ ] List all rooms
  - [ ] Edit room settings
  - [ ] Delete/archive rooms
  - [ ] Manage members
  - [ ] View usage stats
- [ ] User management:
  - [ ] List active users
  - [ ] View user profiles
  - [ ] Ban/unban users
  - [ ] View user activity
  - [ ] Message history per user
- [ ] Moderation queue:
  - [ ] Flagged messages for review
  - [ ] Approve/delete messages
  - [ ] Ban users from queue
  - [ ] Add to watchlist
- [ ] Logs & monitoring:
  - [ ] Activity logs (joins, messages, deletions)
  - [ ] Error logs
  - [ ] System events
  - [ ] Real-time metrics
- [ ] Backend APIs:
  - [ ] `/admin/chat/rooms` - List/manage rooms
  - [ ] `/admin/chat/users` - List/manage users
  - [ ] `/admin/chat/moderation` - Moderation queue
  - [ ] `/admin/chat/logs` - Activity logs
- [ ] Authorization:
  - [ ] Only admins can access dashboard
  - [ ] Role-based permissions
  - [ ] Audit log for admin actions

**Acceptance Criteria:**
- [ ] Dashboard loads all admin features
- [ ] Room management works
- [ ] User management works
- [ ] Moderation queue functional
- [ ] Logs accessible
- [ ] Authorization enforced

**Type:** Frontend + Backend
**Estimate:** L
**Depends On:** CHAT-012
**Status:** PENDING

---

### CHAT-018: Typing Indicators & Read Receipts

**Description:** Implement real-time typing indicators and message read receipts.

**Requirements:**
- [ ] Typing indicators:
  - [ ] Client sends "typing" event every 1 second while typing
  - [ ] Server broadcasts to room subscribers
  - [ ] Display "X is typing..." in UI
  - [ ] Auto-clear after 3 seconds of inactivity
- [ ] Read receipts:
  - [ ] Track which users have read each message
  - [ ] Client sends "read" event when message visible
  - [ ] Server broadcasts to message sender
  - [ ] Show read status in UI (checkmarks, etc.)
  - [ ] Optional privacy: allow disabling read receipts
- [ ] Implementation:
  - [ ] Use Phoenix Channels for events
  - [ ] Minimal bandwidth (just IDs and timestamps)
  - [ ] Debounce typing events (max 1/sec)
  - [ ] Clean up old events
- [ ] UI indicators:
  - [ ] Show typing status below message input
  - [ ] Show read receipts on messages
  - [ ] Graceful degradation if disabled
- [ ] Testing:
  - [ ] Typing indicator tests
  - [ ] Read receipt tests
  - [ ] Privacy setting tests

**Acceptance Criteria:**
- [ ] Typing indicators display
- [ ] Read receipts show
- [ ] Not too noisy (debounced)
- [ ] Privacy respected
- [ ] Tests passing

**Type:** Frontend + Backend
**Estimate:** M
**Depends On:** CHAT-010
**Status:** PENDING

---

### CHAT-019: Emoji Reactions & Message Threading

**Description:** Add emoji reactions and threaded replies to messages.

**Requirements:**
- [ ] Emoji reactions:
  - [ ] React to messages with emoji
  - [ ] Store reactions in separate records
  - [ ] Display reaction counts on messages
  - [ ] Remove/toggle reactions
  - [ ] Show who reacted (hover tooltip)
- [ ] Message threading:
  - [ ] Reply to specific message (reference via rkey)
  - [ ] Show thread context
  - [ ] Thread preview in main conversation
  - [ ] Full thread view (click to expand)
  - [ ] Notification for thread replies
- [ ] Data model:
  - [ ] `replyTo` field in message records
  - [ ] Separate reactions records (optional)
  - [ ] Thread aggregation query
- [ ] API endpoints:
  - [ ] `POST /xrpc/app.nbhd.chat.addReaction`
  - [ ] `DELETE /xrpc/app.nbhd.chat.removeReaction`
  - [ ] `GET /xrpc/app.nbhd.chat.getThread`
- [ ] UI components:
  - [ ] Reaction picker (emoji selector)
  - [ ] Reaction display
  - [ ] Thread view component
  - [ ] Thread notifications
- [ ] Testing:
  - [ ] Reaction tests
  - [ ] Threading tests
  - [ ] Thread notification tests

**Acceptance Criteria:**
- [ ] Reactions work correctly
- [ ] Thread replies create links
- [ ] Thread view shows context
- [ ] Notifications work
- [ ] Tests passing

**Type:** Frontend + Backend
**Estimate:** M
**Depends On:** CHAT-006, CHAT-010
**Status:** PENDING

---

### CHAT-020: Direct Messages (DM System)

**Description:** Implement private one-to-one direct messaging.

**Requirements:**
- [ ] DM creation:
  - [ ] Start DM with any user (by DID)
  - [ ] Store DM room records with special type
  - [ ] Mark as private (visibility: "private")
- [ ] DM interface:
  - [ ] DM list in sidebar
  - [ ] Notification on new DM
  - [ ] One-to-one chat interface
  - [ ] Mark as read/unread
- [ ] Security:
  - [ ] Only participants can view DM
  - [ ] No indexing in public search
  - [ ] Optional end-to-end encryption (future)
- [ ] Data model:
  - [ ] DM rooms with special marker
  - [ ] Store both DIDs in record
  - [ ] Messages same format as room messages
- [ ] API endpoints:
  - [ ] `POST /xrpc/app.nbhd.chat.createDM` - Start DM
  - [ ] `GET /xrpc/app.nbhd.chat.listDMs` - List DMs
- [ ] UI:
  - [ ] DM list component
  - [ ] DM chat interface
  - [ ] Notifications
  - [ ] Archive DMs
- [ ] Testing:
  - [ ] DM creation and messaging
  - [ ] Privacy enforcement
  - [ ] Notification tests

**Acceptance Criteria:**
- [ ] DMs created successfully
- [ ] Only participants can view
- [ ] Messages delivered
- [ ] Notifications work
- [ ] Tests passing

**Type:** Frontend + Backend
**Estimate:** M
**Depends On:** CHAT-010
**Status:** PENDING

---

### CHAT-021: Performance & Scaling Tests

**Description:** Comprehensive performance and load testing.

**Requirements:**
- [ ] Load testing:
  - [ ] 100 concurrent users in one room
  - [ ] 1000+ concurrent connections cluster-wide
  - [ ] Message throughput (messages/sec)
  - [ ] Latency tracking (p50, p95, p99)
- [ ] Stress testing:
  - [ ] Sustained high load (30+ minutes)
  - [ ] Burst traffic patterns
  - [ ] Node failure scenarios
  - [ ] Network partition scenarios
- [ ] Benchmarks:
  - [ ] Message send latency < 500ms (p95)
  - [ ] Room list load < 200ms
  - [ ] History retrieval < 500ms
  - [ ] Throughput > 1000 msgs/sec per node
- [ ] Resource usage:
  - [ ] Memory per room process
  - [ ] CPU utilization
  - [ ] Network bandwidth
  - [ ] Database connection pooling
- [ ] Tools:
  - [ ] Load testing framework (Gatling, Locust, or custom)
  - [ ] Metrics collection (Prometheus)
  - [ ] Flame graphs for profiling
- [ ] Results documentation:
  - [ ] Report with findings
  - [ ] Bottleneck analysis
  - [ ] Optimization recommendations

**Acceptance Criteria:**
- [ ] Load tests complete successfully
- [ ] Latency within targets
- [ ] No memory leaks
- [ ] System stable under stress
- [ ] Report documented

**Type:** Testing (Backend)
**Estimate:** L
**Depends On:** CHAT-006, CHAT-007
**Status:** PENDING

---

### CHAT-022: Monitoring & Observability

**Description:** Implement comprehensive monitoring, metrics, and logging.

**Requirements:**
- [ ] Metrics collection:
  - [ ] Prometheus metrics export
  - [ ] Message counts per room
  - [ ] Active user counts
  - [ ] Connection counts
  - [ ] Error rates
  - [ ] Latency histograms
- [ ] Logging:
  - [ ] Structured JSON logging
  - [ ] Log levels (debug, info, warn, error)
  - [ ] Correlation IDs for request tracing
  - [ ] Log aggregation support
- [ ] Distributed tracing:
  - [ ] OpenTelemetry integration (optional)
  - [ ] Trace full request flow
  - [ ] Cross-node tracing
- [ ] Health checks:
  - [ ] `/health` endpoint (basic)
  - [ ] `/ready` endpoint (dependencies)
  - [ ] Dependency health (Postgres, firehose)
  - [ ] Cluster health check
- [ ] Alerts:
  - [ ] High error rate alert
  - [ ] High latency alert
  - [ ] Node failure alert
  - [ ] Memory/CPU threshold alerts
- [ ] Dashboard:
  - [ ] Grafana integration (optional)
  - [ ] Key metrics visualization
  - [ ] Alert status view
- [ ] Testing:
  - [ ] Metrics accuracy tests
  - [ ] Logging completeness tests

**Acceptance Criteria:**
- [ ] All metrics exported
- [ ] Logging comprehensive
- [ ] Health checks functional
- [ ] Alerts firing correctly
- [ ] Dashboard shows key metrics

**Type:** Backend (DevOps)
**Estimate:** M
**Depends On:** CHAT-007
**Status:** PENDING

---

### CHAT-023: Documentation & API Reference

**Description:** Comprehensive documentation of chat system architecture and APIs.

**Requirements:**
- [ ] Architecture documentation:
  - [ ] System overview diagram
  - [ ] Component descriptions
  - [ ] Data flow diagrams
  - [ ] Deployment architecture
- [ ] API reference:
  - [ ] XRPC endpoints documented
  - [ ] Request/response examples
  - [ ] Error codes and meanings
  - [ ] Rate limits documented
- [ ] Developer guide:
  - [ ] Local setup instructions
  - [ ] Running tests
  - [ ] Common tasks (add room, send message, etc.)
  - [ ] Debugging tips
- [ ] Deployment guide:
  - [ ] Production deployment steps
  - [ ] Configuration reference
  - [ ] Scaling considerations
  - [ ] Backup/restore procedures
- [ ] User guide:
  - [ ] Chat UI walkthrough
  - [ ] Room creation/management
  - [ ] Privacy settings
  - [ ] Shortcuts and tips
- [ ] Troubleshooting guide:
  - [ ] Common issues and solutions
  - [ ] Log interpretation
  - [ ] Performance tuning

**Acceptance Criteria:**
- [ ] All components documented
- [ ] API fully referenced
- [ ] Setup instructions complete
- [ ] Deployment guide clear
- [ ] User guide comprehensive

**Type:** Documentation
**Estimate:** M
**Depends On:** All CHAT-* tickets
**Status:** PENDING

---

### CHAT-024: Integration Testing & E2E Workflows

**Description:** Comprehensive integration and end-to-end testing.

**Requirements:**
- [ ] Test scenarios:
  - [ ] User creates room
  - [ ] Multiple users join
  - [ ] Send/receive messages
  - [ ] Room federation (two nodes)
  - [ ] User goes offline/online
  - [ ] Node failure and recovery
  - [ ] Search in message history
  - [ ] Moderation actions
- [ ] Multi-node testing:
  - [ ] Start two Elixir nodes
  - [ ] Create rooms on each
  - [ ] Federate rooms
  - [ ] Message across nodes
  - [ ] Node failure scenarios
- [ ] Frontend integration:
  - [ ] UI sends messages
  - [ ] Messages display
  - [ ] Presence updates
  - [ ] Typing indicators
  - [ ] Reactions work
- [ ] Performance tests:
  - [ ] Load test (100+ users)
  - [ ] Measure latencies
  - [ ] Monitor resources
- [ ] Tools:
  - [ ] ExUnit for unit tests
  - [ ] LiveBook for exploratory testing
  - [ ] Custom test utilities

**Acceptance Criteria:**
- [ ] All scenarios pass
- [ ] Multi-node federation works
- [ ] Frontend/backend integration solid
- [ ] Performance targets met
- [ ] CI pipeline green

**Type:** Testing
**Estimate:** L
**Depends On:** All CHAT-* core tickets
**Status:** PENDING

---

### CHAT-025: Deployment & DevOps Setup

**Description:** Configure production deployment, Docker, Kubernetes, and CI/CD.

**Requirements:**
- [ ] Docker:
  - [ ] Create Dockerfile for Elixir app
  - [ ] Multi-stage build for optimization
  - [ ] Health checks in image
  - [ ] Docker Compose for local dev
- [ ] Kubernetes:
  - [ ] Deployment manifest
  - [ ] StatefulSet for clustering
  - [ ] Service definitions
  - [ ] ConfigMaps and Secrets
  - [ ] Persistent volumes (Postgres)
  - [ ] Resource requests/limits
- [ ] CI/CD:
  - [ ] GitHub Actions workflow
  - [ ] Run tests on PR
  - [ ] Build Docker image
  - [ ] Push to registry
  - [ ] Deploy to staging/prod
- [ ] Infrastructure:
  - [ ] Terraform for AWS/cloud
  - [ ] RDS PostgreSQL setup
  - [ ] Load balancer configuration
  - [ ] SSL certificates
  - [ ] DNS setup
- [ ] Monitoring:
  - [ ] Prometheus scrape config
  - [ ] Grafana dashboards
  - [ ] Alert rules
  - [ ] Log shipping (ELK or similar)
- [ ] Secrets management:
  - [ ] Environment variables
  - [ ] SSL certificates
  - [ ] Database credentials
  - [ ] Signing keys
- [ ] Documentation:
  - [ ] Deployment runbook
  - [ ] Scaling procedures
  - [ ] Backup procedures
  - [ ] Disaster recovery

**Acceptance Criteria:**
- [ ] Docker image builds successfully
- [ ] Kubernetes manifests valid
- [ ] CI/CD pipeline runs
- [ ] Deployment to staging works
- [ ] Monitoring operational
- [ ] Documentation complete

**Type:** DevOps
**Estimate:** L
**Depends On:** All CHAT-* tickets
**Status:** PENDING

---

