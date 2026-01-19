# nbhd.city Development Tickets

**Last Updated:** 2026-01-10
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

## Static Site Generation Tickets

### Frontend: Template System & UI

#### SSG-001: Create Template Gallery UI Component
- **Description:** Build a `TemplateGallery` component that displays available 11ty templates
- **Requirements:**
  - [ ] Fetch templates from API (`GET /api/templates`)
  - [ ] Display template cards with preview images, name, description
  - [ ] "Select template" button to start site configuration
  - [ ] Show template tags (blog, project, newsletter, etc)
- **Acceptance Criteria:**
  - [ ] Component renders templates from API
  - [ ] Clicking "Select" navigates to config form
  - [ ] Mobile-responsive grid layout
  - [ ] Error handling for API failures
- **Type:** Feature
- **Estimate:** M

#### SSG-002: Build Site Configuration Form
- **Description:** Create dynamic form generator for template-specific config fields
- **Requirements:**
  - [ ] Read `config.schema.json` from selected template
  - [ ] Generate form inputs based on schema (text, textarea, color picker, etc)
  - [ ] Real-time preview updates as user types
  - [ ] Save draft configurations locally (localStorage)
  - [ ] "Preview" and "Deploy" buttons
- **Acceptance Criteria:**
  - [ ] Form renders all schema fields correctly
  - [ ] Draft auto-saves every 30 seconds
  - [ ] Validation matches schema constraints
  - [ ] Form persists across page refreshes
- **Type:** Feature
- **Estimate:** M

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

#### SSG-004: Site Management Dashboard
- **Description:** Build dashboard to view/manage user's static sites
- **Requirements:**
  - [ ] List all user's sites with status (draft, building, published)
  - [ ] Show site URL and deployment status
  - [ ] "Edit" button to re-configure
  - [ ] "Delete" button with confirmation
  - [ ] "View Live" link to published site
- **Acceptance Criteria:**
  - [ ] Displays all user sites from API
  - [ ] Can edit existing sites
  - [ ] Delete removes site from dashboard
  - [ ] Links work correctly
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

#### SSG-007: Site Build Trigger API
- **Description:** Endpoint to initiate Lambda build process
- **Requirements:**
  - [ ] `POST /api/sites/{id}/build` - Trigger build
  - [ ] Returns build status/job ID immediately
  - [ ] Validates user owns the site
  - [ ] Returns build URL once complete
  - [ ] Store build history (timestamp, status, log URL)
- **Acceptance Criteria:**
  - [ ] Returns 202 Accepted with job ID
  - [ ] Build can be monitored via polling
  - [ ] Proper error handling for invalid sites
  - [ ] User sees build progress
- **Type:** Backend
- **Estimate:** M

### Lambda/Infrastructure: Build System

#### SSG-008: 11ty Lambda Build Function
- **Description:** Create Lambda function to build sites server-side
- **Requirements:**
  - [ ] Clone template repo from Git
  - [ ] Merge user config JSON into template data files
  - [ ] Run 11ty build process
  - [ ] Upload output to S3 bucket (per-site)
  - [ ] Invalidate CloudFront cache
  - [ ] Return signed URL to built site
  - [ ] Log errors to CloudWatch
- **Acceptance Criteria:**
  - [ ] Successfully builds all 3 template types
  - [ ] Output correctly uploaded to S3
  - [ ] CloudFront serves latest version
  - [ ] Build errors logged and returned to user
  - [ ] Build timeout gracefully (30s limit)
- **Type:** Backend/Infrastructure
- **Estimate:** L

#### SSG-009: Subdomain Routing Setup
- **Description:** Configure Route53 + CloudFront for subdomain deployment
- **Requirements:**
  - [ ] Create wildcard DNS record (`*.nbhd.city`)
  - [ ] Create CloudFront distribution for subdomains
  - [ ] Map `{username}.nbhd.city` → S3 bucket for that user
  - [ ] Support custom domains (future: DNS validation)
  - [ ] Terraform code for DNS infrastructure
