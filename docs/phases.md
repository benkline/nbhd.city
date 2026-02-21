# Development Roadmap & Phases

9-phase plan for building nbhd.city from MVP to full AT Protocol federation.

## Overview

**Status:** Phase 2 (AT Protocol Foundation) in progress
**Last Updated:** 2026-02-21
**Structure:** Sequential phases with clear dependencies

The roadmap ensures features are built in the right order—foundational work first, advanced features after core stability.

## Phase 1: MVP Foundation ✅ COMPLETE

**Timeline:** Weeks 1-4
**Status:** Shipped and working

Core platform foundation where users can create neighborhoods and authenticate.

### Completed Features
- ✅ BlueSky OAuth authentication
- ✅ User profiles with BlueSky sync
- ✅ Neighborhood creation and membership
- ✅ DynamoDB single-table design
- ✅ Terraform AWS deployment
- ✅ React frontend with basic pages
- ✅ Admin role basics

### Key Achievement
Foundation infrastructure in place for all subsequent phases.

---

## Phase 2: AT Protocol Foundation 🔧 IN PROGRESS

**Timeline:** Weeks 5-6
**Status:** Currently working on this
**Dependency:** None (foundational)
**Critical For:** All content management in later phases

Implement AT Protocol record storage and management foundation.

### Core Features
- **Record Schema Extension** - DynamoDB schema for AT Protocol records
- **CID Generation** - Content Identifier for record immutability
- **TID Generation** - Timestamp Identifier for record keys
- **Record CRUD** - Basic create, read, update, delete operations
- **Foundation for Federation** - Set up record structure for future federation

### Deliverables
- ATP-FOUND-001: Record schema in DynamoDB
- ATP-FOUND-002: CID generation utilities
- ATP-FOUND-003: TID (rkey) generation
- ATP-FOUND-004: Record CRUD operations

### Why This Phase?
All content management depends on content being stored as AT Protocol records. Build foundation before creating content managers.

### Acceptance Criteria
- Content records stored with AT Protocol metadata (CID, DID, RKey)
- CID generation consistent and deterministic
- Record CRUD operations working in DynamoDB
- Tests verify record structure and generation

---

## Phase 3: Template System & Site Config APIs 📋

**Timeline:** Weeks 6-7
**Status:** Pending
**Depends On:** Phase 2 (AT Protocol Foundation)

API layer for template discovery, management, and site configuration.

### Core Features
- **Template Discovery** - Browse available templates with metadata
- **Template Metadata API** - Get template details and schema
- **Site Configuration Storage** - Save user site configurations
- **Site Management Endpoints** - CRUD operations for sites
- **Template Schema Validation** - Validate config against template schema

### Key Deliverables
- SSG-001: Template Gallery UI
- SSG-002: Site Configuration Form
- SSG-004: Site Management Dashboard
- SSG-005: Template Management API
- SSG-006: Site Configuration Storage API

### Why This Phase?
Establishes API foundation for content creation. Templates define structure, configs define instances.

---

## Phase 4: Template Analysis System 📐

**Timeline:** Weeks 7-8
**Status:** Pending
**Depends On:** Phase 3 (Template APIs)
**Can Parallel With:** Phase 5 (Content Management)

Research and implementation of automated template analysis.

### Core Features
- **Schema Inference** - Auto-detect template config fields from frontmatter
- **Custom Template Registration** - Users can bring templates from GitHub
- **Template Analyzer Lambda** - Analyze and extract template structure
- **Custom Template Selection UI** - Choose custom templates in config form

### Key Deliverables
- SSG-007: Template Schema Inference Research
- SSG-008: Custom Template Registration API
- SSG-009: Template Analyzer Lambda Function
- SSG-010: Custom Template Selection UI

### Why This Phase?
Enables power users to bring custom templates while maintaining schema validation.

---

## Phase 5: Content Management ✍️

