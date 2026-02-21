# Getting Started with nbhd.city

Get nbhd.city running locally in 5 minutes.

## Quick Start (Recommended)

The easiest way to start all services at once:

```bash
cd /Users/benkline/Projects/nbhd.city
./start-dev.sh
```

This single command starts:
- **DynamoDB Local** (port 8000) - Local database
- **Backend API** (port 8001) - REST API server
- **Frontend** (port 5173) - Web UI

Then open **`http://localhost:5173`** in your browser.

## Prerequisites

- **Node.js 18+** - for frontend
- **Python 3.11+** - for backend
- **Docker** - for local DynamoDB
- **Git** - for version control

## Manual Setup (If Needed)

### 1. Start Backend & Database

```bash
cd app/dynamodb
docker-compose up
```

This starts:
- DynamoDB Local on **port 8000**
- Backend API on **port 8001**
- DynamoDB Admin UI at **http://localhost:8001**

### 2. Start Frontend (New Terminal)

```bash
cd app/UI
npm install  # First time only
npm run dev
```

Frontend will be available at **`http://localhost:5173`**

## Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 5173 | Web UI (React app) |
| Backend API | 8001 | REST endpoints |
| DynamoDB Local | 8000 | Local database |
| DynamoDB Admin | 8002 | Database browser |

## Configuration

### Backend (app/.env.local)

```
DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_REGION=us-east-1
BLUESKY_OAUTH_CLIENT_ID=your_client_id
BLUESKY_OAUTH_CLIENT_SECRET=your_client_secret
```

### Frontend (app/UI/.env.local)

```
VITE_API_URL=http://localhost:8001
```

## Testing the Setup

Once everything is running, test the login endpoint:

```bash
curl -X POST http://localhost:8001/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username":"your.bsky.handle", "password":"your_password"}'
```

You should get back a JWT token.

## Running Tests

### Frontend Tests

```bash
cd app/UI
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

Uses **Vitest + React Testing Library** for component testing.

### Backend Tests

```bash
cd app/api
pytest                   # Run all tests
pytest --cov             # With coverage
pytest -v                # Verbose output
```

Uses **pytest** with async support for FastAPI endpoints.

## Troubleshooting

### Port Already in Use

```bash
# Kill processes on specific ports
lsof -ti:8000,8001,5173 | xargs kill -9
```

### DynamoDB Connection Failed

1. Ensure Docker is running: `docker ps`
2. Check DynamoDB health: `curl http://localhost:8000`
3. Restart: `docker-compose down && docker-compose up`

### Frontend Shows "Failed to Fetch"

1. Verify backend is running on port 8001
2. Check `app/UI/.env.local` has `VITE_API_URL=http://localhost:8001`
3. Restart frontend after changing `.env.local`

## Stopping Services

**With start-dev.sh:** Press `Ctrl+C`

**Manual setup:**
- Frontend: Press `Ctrl+C`
- Backend/DynamoDB: `docker-compose down`

## Next Steps

1. ✅ Frontend is running at **http://localhost:5173**
2. ✅ Backend API is ready at **http://localhost:8001**
3. ✅ Database is running

Now you can:
- Explore the UI
- Review [Frontend docs](./frontend.md) to understand components
- Review [Backend docs](./backend.md) to understand APIs
- Check `/tickets/` for development tasks

## Key Directories

```
app/
├── UI/           # React frontend (Vite)
│  ├── src/
│  │  ├── pages/      # Page components
│  │  ├── components/ # Reusable UI components
│  │  ├── styles/     # CSS modules
│  │  └── __tests__/  # Component tests
│  └── package.json
├── api/          # Python FastAPI backend
│  ├── main.py        # App setup
│  ├── models.py      # Pydantic schemas
│  ├── users/         # User endpoints
│  ├── nbhds/         # Neighborhood endpoints
│  ├── sites/         # Site endpoints
│  └── requirements.txt
├── lambda/       # AWS Lambda functions
└── dynamodb/     # Local DynamoDB setup
   └── docker-compose.yml
```

For detailed information, see:
- **[Architecture Overview](./architecture.md)** - System design
- **[Frontend Guide](./frontend.md)** - React components
- **[Backend Guide](./backend.md)** - API endpoints
- **[Full Technical Specs](../specs/)** - Deep dives

---

**Need help?** Check [CLAUDE.md](../CLAUDE.md) or see troubleshooting section above.
