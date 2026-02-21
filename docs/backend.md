# Backend Guide

FastAPI server, REST endpoints, and data models for nbhd.city.

## Overview

The backend is a **Python FastAPI** application that provides all REST endpoints for the frontend.

**Key Details:**
- **Framework:** FastAPI 0.100+
- **Server:** Uvicorn (dev) / AWS Lambda + Mangum (production)
- **Database:** DynamoDB with single-table design
- **Authentication:** BlueSky OAuth 2.0 → JWT tokens

**Development:**
```bash
cd app/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  # Runs on http://localhost:8001
```

## API Endpoints

### Authentication
- **POST /auth/login** - Start BlueSky OAuth flow
- **POST /auth/callback** - Handle OAuth callback
- **POST /auth/test-login** - Test login with credentials (dev)
- **POST /auth/refresh** - Refresh JWT token

### Users
- **GET /users/me** - Get current user profile
- **PUT /users/me** - Update current user profile
- **GET /users/{id}** - Get user by ID
- **GET /users/search** - Search users by handle

### Neighborhoods
- **POST /nbhds** - Create new neighborhood
- **GET /nbhds** - List all neighborhoods
- **GET /nbhds/{id}** - Get neighborhood details
- **PUT /nbhds/{id}** - Update neighborhood settings
- **POST /nbhds/{id}/members** - Add member to neighborhood
- **GET /nbhds/{id}/members** - List members
- **DELETE /nbhds/{id}/members/{user_id}** - Remove member

### Sites
- **POST /sites** - Create new site
- **GET /sites** - List user's sites
- **GET /sites/{id}** - Get site details
- **PUT /sites/{id}** - Update site config
- **DELETE /sites/{id}** - Delete site
- **POST /sites/{id}/build** - Trigger site build

### Content
- **POST /content** - Create new content record
- **GET /content** - List content in neighborhood
- **GET /content/{id}** - Get content details
- **PUT /content/{id}** - Update content
- **DELETE /content/{id}** - Delete content
- **POST /content/{id}/publish** - Publish to BlueSky

### Templates
- **GET /templates** - List available templates
- **GET /templates/{id}** - Get template details
- **POST /templates/analyze** - Analyze custom template from GitHub

## Request/Response Format

All endpoints accept and return **JSON**. Authentication uses **JWT bearer tokens**.

**Example Request:**
```bash
curl -X POST http://localhost:8001/sites \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Blog",
    "template_id": "blog-minimal",
    "config": { "title": "My Blog", "tagline": "..." }
  }'
```

**Example Response:**
```json
{
  "id": "site_abc123",
  "name": "My Blog",
  "template_id": "blog-minimal",
  "config": { "title": "My Blog" },
  "created_at": "2026-02-21T10:30:00Z",
  "updated_at": "2026-02-21T10:30:00Z"
}
```

## Error Handling

All errors return **JSON** with status code and message:

```json
{
  "detail": "User not authenticated"
}
```

**Common Status Codes:**
- **200** - Success
- **201** - Created
- **400** - Bad request (invalid data)
- **401** - Unauthorized (missing/expired token)
- **403** - Forbidden (user lacks permission)
- **404** - Not found
- **500** - Server error

## Authentication & Authorization

### JWT Token

After successful OAuth login, backend returns a **JWT token** containing user info:

```json
{
  "sub": "user_uuid",
  "handle": "username.bsky",
  "name": "User Name",
  "exp": 1234567890
}
```

Frontend stores token in `localStorage` and includes it in all requests:
```
Authorization: Bearer <jwt_token>
```

### Protected Endpoints

All endpoints except `/auth/login` require a valid JWT token. Invalid/expired tokens return **401 Unauthorized**.

### Role-Based Access Control

Some endpoints check user role:
- **User** - Can manage own profile and sites
- **Admin** - Can manage neighborhood settings, members, and content
- **Owner** - Full control (creator of neighborhood)

## Data Models

### User

```python
class User:
    id: str                    # UUID
    handle: str               # BlueSky handle
    name: str
    email: str
    did: str                  # AT Protocol DID
    profile_picture_url: str  # Avatar
    created_at: datetime
    updated_at: datetime
    role: str                 # user, admin, owner
```

### Neighborhood

```python
class Neighborhood:
    id: str                   # UUID
    name: str
    description: str
    owner_id: str            # User ID of creator
    members: List[str]       # User IDs of members
    settings: Dict          # Community settings
    created_at: datetime
    updated_at: datetime
```

### Site

```python
class Site:
    id: str
    nbhd_id: str
    name: str
    template_id: str
    config: Dict              # Template-specific config
    status: str               # draft, building, published
    build_history: List[Dict] # Previous builds
    created_at: datetime
    updated_at: datetime
```

### Content

```python
class Content:
    id: str
    site_id: str
    title: str
    body: str
    metadata: Dict            # Tags, category, etc
    published: bool
    published_to_bsky: bool
    created_at: datetime
    updated_at: datetime
```

## Async Patterns

FastAPI endpoints use **async/await** for non-blocking I/O:

```python
@app.post("/sites")
async def create_site(site: SiteCreate, user: User = Depends(get_current_user)):
    result = await db.put_item(
        TableName="nbhd-main",
        Item=site_item
    )
    return SiteResponse(**result)
```

## Environment Variables

Backend env vars in `app/api/.env.local`:

```
PORT=8001
DEBUG=true
DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_REGION=us-east-1
JWT_SECRET=your-secret-key
BLUESKY_OAUTH_CLIENT_ID=your_id
BLUESKY_OAUTH_CLIENT_SECRET=your_secret
```

## Testing

```bash
cd app/api
pytest                    # Run all tests
pytest -v                # Verbose output
pytest --cov             # Coverage report
pytest tests/test_api.py # Specific file
```

**Test Structure:**
```
tests/
├── test_auth.py        # Authentication endpoints
├── test_nbhds.py       # Neighborhood endpoints
├── test_sites.py       # Site endpoints
├── test_content.py     # Content endpoints
└── conftest.py         # Fixtures and setup
```

## File Structure

```
app/api/
├── main.py              # FastAPI app setup and routes
├── models.py            # Pydantic request/response models
├── database.py          # DynamoDB client and queries
├── auth.py              # OAuth and JWT logic
├── users/
│   ├── routes.py        # User endpoints
│   └── service.py       # User business logic
├── nbhds/
│   ├── routes.py
│   └── service.py
├── sites/
│   ├── routes.py
│   └── service.py
├── content/
│   ├── routes.py
│   └── service.py
├── requirements.txt
└── .env.local
```

## Key Dependencies

```
fastapi              # Web framework
uvicorn              # ASGI server
boto3                # AWS SDK for DynamoDB
mangum               # ASGI adapter for Lambda
pydantic             # Request validation
python-jose          # JWT tokens
requests             # HTTP client
python-dotenv        # Environment variables
```

## Production Deployment

In production, the backend runs on **AWS Lambda** with **Mangum** ASGI adapter.

See [Deployment Guide](./deployment.md) for infrastructure setup.

## Related Documentation

- **[Getting Started](./getting-started.md)** - Local dev setup
- **[Frontend Guide](./frontend.md)** - How frontend calls these APIs
- **[Database Guide](./database.md)** - DynamoDB schema
- **[specs/API.md](../specs/API.md)** - Detailed API specifications

---

**Development:** `uvicorn main:app --reload` to start with hot reload
**Testing:** `pytest` to run tests
**Production:** Deployed to AWS Lambda
