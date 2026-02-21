# nbhd.city

**A self-hosted neighborhood collaboration platform where communities own their data.**

Neighborhoods are collaborative digital spaces where members create and manage shared content. Built on AT Protocol for federation and portability, powered by serverless architecture (React, FastAPI, DynamoDB, 11ty).

## ⚡ Quick Start

```bash
./start-dev.sh
```

Then visit `http://localhost:5173`

See **[Getting Started](./docs/getting-started.md)** for detailed setup.

## 📚 Documentation

**For Different Audiences:**

| I want to... | Read this |
|------|----------|
| **Understand the vision** | [Soul of nbhd.city](./docs/soul.md) |
| **Set up locally** | [Getting Started](./docs/getting-started.md) |
| **Understand the system** | [Architecture Overview](./docs/architecture.md) |
| **Work on frontend** | [Frontend Guide](./docs/frontend.md) |
| **Work on backend** | [Backend Guide](./docs/backend.md) |
| **Understand databases** | [Database Guide](./docs/database.md) |
| **Learn about AT Protocol** | [AT Protocol Integration](./docs/atprotocol.md) |
| **Build/deploy sites** | [Site Builder](./docs/site-builder.md) |
| **Self-host nbhd.city** | [Deployment Guide](./docs/deployment.md) |
| **Write tests** | [Testing Guide](./docs/testing.md) |
| **See development phases** | [Phases & Roadmap](./docs/phases.md) |

**All documentation is in `/docs/` folder with links to detailed specs in `/specs/`**

## Key Features

- 🏘️ **Neighborhood Management** - Create communities, manage membership
- 📰 **Template Gallery** - Pre-built 11ty templates (blog, portfolio, newsletter, wiki)
- ✍️ **Content Management** - Create and edit content with rich editors
- 🏗️ **One-Click Build** - Compile templates + content → static HTML
- 🌐 **BlueSky Integration** - Dual-post to BlueSky, own your content
- 👥 **Admin Features** - Neighborhood owners manage welcome pages and announcements
- 🔌 **Plugin System** - Extend features with community plugins (future)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 7 |
| **Backend** | Python FastAPI |
| **Database** | DynamoDB (serverless) |
| **Site Generation** | 11ty (Eleventy) |
| **Federation** | AT Protocol |
| **Hosting** | AWS (Lambda, CloudFront, S3) |
| **IaC** | Terraform |

## Architecture at a Glance

```
Frontend (React)  →  Backend API (FastAPI)  →  Database (DynamoDB)
                            ↓
                    Lambda Build Function  →  S3/CloudFront
```

See [Architecture Overview](./docs/architecture.md) for details.

## Development

### Local Development

```bash
# Quick start (recommended)
./start-dev.sh

# Or manually:
cd app/dynamodb && docker-compose up &
cd app/api && uvicorn main:app --reload &
cd app/UI && npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8001
- **Database:** http://localhost:8000 (DynamoDB local)

See [Getting Started](./docs/getting-started.md) for full setup guide.

### Testing

```bash
# Frontend
cd app/UI
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Backend
cd app/api
pytest                # Run all tests
pytest --cov          # With coverage
```

See [Testing Guide](./docs/testing.md) for details.

## Deployment

Deploy to your own AWS account using Terraform:

```bash
cd devops
terraform init
terraform plan
terraform apply
```

**Cost:** $5-15/month for communities of 100+ users (serverless)

See [Deployment Guide](./docs/deployment.md) for detailed instructions.

## Development Phases

- ✅ **Phase 1:** MVP Foundation
- 🔧 **Phase 2:** AT Protocol Foundation (in progress)
- 📋 **Phase 3-9:** Planned phases (template system, content management, build pipeline, admin features, federation)

See [Phases & Roadmap](./docs/phases.md) for complete timeline.

## Project Structure

```
/docs/              ← Quick-reference guides for key topics
/specs/             ← Detailed technical specifications
/app/
  ├── UI/           ← React frontend
  ├── api/          ← Python FastAPI backend
  ├── lambda/       ← AWS Lambda functions
  └── dynamodb/     ← Local DynamoDB setup
/tickets/           ← Development tickets and specifications
/devops/            ← Terraform infrastructure
CLAUDE.md           ← Development configuration
README.md           ← This file
```

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines, ticket management, and project structure.

## Philosophy

**nbhd.city** is built on the conviction that communities should own their digital spaces:

- 🔓 **Decentralized** - No single authority, communities make their own decisions
- 🔐 **Data Ownership** - Users own their data, not the platform
- 💰 **Low Cost** - Serverless architecture enables affordable self-hosting
- 🤝 **Collaborative** - Members work together to create shared content
- 🌐 **Federated** - Built on AT Protocol for portability and interoperability

See [Soul of nbhd.city](./docs/soul.md) for the full vision.

## License

MIT - Fork it! Run your own!

---

**Docs updated:** 2026-02-21 | **Phase:** 2 (AT Protocol Foundation) in progress | **Docs:** See `/docs/`
