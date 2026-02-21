# nbhd.city Documentation

Welcome to the nbhd.city documentation. This folder contains quick-reference guides for understanding and developing the platform.

## Quick Navigation

### For Everyone
- **[Soul of nbhd.city](./soul.md)** - Vision, philosophy, and what makes us different
- **[Architecture Overview](./architecture.md)** - High-level system design
- **[Phases & Roadmap](./phases.md)** - Where we're building and what's next

### For Developers
- **[Getting Started](./getting-started.md)** - Set up local development (5 min)
- **[Frontend](./frontend.md)** - React UI components and page structure
- **[Backend](./backend.md)** - APIs, endpoints, and data flow
- **[Database](./database.md)** - DynamoDB schema and design decisions

### For Technical Depth
- **[AT Protocol Integration](./atprotocol.md)** - BlueSky and federation support
- **[Site Builder](./site-builder.md)** - 11ty template system and static generation
- **[Deployment](./deployment.md)** - Self-hosting and AWS infrastructure
- **[Testing](./testing.md)** - Test strategy and running tests

## Document Structure

Each document in `/docs/` is a **summary with quick descriptions** of main features and technical aspects. They link to more **detailed specifications in `/specs/`** that contain:
- Detailed implementation instructions
- Code examples and API specifications
- Design decisions and rationale
- Step-by-step guides

### Folder Organization

```
/docs/          ← You are here (quick reference guides)
  ├── soul.md
  ├── architecture.md
  ├── getting-started.md
  ├── [other summary docs]
  └── README.md (this file)

/specs/         ← Detailed technical specifications
  ├── ARCHITECTURE.md
  ├── API.md
  ├── DATABASE.md
  ├── [20+ detailed docs]
  └── README.md

/app/           ← Application source code
  ├── api/      ← Python FastAPI backend
  ├── UI/       ← React frontend
  └── lambda/   ← AWS Lambda functions

/tickets/       ← Development tickets with acceptance criteria
```

## How to Use This Documentation

### "I want to understand what nbhd.city does"
→ Start with [soul.md](./soul.md), then read [architecture.md](./architecture.md)

### "I want to set up and develop locally"
→ Start with [getting-started.md](./getting-started.md)

### "I want to understand a specific feature"
→ Find the relevant doc (frontend/backend/database), then dive into `/specs/` for details

### "I need implementation details"
→ The `/specs/` folder has detailed technical docs for every aspect

### "I want to see the full project timeline"
→ Read [phases.md](./phases.md) for the 9-phase development roadmap

## Key Concepts at a Glance

### Nbhd
A neighborhood—a self-hosted instance of nbhd.city where a community collaborates on content and websites.

### AT Protocol
Decentralized web standard that enables data portability and federation. nbhd stores records using AT Protocol schemas.

### BlueSky Integration
Members can sign in with BlueSky, and content can be dual-posted to BlueSky while being managed on nbhd.

### Static Site Generation
nbhd uses 11ty (Eleventy) to compile templates + content into fast, deployment-ready static HTML sites.

### Serverless Architecture
All compute runs on AWS Lambda (no servers to manage), storage is DynamoDB, and sites are delivered via CloudFront.

## Contributing & Questions

See [CLAUDE.md](../CLAUDE.md) for development guidelines and ticket management.

---

**Last Updated:** 2026-02-21
**Phase:** 2 (AT Protocol Foundation) in progress
