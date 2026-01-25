# nbhd.city Development Tickets

**Last Updated:** 2026-01-21
**Phase:** 2 (Static Sites + AT Protocol PDS)
**Priority:** High

---

## Phase 2 Overview

Phase 2 focuses on two major features:
1. **Static Site Generation** - Members can create beautiful static sites using 11ty templates
2. **AT Protocol PDS** - Each nbhd becomes a full Personal Data Server on the AT Protocol network

### Relevant Documentation for Phase 2

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and tech stack
- **[DATABASE.md](./DATABASE.md)** - DynamoDB schema for static sites and PDS data
- **[API.md](./API.md)** - REST endpoints for templates, sites, and PDS
- **[FRONTEND.md](./FRONTEND.md)** - React components for site builder
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Lambda builds, S3, CloudFront, Terraform
- **[SECURITY.md](./SECURITY.md)** - DID key management, authentication
- **[ATPROTOCOL.md](./ATPROTOCOL.md)** - PDS implementation details
- **[TESTING.md](./TESTING.md)** - Testing strategy for Phase 2

---

## Phase 2a: MVP Foundation ✅ COMPLETE

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

## Phase 2b: AT Protocol Foundation 🔧

**Critical:** This foundation must be built before content management. The build pipeline depends on content being stored as AT Protocol records.

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

## Phase 2c: Content Management ✍️

**Depends on:** Phase 2b (AT Protocol Foundation)

### Content Records & Editor

#### SSG-011: Content Records API
- **Description:** API for creating and managing content as AT Protocol records
- **Requirements:**
  - [ ] `POST /api/sites/{id}/content` - Create blog post/page
  - [ ] `GET /api/sites/{id}/content` - List all content
  - [ ] `GET /api/sites/{id}/content/{rkey}` - Get specific content
  - [ ] `PUT /api/sites/{id}/content/{rkey}` - Update content
  - [ ] `DELETE /api/sites/{id}/content/{rkey}` - Delete content
  - [ ] Store as AT Protocol records (app.nbhd.blog.post)
  - [ ] Use CID generation from ATP-FOUND-002
  - [ ] Use rkey generation from ATP-FOUND-003
  - [ ] Use record CRUD from ATP-FOUND-004
- **Acceptance Criteria:**
  - [ ] Content stored in DynamoDB with AT Protocol schema
  - [ ] CID generation works correctly
  - [ ] Record URIs follow at:// format
  - [ ] Query by site_id works
  - [ ] Pagination implemented
- **Type:** Backend
- **Estimate:** M
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

## Phase 2d: Template Analysis System 📐

**Can run in parallel with Phase 2c**

### Template Analysis System

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
  - [ ] Async invocation of analyzer Lambda
- **Acceptance Criteria:**
  - [x] Valid GitHub URLs accepted
  - [x] Invalid URLs rejected with error
  - [x] Returns 202 Accepted with template_id
  - [x] Status polling works correctly
  - [x] Template record created in DynamoDB
- **Type:** Backend
- **Estimate:** M
- **Reference:** See [TEMPLATE_ANALYSIS.md](./TEMPLATE_ANALYSIS.md)
- **Status:** MOSTLY COMPLETE (Lambda invocation in SSG-009)
- **Tests:** `api/tests/integration/test_custom_templates.py` (29 tests passing)

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

## Phase 2e: Build Pipeline & Deployment 🏗️

**Depends on:** Phase 2c (Content Management - SSG-011)

#### SSG-015: Site Build Trigger API
- **Description:** Endpoint to initiate Lambda build process
- **Requirements:**
  - [ ] `POST /api/sites/{id}/build` - Trigger build
  - [ ] `GET /api/sites/{id}/builds/{job_id}` - Get build status
  - [ ] `GET /api/sites/{id}/builds` - List build history
  - [ ] Returns build status/job ID immediately (202 Accepted)
  - [ ] Validates user owns the site
  - [ ] Create build job record in DynamoDB
  - [ ] Invoke build Lambda asynchronously
  - [ ] Store build history (timestamp, status, log URL)
- **Acceptance Criteria:**
  - [ ] Returns 202 Accepted with job ID
  - [ ] Build job created in DynamoDB
  - [ ] Lambda invoked successfully
  - [ ] Status polling works
  - [ ] Proper error handling for invalid sites
- **Type:** Backend
- **Estimate:** M