**Timeline:** Weeks 8-9
**Status:** Pending
**Depends On:** Phase 2 (AT Protocol) + Phase 3 (Template APIs)

Content creation and management layer for users.

### Core Features
- **Content Records API** - CRUD for AT Protocol content records
- **Rich Content Editor UI** - Component for creating/editing content
- **Dual Record Creation** - Create record both locally and on BlueSky
- **Smart Content Prefilling** - Auto-fill from user profile (name, bio, avatar)

### Key Deliverables
- SSG-011: Content Records API
- SSG-012: Content Editor UI Component
- SSG-013: Dual Record Creation (BlueSky Integration)
- SSG-014: Smart Content Prefilling

### Why This Phase?
Once template infrastructure is in place, this provides the UI and APIs for creating content.

---

## Phase 6: Build Pipeline & Deployment 🏗️

**Timeline:** Weeks 10-12
**Status:** Pending
**Depends On:** Phase 5 (Content Management)

Server-side build execution and deployment infrastructure.

### Core Features
- **Build Trigger API** - Endpoint to trigger site builds
- **Build Job Tracking** - Track build progress and status
- **11ty Lambda Function** - Run 11ty in Lambda environment
- **S3 Bucket Setup** - Store generated sites
- **CloudFront CDN Setup** - Deliver via CDN
- **Subdomain Routing** - Sites available at `*.nbhd.city`
- **Site Export to ZIP** - Export for self-hosting

### Key Deliverables
- SSG-015: Site Build Trigger API
- SSG-016: 11ty Lambda Build Function
- SSG-017: Subdomain Routing Setup
- SSG-018: Site Export to ZIP
- Infrastructure for Lambdas and CDN

### Why This Phase?
Once content is being created, this takes that content and templates, builds them together, and deploys.

---

## Phase 7: Nbhd CMS & Admin Features 📝

**Timeline:** Weeks 13-15
**Status:** Pending
**Depends On:** Phase 5 (Content) + Phase 6 (Build Pipeline)

Neighborhood-level CMS for community owners.

### Core Features
- **Neighborhood DID** - Enhanced data model for neighborhoods
- **Neighborhood Content API** - Welcome pages, announcements
- **Welcome Page UI** - Design custom community welcome page
- **Admin Dashboard** - Manage neighborhood settings and members
- **CMS View** - Browse all AT Protocol records
- **Site Type Distinction** - Personal vs project sites
- **Personal/Project Site Pages** - Showcase member sites

### Key Deliverables
- NBHD-001: Nbhd DID & Data Model Enhancement
- NBHD-002: Nbhd Content API
- NBHD-003: Welcome Page UI
- NBHD-004: Admin Page UI
- NBHD-005: CMS View for AT Protocol Data
- SITES-001: Site Type Distinction
- SITES-002: Personal Sites Page
- SITES-003: Project Sites Page

### Why This Phase?
Scale from personal sites to neighborhood-level administration.

---

## Phase 8: Build Pipeline UI Completion 🚀

**Timeline:** Weeks 15-16
**Status:** Pending
**Depends On:** Phase 6 (Build Pipeline APIs)

Frontend UI completion for build pipeline.

### Core Features
- **Build Trigger Button** - User-visible button to rebuild site
- **Real-time Status Polling** - See build progress
- **Build Logs Display** - View build output and errors
- **Build History Dashboard** - See previous builds

### Key Deliverables
- BUILD-001: Site Build Trigger UI
- BUILD-002: Build Status Poller
- BUILD-003: Build History Dashboard

### Why This Phase?
Backend build pipeline exists, but users need UI to interact with it.

---

## Phase 9: Full AT Protocol Federation 🌐

**Timeline:** Weeks 17+
**Status:** Pending
**Depends On:** Phase 2 (AT Protocol Foundation)

Complete federation and Personal Data Server implementation.

