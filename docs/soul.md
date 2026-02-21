# The Soul of nbhd.city

## Vision

**nbhd.city** is a self-hosted neighborhood collaboration platform built on the conviction that communities should own their digital spaces.

Rather than surrendering content to corporate platforms, nbhd.city enables **communities to fork, run, and govern their own social infrastructure**. Each neighborhood is an autonomous, serverless instance where members collaborate on shared digital spaces—from blogs to project portfolios to community announcements.

## Core Philosophy

### Decentralization
- No single authority controls the platform
- Each neighborhood is a completely independent deployment
- Communities make their own decisions about governance and features

### Data Ownership
- Users own their data, not the platform
- Built on AT Protocol to enable federation and data portability
- Communities can export, migrate, or self-host independently

### Low Barrier to Entry
- Self-hosted but serverless—no server administration
- One-click template deployment with 11ty static sites
- Costs $5-15/month even for communities of 100+

### Collaborative Creation
- Members work together to create and curate content
- Admin roles enable community governance
- Integration with BlueSky connects neighborhoods to broader conversations

## Architecture Philosophy

### Serverless-First
No servers to manage. Deploy with Terraform, scale automatically, pay only for what you use.

### Static Site Generation
Use 11ty to compile templates and content into fast, deployment-ready static sites. No dynamic databases needed for the public face.

### AT Protocol Foundation
Store records using AT Protocol standards for federation, portability, and alignment with decentralized web values.

### Single Nbhd Per Instance
Each deployment hosts one neighborhood. This simplifies operations, enables strong community governance, and prevents one neighborhood from consuming another's resources.

## Key Features

- **Neighborhood Management** - Create or join neighborhoods, manage membership
- **Template Gallery** - Browse and deploy pre-built 11ty templates (blog, project portfolio, newsletter)
- **Content Management** - Create and edit site content with rich editors
- **Site Building** - One-click builds transform templates + content into static HTML
- **BlueSky Integration** - Dual-post to BlueSky while managing your own content
- **Admin Features** - Neighborhood owners manage welcome pages, community announcements, member portfolios
- **Plugin System** - Extend neighborhood features with community-built plugins

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Python FastAPI |
| Database | DynamoDB |
| Static Generation | 11ty (Eleventy) |
| Federation | AT Protocol |
| Hosting | AWS (Serverless) |
| Infrastructure | Terraform |

## Development Phases

See [../docs/phases.md](./phases.md) for the 9-phase roadmap from MVP to full AT Protocol federation.

**Current Status:** Phase 2 (AT Protocol Foundation) in progress

## Getting Started

- **Developing locally?** → [Getting Started Guide](./getting-started.md)
- **Understanding the system?** → [Architecture Overview](./architecture.md)
- **Need detailed specs?** → See `/specs/` folder for in-depth documentation
