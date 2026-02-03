# nbhd.city Development Tickets

**Last Updated:** 2026-02-01 (SSG-018 Completed)
**Phases:** 1-9 (Sequential phases based on execution order and dependencies)
**Priority:** High

---

## Phase Overview

The development roadmap is organized into 9 sequential phases:
1. **Phase 1** - MVP Foundation ✅ COMPLETE
2. **Phase 2** - AT Protocol Foundation (ATP-FOUND-001 to 004) - foundational for everything
3. **Phase 3** - Template System & Site Config APIs (SSG-001, 002, 004, 005, 006)
4. **Phase 4** - Template Analysis System (SSG-007, 008, 009, 010)
5. **Phase 5** - Content Management (SSG-011, 012, 013, 014)
6. **Phase 6** - Build Pipeline & Deployment (SSG-015, 016, 017, 018 + infrastructure)
7. **Phase 7** - Nbhd CMS & Admin Features (NBHD-001 through SITES-003)
8. **Phase 8** - Build Pipeline UI Completion (BUILD-001, 002, 003)
9. **Phase 9** - Full AT Protocol Federation (ATP-001 through ATP-010)

### Relevant Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and tech stack
- **[DATABASE.md](./DATABASE.md)** - DynamoDB schema for static sites and PDS data
- **[API.md](./API.md)** - REST endpoints for templates, sites, and PDS
- **[FRONTEND.md](./FRONTEND.md)** - React components for site builder
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Lambda builds, S3, CloudFront, Terraform
- **[SECURITY.md](./SECURITY.md)** - DID key management, authentication
- **[ATPROTOCOL.md](./ATPROTOCOL.md)** - PDS implementation details
- **[TESTING.md](./TESTING.md)** - Testing strategy for Phase 2

---

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
- **Tests:** `api/tests/integration/test_at_protocol_schema.py` (8 tests passing)

#### ATP-FOUND-002: CID Generation Utilities
- **Description:** Implement Content Identifier (CID) generation for AT Protocol records
- **Requirements:**
  - [x] Install dag-cbor library for CBOR encoding
  - [x] Install multihash library for hashing (not needed - using Python hashlib)
  - [x] Implement CID v1 generation (SHA-256 + base32)
  - [x] Create `generate_cid(record_value)` function
  - [x] Ensure immutability (same content → same CID)
  - [x] Add validation for CID format
  - [x] Create utility file: `/api/atproto/cid.py`
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
- **Tests:** `api/tests/unit/test_cid_generation.py` (14 tests passing)

#### ATP-FOUND-003: Record Key (rkey) Generation
- **Description:** Implement TID (Timestamp Identifier) format for record keys
- **Requirements:**
  - [x] Create `generate_rkey()` function
  - [x] Use TID format: timestamp (microseconds) + random bits
  - [x] Base32 encoding for human-readable keys
  - [x] Ensure chronological sorting (newer records sort later)
  - [x] Ensure global uniqueness (no collisions)
  - [x] Create utility file: `/api/atproto/tid.py`
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
- **Tests:** `api/tests/unit/test_rkey_generation.py` (23 tests passing)

