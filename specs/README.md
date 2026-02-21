# Detailed Technical Specifications

This folder contains **deep-dive technical documentation** for nbhd.city. For quick-reference guides, see `/docs/` instead.

**Last Updated:** 2026-02-21
**Status:** Active Development (Phase 2 - AT Protocol Foundation)

---

## 📖 Documentation Organization

### Start Here: `/docs/` (Quick Guides)
Quick-reference guides with summaries and links to detailed specs:
- [Soul of nbhd.city](../docs/soul.md) - Vision and philosophy
- [Getting Started](../docs/getting-started.md) - Local development setup
- [Architecture Overview](../docs/architecture.md) - System design summary
- [Frontend Guide](../docs/frontend.md) - React UI overview
- [Backend Guide](../docs/backend.md) - APIs overview
- [Database Guide](../docs/database.md) - Schema overview
- [AT Protocol Integration](../docs/atprotocol.md) - Federation overview
- [Site Builder](../docs/site-builder.md) - 11ty system overview
- [Deployment Guide](../docs/deployment.md) - Self-hosting instructions
- [Testing Guide](../docs/testing.md) - Testing approach
- [Phases & Roadmap](../docs/phases.md) - Development timeline

### Detailed Specs: `/specs/` (This Folder)
In-depth technical documentation with implementation details.

---

## 🎯 Specification Index

### Planning & Direction
- **[PHASES.md](./PHASES.md)** - 9-phase development roadmap with dependencies
- **[../tickets/tickets.md](../tickets/tickets.md)** - Prioritized feature tickets with acceptance criteria

### 🏗️ System Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System overview, deployment model, tech stack decisions
- **[DATABASE.md](./DATABASE.md)** - DynamoDB single-table design, schemas, access patterns
- **[API.md](./API.md)** - REST API endpoints, authentication, request/response formats
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - AWS services, Terraform configuration, monitoring

### 💻 Application Layer
- **[FRONTEND.md](./FRONTEND.md)** - React component structure, pages, routing, styling, testing
- **[SECURITY.md](./SECURITY.md)** - Authentication, authorization, OAuth flow, data protection

### 🌐 Federation & Integration
- **[ATPROTOCOL.md](./ATPROTOCOL.md)** - AT Protocol integration, DIDs, record schemas, federation
- **[BLUESKY_INTEGRATION.md](./BLUESKY_INTEGRATION.md)** - BlueSky OAuth, dual-posting, integration flow
- **[PLUGINS.md](./PLUGINS.md)** - Plugin system architecture, installation, core plugins

### 🏢 Domain Features
- **[NBHD-CMS-DESIGN.md](./NBHD-CMS-DESIGN.md)** - Neighborhood CMS, admin features, welcome pages
- **[SITE-TYPES.md](./SITE-TYPES.md)** - Site type distinction (personal vs project)
- **[BUILD_PIPELINE.md](./BUILD_PIPELINE.md)** - Build process, Lambda execution, deployment
- **[BUILD-PIPELINE-UI.md](./BUILD-PIPELINE-UI.md)** - Build UI, status tracking, history
- **[TEMPLATE_ANALYSIS.md](./TEMPLATE_ANALYSIS.md)** - Schema inference, custom template registration
- **[TEMPLATE_GALLERY_DESIGN.md](./TEMPLATE_GALLERY_DESIGN.md)** - Template discovery UI, selection
- **[CONTENT_RECORDS.md](./CONTENT_RECORDS.md)** - Content schema, storage, management
- **[CONTENT_PREFILLING.md](./CONTENT_PREFILLING.md)** - Smart content prefill from profiles
- **[USER_FLOWS.md](./USER_FLOWS.md)** - User journeys for all key features

### ✅ Quality & Testing
- **[TESTING.md](./TESTING.md)** - Testing strategy, coverage goals, test examples

### 🏛️ Architecture Decisions
- **[ADR-001-ATPROTOCOL-PDS.md](./ADR-001-ATPROTOCOL-PDS.md)** - Architecture decision: AT Protocol PDS
- **[SSG-007-RESEARCH.md](./SSG-007-RESEARCH.md)** - Research on template schema inference

