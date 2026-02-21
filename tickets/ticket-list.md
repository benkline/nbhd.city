# Ticket Priority Order & Timeline

**Last Updated:** 2026-02-07

**NOTE:** Detailed ticket descriptions and acceptance criteria are in [tickets.md](./tickets.md). This document provides the priority order, phase dependencies, and timeline overview.

---

## Priority Order & Timeline

Tickets are organized in 9-phase execution order below. Phases have dependencies - later phases depend on earlier phases being completed first.

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

- [x] ATP-FOUND-001 (AT Protocol Record Schema in DynamoDB)
- [x] ATP-FOUND-002 (CID Generation Utilities)
- [x] ATP-FOUND-003 (Record Key/rkey Generation)
- [x] ATP-FOUND-004 (Basic Record CRUD Operations)

**Why Phase 2 is critical:** All subsequent phases depend on AT Protocol record storage. Build this foundation first.

### 📋 Phase 3: Template System & Site Config APIs (Weeks 6-7)

**Depends on:** Phase 2 (AT Protocol Foundation)

- [x] SSG-001 (Template Gallery UI)
- [x] SSG-002 (Site Configuration Form)
- [x] SSG-004 (Site Management Dashboard)
- [x] SSG-005 (Template Management API)
- [x] SSG-006 (Site Configuration Storage API)

### 📐 Phase 4: Template Analysis System (Weeks 7-8)

**Depends on:** Phase 3 (Template APIs)
**Can Run In Parallel With:** Phase 5 (Content Management)

- [x] SSG-007 (Template Schema Inference Research)
- [x] SSG-008 (Custom Template Registration API)
- [x] SSG-009 (Template Analyzer Lambda Function)
- [x] SSG-010 (Custom Template Selection UI)

### ✍️ Phase 5: Content Management (Weeks 8-9)

**Depends on:** Phase 2 (AT Protocol Foundation) and Phase 3 (Template APIs)

- [x] SSG-011 (Content Records API)
- [x] SSG-012 (Content Editor UI)
- [x] SSG-013 (Dual Record Creation - BlueSky Integration)
- [x] SSG-014 (Smart Content Prefilling)

### 🏗️ Phase 6: Build Pipeline & Deployment (Weeks 10-12)

**Depends on:** Phase 5 (Content Management - content must exist before building)

- [x] SSG-015 (Site Build Trigger API)
- [x] SSG-016 (11ty Lambda Build Function)
- [x] SSG-017 (Subdomain Routing Setup) - COMPLETED 2026-01-31
- [x] SSG-018 (Site Export to ZIP) - COMPLETED 2026-02-01
- Infrastructure: SSG-009-INFRA, SSG-016-INFRA, SSG-015-INFRA

### 📝 Phase 7: Nbhd CMS & Admin Features (Weeks 13-15)

**Depends on:** Phase 5 (Content Management) and Phase 6 (Build Pipeline)

**Backend Foundation:**
- [x] NBHD-001 (Nbhd DID & Data Model Enhancement)
- [x] NBHD-002 (Nbhd Content API)

**Frontend - Core CMS:**
- [x] NBHD-003 (Welcome Page UI)
- [x] NBHD-004 (Admin Page UI)
- [x] NBHD-005 (CMS View for AT Protocol Data)

**Frontend - Site Management:**
- [x] SITES-001 (Site Type Distinction)
- [x] SITES-002 (Personal Sites Page)
- [x] SITES-003 (Project Sites Page) - COMPLETED 2026-02-07

### 🚀 Phase 8: Build Pipeline UI Completion (Weeks 15-16)

**Depends on:** Phase 6 (Build Pipeline backend is complete)

- [x] BUILD-001 (Site Build Trigger UI)
- [x] BUILD-002 (Build Status Poller) - COMPLETED 2026-02-07
- [x] BUILD-003 (Build History Dashboard) - COMPLETED 2026-02-07

### 🔐 Phase 9.1: Frontend Login & Authentication (Weeks TBD)

**Depends on:** Phase 1 (BlueSky OAuth), Phase 7 (Neighborhoods)
**Complements:** Phase 9.2 (AT Protocol Federation)

- [x] FL-9.1 (Context-Aware Home Page) - COMPLETED 2026-02-08
- [x] FL-9.2 (Enhanced OAuth Login Flow) - COMPLETED 2026-02-10
- [ ] FL-9.3 (Persistent Sessions & Token Refresh)
- [ ] FL-9.4 (User Onboarding After First Login)
- [ ] FL-9.5 (Logout Flow & Session Cleanup)

### 🐛 Bugfix Tickets: Critical Profile & Endpoint Issues

**PRIORITY: High** - Blocking user onboarding and profile creation

