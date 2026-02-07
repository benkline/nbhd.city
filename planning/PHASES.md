# Development Roadmap & Phases

**Status:** Phase 2 in progress
**Last Updated:** 2026-02-01
**Phase Structure:** 9 sequential phases with clear dependencies

---

## Phase 1: MVP Foundation ✅ COMPLETE

**Status:** Shipped and working
**Timeline:** Weeks 1-4

Core platform foundation - users can create neighborhoods and join BlueSky communities.

- ✅ BlueSky OAuth authentication
- ✅ User profiles with BlueSky sync
- ✅ Neighborhood creation and membership
- ✅ DynamoDB single-table design
- ✅ Terraform AWS deployment
- ✅ React frontend with basic pages
- ✅ Admin role basics

**Key Completion:** All foundational infrastructure in place for subsequent phases.

---

## Phase 2: AT Protocol Foundation 🔧

**Status:** In Progress
**Timeline:** Weeks 5-6
**Critical Path:** Must complete before content management

Foundation layer for AT Protocol record storage and management. This is the critical dependency for all subsequent content-based phases.

### Core Features:

- Record schema extension in DynamoDB for AT Protocol records
- CID (Content Identifier) generation for record immutability
- TID (Timestamp Identifier) for record keys
- Basic CRUD operations for AT Protocol records
- Foundation for content storage and federation

**Why This Phase:** All content management and site building depends on content being stored as AT Protocol records. Build this foundation before creating content managers or build pipelines.

**Key Deliverables:**
- ATP-FOUND-001: Record schema in DynamoDB
- ATP-FOUND-002: CID generation utilities
- ATP-FOUND-003: Record key (rkey) generation
- ATP-FOUND-004: Basic record CRUD operations

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase 3: Template System & Site Config APIs 📋

**Status:** Pending
**Timeline:** Weeks 6-7
**Depends On:** Phase 2 (AT Protocol Foundation)

API layer for template discovery, management, and site configuration. This provides the infrastructure for the site builder.

### Core Features:

- Template discovery and metadata API
- Site configuration storage API
- Site management endpoints
- Template schema validation

**Why This Phase:** Establishes the API foundation for content creation. Templates define structure, and configs define instances of that structure.

**Key Deliverables:**
- SSG-001: Template Gallery UI
- SSG-002: Site Configuration Form
- SSG-004: Site Management Dashboard
- SSG-005: Template Management API
- SSG-006: Site Configuration Storage API

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase 4: Template Analysis System 📐

**Status:** Pending
**Timeline:** Weeks 7-8
**Depends On:** Phase 3 (Template System APIs)
**Can Run In Parallel With:** Phase 5 (Content Management)

Research and implementation of automated template analysis. Allows users to register custom templates from GitHub and automatically infer their configuration schema.

### Core Features:

- Template schema inference from frontmatter
- Custom template registration from GitHub
- Template analyzer Lambda function
- Custom template selection UI

**Why This Phase:** Enables power users to bring custom templates while maintaining schema validation. Runs in parallel with content management but depends on basic template APIs.

**Key Deliverables:**
- SSG-007: Template Schema Inference Research
- SSG-008: Custom Template Registration API
- SSG-009: Template Analyzer Lambda Function
- SSG-010: Custom Template Selection UI

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase 5: Content Management ✍️

**Status:** Pending
**Timeline:** Weeks 8-9
**Depends On:** Phase 2 (AT Protocol Foundation) and Phase 3 (Template APIs)

Content creation and management layer. Users can create, edit, and publish content stored as AT Protocol records. Integrates with BlueSky for dual posting.

### Core Features:

- Content records API (using AT Protocol schema)
- Rich content editor UI
- Dual record creation for BlueSky integration
- Smart content prefilling from user profiles

**Why This Phase:** Once template infrastructure is in place, this provides the UI and APIs for creating content. Content is the substance of static sites.

**Key Deliverables:**
- SSG-011: Content Records API
- SSG-012: Content Editor UI Component
- SSG-013: Dual Record Creation (BlueSky Integration)
- SSG-014: Smart Content Prefilling

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase 6: Build Pipeline & Deployment 🏗️

**Status:** Pending
**Timeline:** Weeks 10-12
**Depends On:** Phase 5 (Content Management) - must have content to build

Server-side build execution and deployment infrastructure. Transforms content records and templates into static HTML and deploys to subdomains.

### Core Features:

- Build trigger API and job tracking
- 11ty Lambda build function
- S3 bucket and CloudFront CDN setup
- Subdomain routing (*.nbhd.city)
- Site export to ZIP for self-hosting

**Why This Phase:** Once content is being created, this takes that content and templates, builds them together, and deploys the result. Content must exist before building.

**Key Deliverables:**
- SSG-015: Site Build Trigger API
- SSG-016: 11ty Lambda Build Function
- SSG-017: Subdomain Routing Setup
- SSG-018: Site Export to ZIP
- Infrastructure for Lambdas and CDN

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase 7: Nbhd CMS & Admin Features 📝