#### SSG-016: 11ty Lambda Build Function
- **Description:** Lambda function to build static sites from templates and content
- **Requirements:**
  - [ ] Clone template repo from GitHub to /tmp
  - [ ] Query content records from DynamoDB (app.nbhd.blog.post)
  - [ ] Transform AT Protocol records to 11ty data format
  - [ ] Write _data/posts.json, _data/site.json
  - [ ] Run npm install (with timeout)
  - [ ] Run npm run build (11ty build)
  - [ ] Upload _site/ output to S3
  - [ ] Invalidate CloudFront cache
  - [ ] Update build job status in DynamoDB
  - [ ] Log errors to CloudWatch
- **Acceptance Criteria:**
  - [ ] Successfully builds sites with blog content
  - [ ] Output correctly uploaded to S3
  - [ ] CloudFront serves latest version
  - [ ] Build errors logged and returned
  - [ ] Completes within 5 minute timeout
  - [ ] Handles build failures gracefully
- **Type:** Backend/Lambda/Infrastructure
- **Estimate:** XL

#### SSG-017: Subdomain Routing Setup
- **Description:** Configure Route53 + CloudFront for subdomain deployment
- **Requirements:**
  - [ ] Create wildcard DNS record (`*.nbhd.city`)
  - [ ] Create CloudFront distribution for subdomains
  - [ ] Map `{subdomain}.nbhd.city` → S3 bucket paths
  - [ ] Configure origin routing based on subdomain
  - [ ] SSL/TLS certificates for wildcard domain
  - [ ] Terraform code for DNS infrastructure
- **Acceptance Criteria:**
  - [ ] Wildcard DNS resolves correctly
  - [ ] CloudFront serves correct S3 path per subdomain
  - [ ] Multiple subdomains work independently
  - [ ] HTTPS works for all subdomains
  - [ ] 404 handling for non-existent subdomains
- **Type:** Infrastructure
- **Estimate:** L

#### SSG-018: Site Export to ZIP
- **Description:** Generate downloadable ZIP of built site files
- **Requirements:**
  - [ ] Endpoint: `GET /api/sites/{id}/export`
  - [ ] Downloads all static files from S3 as ZIP
  - [ ] Includes README with deployment instructions
  - [ ] Users can self-host the generated site anywhere
  - [ ] Include source content (markdown) as backup
- **Acceptance Criteria:**
  - [ ] ZIP contains all necessary files
  - [ ] ZIP is downloadable and extractable
  - [ ] Can be deployed to any static host (Netlify, Vercel, etc.)
  - [ ] README explains how to deploy
  - [ ] File structure is clear
- **Type:** Backend
- **Estimate:** S

---

## Phase 2f: Polish & Optional Features 🎨

### Client-Side Preview

#### SSG-003: Integrate 11ty WASM for Client-Side Preview
- **Description:** Implement Eleventy compiled to WebAssembly for instant in-browser previews
- **Requirements:**
  - [ ] Research/integrate 11ty WASM build
  - [ ] Load WASM in browser when user edits config
  - [ ] Render preview HTML without server calls
  - [ ] Display preview in side panel or modal
  - [ ] Handle WASM loading errors gracefully
- **Acceptance Criteria:**
  - [ ] Preview updates within 1 second of config change
  - [ ] WASM successfully generates HTML output
  - [ ] Works offline (no server required for preview)
  - [ ] Graceful fallback if WASM unavailable
- **Type:** Feature
- **Estimate:** L (first time integrating WASM)
- **Priority:** Optional - Nice to have but not critical for MVP

---

## Phase 3: AT Protocol Federation & Full PDS 🌐

**NOTE:** The foundation (ATP-FOUND tickets) has already been completed in Phase 2b. These tickets implement the full federated PDS features.

### AT Protocol PDS Tickets

### Research & Specification

#### ATP-001: AT Protocol PDS Research & Design
- **Description:** Deep dive into AT Protocol and design nbhd as PDS
- **Requirements:**
  - [ ] Study AT Protocol documentation
  - [ ] Understand PDS (Personal Data Server) spec
  - [ ] Design: How do nbhd members register DIDs?
  - [ ] Plan: How is neighborhood data federated?
  - [ ] Create ADR (Architecture Decision Record)
- **Acceptance Criteria:**
  - [ ] Clear understanding of PDS requirements
  - [ ] Design document for AT Protocol integration
  - [ ] Decision record on implementation approach
- **Type:** Research
- **Estimate:** L

