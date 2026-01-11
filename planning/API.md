# API Design

**Focus:** REST API endpoints, authentication, response formats
**Last Updated:** 2026-01-10

---

## Base URL

```
Production: https://api.nbhd.city
Development: http://localhost:8000
```

## Authentication

All endpoints except login require JWT token in `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token:**
- Algorithm: HS256
- Expiration: 7 days
- Secret: Stored in AWS Secrets Manager

---

## Core Endpoints

### Authentication

```
POST /auth/login
  └─ Initiates BlueSky OAuth flow
  └─ Returns redirect URL to BlueSky

POST /auth/callback
  └─ BlueSky OAuth callback
  └─ Exchanges code for JWT
  └─ Returns token + redirect to frontend

POST /auth/logout
  └─ Clears session (frontend removes token)
  └─ Requires: JWT token
```

### User Profile

```
GET /api/user
  └─ Get current user's profile
  └─ Requires: JWT token
  └─ Returns: User object

PUT /api/user
  └─ Update user profile (bio, location, etc)
  └─ Requires: JWT token
  └─ Body: { display_name, bio, location, avatar_url }

GET /api/user/export/atproto
  └─ Export user data in AT Protocol format
  └─ Requires: JWT token
  └─ Returns: ZIP or JSON of all user data
```

### Neighborhoods

```
GET /api/neighborhoods
  └─ List all neighborhoods (public only)
  └─ Returns: Array of neighborhood objects
  └─ Query: ?skip=0&limit=20

GET /api/neighborhoods/{id}
  └─ Get neighborhood details
  └─ Returns: Neighborhood object + member count

POST /api/neighborhoods
  └─ Create new neighborhood
  └─ Requires: JWT token
  └─ Body: { name, description, privacy }
  └─ Returns: Neighborhood object

PUT /api/neighborhoods/{id}
  └─ Update neighborhood settings
  └─ Requires: JWT token, admin role
  └─ Body: { description, settings, ... }

DELETE /api/neighborhoods/{id}
  └─ Delete neighborhood (creator only)
  └─ Requires: JWT token, creator
  └─ Returns: 204 No Content
```

### Memberships

```
GET /api/neighborhoods/{id}/members
  └─ List neighborhood members
  └─ Returns: Array of member objects
  └─ Query: ?skip=0&limit=50

POST /api/neighborhoods/{id}/join
  └─ Join neighborhood
  └─ Requires: JWT token
  └─ Returns: Membership object

DELETE /api/neighborhoods/{id}/leave
  └─ Leave neighborhood
  └─ Requires: JWT token
  └─ Returns: 204 No Content

PUT /api/neighborhoods/{id}/members/{user_did}
  └─ Update member (promote/demote)
  └─ Requires: JWT token, admin role
  └─ Body: { role: "member" | "admin" }

DELETE /api/neighborhoods/{id}/members/{user_did}
  └─ Remove member from neighborhood
  └─ Requires: JWT token, admin role
```

### Static Sites

```
GET /api/templates
  └─ List all available 11ty templates
  └─ Returns: Array of template metadata
  └─ Query: ?type=blog&tags=responsive

GET /api/templates/{id}
  └─ Get single template details
  └─ Returns: Template object + schema

GET /api/templates/{id}/preview
  └─ Get template preview image
  └─ Returns: PNG/JPG preview

POST /api/sites
  └─ Create new site
  └─ Requires: JWT token
  └─ Body: { title, template, config }
  └─ Returns: Site object

GET /api/sites/{id}
  └─ Get site details + current config
  └─ Requires: JWT token (must be owner)
  └─ Returns: Site object

PUT /api/sites/{id}
  └─ Update site configuration
  └─ Requires: JWT token (must be owner)
  └─ Body: { title, config, ... }

DELETE /api/sites/{id}
  └─ Delete site
  └─ Requires: JWT token (must be owner)
  └─ Returns: 204 No Content

POST /api/sites/{id}/build
  └─ Trigger site build
  └─ Requires: JWT token (must be owner)
  └─ Returns: { job_id, status }
  └─ Async operation (returns 202 Accepted)

GET /api/sites/{id}/build/{job_id}
  └─ Get build job status
  └─ Returns: { status, progress, error?, url? }

GET /api/sites/{id}/export
  └─ Download site as ZIP
  └─ Requires: JWT token (must be owner)
  └─ Returns: ZIP file (application/zip)
```

---

## Response Format

### Success (2xx)

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-10T12:30:00Z",
    "request_id": "req-abc123"
  }
}
```

### Error (4xx, 5xx)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid neighborhood name",
    "details": {
      "field": "name",
      "reason": "Must be 3-50 characters"
    }
  },
  "meta": {
    "timestamp": "2026-01-10T12:30:00Z",
    "request_id": "req-abc123"
  }
}
```

---

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_TOKEN | 401 | JWT invalid or expired |
| UNAUTHORIZED | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Bad request data |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

```
Global:       100 requests/minute per IP
Authenticated: 1000 requests/hour per user
```

**Specific limits:**
- Neighborhood creation: 5/day per user
- Site builds: 10/hour per user
- Profile updates: 20/hour per user

**Headers returned:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1234567890
```

---

## Phase 2 New Endpoints

### AT Protocol PDS

```
POST /api/user/did
  └─ Get or register DID for current user
  └─ Requires: JWT token
  └─ Returns: { did, public_key, registered_at }

GET /.well-known/at-uri
  └─ AT Protocol service discovery
  └─ Returns: PDS service info

GET /xrpc/com.atproto.repo.getRepo
  └─ AT Protocol PDS endpoint
  └─ Query: ?did={user_did}
  └─ Returns: User's repository data
```

---

## Documentation

**Interactive API docs:**
- Swagger UI: `https://api.nbhd.city/docs`
- ReDoc: `https://api.nbhd.city/redoc`

Automatically generated from FastAPI docstrings.

---

## See Also

- [DATABASE.md](./DATABASE.md) - Data models
- [SECURITY.md](./SECURITY.md) - Authentication details