- **Acceptance Criteria:**
  - [ ] Wildcard DNS resolves correctly
  - [ ] CloudFront serves user's S3 bucket
  - [ ] Multiple subdomains work independently
  - [ ] Proper SSL/TLS for all subdomains
- **Type:** Infrastructure
- **Estimate:** M

#### SSG-010: Site Export to ZIP
- **Description:** Generate downloadable ZIP of built site files
- **Requirements:**
  - [ ] Endpoint: `GET /api/sites/{id}/export`
  - [ ] Downloads all static files from S3 as ZIP
  - [ ] Includes README with deployment instructions
  - [ ] Users can self-host the generated site anywhere
- **Acceptance Criteria:**
  - [ ] ZIP contains all necessary files
  - [ ] ZIP is downloadable and extractable
  - [ ] Can be deployed to any static host
  - [ ] File structure is clear
- **Type:** Backend
- **Estimate:** S

### Templates: Initial Implementations

#### SSG-011: Blog Template (11ty)
- **Description:** Personal blog template with posts, tags, and RSS
- **Requirements:**
  - [ ] Homepage with recent posts
  - [ ] Individual post pages (Markdown)
  - [ ] Tag archive pages
  - [ ] RSS feed generation
  - [ ] Config schema: site title, author, description, accent color
  - [ ] Responsive mobile-first design
- **Acceptance Criteria:**
  - [ ] All pages render correctly
  - [ ] Posts display from data files
  - [ ] RSS feed is valid
  - [ ] Looks good on mobile/tablet/desktop
- **Type:** Template
- **Estimate:** M

#### SSG-012: Project Showcase Template (11ty)
- **Description:** Team project page with gallery and contributors
- **Requirements:**
  - [ ] Project overview
  - [ ] Team member cards
  - [ ] Image gallery
  - [ ] Project status/progress
  - [ ] Config schema: project name, description, team list, gallery images
- **Acceptance Criteria:**
  - [ ] Team members display correctly
  - [ ] Gallery images load
  - [ ] Mobile responsive
  - [ ] Professional appearance
- **Type:** Template
- **Estimate:** M

#### SSG-013: Newsletter Archive Template (11ty)
- **Description:** Email newsletter archive with latest/past issues
- **Requirements:**
  - [ ] Latest issue featured
  - [ ] Archive of past issues
  - [ ] Email signup form
  - [ ] Mobile-optimized layout
  - [ ] Config schema: title, description, signup URL
- **Acceptance Criteria:**
  - [ ] Archives display correctly
  - [ ] Form submits properly
  - [ ] Optimized for mobile readers
- **Type:** Template
- **Estimate:** M

---

## AT Protocol PDS Tickets

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

## Priority Order (Recommended Sequence)

### Week 1-2: Foundation
- [x] SSG-005 (Template API)
- [x] SSG-006 (Site Config API)
- [ ] ATP-001 (AT Protocol Research)

### Week 3-4: Frontend
- [ ] SSG-001 (Template Gallery)
- [ ] SSG-002 (Config Form)
- [ ] SSG-004 (Site Dashboard)

### Week 5-6: Build System
- [ ] SSG-008 (Lambda Build)
- [ ] SSG-009 (Subdomain Routing)
- [ ] SSG-007 (Build Trigger API)

### Week 7-8: Templates
- [ ] SSG-011 (Blog Template)
- [ ] SSG-012 (Project Template)
- [ ] SSG-013 (Newsletter Template)

### Week 9-10: Preview & Export
- [ ] SSG-003 (WASM Preview)
- [ ] SSG-010 (Site Export)

### Week 11+: AT Protocol Core
- [ ] ATP-003 (DID Registration)
- [ ] ATP-004 (BlueSky Mapping)
- [ ] ATP-005 (PDS Implementation)
- [ ] ATP-006 (Firehose Sync)

### Ongoing
- [ ] TEST-001 (Testing throughout)
- [ ] DOC-001, DOC-002 (Documentation)

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
