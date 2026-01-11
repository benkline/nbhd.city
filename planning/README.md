# nbhd.city Documentation Index

**Last Updated:** 2026-01-10
**Status:** Active Development (Phase 2)

---

## Quick Navigation

### 🎯 Planning & Direction
- **[PHASES.md](./PHASES.md)** - Development roadmap and current phase focus
- **[tickets.md](./tickets.md)** - Prioritized feature tickets and breakdown

### 🏗️ System Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System overview, deployment model, tech stack
- **[DATABASE.md](./DATABASE.md)** - Data models, DynamoDB single-table design, access patterns
- **[API.md](./API.md)** - REST API endpoints, authentication flow, request/response formats

### 💻 Frontend & UI
- **[FRONTEND.md](./FRONTEND.md)** - React structure, pages, routing, state management, styling

### ☁️ Infrastructure & Deployment
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - AWS services, Terraform setup, cost estimation, monitoring

### 🔐 Security & Access
- **[SECURITY.md](./SECURITY.md)** - Authentication, authorization, privacy, rate limiting, data protection

### 🔗 Core Features
- **[ATPROTOCOL.md](./ATPROTOCOL.md)** - AT Protocol PDS integration, DIDs, federation
- **[PLUGINS.md](./PLUGINS.md)** - Plugin system architecture, installation, core plugins

---

## What is nbhd.city?

**nbhd.city** is a self-hosted, open-source collaboration platform for small communities (10-1000 members). Each neighborhood is a completely **autonomous deployment** with:

- **Static-first architecture** - Members can create beautiful static sites using 11ty templates
- **Personal Data Ownership** - Each neighborhood operates as an AT Protocol Personal Data Server
- **Easy self-hosting** - Users fork the repo and deploy to their own AWS account
- **Extensible plugins** - Core features plus community-developed plugins

## Current Phase

### Phase 2: Static Sites + AT Protocol PDS

Two parallel workstreams:

**Static Sites:** Members create and publish static websites using configurable 11ty templates (blog, project, newsletter). Full WASM preview in browser, Lambda builds, automatic subdomain deployment.

**AT Protocol PDS:** Each nbhd becomes a full Personal Data Server. Members get DIDs, data is federated with BlueSky, full data portability.

See [PHASES.md](./PHASES.md) for complete roadmap and [tickets.md](./tickets.md) for implementation tickets.

## Core Principles

1. **Autonomous Neighborhoods** - No multi-tenancy. Each deployment is ONE independent neighborhood.
2. **User Data Ownership** - Data stays with the neighborhood instance. Users own their content.
3. **Portability First** - Export everything as static files or AT Protocol format.
4. **Self-Hosted SaaS** - Users deploy to their own cloud with one command.

## Key Files

- `/api/` - Python FastAPI backend
- `/nbhd/` - React frontend
- `/devops/` - Terraform infrastructure (AWS)
- `/planning/` - This documentation

---

**For a specific question about the app, check the relevant doc above.**
