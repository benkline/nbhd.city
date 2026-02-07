# System Architecture

**Focus:** System design, tech stack, deployment model
**Last Updated:** 2026-01-10

---

## Deployment Model

### Single Nbhd Per Deployment (Autonomous)

Each nbhd.city instance is **one completely independent neighborhood**.

- **No multi-tenancy** - Each deployment hosts ONE nbhd only
- **Autonomous operation** - Own database, infrastructure, users
- **Self-hosted** - Users fork repo and deploy to their AWS account
- **Reference instance** - nbhd.city's own deployment is one example
- **Low cost** - $5-15/month for small neighborhood (100 users)

**User Accounts:**
- Users create one account per nbhd instance
- To join another neighborhood → create separate account on that instance
- No concept of users managing multiple neighborhoods simultaneously

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Server:** Uvicorn (dev) / AWS Lambda + Mangum (production)
- **Database:** DynamoDB (NoSQL, serverless)
- **Authentication:** BlueSky OAuth 2.0 → JWT tokens
- **Static Generator:** 11ty (Eleventy) v3.0+

### Frontend
- **Framework:** React 19.2
- **Build Tool:** Vite 7.2
- **Router:** React Router v7 (hash-based for static hosting)
- **State:** React Context + custom hooks (no Redux)
- **HTTP:** Axios with automatic token injection
- **Styling:** CSS Modules (component-scoped)

### Infrastructure (AWS)
- **Compute:** Lambda (512MB RAM, 30s timeout)
- **Storage:** DynamoDB (on-demand billing)
- **CDN:** CloudFront (assets + subdomains)
- **Static Hosting:** S3 buckets
- **Monitoring:** CloudWatch Logs + Metrics
- **IaC:** Terraform/OpenTofu

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (SPA)                  │
│                  (S3 + CloudFront CDN)                   │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API calls
                      ↓
┌─────────────────────────────────────────────────────────┐
│              API Gateway + Lambda Functions              │
│              (FastAPI on AWS Lambda + Mangum)            │
├─────────────────────────────────────────────────────────┤
│ Core Services:                                            │
│ • User Auth & Profiles (BlueSky OAuth)                   │
│ • Neighborhood Management                                 │
│ • Static Site Configuration                              │
│ • Site Build Orchestration                               │
│ • AT Protocol PDS (Phase 2)                              │
│ • Plugin Registry (Phase 4)                              │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
    ┌────────┐   ┌─────────┐   ┌─────────┐
    │DynamoDB│   │  S3     │   │Secrets  │
    │  (DB)  │   │ (Sites) │   │Manager  │
    └────────┘   └─────────┘   └─────────┘
```

### Data Flow

**Authentication:**
1. User clicks "Login with BlueSky"
2. Redirects to BlueSky OAuth → user authorizes
3. BlueSky redirects back with auth code
4. API exchanges code for BlueSky access token
5. API creates JWT (7-day expiration) → frontend stores in localStorage
6. Frontend includes JWT in all subsequent API requests

**Static Site Generation:**
1. User selects template from gallery
2. Fills in config form (title, colors, content)
3. Frontend sends config JSON to API
4. **Preview mode:** WASM 11ty renders in browser (instant)
5. **Publish mode:** API triggers Lambda build
6. Lambda clones template, merges config, runs 11ty
7. Output uploaded to S3 bucket
8. CloudFront invalidated
9. Site live at `username.nbhd.city`

---

## Key Architectural Decisions

| Decision | Why |
|----------|-----|
| **Single-table DynamoDB** | Serverless, no ops, pay-per-request, simple scaling |
| **Lambda for builds** | Ephemeral, scales auto, only pay for execution time |
| **Stateless API** | Easy to scale, no session management |
| **Client-side WASM preview** | Instant feedback, no server round-trip, privacy (preview offline) |
| **Subdomain routing** | Professional URLs, easy to remember, CloudFront handles routing |
| **React Context (no Redux)** | Small team, modest scope, simpler than Redux |
| **CSS Modules** | Component isolation, no global CSS conflicts |

---

## Service Boundaries

### API (Backend)

**Responsibilities:**
- User authentication via BlueSky OAuth
- User profile management
- Neighborhood CRUD operations
- Site configuration persistence
- Build job orchestration
- AT Protocol PDS operations
- Plugin management

**Stateless:** All state in DynamoDB, sessions in JWT

### Frontend (React SPA)

**Responsibilities:**
- User interface and UX
- Form validation (client-side)
- WASM preview rendering
- Token management (localStorage)
- State management (Context API)

**Runs:** In browser, deployed to S3 + CloudFront

### Lambda Functions

**Site Builder:**
- Clone 11ty template repo
- Merge user config
- Run 11ty build
- Upload to S3
- Return final URL

**Async tasks** (future):
- Email sending
- Data exports
- Scheduled syncs
- PDS federation

---

## Scalability Approach

**DynamoDB:** On-demand billing - automatically scales with load
**Lambda:** Auto-scales based on concurrent invocations
**S3 + CloudFront:** Serves static content at edge locations
**No scaling bottlenecks** for neighborhood under 10,000 users

**Estimated costs:**
- 100 users: $6/month
- 1,000 users: $15/month
- 10,000 users: $50/month

(See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for detailed breakdown)

---

## See Also

- [DATABASE.md](./DATABASE.md) - Data models and schema
- [API.md](./API.md) - API endpoint design
- [FRONTEND.md](./FRONTEND.md) - Frontend structure
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Cloud setup
