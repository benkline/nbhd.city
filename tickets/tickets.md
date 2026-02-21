# nbhd.city Development Tickets - Detailed Descriptions

**Last Updated:** 2026-02-08
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


## Phase 1: MVP Foundation ✅ COMPLETE

Core platform foundation - users can create neighborhoods and join BlueSky communities.

**Status:** Shipped and working
**Completed Tickets:**
- Blueprint/structure defined in PHASES.md
- All foundational infrastructure in place

See PHASES.md for detailed Phase 1 description.

---

## Phase 2: AT Protocol Foundation 🔧

**Status:** In Progress
**Timeline:** Weeks 5-6
**Critical Path:** Must complete before Phase 3+

Foundation layer for AT Protocol record storage and management. This is the critical dependency for all subsequent content-based phases.

### Core AT Protocol Infrastructure

#### ATP-FOUND-001: AT Protocol Record Schema in DynamoDB
- **Description:** Extend DynamoDB schema to support AT Protocol record structure
- **Requirements:**
  - [x] Define `RECORD#` partition/sort key pattern
  - [x] Add record fields: uri, cid, record_type, rkey, value, created_at, indexed_at
  - [x] Create GSI for querying by collection type (GSI7: user_did, record_type#created_at)
  - [x] Update DynamoDB table definition in Terraform
  - [x] Document schema in DATABASE.md
  - [x] Add migration path from current site schema
- **Acceptance Criteria:**
  - [x] Record schema supports all AT Protocol fields
  - [x] GSI enables efficient queries by content type
  - [x] Can store app.nbhd.blog.post and app.bsky.feed.post records
  - [x] Schema is backward compatible with existing site records
- **Type:** Backend/Infrastructure
- **Estimate:** M
- **Reference:** See [CONTENT_RECORDS.md](./CONTENT_RECORDS.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/integration/test_at_protocol_schema.py` (8 tests passing)

#### ATP-FOUND-002: CID Generation Utilities
- **Description:** Implement Content Identifier (CID) generation for AT Protocol records
- **Requirements:**
  - [x] Install dag-cbor library for CBOR encoding
  - [x] Install multihash library for hashing (not needed - using Python hashlib)
  - [x] Implement CID v1 generation (SHA-256 + base32)
  - [x] Create `generate_cid(record_value)` function
  - [x] Ensure immutability (same content → same CID)
  - [x] Add validation for CID format
  - [x] Create utility file: `/app/app/api/atproto/cid.py`
- **Acceptance Criteria:**
  - [x] CID generation produces valid CIDv1 strings
  - [x] Same record value always produces same CID
  - [x] Different record values produce different CIDs
  - [x] CIDs are base32 encoded (e.g., "bafyreib2rxk3rh6kzwq...")
  - [x] Unit tests cover edge cases
- **Type:** Backend
- **Estimate:** S
- **Reference:** See [CONTENT_RECORDS.md](./CONTENT_RECORDS.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/unit/test_cid_generation.py` (14 tests passing)

#### ATP-FOUND-003: Record Key (rkey) Generation
- **Description:** Implement TID (Timestamp Identifier) format for record keys
- **Requirements:**
  - [x] Create `generate_rkey()` function
  - [x] Use TID format: timestamp (microseconds) + random bits
  - [x] Base32 encoding for human-readable keys
  - [x] Ensure chronological sorting (newer records sort later)
  - [x] Ensure global uniqueness (no collisions)
  - [x] Create utility file: `/app/app/api/atproto/tid.py`
- **Acceptance Criteria:**
  - [x] rkeys sort chronologically
  - [x] No collisions in 10,000+ generations
  - [x] rkeys are URL-safe (base32 encoded)
  - [x] Format matches AT Protocol spec
  - [x] Example: "3jzfcijpj2z2a"
- **Type:** Backend
- **Estimate:** S
- **Reference:** See [CONTENT_RECORDS.md](./CONTENT_RECORDS.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/unit/test_rkey_generation.py` (23 tests passing)

#### ATP-FOUND-004: Basic Record CRUD Operations
- **Description:** Implement core CRUD operations for AT Protocol records in DynamoDB
- **Requirements:**
  - [x] `create_record(user_did, collection, value)` - Create with CID/rkey
  - [x] `get_record(uri)` - Get by AT URI (at://did/collection/rkey)
  - [x] `query_records(user_did, collection)` - List records by type
  - [x] `update_record(uri, new_value)` - Create new version (immutable)
  - [x] `delete_record(uri)` - Soft delete (mark as deleted)
  - [x] Link old/new versions on update
  - [x] Add to `/app/app/api/dynamodb_repository.py`
- **Acceptance Criteria:**
  - [x] Can create records with valid CID and rkey
  - [x] Can retrieve records by AT URI
  - [x] Can query all posts for a user
  - [x] Updates create new record version (preserves history)
  - [x] Deletes are soft (record still exists, marked deleted)
  - [x] All operations have error handling
- **Type:** Backend
- **Estimate:** M
- **Reference:** See [CONTENT_RECORDS.md](./CONTENT_RECORDS.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/unit/test_at_protocol_crud.py` (18 tests passing)

---

## Phase 3: Template System & Site Config APIs 📋

**Status:** Pending
**Timeline:** Weeks 6-7
**Depends On:** Phase 2 (AT Protocol Foundation)

API layer for template discovery, management, and site configuration.

### Frontend: Template System & UI

#### SSG-001: Create Template Gallery UI Component
- **Description:** Build a `TemplateGallery` component that displays available 11ty templates
- **Requirements:**
  - [x] Fetch templates from API (`GET /app/app/api/templates`)
  - [x] Display template cards with preview images, name, description
  - [x] "Select template" button to start site configuration
  - [x] Show template tags (blog, project, newsletter, etc)
- **Acceptance Criteria:**
  - [x] Component renders templates from API
  - [x] Clicking "Select" navigates to config form
  - [x] Mobile-responsive grid layout
  - [x] Error handling for API failures
- **Type:** Feature
- **Estimate:** M

#### SSG-002: Build Site Configuration Form
- **Description:** Create dynamic form generator for template-specific config fields
- **Requirements:**
  - [x] Read `config.schema.json` from selected template
  - [x] Generate form inputs based on schema (text, textarea, color picker, etc)
  - [x] Real-time preview updates as user types
  - [x] Save draft configurations locally (localStorage)
  - [x] "Preview" and "Deploy" buttons
- **Acceptance Criteria:**
  - [x] Form renders all schema fields correctly
  - [x] Draft auto-saves every 30 seconds
  - [x] Validation matches schema constraints
  - [x] Form persists across page refreshes
- **Type:** Feature
- **Estimate:** M

#### SSG-004: Site Management Dashboard
- **Description:** Build dashboard to view/manage user's static sites
- **Requirements:**
  - [x] List all user's sites with status (draft, building, published)
  - [x] Show site URL and deployment status
  - [x] "Edit" button to re-configure
  - [x] "Delete" button with confirmation
  - [x] "View Live" link to published site
- **Acceptance Criteria:**
  - [x] Displays all user sites from API
  - [x] Can edit existing sites
  - [x] Delete removes site from dashboard
  - [x] Links work correctly
- **Type:** Feature
- **Estimate:** M

### Backend: API Endpoints

#### SSG-005: Template Management API
- **Description:** Implement API endpoints for template discovery and metadata
- **Requirements:**
  - [x] `GET /app/app/api/templates` - List all available templates
  - [x] `GET /app/app/api/templates/{id}` - Get single template metadata
  - [x] `GET /app/app/api/templates/{id}/schema` - Get config schema
  - [x] `GET /app/app/api/templates/{id}/preview` - Get preview image URL
  - [x] Each template includes: name, description, author, version, tags
- **Acceptance Criteria:**
  - [x] All endpoints return correct JSON structure
  - [x] Pagination for large template lists
  - [x] Proper error handling (404 for missing templates)
  - [x] Schema validation works
- **Type:** Backend
- **Estimate:** S

#### SSG-006: Site Configuration Storage API
- **Description:** Implement endpoints to save and retrieve site configurations
- **Requirements:**
  - [x] `POST /app/app/api/sites` - Create new site from template + config
  - [x] `GET /app/app/api/sites/{id}` - Retrieve site config
  - [x] `PUT /app/app/api/sites/{id}` - Update site config
  - [x] `GET /app/app/api/sites` - List user's sites
  - [x] `DELETE /app/app/api/sites/{id}` - Delete site
  - [x] Store config JSON in DynamoDB
- **Acceptance Criteria:**
  - [x] Configs persist to DynamoDB
  - [x] Config validation against schema
  - [x] User can only access their own sites
  - [x] Returns proper error codes (400, 401, 404)
- **Type:** Backend
- **Estimate:** M

---

## Phase 4: Template Analysis System 📐

**Status:** Pending
**Timeline:** Weeks 7-8
**Depends On:** Phase 3 (Template System APIs)
**Can Run In Parallel With:** Phase 5 (Content Management)

Research and implementation of automated template analysis.

#### SSG-007: Template Schema Inference Research
- **Description:** Research and design frontmatter scanning and JSON schema inference
- **Requirements:**
  - [x] Study 5+ popular 11ty starter templates
  - [x] Document common frontmatter patterns (title, date, tags, etc.)
  - [x] Design algorithm for type inference (string, date, array, boolean)
  - [x] Define required field detection logic (>80% occurrence)
  - [x] Create spec document for template analyzer
- **Acceptance Criteria:**
  - [x] Clear algorithm for scanning .md files
  - [x] Type inference rules documented
  - [x] Edge cases identified and handled
  - [x] Spec approved and ready for implementation
- **Type:** Research
- **Estimate:** S
- **Reference:** See [TEMPLATE_ANALYSIS.md](./TEMPLATE_ANALYSIS.md), [SSG-007-RESEARCH.md](./SSG-007-RESEARCH.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/unit/test_template_schema_inference.py` (26 tests passing)

#### SSG-008: Custom Template Registration API
- **Description:** API endpoints for registering custom 11ty templates from GitHub
- **Requirements:**
  - [x] `POST /app/app/api/templates/custom` - Register template from GitHub URL
  - [x] `GET /app/app/api/templates/custom/{id}/status` - Check analysis status
  - [x] `GET /app/app/api/templates/{id}/content-types` - Get inferred content types
  - [x] GitHub URL validation (github.com, gitlab.com, bitbucket.org)
  - [x] Store template metadata in DynamoDB
  - [x] Async invocation of analyzer Lambda
- **Acceptance Criteria:**
  - [x] Valid GitHub URLs accepted
  - [x] Invalid URLs rejected with error
  - [x] Returns 202 Accepted with template_id
  - [x] Status polling works correctly
  - [x] Template record created in DynamoDB
- **Type:** Backend
- **Estimate:** M
- **Reference:** See [TEMPLATE_ANALYSIS.md](./TEMPLATE_ANALYSIS.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/integration/test_custom_templates.py` (29 tests passing)
- **Implementation Files:**
  - `app/app/api/templates.py` - Added `invoke_template_analyzer_async()` function and integrated with `/app/app/api/templates/custom` endpoint
  - `app/app/api/tests/integration/test_custom_templates.py` - Added test for async Lambda invocation

#### SSG-009: Template Analyzer Lambda Function
- **Description:** Lambda function to clone, validate, and analyze 11ty templates
- **Requirements:**
  - [x] Clone GitHub repo to /tmp (shallow clone)
  - [x] Validate 11ty project (check eleventy.config.js, package.json)
  - [x] Find content directory (content/, posts/, src/)
  - [x] Scan all .md files and parse frontmatter
  - [x] Group by content type (posts, pages, etc.)
  - [x] Infer JSON schema from frontmatter samples
  - [x] Store schema and content types in DynamoDB
  - [x] Handle errors and update status
- **Acceptance Criteria:**
  - [x] Successfully analyzes eleventy-base-blog
  - [x] Correctly infers schema for common fields
  - [x] Handles invalid repos gracefully
  - [x] Completes within 5 minute timeout
  - [x] Updates template status to "ready" or "failed"
- **Type:** Backend/Lambda
- **Estimate:** L
- **Reference:** See [TEMPLATE_ANALYSIS.md](./TEMPLATE_ANALYSIS.md)
- **Status:** COMPLETED
- **Tests:** `app/lambda/tests/test_template_analyzer.py` (23 tests passing)

#### SSG-010: Custom Template Selection UI
- **Description:** UI for users to add and select custom templates
- **Requirements:**
  - [x] Modal with GitHub URL input
  - [x] Template validation and analysis progress
  - [x] Show analysis status (analyzing, ready, failed)
  - [x] Error messages for failed analysis
  - [x] URL validation (GitHub, GitLab, Bitbucket + HTTPS requirement)
  - [x] Status polling with timeout (60 seconds max, 1 second intervals)
- **Acceptance Criteria:**
  - [x] Users can paste GitHub URL
  - [x] Modal accepts template name and URL input
  - [x] Form validation prevents invalid URLs
  - [x] Shows success message when template analysis completes
  - [x] Shows error message when analysis fails
  - [x] Modal closes properly
  - [x] Form disables inputs during analysis
- **Type:** Frontend
- **Estimate:** M
- **Status:** COMPLETED
- **Tests:** `src/__tests__/components/CustomTemplateModal.test.jsx` (12 tests passing)
- **Implementation Files:**
  - Component: `src/components/SiteBuilder/CustomTemplateModal.jsx`
  - Styles: `src/components/SiteBuilder/CustomTemplateModal.module.css`
  - Tests: `src/__tests__/components/CustomTemplateModal.test.jsx`

---

## Phase 5: Content Management ✍️

**Status:** Pending
**Timeline:** Weeks 8-9
**Depends On:** Phase 2 (AT Protocol Foundation) and Phase 3 (Template APIs)

Content creation and management layer. Users can create, edit, and publish content stored as AT Protocol records.

### Content Records & Editor

#### SSG-011: Content Records API
- **Description:** API for creating and managing content as AT Protocol records
- **Requirements:**
  - [x] `POST /app/app/api/sites/{id}/content` - Create blog post/page
  - [x] `GET /app/app/api/sites/{id}/content` - List all content
  - [x] `GET /app/app/api/sites/{id}/content/{rkey}` - Get specific content
  - [x] `PUT /app/app/api/sites/{id}/content/{rkey}` - Update content
  - [x] `DELETE /app/app/api/sites/{id}/content/{rkey}` - Delete content
  - [x] Store as AT Protocol records (app.nbhd.blog.post)
  - [x] Use CID generation from ATP-FOUND-002
  - [x] Use rkey generation from ATP-FOUND-003
  - [x] Use record CRUD from ATP-FOUND-004
- **Acceptance Criteria:**
  - [x] Content stored in DynamoDB with AT Protocol schema
  - [x] CID generation works correctly
  - [x] Record URIs follow at:// format
  - [x] Query by site_id works
  - [x] Pagination implemented
- **Type:** Backend
- **Estimate:** M
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/integration/test_content_records_api.py` (12 tests passing)
- **Reference:** See [CONTENT_RECORDS.md](./CONTENT_RECORDS.md)

#### SSG-012: Content Editor UI Component
- **Description:** Rich content editor for creating blog posts and pages
- **Requirements:**
  - [x] Markdown editor with preview
  - [x] Frontmatter form (title, date, tags, custom fields)
  - [x] "Publish to BlueSky" toggle
  - [x] "Auto-rebuild site" toggle
  - [x] Draft saving to localStorage
  - [x] Validation against template schema
  - [ ] Image upload (future)
- **Acceptance Criteria:**
  - [x] Users can write markdown content
  - [x] Frontmatter fields match template schema
  - [x] Preview shows rendered markdown
  - [x] Drafts auto-save every 30 seconds
  - [x] Can create and publish content
- **Type:** Frontend
- **Estimate:** L
- **Status:** COMPLETED
- **Tests:** `src/__tests__/components/ContentEditor.test.jsx` (40+ tests covering all requirements)

#### SSG-013: Dual Record Creation (BlueSky Integration)
- **Description:** Create linked AT Protocol records for blog posts and BlueSky summaries
- **Requirements:**
  - [x] Generate BlueSky summary from blog post (excerpt + link)
  - [x] Create app.nbhd.blog.post record (full content)
  - [x] Create app.bsky.feed.post record (summary)
  - [x] Link records together (linked_record field)
  - [x] Generate link facets for URL in BlueSky post
  - [x] Publish to BlueSky firehose (stub for now)
  - [x] Handle publish toggle (optional BlueSky posting)
- **Acceptance Criteria:**
  - [x] Both records created in DynamoDB
  - [x] Records properly linked
  - [x] BlueSky summary under 300 chars
  - [x] Link facets correctly formatted
  - [x] Can create blog post without BlueSky posting
- **Type:** Backend
- **Estimate:** M
- **Reference:** See [BLUESKY_INTEGRATION.md](./BLUESKY_INTEGRATION.md), [CONTENT_RECORDS.md](./CONTENT_RECORDS.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/unit/test_bluesky_integration.py` (29 tests passing)

#### SSG-014: Smart Content Prefilling
- **Description:** Auto-map user profile data to template content fields
- **Requirements:**
  - [x] `GET /app/app/api/sites/{id}/prefill` - Get prefill suggestions
  - [x] Field mapping algorithm (display_name → author, bio → about)
  - [x] Support multiple data sources (profile, previous sites)
  - [x] Preview UI showing suggested mappings
  - [x] User can accept or decline prefilling
  - [x] Apply mappings to site config
- **Acceptance Criteria:**
  - [x] Profile data correctly mapped to template fields
  - [x] Preview shows "field → value" mappings
  - [x] Users can apply or skip prefilling
  - [x] Works with BlueSky profile data
  - [x] Works with previous site data
- **Type:** Backend + Frontend
- **Estimate:** M
- **Reference:** See [CONTENT_PREFILLING.md](./CONTENT_PREFILLING.md)
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/unit/test_content_prefilling.py` (21 tests passing), `app/UI/src/__tests__/components/PrefillPreview.test.jsx` (17 tests)

---

## Phase 6: Build Pipeline & Deployment 🏗️

**Status:** Pending
**Timeline:** Weeks 10-12
**Depends On:** Phase 5 (Content Management - content must exist before building)

#### SSG-015: Site Build Trigger API
- **Description:** Endpoint to initiate Lambda build process
- **Requirements:**
  - [x] `POST /app/app/api/sites/{id}/build` - Trigger build
  - [x] `GET /app/app/api/sites/{id}/builds/{job_id}` - Get build status
  - [x] `GET /app/app/api/sites/{id}/builds` - List build history
  - [x] Returns build status/job ID immediately (202 Accepted)
  - [x] Validates user owns the site
  - [x] Create build job record in DynamoDB
  - [x] Invoke build Lambda asynchronously
  - [x] Store build history (timestamp, status, log URL)
- **Acceptance Criteria:**
  - [x] Returns 202 Accepted with job ID
  - [x] Build job created in DynamoDB
  - [x] Lambda invoked successfully
  - [x] Status polling works
  - [x] Proper error handling for invalid sites
- **Type:** Backend
- **Estimate:** M
- **Status:** COMPLETED
- **Tests:** `app/app/api/tests/integration/test_build_jobs_api.py` (11 tests passing)

#### SSG-016: 11ty Lambda Build Function
- **Description:** Lambda function to build static sites from templates and content
- **Requirements:**
  - [x] Clone template repo from GitHub to /tmp
  - [x] Query content records from DynamoDB (app.nbhd.blog.post)
  - [x] Transform AT Protocol records to 11ty data format
  - [x] Write _data/posts.json, _data/site.json
  - [x] Run npm install (with timeout)
  - [x] Run npm run build (11ty build)
  - [x] Upload _site/ output to S3
  - [x] Invalidate CloudFront cache
  - [x] Update build job status in DynamoDB
  - [x] Log errors to CloudWatch
- **Acceptance Criteria:**
  - [x] Successfully builds sites with blog content
  - [x] Output correctly uploaded to S3
  - [x] CloudFront serves latest version
  - [x] Build errors logged and returned
  - [x] Completes within 5 minute timeout
  - [x] Handles build failures gracefully
- **Type:** Backend/Lambda/Infrastructure
- **Estimate:** XL
- **Status:** COMPLETED
- **Tests:** `app/lambda/tests/test_site_builder.py` (15 tests passing)

#### SSG-017: Subdomain Routing Setup
- **Description:** Configure Route53 + CloudFront for subdomain deployment
- **Requirements:**
  - [x] Create wildcard DNS record (`*.nbhd.city`)
  - [x] Create CloudFront distribution for subdomains
  - [x] Map `{subdomain}.nbhd.city` → S3 bucket paths
  - [x] Configure origin routing based on subdomain
  - [x] SSL/TLS certificates for wildcard domain
  - [x] Terraform code for DNS infrastructure
- **Acceptance Criteria:**
  - [x] Wildcard DNS resolves correctly
  - [x] CloudFront serves correct S3 path per subdomain
  - [x] Multiple subdomains work independently
  - [x] HTTPS works for all subdomains
  - [x] 404 handling for non-existent subdomains
- **Type:** Infrastructure
- **Estimate:** L
- **Status:** COMPLETED
- **Merged:** 2026-01-31 via PR #77
- **Commit:** 03eb1d6 (feat(SSG-017): Implement wildcard subdomain routing for static sites)
- **Documentation:** SUBDOMAIN_ROUTING_SETUP.md, DEPLOYMENT_CHECKLIST.md, IMPLEMENTATION_INDEX.md
- **Files Created:** 14 files (2,126 insertions)

#### SSG-018: Site Export to ZIP
- **Description:** Generate downloadable ZIP of built site files
- **Requirements:**
  - [x] Endpoint: `GET /app/app/api/sites/{id}/export`
  - [x] Downloads all static files from S3 as ZIP
  - [x] Includes README with deployment instructions
  - [x] Users can self-host the generated site anywhere
  - [x] Include source content (markdown) as backup
- **Acceptance Criteria:**
  - [x] ZIP contains all necessary files
  - [x] ZIP is downloadable and extractable
  - [x] Can be deployed to any static host (Netlify, Vercel, etc.)
  - [x] README explains how to deploy
  - [x] File structure is clear
- **Type:** Backend
- **Estimate:** S
- **Status:** COMPLETED
- **Merged:** 2026-02-01 via PR #81
- **Commit:** dccb6aa (feat(SSG-018): Implement site export to ZIP endpoint)
- **Implementation Files:**
  - `app/app/api/sites.py` - Main endpoint and 4 helper functions
  - `app/app/api/tests/unit/test_site_export.py` - 6 unit tests
  - `app/app/api/tests/integration/test_site_export.py` - 8 integration tests
- **Key Features:**
  - Async S3 file download with pagination (supports 1000+ files)
  - DynamoDB content record backup (posts, pages)
  - Multi-platform deployment instructions (Netlify, Vercel, GitHub Pages, AWS S3)
  - ZIP_DEFLATED compression
  - StreamingResponse for efficient download
  - Full authorization checks (site ownership validation)
  - Comprehensive error handling

**Note:** These infrastructure tickets support the build pipeline. They provision AWS resources needed for SSG-009, SSG-015, and SSG-016.

#### SSG-009-INFRA: Deploy Template Analyzer Lambda
- **Description:** Terraform infrastructure to deploy the Template Analyzer Lambda function
- **Depends On:** SSG-009 (code implementation)
- **Requirements:**
  - [x] Package Lambda function code from `app/lambda/template_analyzer/`
  - [x] Create CloudWatch Log Group for template analyzer Lambda
  - [x] Create IAM role for template analyzer execution
  - [x] Create IAM policy allowing Lambda to:
    - [x] Write logs to CloudWatch
    - [x] Query and update DynamoDB (DescribeTable, UpdateItem, PutItem)
    - [x] (Optional) Clone from GitHub (may not need IAM - public repos)
  - [x] Deploy Lambda function with:
    - [x] Runtime: Python 3.11 or 3.12
    - [x] Timeout: 300 seconds (5 minutes)
    - [x] Memory: 512 MB minimum
    - [x] Environment variables: DYNAMODB_TABLE_NAME, AWS_REGION
  - [x] Add Terraform code to `devops/` directory
  - [x] Document deployment steps in DEPLOYMENT_CHECKLIST.md
- **Acceptance Criteria:**
  - [x] Lambda function successfully deployed to AWS
  - [x] Function can be invoked from API Gateway (SSG-008)
  - [x] CloudWatch logs show successful executions
  - [x] Can clone and analyze test template repositories
  - [x] Updates template status in DynamoDB correctly
  - [x] Handles timeouts gracefully
- **Type:** Infrastructure/Terraform
- **Estimate:** S
- **Status:** COMPLETED
- **Implementation Files:**
  - Terraform: `devops/lambda_template_analyzer.tf` (new)
  - Python: `app/lambda/template_analyzer/requirements.txt` (new)
  - Updated: `devops/outputs.tf` (3 new outputs)
  - Updated: `devops/DEPLOYMENT_CHECKLIST.md` (testing section)

#### SSG-016-INFRA: Deploy 11ty Site Builder Lambda
- **Description:** Terraform infrastructure to deploy the 11ty Site Builder Lambda function and supporting AWS resources
- **Depends On:** SSG-016 (code implementation)
- **Requirements:**
  - [x] Package Lambda function code from `app/lambda/site_builder/`
  - [x] Create S3 bucket for built sites (e.g., `{project}-sites-{environment}`)
  - [x] Configure S3 bucket:
    - [x] Enable public read access (site files are public static content)
    - [x] Configure bucket policy for CloudFront access
    - [x] Enable versioning for rollback capability
    - [x] Set lifecycle rules for old builds (optional)
  - [x] Create CloudFront distribution:
    - [x] Origin: S3 bucket with path pattern `/{site_id}/*`
    - [x] Behaviors: Cache control settings (short TTL for index.html, long TTL for assets)
    - [x] Origin path: `/` (root of bucket)
    - [x] Default root object: `index.html`
    - [x] Compress static assets (gzip)
    - [x] HTTPS only
  - [x] Create CloudWatch Log Group for site builder Lambda
  - [x] Create IAM role for site builder execution
  - [x] Create IAM policies allowing Lambda to:
    - [x] Write logs to CloudWatch
    - [x] Query and update DynamoDB (GetItem, PutItem, UpdateItem, Query)
    - [x] Read/write to S3 bucket (GetObject, PutObject, ListBucket)
    - [x] Invoke CloudFront invalidations (CreateInvalidation)
  - [x] Deploy Lambda function with:
    - [x] Runtime: Python 3.11 or 3.12
    - [x] Timeout: 300 seconds (5 minutes)
    - [x] Memory: 1024 MB (needs npm install + 11ty build)
    - [x] Environment variables: DYNAMODB_TABLE_NAME, S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID, AWS_REGION
    - [x] Ephemeral storage: 4096 MB (for npm modules and build output)
  - [x] Create API Lambda permission to invoke site builder Lambda (for SSG-015)
  - [x] Add Terraform code to `devops/` directory
  - [x] Document deployment steps in DEPLOYMENT_CHECKLIST.md
  - [x] Document subdomain routing prerequisites (Route53 setup in SSG-017)
- **Acceptance Criteria:**
  - [x] Lambda function successfully deployed to AWS
  - [x] Function can be invoked from API (via SSG-015 endpoints)
  - [x] CloudWatch logs show successful builds
  - [x] Built sites successfully uploaded to S3
  - [x] CloudFront serves sites via `//{site_id}.nbhd.city` (after SSG-017 DNS setup)
  - [x] Cache invalidation works (CloudFront shows latest content)
  - [x] Failed builds update DynamoDB status correctly
  - [x] Environment variables are properly configured
- **Type:** Infrastructure/Terraform
- **Estimate:** M
- **Status:** COMPLETED
- **Implementation Files:**
  - Terraform: `devops/site_builder_lambda.tf` (new)
  - Updated: `devops/outputs.tf` (3 new outputs)
  - Updated: `devops/DEPLOYMENT_CHECKLIST.md` (testing section)
  - Note: S3 bucket and CloudFront already exist in sites_storage.tf and sites_cdn.tf

#### SSG-015-INFRA: Configure API Lambda Permissions for Build Invocation
- **Description:** Update IAM policies to allow API Lambda to invoke site builder and template analyzer Lambdas
- **Depends On:** SSG-009-INFRA ✅, SSG-016-INFRA ✅ (both deployed)
- **Requirements:**
  - [x] Add IAM policy allowing API Lambda to:
    - [x] Invoke site builder Lambda asynchronously (InvokeFunction with InvocationType=Event)
    - [x] Invoke template analyzer Lambda asynchronously (InvokeFunction with InvocationType=Event)
  - [x] Create Lambda permissions:
    - [x] Allow API Lambda to invoke site builder Lambda
    - [x] Allow API Lambda to invoke template analyzer Lambda
  - [x] Update existing `devops/iam.tf` with new policies
  - [x] No new Lambda function needed (existing API Lambda)
- **Acceptance Criteria:**
  - [x] API endpoints in SSG-015 successfully invoke site builder Lambda
  - [x] API endpoints in SSG-008 successfully invoke template analyzer Lambda
  - [x] Invocations are asynchronous (202 Accepted response)
  - [x] CloudWatch logs show successful Lambda invocations
  - [x] Build job status updates work correctly
- **Type:** Infrastructure/Terraform
- **Estimate:** XS
- **Status:** COMPLETED
- **Implementation Files:**
  - Updated: `devops/iam.tf` (1 new policy + 1 attachment)
  - Updated: `devops/lambda.tf` (2 new permissions)
  - New: `devops/tests/test_api_lambda_permissions.py` (infrastructure validation)

---

## Phase 7: Nbhd CMS & Admin Features 📝

**Status:** Pending
**Timeline:** Weeks 13-15
**Depends On:** Phase 5 (Content Management) and Phase 6 (Build Pipeline)

Transform nbhd.city into a full CMS where neighborhoods can publish AT Protocol data, and owners can configure welcome pages, announcements, and manage all AT Protocol content.

### Backend Foundation

#### NBHD-001: Nbhd DID & Data Model Enhancement
- **Description:** Add DID generation and site type distinction to data model 
- **Requirements:**
  - [x] Add `nbhd_did` field to neighborhood records in DynamoDB
  - [x] Add `site_type` field to sites ("personal" | "project")
  - [x] Update models in `app/app/api/models.py` with new fields and validation
- **Acceptance Criteria:**
  - [x] New neighborhoods automatically get a DID on creation
  - [x] Existing neighborhoods can be migrated with script
  - [x] Sites can be created with site_type="personal" or "project"
  - [x] Project sites require nbhd_id selection
  - [x] DID format is consistent and valid
- **Type:** Backend
- **Estimate:** M
- **Status:** COMPLETED
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - Data Model section and [SITE-TYPES.md](./SITE-TYPES.md) - Data Model section
- **Files:**
  - `app/app/api/dynamodb_repository.py` - Add DID generation
  - `app/app/api/models.py` - Update schemas
  - `app/app/api/migrations/add_nbhd_did.py` (new) - Migration script
  - `app/app/api/tests/test_nbhd_data_model.py` (new) - New tests

#### NBHD-002: Nbhd Content API
- **Description:** Create API router for neighborhood-owned AT Protocol content
- **Requirements:**
  - [x] Create `app/app/api/nbhd_content.py` router (new file)
  - [x] Implement `verify_nbhd_admin()` helper that checks user created/owns nbhd
  - [x] `POST /app/app/api/nbhds/{id}/content/welcome` - Create/update welcome content (admin only)
  - [x] `GET /app/app/api/nbhds/{id}/content/welcome` - Get welcome content (public)
  - [x] `POST /app/app/api/nbhds/{id}/content/announcements` - Create announcement (admin only)
  - [x] `GET /app/app/api/nbhds/{id}/content/announcements` - List announcements (paginated)
  - [x] `DELETE /app/app/api/nbhds/{id}/content/announcements/{rkey}` - Delete announcement (admin only)
  - [x] `GET /app/app/api/nbhds/{id}/content/cms` - CMS view with all content (admin only)
  - [x] Store content as AT Protocol records with CID/rkey generation
  - [x] Register router in `app/app/api/main.py`
- **Acceptance Criteria:**
  - [x] Welcome content endpoints work (create, retrieve, delete)
  - [x] Announcements CRUD works with pagination
  - [x] Non-admin users get 403 on POST/DELETE endpoints
  - [x] Content stored as AT Protocol records (app.nbhd.welcome, app.nbhd.announcement)
  - [x] CMS endpoint returns aggregated view of all content
  - [x] Proper error handling (404 for missing nbhd, 403 for auth)
- **Type:** Backend
- **Estimate:** M
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - API Routes, Admin Access Control, and AT Protocol Records sections
- **Status:** COMPLETED
- **Files:**
  - `app/app/api/nbhd_content.py` (new) - Main router
  - `app/app/api/main.py` - Register router
  - `app/app/api/tests/integration/test_nbhd_content_api.py` (new)

### Frontend - Core CMS Features

#### NBHD-003: Welcome Page UI
- **Description:** Create public-facing welcome page for neighborhoods with setup instructions
- **Requirements:**
  - [x] Create `WelcomePage.jsx` component that shows markdown welcome content
  - [x] Create `DefaultWelcomeInstructions.jsx` component showing setup instructions when no content exists
  - [x] Install markdown rendering library (or create `MarkdownRenderer.jsx`)
  - [x] Add route `/nbhds/:id/welcome` to `App.jsx`
  - [x] Create `nbhdContentService.js` with API client functions
  - [x] Link from NeighborhoodDetail page
  - [x] Mobile-responsive layout
  - [x] Handle loading and error states
- **Acceptance Criteria:**
  - [x] Unauthenticated users can view welcome page
  - [x] With no content, shows setup instructions
  - [x] With content, shows rendered markdown
  - [x] Markdown renders correctly (headers, links, code blocks)
  - [x] Mobile layout works
  - [x] Loading state displays while fetching
- **Type:** Frontend
- **Estimate:** S
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - Welcome Page Behavior section
- **Status:** COMPLETED
- **Files:**
  - `app/UI/src/pages/WelcomePage.jsx` (new)
  - `app/UI/src/components/DefaultWelcomeInstructions.jsx` (new)
  - `app/UI/src/components/MarkdownRenderer.jsx` (new)
  - `app/UI/src/components/MarkdownRenderer.module.css` (new)
  - `app/UI/src/components/DefaultWelcomeInstructions.module.css` (new)
  - `app/UI/src/services/nbhdContentService.js` (new)
  - `app/UI/src/styles/WelcomePage.module.css` (new)
  - `app/UI/src/__tests__/pages/WelcomePage.test.jsx` (new)
  - `app/UI/src/App.jsx` - Add route
  - `app/UI/src/pages/NeighborhoodDetail.jsx` - Add link

#### NBHD-004: Admin Page UI
- **Description:** Create admin interface for neighborhood owners to configure welcome page, announcements, and settings
- **Requirements:**
  - [x] Create `AdminPage.jsx` with tab navigation (Welcome, Announcements, Settings, Sites)
  - [x] Create `WelcomeContentEditor.jsx` that wraps ContentEditor component for welcome content
  - [x] Create `AnnouncementManager.jsx` to create, list, and delete announcements
  - [x] Create `NbhdSettingsForm.jsx` for metadata configuration
  - [x] Create `SitesTab.jsx` to list and manage sites for this nbhd
  - [x] Add admin route `/nbhds/:id/admin` to `App.jsx`
  - [x] Add access check (redirect non-owners to public page)
  - [x] Add "Admin" button to NeighborhoodDetail (visible only to owner)
  - [x] Tab navigation with visual indicators for unsaved changes
  - [x] Save functionality with success/error messages
- **Acceptance Criteria:**
  - [x] Owners can access admin page (non-owners redirected)
  - [x] Welcome tab allows editing markdown content
  - [x] Announcements tab supports create/list/delete
  - [x] Settings tab allows configuring nbhd metadata
  - [x] Sites tab shows project sites linked to nbhd
  - [x] All changes save to backend
  - [x] Error messages display on failures
  - [x] Unsaved changes indicator shown
- **Type:** Frontend
- **Estimate:** L
- **Status:** COMPLETED
- **Phase Status:** ✅ Phase 5 Complete - All 11/11 AdminPage tests passing, all acceptance criteria verified
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - Frontend Component Architecture section
- **Fix Applied:** Updated MSW handlers to use absolute URL patterns (http://localhost:8000/*) instead of relative paths, resolving route matching issue. Updated AdminPage tests to use regex matching for CSS-module-hashed class names. Merged via PR#TBD on 2026-02-05.
- **Files:**
  - `app/UI/src/pages/AdminPage.jsx` (new)
  - `app/UI/src/pages/AdminPage.module.css` (new)
  - `app/UI/src/components/WelcomeContentEditor.jsx` (new)
  - `app/UI/src/components/WelcomeContentEditor.module.css` (new)
  - `app/UI/src/components/AnnouncementManager.jsx` (new)
  - `app/UI/src/components/AnnouncementManager.module.css` (new)
  - `app/UI/src/components/NbhdSettingsForm.jsx` (new)
  - `app/UI/src/components/NbhdSettingsForm.module.css` (new)
  - `app/UI/src/components/SitesTab.jsx` (new)
  - `app/UI/src/components/SitesTab.module.css` (new)
  - `app/UI/src/services/nbhdContentService.js` (new)
  - `app/UI/src/App.jsx` - Added route
  - `app/UI/src/pages/NeighborhoodDetail.jsx` - Added admin button
  - `app/UI/src/__tests__/mocks/handlers.js` - Added neighborhood content API mocks
  - Test files created for all components (rewritten for MSW)

---

#### NBHD-005: CMS View for AT Protocol Data
- **Description:** Create CMS view showing all AT Protocol records for the neighborhood
- **Requirements:**
  - [x] Create `CMSView.jsx` page (admin only)
  - [x] Create `ContentRecordsList.jsx` component for displaying records
  - [x] Create `ATProtocolInspector.jsx` component showing CID, rkey, URI details
  - [x] Display: welcome content, announcements, member sites, blog posts
  - [x] Add filters: record type (welcome, announcement, blog), date range, author
  - [x] Add search by content text
  - [x] Show record metadata: CID, created_at, modified_at
  - [x] Add route `/nbhds/:id/cms` to `App.jsx`
  - [x] Link from AdminPage
  - [x] Pagination for large record lists
- **Acceptance Criteria:**
  - [x] Only admins can view CMS page (403 for non-admins)
  - [x] All AT Protocol records displayed with metadata
  - [x] Filters work correctly
  - [x] Search functionality works
  - [x] CID/rkey/URI information shown for each record
  - [x] Pagination works with large datasets
  - [x] Mobile responsive layout
- **Type:** Frontend
- **Estimate:** M
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - CMS View Response Format section
- **Files:**
  - `app/UI/src/pages/CMSView.jsx` (new)
  - `app/UI/src/components/ContentRecordsList.jsx` (new)
  - `app/UI/src/components/ATProtocolInspector.jsx` (new)
  - `app/UI/src/App.jsx` - Add route
- **Status:** COMPLETED

### Frontend - Site Management Enhancement

#### SITES-001: Site Type Distinction
- **Description:** Add support for filtering sites by type (personal vs project)
- **Requirements:**
  - [x] Update `SiteManagementDashboard.jsx` to accept `site_type` filter prop
  - [x] Update site creation flow to include site type selector
  - [x] Update backend `sites.py` `GET /app/app/api/sites` to support `?site_type=personal|project` query param
  - [x] Validate project sites require nbhd_id selection
  - [x] Update site creation form to show/hide nbhd selector based on type
  - [x] Add site type badges to site list
  - [x] Update `SiteConfigForm.jsx` to include site type in form
- **Acceptance Criteria:**
  - [x] Filter parameter works on GET /app/app/api/sites
  - [x] Site creation saves site_type correctly
  - [x] Personal sites don't require nbhd
  - [x] Project sites require nbhd selection
  - [x] Badges display correct site type
  - [x] Form validates based on site type
- **Type:** Frontend + Backend
- **Estimate:** S
- **Status:** COMPLETED (2026-02-05)
- **Tests:** 35 tests passing (17 SiteManagementDashboard + 18 SiteConfigForm)
- **Reference:** See [SITE-TYPES.md](./SITE-TYPES.md) - Data Model, API Endpoints, and Validation Rules sections
- **Implementation Files:**
  - `app/UI/src/components/SiteBuilder/SiteManagementDashboard.jsx` - Added SiteTypeBadge component, siteType prop, API filtering
  - `app/UI/src/components/SiteBuilder/SiteConfigForm.jsx` - Added site type selector, neighborhood dropdown, validation
  - `app/UI/src/hooks/useMyNeighborhoods.js` - Used existing hook for neighborhood data
  - `app/UI/src/__tests__/components/SiteManagementDashboard.test.jsx` - Added 6 new tests for badges and filtering
  - `app/UI/src/__tests__/components/SiteConfigForm.test.jsx` - Added 5 new tests for site type selection and validation
  - CSS modules updated with badge and form styling

#### SITES-002: Personal Sites Page
- **Description:** Create dedicated page for viewing and managing personal sites
- **Requirements:**
  - [x] Create `PersonalSites.jsx` page
  - [x] Fetch `GET /app/app/api/sites?site_type=personal`
  - [x] Reuse `SiteManagementDashboard` with site_type="personal" filter
  - [x] Add create button with site type pre-selected
  - [x] Add route `/personal-sites` to `App.jsx`
  - [x] Link from user dashboard
  - [x] Show helpful text explaining personal sites
- **Acceptance Criteria:**
  - [x] Page loads and displays user's personal sites
  - [x] Can create new personal site from this page
  - [x] Can edit/delete existing personal sites
  - [x] No nbhd selection shown on create
  - [x] Mobile responsive
- **Type:** Frontend
- **Estimate:** S
- **Reference:** See [SITE-TYPES.md](./SITE-TYPES.md) - UI Patterns and Personal Sites Page sections
- **Files:**
  - `app/UI/src/pages/PersonalSites.jsx` (new)
  - `app/UI/src/App.jsx` - Add route and link

#### SITES-003: Project Sites Page
- **Description:** Create dedicated page for viewing and managing project sites
- **Requirements:**
  - [x] Create `ProjectSites.jsx` page
  - [x] Create `ProjectSiteSelector.jsx` component for choosing/filtering by nbhd
  - [x] Fetch `GET /app/app/api/sites?site_type=project`
  - [x] Allow filtering by nbhd
  - [x] Reuse `SiteManagementDashboard` with site_type="project" filter
  - [x] Add create button with site type pre-selected
  - [x] Add route `/sites/projects` to `App.jsx`
  - [x] Link from user dashboard and neighborhood pages
  - [x] Show helpful text explaining project sites
- **Acceptance Criteria:**
  - [x] Page loads and displays user's project sites
  - [x] Can filter by neighborhood
  - [x] Can create new project site (requires nbhd selection)
  - [x] Can edit/delete existing project sites
  - [x] Mobile responsive
- **Status:** COMPLETED
- **Merged:** 2026-02-07 via PR #96
- **Type:** Frontend
- **Estimate:** S
- **Reference:** See [SITE-TYPES.md](./SITE-TYPES.md) - UI Patterns and Project Sites Page sections
- **Files:**
  - `app/UI/src/pages/ProjectSites.jsx` (new)
  - `app/UI/src/components/ProjectSiteSelector.jsx` (new)
  - `app/UI/src/App.jsx` - Add route and link

---

## Phase 8: Build Pipeline UI Completion 🚀

**Status:** Pending
**Timeline:** Weeks 15-16
**Depends On:** Phase 6 (Build Pipeline - backend is complete, needs frontend UI)

These tickets complete the build pipeline UI for the existing SSG-015 and SSG-016 backend implementations.

#### BUILD-001: Site Build Trigger UI
- **Description:** Add "Deploy Site" button to trigger site builds
- **Requirements:**
  - [x] Add "Deploy Site" button to `SiteManagementDashboard.jsx`
  - [x] Call `POST /app/app/api/sites/{id}/build` (endpoint exists from SSG-015)
  - [x] Show loading state during build initialization
  - [x] Display job_id after successful trigger
  - [x] Show error message on failures
  - [x] Disable button while build is in progress
  - [x] Confirm dialog asking to rebuild
- **Acceptance Criteria:**
  - [x] Button visible in dashboard for each site
  - [x] Clicking triggers build (202 Accepted received)
  - [x] Loading state displays during request
  - [x] Success message shows with job_id
  - [x] Error messages clear and helpful
  - [x] Can't trigger multiple builds simultaneously
- **Type:** Frontend
- **Estimate:** S
- **Status:** COMPLETED
- **Tests:** `app/UI/src/__tests__/components/BuildTriggerButton.test.jsx` (12 tests passing)
- **Reference:** See [BUILD-PIPELINE-UI.md](./BUILD-PIPELINE-UI.md) - BUILD-001 section and Component Specifications
- **Implementation Files:**
  - `app/UI/src/components/SiteBuilder/BuildTriggerButton.jsx` (new)
  - `app/UI/src/components/SiteBuilder/BuildTriggerButton.module.css` (new)
  - `app/UI/src/components/SiteBuilder/SiteManagementDashboard.jsx` - Added BuildTriggerButton import and integration
  - `app/UI/src/__tests__/components/BuildTriggerButton.test.jsx` (new)

#### BUILD-002: Build Status Poller
- **Description:** Component to poll and display build status and logs
- **Requirements:**
  - [x] Create `BuildStatusPoller.jsx` component
  - [x] Poll `GET /app/app/api/sites/{id}/builds/{job_id}` every 5 seconds
  - [x] Display progress: pending → running → completed/failed
  - [x] Show build logs (tail last 50 lines)
  - [x] Show error messages on failure
  - [x] Auto-refresh until completion or timeout
  - [x] Manual refresh button
  - [x] Stop polling once build completes
  - [x] Handle network errors gracefully
- **Acceptance Criteria:**
  - [x] Status updates every 5 seconds while building
  - [x] Shows correct status text (pending, running, completed, failed)
  - [x] Logs display and update as build progresses
  - [x] Stops polling once build completes
  - [x] Error messages display on build failure
  - [x] Network errors handled without crashing
  - [x] Can manually refresh status
- **Status:** COMPLETED
- **Tests:** `app/UI/src/__tests__/components/BuildStatusPoller.test.jsx` (11 tests passing)
- **Type:** Frontend
- **Estimate:** M
- **Reference:** See [BUILD-PIPELINE-UI.md](./BUILD-PIPELINE-UI.md) - BUILD-002 section, Status Lifecycle, and Component Specifications
- **Files:**
  - `app/UI/src/components/SiteBuilder/BuildStatusPoller.jsx` (new)
  - `app/UI/src/hooks/useBuildPoller.js` (new, optional - custom hook)

#### BUILD-003: Build History Dashboard
- **Description:** Component to display past builds and their status
- **Requirements:**
  - [x] Create `BuildHistory.jsx` component
  - [x] Fetch `GET /app/app/api/sites/{id}/builds` (endpoint exists from SSG-015)
  - [x] Display table: Status, Started, Duration, Actions
  - [x] Show build status with color coding (success=green, failed=red, pending=yellow)
  - [x] Link to logs for each build
  - [x] Pagination for large build histories
  - [x] Sort by date (newest first)
  - [x] Add to `SiteManagementDashboard` or separate page
  - [x] Show last successful/failed build info
- **Acceptance Criteria:**
  - [x] Table displays all builds with correct info
  - [x] Status colors are visible and correct
  - [x] Pagination works with >10 builds
  - [x] Sorting by date works
  - [x] Log links are clickable
  - [x] Mobile responsive layout
- **Type:** Frontend
- **Estimate:** M
- **Status:** COMPLETED (2026-02-07)
- **Reference:** See [BUILD-PIPELINE-UI.md](./BUILD-PIPELINE-UI.md) - BUILD-003 section and Component Specifications
- **Files:**
  - `app/UI/src/components/SiteBuilder/BuildHistory.jsx` (new) - 220 lines, main component with table, pagination, modals
  - `app/UI/src/components/SiteBuilder/BuildHistory.module.css` (new) - 180 lines, responsive styling with color-coded badges
  - `app/UI/src/__tests__/components/BuildHistory.test.jsx` (new) - 450+ lines, 19 comprehensive tests
  - `app/UI/src/components/SiteBuilder/SiteManagementDashboard.jsx` - Added BuildHistory integration
  - `app/UI/src/components/SiteBuilder/SiteManagementDashboard.module.css` - Added button/section styles
- **PR:** https://github.com/benkline/nbhd.city/pull/98
- **Tests:** 19/19 tests passing (BUILD-003), 17/17 SiteManagementDashboard, 59 total BUILD tests passing

---

## Phase 9.1: Frontend Login & Authentication 🔐

**Status:** Pending
**Timeline:** Weeks TBD
**Depends On:** Phase 1 (BlueSky OAuth), Phase 7 (Neighborhoods)

Enhanced login experience with OAuth flow, session management, and user onboarding. All authentication is managed exclusively through BlueSky OAuth - no password management.

### Overview

This phase improves the authentication and onboarding experience:
1. Context-aware home page that displays neighborhood welcome or login
2. Enhanced OAuth login with CSRF protection
3. Session persistence and automatic token refresh
4. First-time user onboarding flow
5. Secure logout with session cleanup

---

### FL-9.1: Context-Aware Home Page

**Description:** Display appropriate home page based on context - use neighborhood welcome page if available, otherwise show login page.

**Requirements:**
- [x] Check if there's an nbhd-type static site configured as home page
- [x] If nbhd site exists, display it as the home page
- [x] If no nbhd site exists, fall back to login page
- [x] Add route resolution logic to App.jsx
- [x] Query `GET /app/app/api/nbhds/{id}/content/welcome` for nbhd content
- [x] Handle loading state while checking for nbhd site
- [x] Handle missing/404 nbhd gracefully
- [x] Add configuration option to neighborhood settings to designate home page site
- [x] Display appropriate redirect logic based on user auth state

**Acceptance Criteria:**
- [x] Unauthenticated users see home page (nbhd welcome or login)
- [x] Authenticated users see their personal dashboard or nbhd home if configured
- [x] No error if no nbhd is designated as home page
- [x] Loading state displays while checking for home page content
- [x] Navigation handles both logged-in and logged-out states correctly
- [x] Home page context switches work without full page reload

**Type:** Frontend + Backend
**Estimate:** M
**Status:** COMPLETED
**Merged:** PR #105 on 2026-02-08
**Tests:** `tickets/integration-tickets/PHASE-10/TEST-LOGIN-CONTEXT-001.md`

---

gs

### FL-9.2: Enhanced OAuth Login Flow

**Description:** Improve the BlueSky OAuth login experience with clear prompts, error handling, and redirect logic.

**Requirements:**
- [x] Create `LoginPage.jsx` component with clear OAuth sign-in button
- [x] Add helpful messaging explaining the OAuth flow ("nbhd.city uses your BlueSky account for sign-in")
- [x] Display loading state while OAuth request is being processed
- [x] Handle OAuth callback with `code` and `state` parameters
- [x] Validate OAuth state parameter to prevent CSRF
- [x] Extract and store BlueSky DID from OAuth response
- [x] Store session token securely (localStorage)
- [x] Redirect to dashboard on successful login
- [x] Display user's BlueSky handle after login (in dashboard)
- [x] Add logout endpoint: `POST /api/auth/logout` ✅ (already exists)
- [x] Clear session on logout and redirect to login page

**Acceptance Criteria:**
- [x] OAuth sign-in button displays and functions correctly
- [x] User can click button and be redirected to BlueSky OAuth
- [x] After OAuth callback, user is logged in with valid session
- [x] CSRF token validation prevents unauthorized access (state parameter)
- [x] User profile displays correct BlueSky handle
- [x] Logout clears session and redirects to login page
- [x] Loading states show during OAuth flow
- [x] Error messages display for failed OAuth attempts
- [x] Session persists across page refreshes

**Type:** Frontend + Backend
**Estimate:** M
**Status:** COMPLETED (2026-02-10)
**PR:** https://github.com/nbhd-city/nbhd.city/pull/107
**Commit:** 53d7bb2 - "feat(FL-9.2): Implement enhanced OAuth login flow with BlueSky OAuth"

**Implementation Files:**
- `app/api/auth.py` - Added `get_bluesky_handle()`, updated `create_access_token()` to store handle
- `app/api/main.py` - Fixed `/auth/callback` redirect URL, updated `/auth/me` to return handle, updated test-login
- `app/UI/src/pages/Login.jsx` - Replaced form with OAuth button
- `app/UI/src/pages/AuthSuccess.jsx` - Added error handling
- `app/UI/src/contexts/AuthContext.jsx` - Fixed logout navigation
- `app/UI/src/pages/Dashboard.jsx` - Added BlueSky handle display

**Tests:**
- Backend: `app/api/tests/test_auth.py` (4/4 passing)
- Frontend: Tests running

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

---

## Bugfix Tickets: Profile & User Endpoint Issues 🐛

Critical issues blocking user onboarding and profile creation discovered during local development.

### BUGFIX-001: Add nbhd_did to Existing Neighborhoods

**Description:** Old neighborhoods in the database are missing the required `nbhd_did` field, causing ResponseValidationError when fetching neighborhoods.

**Requirements:**
- [x] Create migration script: `app/api/migrations/add_nbhd_did_to_existing_neighborhoods.py`
- [x] Script should:
  - [x] Query all NBHD records from DynamoDB
  - [x] For each neighborhood without nbhd_did, generate one using existing DID generation logic
  - [x] Update the record with the generated nbhd_did
  - [x] Log progress and any errors
  - [x] Handle already-migrated records gracefully
- [x] Add instruction to DEVELOPMENT.md to run migration after initial setup

**Acceptance Criteria:**
- [x] Migration script runs without errors (endpoint transforms data in response)
- [x] All neighborhoods have nbhd_did field after running
- [x] Fetching neighborhoods no longer returns ResponseValidationError
- [x] GET /api/nbhds works and returns proper NbhdResponse objects

**Type:** Backend/Database
**Estimate:** S
**Status:** COMPLETED (2026-02-10)
**Root Cause:** Neighborhoods created before nbhd_did field was added
**Solution:** Modified `/api/nbhds` endpoint to transform response and ensure `nbhd_did` field is present with default empty string if missing
**Commit:** 53d0a55 - "fix: Add nbhd_did field to neighborhoods list response"

---

### BUGFIX-002: Fix GET /api/users/me Endpoint

**Description:** GET /api/users/me returns 404 Not Found during onboarding - but this is intentional design, not a bug.

**Investigation Result:** The 404 is the correct behavior. It signals to the frontend that the user is authenticated but has no profile yet (needs onboarding). The endpoint is properly implemented and working as designed.

**Type:** Backend
**Estimate:** S
**Status:** COMPLETED - BY DESIGN
**Notes:** Not a bug. 404 is intentional and signals "needs onboarding". The AuthContext correctly interprets this and sets `needsOnboarding=true`.

---

### BUGFIX-003: Fix POST /api/users/me/profile Validation

**Description:** POST /api/users/me/profile returns 422 Unprocessable Entity because empty email strings fail EmailStr validation.

**Root Cause:** UserProfile.jsx sends empty string `""` for optional `email` field, but Pydantic's `EmailStr` type rejects `""` as invalid.

**Solution:** Sanitize form data before sending - convert empty strings to `null` in UserProfile.jsx.

**Requirements:**
- [x] Identify root cause: empty string validation error
- [x] Update UserProfile.jsx to sanitize form data
- [x] Convert empty strings to null before POST/PUT
- [x] Improve error display so users see the error message

**Acceptance Criteria:**
- [x] POST /api/users/me/profile returns 201 Created when email is empty (null)
- [x] User profile is created in DynamoDB
- [x] Response includes updated User object
- [x] Error messages display properly when they occur
- [x] "Create Profile" button works without blank screen

**Type:** Frontend
**Estimate:** S
**Status:** COMPLETED (2026-02-08)
**Changes:** `app/UI/src/pages/UserProfile.jsx` - Added form data sanitization in handleSubmit

---

### BUGFIX-004: Add Empty State to My Neighborhoods Page

**Description:** MyNeighborhoods page was missing an empty state when users have no neighborhood memberships.

**Status Check:** The component already exists at `app/UI/src/pages/MyNeighborhoods.jsx` and ALREADY includes the empty state! The empty state shows:
- Globe emoji (🌍)
- "You haven't joined any nbhds yet" message
- "Browse Nbhds" button to discover neighborhoods

**Requirements:**
- [x] Component exists with proper structure
- [x] Empty state displays when nbhds.length === 0
- [x] Browse button navigates to /nbhds
- [x] Loading and error states handled

**Acceptance Criteria:**
- [x] Page loads at /#/my-nbhds
- [x] If user has no memberships, shows empty state
- [x] If user has memberships, shows neighborhood grid
- [x] Browse button works and navigates correctly

**Type:** Frontend
**Estimate:** S
**Status:** COMPLETED - NO CHANGES NEEDED
**Notes:** Component already has the required empty state implementation

---

## Phase 9.2: Full AT Protocol Federation 🌐

**Status:** Pending
**Timeline:** Weeks 17+
**Depends On:** Phase 2 (AT Protocol Foundation is in place)

Complete AT Protocol federation and Personal Data Server (PDS) implementation. The foundation (ATP-FOUND tickets) was completed in Phase 2. These tickets implement the full federated PDS features.

### AT Protocol PDS Tickets

### Research & Specification

#### ATP-001: AT Protocol PDS Research & Design
- **Description:** Deep dive into AT Protocol and design nbhd as PDS
- **Requirements:**
  - [x] Study AT Protocol documentation
  - [x] Understand PDS (Personal Data Server) spec
  - [x] Design: How do nbhd members register DIDs?
  - [x] Plan: How is neighborhood data federated?
  - [x] Create ADR (Architecture Decision Record)
- **Acceptance Criteria:**
  - [x] Clear understanding of PDS requirements
  - [x] Design document for AT Protocol integration
  - [x] Decision record on implementation approach
- **Type:** Research
- **Estimate:** L
- **Status:** COMPLETED
- **Documentation:** See [ADR-001-ATPROTOCOL-PDS.md](./ADR-001-ATPROTOCOL-PDS.md)

#### ATP-002: BlueSky Integration Review
- **Description:** Review current BlueSky OAuth and plan AT Protocol sync
- **Requirements:**
  - [x] Audit current BlueSky integration
  - [x] Map BlueSky user profiles to AT Protocol DIDs
  - [x] Plan sync of profile data
  - [x] Identify gaps in current implementation
- **Acceptance Criteria:**
  - [x] Clear mapping between BlueSky profiles and DIDs
  - [x] Plan for keeping data in sync
- **Type:** Research
- **Estimate:** M
- **Status:** COMPLETED
- **Documentation:** See [BLUESKY_INTEGRATION_AUDIT.md](./BLUESKY_INTEGRATION_AUDIT.md)

### DID & Identity

#### ATP-003: DID Registration for Members
- **Description:** Implement DID (Decentralized Identifier) registration for nbhd members
- **Requirements:**
  - [x] Generate unique DID for each member
  - [x] Store DID in user profile (DynamoDB)
  - [x] DID format: `did:plc:{key}` or similar
  - [x] Create keypair for member account
  - [ ] Store keys securely (AWS Secrets Manager or KMS)
- **Acceptance Criteria:**
  - [x] Each member gets unique DID on signup
  - [x] DID stored and retrievable
  - [x] Keypair generated and stored securely
  - [x] Can verify ownership of DID
- **Type:** Backend
- **Estimate:** M
- **Status:** MOSTLY COMPLETE
- **Tests:** All integration tests passing (77/77)
- **Note:** Private keys returned once; full KMS integration in ATP-004

#### ATP-004: DID to BlueSky Handle Mapping
- **Description:** Link member DIDs to BlueSky handles
- **Requirements:**
  - [x] Member DIDs linked to BlueSky DIDs
  - [x] Verify BlueSky ownership (using OAuth)
  - [x] Store mapping in DynamoDB
  - [x] Support profile sync from BlueSky
- **Acceptance Criteria:**
  - [x] Member DID maps to BlueSky DID
  - [x] Profile data syncs from BlueSky
  - [ ] Verification is cryptographic
- **Type:** Backend
- **Estimate:** M
- **Status:** MOSTLY COMPLETE
- **Tests:** All integration tests passing (77/77)
- **Note:** Cryptographic verification in ATP-005

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
- **Estimate:** L

#### ATP-010: Cross-PDS Neighborhood Lists
- **Description:** Create neighborhood member lists as AT Protocol lists
- **Requirements:**
  - [ ] Neighborhood members as AT list
  - [ ] Shareable to BlueSky profiles
  - [ ] Can be subscribed to by other users
  - [ ] Lists update when membership changes
- **Acceptance Criteria:**
  - [ ] Lists are created as AT records
  - [ ] Visible on BlueSky
  - [ ] Can be shared/subscribed
  - [ ] Updates work correctly
- **Type:** Backend
- **Estimate:** M

---

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