### Core Features
- **DID Registration** - Register DIDs for members
- **DID to Handle Mapping** - Connect DIDs to BlueSky handles
- **Full PDS Implementation** - Personal Data Server for neighborhoods
- **Firehose Data Sync** - Sync data from BlueSky network
- **Data Export** - Export data for portability
- **Data Migration** - Move data between neighborhoods
- **PDS Federation** - Connect with other AT Protocol services
- **Cross-PDS Neighborhood Lists** - Find neighborhoods across networks

### Key Deliverables
- ATP-001: AT Protocol PDS Research & Design
- ATP-002: BlueSky Integration Review
- ATP-003: DID Registration for Members
- ATP-004: DID to Handle Mapping
- ATP-005: Personal Data Repository Implementation
- ATP-006: Data Sync from BlueSky Firehose
- ATP-007: AT Protocol Data Export
- ATP-008: Data Migration Between nbhds
- ATP-009: PDS Federation Setup
- ATP-010: Cross-PDS Neighborhood Lists

### Why This Phase?
Once core platform is stable, implement full federation for data ownership and interoperability.

---

## Dependency Diagram

```
Phase 1: MVP Foundation ✅
    ↓
Phase 2: AT Protocol Foundation (foundational for all)
    ↓
    ├─ Phase 3: Template System & APIs
    │   ↓
    ├─ Phase 4: Template Analysis (parallel with Phase 5)
    │   ↓
    ├─ Phase 5: Content Management
    │   ↓
    ├─ Phase 6: Build Pipeline & Deployment
    │   ↓
    ├─ Phase 7: Nbhd CMS & Admin Features
    │   ↓
    ├─ Phase 8: Build Pipeline UI Completion
    │   ↓
    └─ Phase 9: Full AT Protocol Federation (can parallel earlier)
```

## Strategic Decisions (Locked)

| Decision | Status | Reasoning |
|----------|--------|-----------|
| 9-phase sequential structure | ✅ Locked | Clear execution order with explicit dependencies |
| Phase 2 first (AT Protocol) | ✅ Locked | Critical dependency for all content management |
| Build pipeline after content | ✅ Locked | Content must exist before building sites |
| Admin features after core | ✅ Locked | Get personal sites working first |
| Federation as final phase | ✅ Locked | Advanced feature after core is stable |

## Current Status Summary

| Phase | Status | Completion |
|-------|--------|-----------|
| 1: MVP Foundation | ✅ Complete | 100% |
| 2: AT Protocol | 🔧 In Progress | 50% |
| 3: Template System | 📋 Planned | 0% |
| 4: Template Analysis | 📋 Planned | 0% |
| 5: Content Management | 📋 Planned | 0% |
| 6: Build Pipeline | 📋 Planned | 0% |
| 7: Nbhd CMS | 📋 Planned | 0% |
| 8: Build Pipeline UI | 📋 Planned | 0% |
| 9: Federation | 📋 Planned | 0% |

## How to Use This Roadmap

### For Understanding Direction
→ Read this document to see WHAT we're building and WHEN

### For Execution
→ See `/tickets/` for detailed specifications and sequencing

### For Technical Details
→ Reference domain-specific docs (ARCHITECTURE.md, DATABASE.md, etc.)

### For Finding Next Steps
→ Phase 2 (ATP-FOUND-001 through ATP-FOUND-004)

## Related Documentation

- **[Soul of nbhd.city](./soul.md)** - Vision and philosophy
- **[Architecture](./architecture.md)** - System design
- **[Getting Started](./getting-started.md)** - Local development
- **[tickets/tickets.md](../tickets/tickets.md)** - Detailed specifications
- **[CLAUDE.md](../CLAUDE.md)** - Development configuration

---

**Next Phase:** Phase 2 (AT Protocol Foundation) - In Progress
**Phase Lead:** See `/tickets/` for ticket ownership
**Updates:** Phase status updated in this file and `/tickets/`