**Status:** Pending
**Timeline:** Weeks 13-15
**Depends On:** Phase 5 (Content Management) and Phase 6 (Build Pipeline)

Neighborhood-level CMS allowing neighborhood owners to manage community content, welcome pages, announcements, and member site portfolios.

### Core Features:

- Neighborhood DID and data model enhancement
- Neighborhood content API (welcome, announcements)
- Welcome page UI
- Admin dashboard for neighborhood owners
- CMS view for all AT Protocol records
- Site type distinction (personal vs project)
- Personal and project site pages

**Why This Phase:** Once individual site content and builds work, scale to neighborhood-level administration where communities can curate welcome pages and member announcements.

**Key Deliverables:**
- NBHD-001: Nbhd DID & Data Model Enhancement
- NBHD-002: Nbhd Content API
- NBHD-003: Welcome Page UI
- NBHD-004: Admin Page UI
- NBHD-005: CMS View for AT Protocol Data
- SITES-001: Site Type Distinction
- SITES-002: Personal Sites Page
- SITES-003: Project Sites Page

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase 8: Build Pipeline UI Completion 🚀

**Status:** Pending
**Timeline:** Weeks 15-16
**Depends On:** Phase 6 (Build Pipeline APIs are complete)

Frontend UI completion for build pipeline. Provides user-visible interfaces for triggering builds, monitoring progress, and viewing history.

### Core Features:

- Build trigger button in site dashboard
- Real-time build status polling
- Build logs and error display
- Build history dashboard

**Why This Phase:** Backend build pipeline already exists from Phase 6, but users need frontend UI to interact with it. This completes the user-facing experience.

**Key Deliverables:**
- BUILD-001: Site Build Trigger UI
- BUILD-002: Build Status Poller
- BUILD-003: Build History Dashboard

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase 9: Full AT Protocol Federation 🌐

**Status:** Pending
**Timeline:** Weeks 17+
**Depends On:** Phase 2 (AT Protocol Foundation is in place)

Complete AT Protocol federation and Personal Data Server (PDS) implementation. Neighborhoods become federated PDS nodes that can exchange data with BlueSky and other AT Protocol services.

### Core Features:

- DID registration and management for members
- DID to BlueSky handle mapping
- Full PDS implementation and federation
- Data sync from BlueSky firehose
- Data export for portability
- Data migration between nbhds
- Cross-PDS neighborhood member lists

**Why This Phase:** Once core platform functionality is working, implement full federation capabilities. This is the advanced feature set that aligns with nbhd.city's philosophy of data ownership and interoperability.

**Key Deliverables:**
- ATP-001: AT Protocol PDS Research & Design
- ATP-002: BlueSky Integration Review
- ATP-003: DID Registration for Members
- ATP-004: DID to BlueSky Handle Mapping
- ATP-005: Personal Data Repository (PDS) Implementation
- ATP-006: Data Sync from BlueSky Firehose
- ATP-007: AT Protocol Data Export
- ATP-008: Data Migration Between nbhds
- ATP-009: PDS Federation Setup
- ATP-010: Cross-PDS Neighborhood Lists

See [tickets.md](../tickets/tickets.md) for detailed specifications.

---

## Phase Dependencies Summary

```
Phase 1: MVP Foundation ✅
    ↓
Phase 2: AT Protocol Foundation (foundational for all)
    ↓
├─ Phase 3: Template System & APIs
│   ↓
├─ Phase 4: Template Analysis System (parallel with Phase 5)
│   ↓
├─ Phase 5: Content Management
│   ↓
├─ Phase 6: Build Pipeline & Deployment
│   ↓
├─ Phase 7: Nbhd CMS & Admin Features
│   ↓
├─ Phase 8: Build Pipeline UI Completion
    ↓
Phase 9: Full AT Protocol Federation (can run in parallel with earlier phases)
```

---

## Key Strategic Decisions

| Decision | Status | Reasoning |
|----------|--------|-----------|
| 9-phase sequential structure | ✅ Locked | Clear execution order with explicit dependencies |
| Phase 2 first (AT Protocol Foundation) | ✅ Locked | Critical dependency for all content management |
| Build pipeline after content | ✅ Locked | Content must exist before building sites |
| Admin features after core functionality | ✅ Locked | Get personal sites working first, then community features |
| Federation as final phase | ✅ Locked | Advanced feature after core platform is stable |

---

## How to Use This Roadmap

1. **For Direction**: Use this to understand WHAT we're building and WHEN
2. **For Execution**: See [tickets.md](../tickets/tickets.md) for HOW (specific tickets and sequencing)
3. **For Details**: Reference domain-specific docs (ARCHITECTURE.md, DATABASE.md, etc.)

**Next Step**: Execute Phase 2 (AT Protocol Foundation) - ATP-FOUND-001 through ATP-FOUND-004
