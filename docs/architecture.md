# Architecture Overview

High-level system design and tech stack decisions for nbhd.city.

## Deployment Model

### Single Nbhd Per Instance (Autonomous)

Each nbhd.city instance is **one completely independent neighborhood**:
- **No multi-tenancy** - Each deployment hosts ONE nbhd
- **Autonomous operation** - Own database, infrastructure, users
- **Self-hosted** - Communities fork the repo and deploy to their own AWS account
- **Reference instance** - nbhd.city itself runs one example
- **Low cost** - $5-15/month for a neighborhood of 100+ users

**User Accounts:**
- Users create one account per nbhd instance
- To join another neighborhood → create a new account on that instance
- No concept of multi-neighborhood user management

This design prioritizes **community autonomy** over corporate-scale growth.

## Technology Stack

### Backend
- **Framework:** Python FastAPI (3.11+)
- **Server:** Uvicorn (dev) / AWS Lambda + Mangum (production)
- **Database:** DynamoDB (NoSQL, serverless, on-demand pricing)
- **Authentication:** BlueSky OAuth 2.0 → JWT tokens
- **Static Generator:** 11ty (Eleventy) v3.0+ for site building

### Frontend
- **Framework:** React 19.2
- **Build Tool:** Vite 7.2
- **Routing:** React Router v7 (hash-based for static hosting)
- **State Management:** React Context + custom hooks (no Redux)
- **HTTP Client:** Axios (auto-injects JWT tokens)
- **Styling:** CSS Modules (component-scoped)

### Infrastructure (AWS)
- **Compute:** Lambda (512MB RAM, 30s timeout)
- **Storage:** DynamoDB (serverless, on-demand)
- **CDN:** CloudFront (content delivery + subdomain routing)
- **Static Hosting:** S3 buckets (for sites and frontend)
- **Monitoring:** CloudWatch Logs + Metrics
- **IaC:** Terraform (infrastructure as code)

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (React)                     │
│             http://localhost:5173                    │
├─────────────────────────────────────────────────────┤
│                     Axios Client                     │
│            (Auto JWT Token Injection)                │
└────────────────────┬────────────────────────────────┘
                     │ REST Calls
                     ▼
┌─────────────────────────────────────────────────────┐
│            Backend API (FastAPI)                     │
│             http://localhost:8001                    │
├─────────────────────────────────────────────────────┤
│  Routes: /auth, /users, /nbhds, /sites, /content   │
│  All endpoints return JSON                           │
└────────────────────┬────────────────────────────────┘
                     │ Queries
                     ▼
┌─────────────────────────────────────────────────────┐
│            DynamoDB (NoSQL Database)                 │
│           Single-Table Design                        │
├─────────────────────────────────────────────────────┤
│  Items: Users, Neighborhoods, Sites, Content        │
│  Access Patterns: OAuth, Neighborhood Membership    │
└─────────────────────────────────────────────────────┘
```

### Data Flow for Site Building

```
1. User Creates Site (Frontend)
   └─ Calls POST /sites endpoint

2. Site Config Stored (Backend)
   └─ Writes to DynamoDB

3. User Triggers Build (Frontend)
   └─ Calls POST /sites/{id}/build endpoint

4. Lambda Build Function (Serverless)
   ├─ Fetches template from GitHub
   ├─ Retrieves site config from DynamoDB
   ├─ Runs 11ty to compile template + content
   └─ Uploads output HTML to S3

5. CloudFront CDN
   └─ Serves built site at subdomain.nbhd.city
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Serverless** | No servers to manage, automatic scaling, pay-per-use pricing |
| **DynamoDB** | NoSQL for flexible schemas, serverless, built-in replication |
| **Single Nbhd/Instance** | Simplifies operations, enables community governance, clear resource boundaries |
| **Static Site Generation** | Fast, cheap to serve, portable, can be self-hosted |
| **AT Protocol Records** | Enables federation, data portability, alignment with decentralized web |
| **BlueSky OAuth** | Simple authentication, connects to broader network |
| **React + Vite** | Fast builds, modern DX, works well with static hosting |
| **Terraform** | Infrastructure as code, version control, reproducible deployments |

## Integration with AT Protocol

nbhd.city uses **AT Protocol** (the protocol behind BlueSky) to:
- Store community records with standard schemas
- Enable federation with BlueSky and other AT Protocol services
- Support data portability (communities can export and migrate)
- Align with decentralized web values

See [AT Protocol Integration](./atprotocol.md) for details.

## Authentication Flow

```
1. User clicks "Sign In"
2. Redirected to BlueSky OAuth
3. User authorizes nbhd.city on BlueSky
4. BlueSky returns authorization code
5. Backend exchanges code for user credentials
6. Backend creates JWT token
7. Token stored in frontend localStorage
8. All subsequent API calls include JWT in Authorization header
```

## Database Design (Single-Table DynamoDB)

**Primary Key:** `PK` + `SK` composite key

Common item types:
- `USER#uuid` - User profiles, credentials
- `NBHD#id` - Neighborhood metadata, members
- `SITE#id` - Site configurations, metadata
- `CONTENT#id` - Blog posts, project entries, announcements

See [Database Guide](./database.md) and [specs/DATABASE.md](../specs/DATABASE.md) for details.

## Scalability & Performance

### Frontend
- Deployed to S3 + CloudFront (CDN)
- Hash-based routing works with static hosting
- Client-side rendering reduces server load

### Backend
- Serverless Lambda scales automatically
- DynamoDB on-demand pricing scales with traffic
- No cold-start issues with Uvicorn in Lambda

### Database
- DynamoDB handles spiky traffic automatically
- Single-table design minimizes inter-table operations
- Global secondary indexes for common queries

## Environment-Specific Behavior

| Environment | Database | API Server | Frontend |
|------------|----------|-----------|----------|
| **Local Dev** | DynamoDB Local (Docker) | Uvicorn on port 8001 | Vite on port 5173 |
| **Production** | AWS DynamoDB | Lambda + Mangum | S3 + CloudFront |

## Related Documentation

- **[Getting Started](./getting-started.md)** - Set up local development
- **[Frontend Guide](./frontend.md)** - React components and pages
- **[Backend Guide](./backend.md)** - API structure and endpoints
- **[Database Guide](./database.md)** - DynamoDB schema
- **[AT Protocol Integration](./atprotocol.md)** - Federation support
- **[Deployment Guide](./deployment.md)** - Self-hosting instructions
- **[specs/ARCHITECTURE.md](../specs/ARCHITECTURE.md)** - Detailed architecture decisions

---

**See Also:** [Phases & Roadmap](./phases.md) for how we're building this out over 9 phases.