#### ATP-002: BlueSky Integration Review
- **Description:** Review current BlueSky OAuth and plan AT Protocol sync
- **Requirements:**
  - [ ] Audit current BlueSky integration
  - [ ] Map BlueSky user profiles to AT Protocol DIDs
  - [ ] Plan sync of profile data
  - [ ] Identify gaps in current implementation
- **Acceptance Criteria:**
  - [ ] Clear mapping between BlueSky profiles and DIDs
  - [ ] Plan for keeping data in sync
- **Type:** Research
- **Estimate:** M

### DID & Identity

#### ATP-003: DID Registration for Members
- **Description:** Implement DID (Decentralized Identifier) registration for nbhd members
- **Requirements:**
  - [ ] Generate unique DID for each member
  - [ ] Store DID in user profile (DynamoDB)
  - [ ] DID format: `did:plc:{key}` or similar
  - [ ] Create keypair for member account
  - [ ] Store keys securely (AWS Secrets Manager or KMS)
- **Acceptance Criteria:**
  - [ ] Each member gets unique DID on signup
  - [ ] DID stored and retrievable
  - [ ] Keypair generated and stored securely
  - [ ] Can verify ownership of DID
- **Type:** Backend
- **Estimate:** M

#### ATP-004: DID to BlueSky Handle Mapping
- **Description:** Link member DIDs to BlueSky handles
- **Requirements:**
  - [ ] Member DIDs linked to BlueSky DIDs
  - [ ] Verify BlueSky ownership (using OAuth)
  - [ ] Store mapping in DynamoDB
  - [ ] Support profile sync from BlueSky
- **Acceptance Criteria:**
  - [ ] Member DID maps to BlueSky DID
  - [ ] Profile data syncs from BlueSky
  - [ ] Verification is cryptographic
- **Type:** Backend
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

**NOTE:** Tickets are now listed above in execution order. This section provides the week-by-week timeline.

### ✅ Phase 2a: MVP Foundation (Weeks 1-4) - COMPLETE
- [x] SSG-001 (Template Gallery UI)
- [x] SSG-002 (Site Configuration Form)
- [x] SSG-004 (Site Management Dashboard)
- [x] SSG-005 (Template Management API)
- [x] SSG-006 (Site Configuration Storage API)

### 🔧 Phase 2b: AT Protocol Foundation (Weeks 5-6) **← CRITICAL: DO THIS FIRST**
- [ ] ATP-FOUND-001 (AT Protocol Record Schema in DynamoDB)
- [ ] ATP-FOUND-002 (CID Generation Utilities)
- [ ] ATP-FOUND-003 (Record Key/rkey Generation)
- [ ] ATP-FOUND-004 (Basic Record CRUD Operations)

**Why this comes first:** The entire build pipeline depends on content being stored as AT Protocol records. Build this foundation before creating content.

### ✍️ Phase 2c: Content Management (Weeks 6-7)
- [ ] SSG-011 (Content Records API) ← Uses ATP-FOUND utilities
- [ ] SSG-012 (Content Editor UI)
- [ ] SSG-013 (Dual Record Creation - BlueSky Integration)
- [ ] SSG-014 (Smart Content Prefilling)

### 📐 Phase 2d: Template Analysis System (Weeks 7-8) **← Can run parallel with 2c**
- [x] SSG-007 (Template Schema Inference Research)
- [x] SSG-008 (Custom Template Registration API)
- [x] SSG-009 (Template Analyzer Lambda Function)
- [x] SSG-010 (Custom Template Selection UI)

### 🏗️ Phase 2e: Build Pipeline & Deployment (Weeks 8-10)
- [ ] SSG-015 (Site Build Trigger API)
- [ ] SSG-016 (11ty Lambda Build Function) ← Queries content from ATP-FOUND
- [ ] SSG-017 (Subdomain Routing Setup)
- [ ] SSG-018 (Site Export to ZIP)

### 🎨 Phase 2f: Polish & Optional Features (Week 11)
- [ ] SSG-003 (WASM Preview - Optional, nice to have)

### 🌐 Phase 3: AT Protocol Federation (Weeks 12+)
Full PDS features (foundation already built in Phase 2b):
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
- [ ] TEST-001 (Phase 2 Integration Tests)
- [ ] DOC-001 (Static Sites User Guide)
- [ ] DOC-002 (AT Protocol PDS Architecture Document)

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
