# nbhd.city

A collaborative neighborhood platform where members can create beautiful static sites using pre-built templates. Each neighborhood instance is fully autonomous—deployed independently with its own database, infrastructure, and users.

nbhd.city enables community members to publish sites without technical knowledge through an intuitive site builder. Users select from a gallery of 11ty-powered templates, customize with a dynamic form, and deploy instantly. Every published site gets a professional subdomain (e.g., `username.nbhd.city`) backed by CloudFront CDN.

The platform is built on modern, serverless architecture: a React frontend for the UI, FastAPI backend for APIs, DynamoDB for storage, and AWS Lambda for building static sites. Future phases will add AT Protocol integration, allowing each neighborhood to become a Personal Data Server on the decentralized web.

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend API)
- **pip** (Python package manager)

### Frontend Setup

The React frontend uses Vite as the build tool and runs on `http://localhost:5173`.

```bash
cd nbhd

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

**Key directories:**
- `src/pages/` - Main page components
- `src/components/` - Reusable UI components
- `src/__tests__/` - Component tests (Vitest)
- `src/styles/` - Global CSS

### API Setup

The FastAPI backend runs on `http://localhost:8000` and provides all REST endpoints.

```bash
cd api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload

# Run tests
pytest

# Run tests with coverage
pytest --cov
```

**Key files:**
- `main.py` - FastAPI app setup and route registration
- `models.py` - Pydantic models for request/response schemas
- `users/` - User authentication and profile endpoints
- `nbhds/` - Neighborhood management endpoints
- `templates.py` - Template discovery endpoints
- `sites/` - Site configuration and management endpoints

### Environment Variables

Create `.env` files in both `api/` and `nbhd/` directories:

**api/.env:**
```
# Server
PORT=8000
DEBUG=true

# Database (DynamoDB - optional for local dev)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Authentication
JWT_SECRET=your-secret-key-here
BLUESKY_CLIENT_ID=your_client_id
BLUESKY_CLIENT_SECRET=your_client_secret
```

**nbhd/.env:**
```
# API endpoint for development
VITE_API_URL=http://localhost:8000
```

---

## Project Structure

```
nbhd.city/
├── nbhd/                    # React frontend (Vite)
│   ├── src/
│   │   ├── pages/          # Page-level components
│   │   ├── components/     # Reusable components
│   │   │   └── SiteBuilder/
│   │   ├── __tests__/      # Component tests
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── api/                     # FastAPI backend
│   ├── main.py             # App entry point
│   ├── models.py           # Data models
│   ├── users/              # User endpoints
│   ├── nbhds/              # Neighborhood endpoints
│   ├── templates.py        # Template endpoints
│   ├── sites/              # Site endpoints
│   ├── requirements.txt
│   └── tests/
│
└── planning/               # Documentation
    ├── tickets.md          # Development tickets
    ├── ARCHITECTURE.md     # System design
    ├── API.md              # API documentation
    ├── FRONTEND.md         # Frontend guide
    └── DATABASE.md         # Data schema
```

---

## Key Features (Phase 2)

### Static Site Generation
- **Template Gallery** - Browse pre-built 11ty templates (blog, project, newsletter)
- **Site Configuration** - Dynamic form based on template schema
- **Live Preview** - See changes instantly as you configure
- **One-Click Deployment** - Publish to `username.nbhd.city` with custom domain support
- **Site Management** - Edit, delete, and manage published sites

### API Endpoints

**Templates:**
- `GET /api/templates` - List all available templates
- `GET /api/templates/{id}` - Get template metadata
- `GET /api/templates/{id}/schema` - Get configuration schema
- `GET /api/templates/{id}/preview` - Get preview image

**Sites:**
- `GET /api/sites` - List user's sites
- `POST /api/sites` - Create new site from template
- `GET /api/sites/{id}` - Get site configuration
- `PUT /api/sites/{id}` - Update site configuration
- `DELETE /api/sites/{id}` - Delete site

**Authentication:**
- `GET /auth/bluesky` - BlueSky OAuth login
- `POST /auth/callback` - OAuth callback handler

---

## Testing

### Frontend Tests
```bash
cd nbhd
npm test                    # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

Tests use Vitest + React Testing Library. Components are tested in isolation with mocked API calls.

### Backend Tests
```bash
cd api
pytest                     # Run all tests
pytest --cov             # With coverage
pytest -v                # Verbose output
```

Tests use pytest with async support for FastAPI endpoints.

---

## Architecture

The application follows a serverless architecture:

- **Frontend:** React SPA deployed to S3 + CloudFront
- **API:** FastAPI on AWS Lambda (with Mangum ASGI adapter)
- **Database:** DynamoDB for all data storage
- **Static Sites:** Generated by Lambda, stored in S3, served via CloudFront
- **Authentication:** BlueSky OAuth 2.0 → JWT tokens

See `planning/ARCHITECTURE.md` for detailed system design.

---

## Documentation

Comprehensive planning and architecture docs are in `planning/`:

- **tickets.md** - Development roadmap and task tracking
- **ARCHITECTURE.md** - System design and tech stack
- **API.md** - REST API endpoint specifications
- **DATABASE.md** - DynamoDB schema design
- **FRONTEND.md** - Frontend component structure
- **INFRASTRUCTURE.md** - AWS deployment guide
- **SECURITY.md** - Authentication and key management

---

## Contributing

1. Check `planning/tickets.md` for current work
2. Create a feature branch: `git checkout -b feature/SSG-###`
3. Write tests first (TDD approach)
4. Implement features
5. Ensure all tests pass
6. Commit with descriptive message
7. Push and create pull request

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, CSS Modules |
| Backend | FastAPI, Python 3.11 |
| Database | DynamoDB |
| Deployment | AWS Lambda, S3, CloudFront |
| Testing | Vitest, Pytest |
| Authentication | BlueSky OAuth 2.0 |
| Static Generator | 11ty (Eleventy) |

---

## License

MIT
