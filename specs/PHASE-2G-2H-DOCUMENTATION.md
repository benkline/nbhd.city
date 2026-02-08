# Phase 2g & 2h Documentation Index

**Version:** 1.0
**Last Updated:** 2026-01-31

This document provides an index of all documentation created for Phase 2g (Nbhd CMS & Admin Features) and Phase 2h (Build Pipeline UI Completion).

## Documentation Files

### 1. NBHD-CMS-DESIGN.md
**Purpose:** Complete design document for neighborhood CMS and admin features

**Covers:**
- Architecture goals and overview
- Data model for neighborhoods with DIDs
- AT Protocol record types (welcome, announcements, metadata)
- Backend API routes and response formats
- Admin access control middleware
- Frontend component architecture and hierarchy
- Welcome page behavior (default vs custom content)
- Migration strategy for existing neighborhoods
- Security considerations
- Testing strategy

**Related Tickets:**
- NBHD-001 (Nbhd DID & Data Model Enhancement)
- NBHD-002 (Nbhd Content API)
- NBHD-003 (Welcome Page UI)
- NBHD-004 (Admin Page UI)
- NBHD-005 (CMS View for AT Protocol Data)

---

### 2. SITE-TYPES.md
**Purpose:** Complete design for personal vs project site distinction

**Covers:**
- Concept and comparison of personal vs project sites
- Data model with conditional nbhd_id
- Validation rules for each type
- API endpoints with filtering
- Frontend architecture and routing patterns
- Component props and reuse strategy
- UI patterns for both site types
- Database query patterns and required GSIs
- Build pipeline integration
- Migration strategy for existing sites
- Security and authorization rules
- Testing strategy

**Related Tickets:**
- SITES-001 (Site Type Distinction)
- SITES-002 (Personal Sites Page)
- SITES-003 (Project Sites Page)

---

### 3. BUILD-PIPELINE-UI.md
**Purpose:** Complete design for build trigger, status polling, and history UI

**Covers:**
- Architecture overview of three-layer build pipeline
- API integration (endpoints, status lifecycle)
- BUILD-001: Site Build Trigger UI specifications
- BUILD-002: Build Status Poller specifications
- BUILD-003: Build History Dashboard specifications
- Component code examples (actual React code)
- UI layout examples with ASCII diagrams
- Error handling strategies
- Performance optimization considerations
- Testing strategy for all components
- Polling optimization and build history caching

**Related Tickets:**
- BUILD-001 (Site Build Trigger UI)
- BUILD-002 (Build Status Poller)
- BUILD-003 (Build History Dashboard)

---

## Cross-Reference Map

### By Feature

**Neighborhood CMS:**
- Documentation: NBHD-CMS-DESIGN.md
- Tickets: NBHD-001, NBHD-002, NBHD-003, NBHD-004, NBHD-005
- Key Concepts: DID generation, AT Protocol records, admin access control

**Site Type Distinction:**
- Documentation: SITE-TYPES.md
- Tickets: SITES-001, SITES-002, SITES-003
- Key Concepts: Personal vs project sites, filtering, conditional fields

**Build Pipeline UI:**
- Documentation: BUILD-PIPELINE-UI.md
- Tickets: BUILD-001, BUILD-002, BUILD-003
- Key Concepts: Job polling, status lifecycle, real-time logs

### By Ticket

**NBHD-001:** References → NBHD-CMS-DESIGN.md (Data Model), SITE-TYPES.md (Data Model)
**NBHD-002:** References → NBHD-CMS-DESIGN.md (API Routes, Admin Access, AT Protocol Records)
**NBHD-003:** References → NBHD-CMS-DESIGN.md (Welcome Page Behavior)
**NBHD-004:** References → NBHD-CMS-DESIGN.md (Frontend Component Architecture)
**NBHD-005:** References → NBHD-CMS-DESIGN.md (CMS View Response Format)

**SITES-001:** References → SITE-TYPES.md (Data Model, API Endpoints, Validation)
**SITES-002:** References → SITE-TYPES.md (UI Patterns, Personal Sites Page)
**SITES-003:** References → SITE-TYPES.md (UI Patterns, Project Sites Page)

**BUILD-001:** References → BUILD-PIPELINE-UI.md (BUILD-001 section, Component Specs)
**BUILD-002:** References → BUILD-PIPELINE-UI.md (BUILD-002 section, Status Lifecycle, Component Specs)
**BUILD-003:** References → BUILD-PIPELINE-UI.md (BUILD-003 section, Component Specs)

---

## Implementation Sequence

### Phase 2g: Nbhd CMS & Admin Features (Weeks 11-13)

1. **Data Model Foundation (NBHD-001)**
   - Create DID generation
   - Add site_type field
   - Migration script
   - Documentation: NBHD-CMS-DESIGN.md (Data Model section)

2. **Backend API (NBHD-002)**
   - Create nbhd_content.py router
   - Implement all endpoints
   - AT Protocol record creation
   - Documentation: NBHD-CMS-DESIGN.md (API Routes, Admin Access Control)