#### ATP-FOUND-004: Basic Record CRUD Operations
- **Description:** Implement core CRUD operations for AT Protocol records in DynamoDB
- **Requirements:**
  - [x] `create_record(user_did, collection, value)` - Create with CID/rkey
  - [x] `get_record(uri)` - Get by AT URI (at://did/collection/rkey)
  - [x] `query_records(user_did, collection)` - List records by type
  - [x] `update_record(uri, new_value)` - Create new version (immutable)
  - [x] `delete_record(uri)` - Soft delete (mark as deleted)
  - [x] Link old/new versions on update
  - [x] Add to `/api/dynamodb_repository.py`
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
- **Tests:** `api/tests/unit/test_at_protocol_crud.py` (18 tests passing)

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
  - [x] Fetch templates from API (`GET /api/templates`)
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
  - [x] `GET /api/templates` - List all available templates
  - [x] `GET /api/templates/{id}` - Get single template metadata
  - [x] `GET /api/templates/{id}/schema` - Get config schema
  - [x] `GET /api/templates/{id}/preview` - Get preview image URL
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
  - [x] `POST /api/sites` - Create new site from template + config
  - [x] `GET /api/sites/{id}` - Retrieve site config
  - [x] `PUT /api/sites/{id}` - Update site config
  - [x] `GET /api/sites` - List user's sites
  - [x] `DELETE /api/sites/{id}` - Delete site
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
- **Tests:** `api/tests/unit/test_template_schema_inference.py` (26 tests passing)

#### SSG-008: Custom Template Registration API
- **Description:** API endpoints for registering custom 11ty templates from GitHub
- **Requirements:**
  - [x] `POST /api/templates/custom` - Register template from GitHub URL
  - [x] `GET /api/templates/custom/{id}/status` - Check analysis status
  - [x] `GET /api/templates/{id}/content-types` - Get inferred content types
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
- **Tests:** `api/tests/integration/test_custom_templates.py` (29 tests passing)
- **Implementation Files:**
  - `api/templates.py` - Added `invoke_template_analyzer_async()` function and integrated with `/api/templates/custom` endpoint
  - `api/tests/integration/test_custom_templates.py` - Added test for async Lambda invocation

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
- **Tests:** `lambda/tests/test_template_analyzer.py` (23 tests passing)

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
  - [x] `POST /api/sites/{id}/content` - Create blog post/page
  - [x] `GET /api/sites/{id}/content` - List all content
  - [x] `GET /api/sites/{id}/content/{rkey}` - Get specific content
  - [x] `PUT /api/sites/{id}/content/{rkey}` - Update content
  - [x] `DELETE /api/sites/{id}/content/{rkey}` - Delete content
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
- **Tests:** `api/tests/integration/test_content_records_api.py` (12 tests passing)
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
- **Tests:** `api/tests/unit/test_bluesky_integration.py` (29 tests passing)

#### SSG-014: Smart Content Prefilling
- **Description:** Auto-map user profile data to template content fields
- **Requirements:**
  - [x] `GET /api/sites/{id}/prefill` - Get prefill suggestions
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
- **Tests:** `api/tests/unit/test_content_prefilling.py` (21 tests passing), `nbhd/src/__tests__/components/PrefillPreview.test.jsx` (17 tests)

---

## Phase 6: Build Pipeline & Deployment 🏗️

**Status:** Pending
**Timeline:** Weeks 10-12
**Depends On:** Phase 5 (Content Management - content must exist before building)

#### SSG-015: Site Build Trigger API
- **Description:** Endpoint to initiate Lambda build process
- **Requirements:**
  - [x] `POST /api/sites/{id}/build` - Trigger build
  - [x] `GET /api/sites/{id}/builds/{job_id}` - Get build status
  - [x] `GET /api/sites/{id}/builds` - List build history
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
- **Tests:** `api/tests/integration/test_build_jobs_api.py` (11 tests passing)

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
- **Tests:** `lambda/tests/test_site_builder.py` (15 tests passing)

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
  - [x] Endpoint: `GET /api/sites/{id}/export`
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
  - `api/sites.py` - Main endpoint and 4 helper functions
  - `api/tests/unit/test_site_export.py` - 6 unit tests
  - `api/tests/integration/test_site_export.py` - 8 integration tests
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
  - [x] Package Lambda function code from `lambda/template_analyzer/`
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
  - Python: `lambda/template_analyzer/requirements.txt` (new)
  - Updated: `devops/outputs.tf` (3 new outputs)
  - Updated: `devops/DEPLOYMENT_CHECKLIST.md` (testing section)

#### SSG-016-INFRA: Deploy 11ty Site Builder Lambda
- **Description:** Terraform infrastructure to deploy the 11ty Site Builder Lambda function and supporting AWS resources
- **Depends On:** SSG-016 (code implementation)
- **Requirements:**
  - [x] Package Lambda function code from `lambda/site_builder/`
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
  - [ ] Add `nbhd_did` field to neighborhood records in DynamoDB
  - [ ] Add `site_type` field to sites ("personal" | "project")
  - [ ] Update models in `api/models.py` with new fields and validation
- **Acceptance Criteria:**
  - [ ] New neighborhoods automatically get a DID on creation
  - [ ] Existing neighborhoods can be migrated with script
  - [ ] Sites can be created with site_type="personal" or "project"
  - [ ] Project sites require nbhd_id selection
  - [ ] DID format is consistent and valid
- **Type:** Backend
- **Estimate:** M
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - Data Model section and [SITE-TYPES.md](./SITE-TYPES.md) - Data Model section
- **Files:**
  - `api/dynamodb_repository.py` - Add DID generation
  - `api/models.py` - Update schemas
  - `api/migrations/add_nbhd_did.py` (new) - Migration script
  - `api/tests/test_nbhd_data_model.py` (new) - New tests

#### NBHD-002: Nbhd Content API
- **Description:** Create API router for neighborhood-owned AT Protocol content
- **Requirements:**
  - [ ] Create `api/nbhd_content.py` router (new file)
  - [ ] Implement `require_nbhd_admin()` middleware that checks user created/owns nbhd
  - [ ] `POST /api/nbhds/{id}/content/welcome` - Create/update welcome content (admin only)
  - [ ] `GET /api/nbhds/{id}/content/welcome` - Get welcome content (public)
  - [ ] `POST /api/nbhds/{id}/content/announcements` - Create announcement (admin only)
  - [ ] `GET /api/nbhds/{id}/content/announcements` - List announcements (paginated)
  - [ ] `DELETE /api/nbhds/{id}/content/announcements/{rkey}` - Delete announcement (admin only)
  - [ ] `GET /api/nbhds/{id}/content/cms` - CMS view with all content (admin only)
  - [ ] Store content as AT Protocol records with CID/rkey generation
  - [ ] Register router in `api/main.py`
- **Acceptance Criteria:**
  - [ ] Welcome content endpoints work (create, retrieve, delete)
  - [ ] Announcements CRUD works with pagination
  - [ ] Non-admin users get 403 on POST/DELETE endpoints
  - [ ] Content stored as AT Protocol records (app.nbhd.welcome, app.nbhd.announcement)
  - [ ] CMS endpoint returns aggregated view of all content
  - [ ] Proper error handling (404 for missing nbhd, 403 for auth)
- **Type:** Backend
- **Estimate:** M
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - API Routes, Admin Access Control, and AT Protocol Records sections
- **Files:**
  - `api/nbhd_content.py` (new) - Main router
  - `api/main.py` - Register router
  - `api/tests/integration/test_nbhd_content_api.py` (new)

### Frontend - Core CMS Features

#### NBHD-003: Welcome Page UI
- **Description:** Create public-facing welcome page for neighborhoods with setup instructions
- **Requirements:**
  - [ ] Create `WelcomePage.jsx` component that shows markdown welcome content
  - [ ] Create `DefaultWelcomeInstructions.jsx` component showing setup instructions when no content exists
  - [ ] Install markdown rendering library (or create `MarkdownRenderer.jsx`)
  - [ ] Add route `/nbhds/:id/welcome` to `App.jsx`
  - [ ] Create `nbhdContentService.js` with API client functions
  - [ ] Link from NeighborhoodDetail page
  - [ ] Mobile-responsive layout
  - [ ] Handle loading and error states
- **Acceptance Criteria:**
  - [ ] Unauthenticated users can view welcome page
  - [ ] With no content, shows setup instructions
  - [ ] With content, shows rendered markdown
  - [ ] Markdown renders correctly (headers, links, code blocks)
  - [ ] Mobile layout works
  - [ ] Loading state displays while fetching
- **Type:** Frontend
- **Estimate:** S
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - Welcome Page Behavior section
- **Files:**
  - `nbhd/src/pages/WelcomePage.jsx` (new)
  - `nbhd/src/components/DefaultWelcomeInstructions.jsx` (new)
  - `nbhd/src/components/MarkdownRenderer.jsx` (new, or use library)
  - `nbhd/src/services/nbhdContentService.js` (new)
  - `nbhd/src/App.jsx` - Add route

#### NBHD-004: Admin Page UI
- **Description:** Create admin interface for neighborhood owners to configure welcome page, announcements, and settings
- **Requirements:**
  - [ ] Create `AdminPage.jsx` with tab navigation (Welcome, Announcements, Settings, Sites)
  - [ ] Create `WelcomeContentEditor.jsx` that wraps ContentEditor component for welcome content
  - [ ] Create `AnnouncementManager.jsx` to create, list, and delete announcements
  - [ ] Create `NbhdSettingsForm.jsx` for metadata configuration
  - [ ] Create `SitesTab.jsx` to list and manage sites for this nbhd
  - [ ] Add admin route `/nbhds/:id/admin` to `App.jsx`
  - [ ] Add access check (redirect non-owners to public page)
  - [ ] Add "Admin" button to NeighborhoodDetail (visible only to owner)
  - [ ] Tab navigation with visual indicators for unsaved changes
  - [ ] Save functionality with success/error messages
- **Acceptance Criteria:**
  - [ ] Owners can access admin page (non-owners redirected)
  - [ ] Welcome tab allows editing markdown content
  - [ ] Announcements tab supports create/list/delete
  - [ ] Settings tab allows configuring nbhd metadata
  - [ ] Sites tab shows project sites linked to nbhd
  - [ ] All changes save to backend
  - [ ] Error messages display on failures
  - [ ] Unsaved changes indicator shown
- **Type:** Frontend
- **Estimate:** L
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - Frontend Component Architecture section
- **Files:**
  - `nbhd/src/pages/AdminPage.jsx` (new)
  - `nbhd/src/components/WelcomeContentEditor.jsx` (new)
  - `nbhd/src/components/AnnouncementManager.jsx` (new)
  - `nbhd/src/components/NbhdSettingsForm.jsx` (new)
  - `nbhd/src/components/SitesTab.jsx` (new)
  - `nbhd/src/App.jsx` - Add route and admin button
  - `nbhd/src/components/NeighborhoodDetail.jsx` - Add admin button

#### NBHD-005: CMS View for AT Protocol Data
- **Description:** Create CMS view showing all AT Protocol records for the neighborhood
- **Requirements:**
  - [ ] Create `CMSView.jsx` page (admin only)
  - [ ] Create `ContentRecordsList.jsx` component for displaying records
  - [ ] Create `ATProtocolInspector.jsx` component showing CID, rkey, URI details
  - [ ] Display: welcome content, announcements, member sites, blog posts
  - [ ] Add filters: record type (welcome, announcement, blog), date range, author
  - [ ] Add search by content text
  - [ ] Show record metadata: CID, created_at, modified_at
  - [ ] Add route `/nbhds/:id/cms` to `App.jsx`
  - [ ] Link from AdminPage
  - [ ] Pagination for large record lists
- **Acceptance Criteria:**
  - [ ] Only admins can view CMS page (403 for non-admins)
  - [ ] All AT Protocol records displayed with metadata
  - [ ] Filters work correctly
  - [ ] Search functionality works
  - [ ] CID/rkey/URI information shown for each record
  - [ ] Pagination works with large datasets
  - [ ] Mobile responsive layout
- **Type:** Frontend
- **Estimate:** M
- **Reference:** See [NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md) - CMS View Response Format section
- **Files:**
  - `nbhd/src/pages/CMSView.jsx` (new)
  - `nbhd/src/components/ContentRecordsList.jsx` (new)
  - `nbhd/src/components/ATProtocolInspector.jsx` (new)
  - `nbhd/src/App.jsx` - Add route

### Frontend - Site Management Enhancement

#### SITES-001: Site Type Distinction
- **Description:** Add support for filtering sites by type (personal vs project)
- **Requirements:**
  - [ ] Update `SiteManagementDashboard.jsx` to accept `site_type` filter prop
  - [ ] Update site creation flow to include site type selector
  - [ ] Update backend `sites.py` `GET /api/sites` to support `?site_type=personal|project` query param
  - [ ] Validate project sites require nbhd_id selection
  - [ ] Update site creation form to show/hide nbhd selector based on type
  - [ ] Add site type badges to site list
  - [ ] Update `SiteConfigForm.jsx` to include site type in form
- **Acceptance Criteria:**
  - [ ] Filter parameter works on GET /api/sites
  - [ ] Site creation saves site_type correctly
  - [ ] Personal sites don't require nbhd
  - [ ] Project sites require nbhd selection
  - [ ] Badges display correct site type
  - [ ] Form validates based on site type
- **Type:** Frontend + Backend
- **Estimate:** S
- **Reference:** See [SITE-TYPES.md](./SITE-TYPES.md) - Data Model, API Endpoints, and Validation Rules sections
- **Files:**
  - `nbhd/src/components/SiteBuilder/SiteManagementDashboard.jsx` - Add filter
  - `nbhd/src/components/SiteBuilder/SiteConfigForm.jsx` - Add type selector
  - `api/sites.py` - Add site_type filtering
  - `api/models.py` - Update site schema

#### SITES-002: Personal Sites Page
- **Description:** Create dedicated page for viewing and managing personal sites
- **Requirements:**
  - [ ] Create `PersonalSites.jsx` page
  - [ ] Fetch `GET /api/sites?site_type=personal`
  - [ ] Reuse `SiteManagementDashboard` with site_type="personal" filter
  - [ ] Add create button with site type pre-selected
  - [ ] Add route `/sites/personal` to `App.jsx`
  - [ ] Link from user dashboard
  - [ ] Show helpful text explaining personal sites
- **Acceptance Criteria:**
  - [ ] Page loads and displays user's personal sites
  - [ ] Can create new personal site from this page
  - [ ] Can edit/delete existing personal sites
  - [ ] No nbhd selection shown on create
  - [ ] Mobile responsive
- **Type:** Frontend
- **Estimate:** S
- **Reference:** See [SITE-TYPES.md](./SITE-TYPES.md) - UI Patterns and Personal Sites Page sections
- **Files:**
  - `nbhd/src/pages/PersonalSites.jsx` (new)
  - `nbhd/src/App.jsx` - Add route and link

#### SITES-003: Project Sites Page
- **Description:** Create dedicated page for viewing and managing project sites
- **Requirements:**
  - [ ] Create `ProjectSites.jsx` page
  - [ ] Create `ProjectSiteSelector.jsx` component for choosing/filtering by nbhd
  - [ ] Fetch `GET /api/sites?site_type=project`
  - [ ] Allow filtering by nbhd
  - [ ] Reuse `SiteManagementDashboard` with site_type="project" filter
  - [ ] Add create button with site type pre-selected
  - [ ] Add route `/sites/projects` to `App.jsx`
  - [ ] Link from user dashboard and neighborhood pages
  - [ ] Show helpful text explaining project sites
- **Acceptance Criteria:**
  - [ ] Page loads and displays user's project sites
  - [ ] Can filter by neighborhood
  - [ ] Can create new project site (requires nbhd selection)
  - [ ] Can edit/delete existing project sites
  - [ ] Mobile responsive
- **Type:** Frontend
- **Estimate:** S
- **Reference:** See [SITE-TYPES.md](./SITE-TYPES.md) - UI Patterns and Project Sites Page sections
- **Files:**
  - `nbhd/src/pages/ProjectSites.jsx` (new)
  - `nbhd/src/components/ProjectSiteSelector.jsx` (new)
  - `nbhd/src/App.jsx` - Add route and link

---

## Phase 8: Build Pipeline UI Completion 🚀

**Status:** Pending
**Timeline:** Weeks 15-16
**Depends On:** Phase 6 (Build Pipeline - backend is complete, needs frontend UI)

These tickets complete the build pipeline UI for the existing SSG-015 and SSG-016 backend implementations.

#### BUILD-001: Site Build Trigger UI
- **Description:** Add "Deploy Site" button to trigger site builds
- **Requirements:**
  - [ ] Add "Deploy Site" button to `SiteManagementDashboard.jsx`
  - [ ] Call `POST /api/sites/{id}/build` (endpoint exists from SSG-015)
  - [ ] Show loading state during build initialization
  - [ ] Display job_id after successful trigger
  - [ ] Show error message on failures
  - [ ] Disable button while build is in progress
  - [ ] Confirm dialog asking to rebuild
- **Acceptance Criteria:**
  - [ ] Button visible in dashboard for each site
  - [ ] Clicking triggers build (202 Accepted received)
  - [ ] Loading state displays during request
  - [ ] Success message shows with job_id
  - [ ] Error messages clear and helpful
  - [ ] Can't trigger multiple builds simultaneously
- **Type:** Frontend
- **Estimate:** S
- **Reference:** See [BUILD-PIPELINE-UI.md](./BUILD-PIPELINE-UI.md) - BUILD-001 section and Component Specifications
- **Files:**
  - `nbhd/src/components/SiteBuilder/SiteManagementDashboard.jsx` - Add button and handler
  - `nbhd/src/components/SiteBuilder/BuildTriggerButton.jsx` (new, optional)

#### BUILD-002: Build Status Poller
- **Description:** Component to poll and display build status and logs
- **Requirements:**
  - [ ] Create `BuildStatusPoller.jsx` component
  - [ ] Poll `GET /api/sites/{id}/builds/{job_id}` every 5 seconds
  - [ ] Display progress: pending → running → completed/failed
  - [ ] Show build logs (tail last 50 lines)
  - [ ] Show error messages on failure
  - [ ] Auto-refresh until completion or timeout
  - [ ] Manual refresh button
  - [ ] Stop polling once build completes
  - [ ] Handle network errors gracefully
- **Acceptance Criteria:**
  - [ ] Status updates every 5 seconds while building
  - [ ] Shows correct status text (pending, running, completed, failed)
  - [ ] Logs display and update as build progresses
  - [ ] Stops polling once build completes
  - [ ] Error messages display on build failure
  - [ ] Network errors handled without crashing
  - [ ] Can manually refresh status
- **Type:** Frontend
- **Estimate:** M
- **Reference:** See [BUILD-PIPELINE-UI.md](./BUILD-PIPELINE-UI.md) - BUILD-002 section, Status Lifecycle, and Component Specifications
- **Files:**
  - `nbhd/src/components/SiteBuilder/BuildStatusPoller.jsx` (new)
  - `nbhd/src/hooks/useBuildPoller.js` (new, optional - custom hook)

#### BUILD-003: Build History Dashboard
- **Description:** Component to display past builds and their status
- **Requirements:**
  - [ ] Create `BuildHistory.jsx` component
  - [ ] Fetch `GET /api/sites/{id}/builds` (endpoint exists from SSG-015)
  - [ ] Display table: Status, Started, Duration, Actions
  - [ ] Show build status with color coding (success=green, failed=red, pending=yellow)
  - [ ] Link to logs for each build
  - [ ] Pagination for large build histories
  - [ ] Sort by date (newest first)
  - [ ] Add to `SiteManagementDashboard` or separate page
  - [ ] Show last successful/failed build info
- **Acceptance Criteria:**
  - [ ] Table displays all builds with correct info
  - [ ] Status colors are visible and correct
  - [ ] Pagination works with >10 builds
  - [ ] Sorting by date works
  - [ ] Log links are clickable
  - [ ] Mobile responsive layout
- **Type:** Frontend
- **Estimate:** M
- **Reference:** See [BUILD-PIPELINE-UI.md](./BUILD-PIPELINE-UI.md) - BUILD-003 section and Component Specifications
- **Files:**
  - `nbhd/src/components/SiteBuilder/BuildHistory.jsx` (new)
  - `nbhd/src/components/SiteBuilder/SiteManagementDashboard.jsx` - Add build history section

---

## Phase 9: Full AT Protocol Federation 🌐

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
  - [ ] Endpoint: `GET /api/user/export/atproto`
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

## Priority Order & Timeline

**NOTE:** Tickets are organized above in 9-phase execution order. This section provides week-by-week and phase-by-phase timeline.

### ✅ Phase 1: MVP Foundation (Weeks 1-4) - COMPLETE
Core platform foundation
- [x] BlueSky OAuth authentication
- [x] User profiles with BlueSky sync
- [x] Neighborhood creation and membership
- [x] DynamoDB single-table design
- [x] Terraform AWS deployment
- [x] React frontend with basic pages

### 🔧 Phase 2: AT Protocol Foundation (Weeks 5-6) **← CRITICAL: DO THIS FIRST**
**Depends on:** Phase 1
- [ ] ATP-FOUND-001 (AT Protocol Record Schema in DynamoDB)
- [ ] ATP-FOUND-002 (CID Generation Utilities)
- [ ] ATP-FOUND-003 (Record Key/rkey Generation)
- [ ] ATP-FOUND-004 (Basic Record CRUD Operations)

**Why Phase 2 is critical:** All subsequent phases depend on AT Protocol record storage. Build this foundation first.

### 📋 Phase 3: Template System & Site Config APIs (Weeks 6-7)
**Depends on:** Phase 2 (AT Protocol Foundation)
- [ ] SSG-001 (Template Gallery UI)
- [ ] SSG-002 (Site Configuration Form)
- [ ] SSG-004 (Site Management Dashboard)
- [ ] SSG-005 (Template Management API)
- [ ] SSG-006 (Site Configuration Storage API)

### 📐 Phase 4: Template Analysis System (Weeks 7-8)
**Depends on:** Phase 3 (Template APIs)
**Can Run In Parallel With:** Phase 5 (Content Management)
- [ ] SSG-007 (Template Schema Inference Research)
- [ ] SSG-008 (Custom Template Registration API)
- [ ] SSG-009 (Template Analyzer Lambda Function)
- [ ] SSG-010 (Custom Template Selection UI)

### ✍️ Phase 5: Content Management (Weeks 8-9)
**Depends on:** Phase 2 (AT Protocol Foundation) and Phase 3 (Template APIs)
- [ ] SSG-011 (Content Records API)
- [ ] SSG-012 (Content Editor UI)
- [ ] SSG-013 (Dual Record Creation - BlueSky Integration)
- [ ] SSG-014 (Smart Content Prefilling)

### 🏗️ Phase 6: Build Pipeline & Deployment (Weeks 10-12)
**Depends on:** Phase 5 (Content Management - content must exist before building)
- [ ] SSG-015 (Site Build Trigger API)
- [ ] SSG-016 (11ty Lambda Build Function)
- [x] SSG-017 (Subdomain Routing Setup) - COMPLETED 2026-01-31
- [x] SSG-018 (Site Export to ZIP) - COMPLETED 2026-02-01
- Infrastructure: SSG-009-INFRA, SSG-016-INFRA, SSG-015-INFRA

### 📝 Phase 7: Nbhd CMS & Admin Features (Weeks 13-15)
**Depends on:** Phase 5 (Content Management) and Phase 6 (Build Pipeline)

Backend Foundation:
- [ ] NBHD-001 (Nbhd DID & Data Model Enhancement)
- [ ] NBHD-002 (Nbhd Content API)

Frontend - Core CMS:
- [ ] NBHD-003 (Welcome Page UI)
- [ ] NBHD-004 (Admin Page UI)
- [ ] NBHD-005 (CMS View for AT Protocol Data)

Frontend - Site Management:
- [ ] SITES-001 (Site Type Distinction)
- [ ] SITES-002 (Personal Sites Page)
- [ ] SITES-003 (Project Sites Page)

### 🚀 Phase 8: Build Pipeline UI Completion (Weeks 15-16)
**Depends on:** Phase 6 (Build Pipeline backend is complete)
- [ ] BUILD-001 (Site Build Trigger UI)
- [ ] BUILD-002 (Build Status Poller)
- [ ] BUILD-003 (Build History Dashboard)

### 🌐 Phase 9: Full AT Protocol Federation (Weeks 17+)
**Depends on:** Phase 2 (AT Protocol Foundation is in place)
- [ ] ATP-001 (AT Protocol PDS Research & Design)
- [ ] ATP-002 (BlueSky Integration Review)
- [ ] ATP-003 (DID Registration for Members)
- [ ] ATP-004 (DID to BlueSky Handle Mapping)
- [ ] ATP-005 (Personal Data Repository Implementation)
- [ ] ATP-006 (Data Sync from BlueSky Firehose)
- [ ] ATP-007 (AT Protocol Data Export)
- [ ] ATP-008 (Data Migration Between nbhds)
- [ ] ATP-009 (PDS Federation Setup)
- [ ] ATP-010 (Cross-PDS Neighborhood Lists)

### 📝 Ongoing (Throughout All Phases)
- [ ] TEST-001 (Integration Tests)
- [ ] DOC-001 (Static Sites User Guide)
- [ ] DOC-002 (AT Protocol PDS Architecture Document)

### 🎨 Optional Features
- [ ] SSG-003 (WASM Preview for client-side building - nice to have)

---

## Ticket Labels (for GitHub)

- `phase-2` - Phase 2 feature
- `static-sites` - Static site generation
- `atproto` - AT Protocol / PDS
- `backend` - Backend/API work
- `frontend` - Frontend/React work
- `infrastructure` - Infrastructure/Lambda/Terraform
- `template` - 11ty template work
- `research` - Research/investigation needed
- `testing` - Tests
- `docs` - Documentation
- `priority-high` - Must do
- `priority-medium` - Should do
- `priority-low` - Nice to have

---

**End of Tickets Document**