### 📊 Analysis & Reports
- **[API-CORRUPTION-ANALYSIS.md](./API-CORRUPTION-ANALYSIS.md)** - API issue analysis
- **[CONSOLIDATION_ANALYSIS.md](./CONSOLIDATION_ANALYSIS.md)** - Consolidation findings
- **[OAUTH_ANALYSIS.md](./OAUTH_ANALYSIS.md)** - OAuth implementation analysis
- **[PKCE_IMPLEMENTATION_COMPLETE.md](./PKCE_IMPLEMENTATION_COMPLETE.md)** - PKCE security implementation
- **[INTEGRATION_TEST_SUMMARY.md](./INTEGRATION_TEST_SUMMARY.md)** - Integration test results
- **[PHASE_10_CSS_HARMONY_DESIGN.md](./PHASE_10_CSS_HARMONY_DESIGN.md)** - CSS design documentation
- **[PHASE_11_CMS_COMPONENTS_SPECS.md](./PHASE_11_CMS_COMPONENTS_SPECS.md)** - CMS component specifications
- **[PHASE_11_COMPLETION_REPORT.md](./PHASE_11_COMPLETION_REPORT.md)** - Phase completion report
- **[FRONTEND_SPECIFICATIONS_OVERVIEW.md](./FRONTEND_SPECIFICATIONS_OVERVIEW.md)** - Frontend spec overview
- **[SHARED_COMPONENTS_GUIDE.md](./SHARED_COMPONENTS_GUIDE.md)** - Reusable component guide
- **[PHASE-2G-2H-DOCUMENTATION.md](./PHASE-2G-2H-DOCUMENTATION.md)** - Phase 2 documentation
- **[PHASE-10.1-OVERVIEW.md](./PHASE-10.1-OVERVIEW.md)** - Phase 10.1 overview
- **[BLUESKY_INTEGRATION_AUDIT.md](./BLUESKY_INTEGRATION_AUDIT.md)** - BlueSky integration audit
- **[HARMONIC_CIRCLES_IMPLEMENTATION.md](./HARMONIC_CIRCLES_IMPLEMENTATION.md)** - Implementation details

---

## 🚀 How to Use This Documentation

| Goal | Resource |
|------|----------|
| **Understand the vision** | Read [../docs/soul.md](../docs/soul.md) |
| **Set up locally** | Read [../docs/getting-started.md](../docs/getting-started.md) |
| **Understand system design** | Read [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Learn API details** | Read [API.md](./API.md) |
| **Understand database** | Read [DATABASE.md](./DATABASE.md) |
| **Learn frontend structure** | Read [FRONTEND.md](./FRONTEND.md) |
| **Plan a feature** | Read [PHASES.md](./PHASES.md) and [../tickets/tickets.md](../tickets/tickets.md) |
| **Implement a feature** | See detailed ticket specs in [../tickets/](../tickets/) |

---

## 📁 Project Structure

```
/docs/               ← Quick-reference guides (START HERE)
/specs/              ← Detailed technical documentation (this folder)
/app/
  ├── UI/            ← React frontend
  ├── api/           ← Python FastAPI backend
  ├── lambda/        ← AWS Lambda functions
  └── dynamodb/      ← Local DynamoDB setup
/tickets/            ← Development tickets and specifications
/devops/             ← Terraform infrastructure
/tests/              ← Infrastructure and integration tests
```

---

## 🎯 Current Phase

**Phase 2: AT Protocol Foundation** (In Progress)

Implementing AT Protocol record storage and management:
- ATP-FOUND-001: Record schema in DynamoDB
- ATP-FOUND-002: CID generation utilities
- ATP-FOUND-003: Record key (rkey) generation
- ATP-FOUND-004: Record CRUD operations

See [PHASES.md](./PHASES.md) for complete 9-phase roadmap.

---

**Documentation updated:** 2026-02-21
**For quick guides:** See `/docs/`
**For implementation:** See `/tickets/`