3. **Frontend CMS (NBHD-003, NBHD-004, NBHD-005) - Parallel**
   - Welcome page UI
   - Admin page with tabs
   - CMS view with record inspector
   - Documentation: NBHD-CMS-DESIGN.md (Frontend Architecture, Welcome Page Behavior)

4. **Site Type Support (SITES-001, SITES-002, SITES-003) - Parallel**
   - Add site_type filtering to backend
   - Personal sites page
   - Project sites page
   - Documentation: SITE-TYPES.md (full document)

### Phase 2h: Build Pipeline UI (Weeks 13-14)

1. **Build Trigger (BUILD-001)**
   - Add "Deploy Site" button
   - Confirmation dialog
   - Documentation: BUILD-PIPELINE-UI.md (BUILD-001 section)

2. **Status Polling (BUILD-002)**
   - Real-time build status display
   - Polling interval management
   - Log viewer
   - Documentation: BUILD-PIPELINE-UI.md (BUILD-002 section, Status Lifecycle)

3. **Build History (BUILD-003)**
   - Paginated build table
   - Status indicators
   - Log retrieval
   - Documentation: BUILD-PIPELINE-UI.md (BUILD-003 section)

---

## Key Design Decisions

### Data Model
- **DIDs for neighborhoods:** Immutable, generated on creation, enables AT Protocol records
- **Site type field:** Indicates ownership model (personal = user, project = neighborhood)
- **Conditional nbhd_id:** Required for project sites, optional for personal

### APIs
- **Neighborhood content endpoints:** Namespaced under `/app/api/nbhds/{id}/content/`
- **Site filtering:** Query parameter `?site_type=personal|project`
- **Admin access:** Middleware `require_nbhd_admin()` on all modification endpoints

### Frontend
- **Component reuse:** Existing `ContentEditor`, `SiteManagementDashboard` wrapped/reused
- **Tab-based admin:** Central AdminPage with tabs for each concern
- **Build pipeline UI:** Three separate concerns (trigger, poll, history)

### AT Protocol
- **Record types:** `app.nbhd.welcome`, `app.nbhd.announcement`, `app.nbhd.metadata`
- **Singleton pattern:** Welcome and metadata use fixed rkey (`default`)
- **Chronological records:** Announcements use TID-based rkeys for sorting

---

## Testing Coverage

### Backend Tests (3 phases)

**Phase 2g:**
- DID generation uniqueness and format
- Site type validation
- Admin endpoint authorization (403 for non-owners)
- AT Protocol record structure
- CMS endpoint aggregation

**Phase 2h:**
- Build trigger 202 response
- Build status polling logic
- Pagination and sorting
- Error handling

### Frontend Tests (3 phases)

**Phase 2g:**
- Admin page access control
- Welcome page default/custom rendering
- Tab navigation and state
- Form submissions

**Phase 2h:**
- Button click and loading states
- Polling lifecycle and cleanup
- Table rendering and pagination
- Error display

---

## Related Documentation

Also reference these existing documents for context:

- **[DATABASE.md](./DATABASE.md)** - DynamoDB schema (see AT Protocol section)
- **[CONTENT_RECORDS.md](./CONTENT_RECORDS.md)** - AT Protocol record details
- **[API.md](./API.md)** - API design patterns
- **[FRONTEND.md](./FRONTEND.md)** - Component architecture
- **[BUILD_PIPELINE.md](./BUILD_PIPELINE.md)** - Build infrastructure (Lambda, S3, CloudFront)
- **[ATPROTOCOL.md](./ATPROTOCOL.md)** - AT Protocol overview
- **[SECURITY.md](./SECURITY.md)** - DID and authentication

---

## Quick Links to Tickets

- [tickets.md - Phase 2g](../tickets/tickets.md#phase-2g-nbhd-cms--admin-features-) - All 11 tickets
- [tickets.md - Phase 2h](../tickets/tickets.md#phase-2h-build-pipeline-ui-completion-) - All 3 tickets

---

## Implementation Checklist

### Before Starting

- [ ] Review NBHD-CMS-DESIGN.md completely
- [ ] Review SITE-TYPES.md completely
- [ ] Review BUILD-PIPELINE-UI.md completely
- [ ] Verify Phase 2e (Build Pipeline) backend is deployed
- [ ] Set up local test data for neighborhoods and sites

### For Each Ticket

- [ ] Read relevant documentation section
- [ ] Check file lists for what to create/modify
- [ ] Implement changes with tests
- [ ] Verify acceptance criteria
- [ ] Update existing documentation if needed

### Final Verification

- [ ] All 14 tickets completed
- [ ] All tests passing
- [ ] All documentation linked from tickets
- [ ] Admin access control working (verified with non-owner)
- [ ] Build pipeline UI working end-to-end
- [ ] Site type filtering working across apps

---

**Next Steps:** Begin with NBHD-001 (Data Model Foundation) following the implementation sequence above.
