# Development Roadmap & Phases

**Status:** Phase 2 in progress
**Last Updated:** 2026-01-10

---

## Phase 1: MVP ✅ (Complete)

Core platform foundation - users can create neighborhoods and join BlueSky communities.

- ✅ BlueSky OAuth authentication
- ✅ User profiles with BlueSky sync
- ✅ Neighborhood creation and membership
- ✅ DynamoDB single-table design
- ✅ Terraform AWS deployment
- ✅ React frontend with basic pages
- ✅ Admin role basics

**Status:** Shipped and working

---

## Phase 2: Static Sites + AT Protocol PDS (Current Priority)

Members create beautiful static sites and neighborhoods become personal data servers.

### Static Sites Track

Users can design and publish static websites with zero coding.

- [ ] 11ty template system (3 templates: blog, project, newsletter)
- [ ] Template API (`GET /api/templates`, config schema)
- [ ] Site configuration storage API
- [ ] Template gallery UI component
- [ ] Dynamic config form builder
- [ ] Client-side preview via 11ty WASM
- [ ] Lambda build function (server-side rendering)
- [ ] Build trigger API with job tracking
- [ ] Subdomain auto-deployment (username.nbhd.city)
- [ ] Site management dashboard
- [ ] Export sites as ZIP files
- [ ] Blog template with posts, tags, RSS
- [ ] Project showcase template
- [ ] Newsletter archive template

### AT Protocol PDS Track

Each neighborhood becomes a Personal Data Server on the AT Protocol network.

- [ ] AT Protocol PDS research & architecture design
- [ ] DID registration system for members
- [ ] DID to BlueSky handle mapping
- [ ] Personal Data Repository (PDS) implementation
- [ ] BlueSky firehose data sync
- [ ] AT Protocol data export for portability
- [ ] PDS federation setup
- [ ] Neighborhood member lists as shareable AT lists

**Estimated Timeline:** 11+ weeks (parallel tracks)
**Key Dependencies:** APIs first, then UI, then infrastructure

See [tickets.md](./tickets.md) for detailed breakdown and effort estimates.

---

## Phase 3: Privacy, Roles & Admin Features

Full role-based access control and advanced privacy settings.

- [ ] Private neighborhoods (invite-only)
- [ ] Full admin role implementation
- [ ] Member promotion/demotion
- [ ] Email verification system
- [ ] Rate limiting (IP + user-based)
- [ ] Neighborhood deletion with data cleanup
- [ ] User profile privacy controls
- [ ] Activity audit logging

**Why after Phase 2:** Phase 2's core features need to ship first, then we add administration.

---

## Phase 4: SaaS Hosting + Core Plugins

Commercial hosting service and essential collaboration tools.

### SaaS Commercial Hosting

nbhd.city offers managed hosting for communities that don't want to self-host.

- [ ] SaaS deployment infrastructure
- [ ] Billing system ($20-100/month tiers)
- [ ] Management dashboard for hosted instances
- [ ] Automated backups and monitoring
- [ ] Support ticket system

### Core Plugins

Built-in collaboration tools that extend the base platform.

- [ ] Plugin system architecture
- [ ] Threaded messaging plugin (Slack-style channels)
- [ ] Project management plugin (Kanban board)
- [ ] Calendar plugin (event sync with Google Calendar, iCal)

---

## Phase 5: Git Integration & Distribution

Make it easy to version-control and distribute themes/plugins.

- [ ] GitHub Actions for auto-deployment
- [ ] Git repo integration for site code
- [ ] Plugin & theme marketplace
- [ ] Template versioning and updates
- [ ] Automated deployments from Git commits

---

## Phase 6: Multi-Cloud Support

Let users deploy to other cloud providers.

- [ ] GCP deployment (Cloud Functions + Firestore)
- [ ] Azure deployment (Functions + Cosmos DB)
- [ ] Cloud provider abstraction layer
- [ ] Cost comparison tools

**Why last:** AWS implementation is proven, then generalize to other clouds.

---

## Key Strategic Decisions

| Decision | Status | Reasoning |
|----------|--------|-----------|
| Single nbhd per deployment | ✅ Locked | Eliminates multi-tenancy complexity |
| AWS-only for MVP | ✅ Locked | Focus, then expand to GCP/Azure in Phase 6 |
| AT Protocol PDS in Phase 2 | ✅ Locked | Core to philosophy of data ownership |
| SaaS hosting Phase 4+ | ✅ Locked | Get self-hosted working first |
| No multi-neighborhood per user | ✅ Locked | Each nbhd is autonomous; users create separate accounts |

---

## How to Use This Roadmap

1. **For Direction**: Use this to understand WHAT we're building and WHEN
2. **For Execution**: See [tickets.md](./tickets.md) for HOW (specific tickets and sequencing)
3. **For Details**: Reference domain-specific docs (ARCHITECTURE.md, DATABASE.md, etc.)

**Next Step**: Start Phase 2 with API foundation tickets (SSG-005, SSG-006, ATP-001)