- [x] BUGFIX-001 (Add nbhd_did to Existing Neighborhoods) - COMPLETED 2026-02-10
- [x] BUGFIX-002 (Fix GET /api/users/me Endpoint) - COMPLETED BY DESIGN
- [x] BUGFIX-003 (Fix POST /api/users/me/profile Validation) - COMPLETED 2026-02-08
- [x] BUGFIX-004 (Create Profile Page Component) - ALREADY IMPLEMENTED

### 🌐 Phase 9.2: Full AT Protocol Federation (Weeks 17+)

**Depends on:** Phase 2 (AT Protocol Foundation is in place)

- [x] ATP-001 (AT Protocol PDS Research & Design)
- [x] ATP-002 (BlueSky Integration Review)
- [ ] ATP-003 (DID Registration for Members)
- [ ] ATP-004 (DID to BlueSky Handle Mapping)
- [ ] ATP-005 (Personal Data Repository Implementation)
- [ ] ATP-006 (Data Sync from BlueSky Firehose)
- [ ] ATP-007 (AT Protocol Data Export)
- [ ] ATP-008 (Data Migration Between nbhds)
- [ ] ATP-009 (PDS Federation Setup)
- [ ] ATP-010 (Cross-PDS Neighborhood Lists)

### 🎨 Phase 10.1: Custom Template UI Integration & Design System (Weeks TBD)

**Depends on:** Phase 4 (SSG-008, SSG-009, SSG-010 - backend feature complete)
**Purpose:** Complete UI integration of custom template registration with beautiful, modern design

**Design System & Foundation:**
- [ ] UI-DESIGN-001 (Harmonic Circle Design System & Animations)
- [ ] UI-NAV-001 (Navigation Structure with Sidebar & Tab System)

**Template Gallery Integration:**
- [ ] UI-GALLERY-001 (TemplateGallery Integration with CustomTemplateModal)
- [ ] UI-GALLERY-002 (Merge Custom + Built-in Templates with Cascade Animation)
- [ ] UI-GALLERY-003 (Template Status Indicators with Circle Progress)
- [ ] UI-GALLERY-004 (Template Details & Management Modal)

**Polish & Optimization:**
- [ ] UI-RESPONSIVE-001 (Mobile Optimization & Responsive Design)
- [ ] UI-PERF-001 (Animation Performance & Optimization)

**Total Tickets:** 8
**Estimated Effort:** 10-12 weeks
**Can Run In Parallel:** Yes - uses git worktrees with 6 subagents

**Design Highlights:**
- Harmonic circle animations inspired by Chladni plates and standing wave patterns
- Intersecting circle patterns with CSS animations (no jank, 60fps target)
- Sidebar navigation (collapsible on mobile) + top tab bar
- Beautiful fade/cascade animations for template cards
- Real-time template analysis status indicators
- Touch-friendly mobile interface

---

### 📝 Phase 11: Advanced CMS Components (Weeks TBD)

**Depends on:** Phase 7 (Nbhd CMS & Admin Features) and Phase 8 (Build Pipeline UI)

Advanced content management components for rich editing experiences.

- [x] CMS-002 (Content Browser Component)
- [x] CMS-003 (Enhanced Content Editor with Markdown Support) - COMPLETED 2026-02-20
- [ ] CMS-006 (Site Settings Manager Component)
- [ ] CMS-007 (Content Metadata Manager Component)

**Total Tickets:** 4
**Estimated Effort:** 4-6 weeks
**Can Run In Parallel:** Yes, with separate subagents for each component

---

### 🔌 Phase 9.3: Plugin Architecture & Infrastructure (Weeks 18-19)

**Depends on:** Phase 8 (Build Pipeline UI) - needed before next major extension
**Purpose:** Establish formal plugin system to prevent code contamination

- [ ] PLUGIN-ARCH-001 (Define Plugin Architecture Specification)
- [ ] PLUGIN-ARCH-002 (Create Plugin Loader Utility)
- [ ] PLUGIN-ARCH-003 (Update Main Application to Use Plugin Loader)
- [ ] PLUGIN-ARCH-004 (Create Frontend Plugin Registration System)
- [ ] PLUGIN-ARCH-005 (Document Plugin Development Guide)
- [ ] PLUGIN-ARCH-006 (Create Template Plugin - Hello World)
- [ ] PLUGIN-ARCH-007 (Set Up Plugin Testing Infrastructure)
- [ ] PLUGIN-ARCH-008 (Create Plugin Validation Checklist)

**Why This Phase:** Lessons learned from nbhrs-chat accidental integration. Establishes clean separation of plugin code from main app. Prevents future contamination.

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

**See [tickets.md](./tickets.md) for detailed descriptions and acceptance criteria.**
