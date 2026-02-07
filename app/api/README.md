# nbhd.city API

FastAPI-based backend for nbhd.city, a neighborhood management platform with BlueSky OAuth integration and DynamoDB storage.

## Quick Start

### Prerequisites

- Python 3.9+
- DynamoDB Local (optional, for local development)
- BlueSky OAuth credentials (for authentication)

### 1. Set Up Environment

Copy the environment template to create your local config:

```bash
# From project root
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# BlueSky OAuth Configuration
BLUESKY_OAUTH_CLIENT_ID=your-client-id
BLUESKY_OAUTH_CLIENT_SECRET=your-client-secret
BLUESKY_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=nbhd-city-development
AWS_REGION=us-east-1

# For local DynamoDB (recommended for development)
DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
```

### 2. Install Dependencies

```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start Local DynamoDB (Recommended)

```bash
cd ../devlocal
./scripts/start.sh
```

This will:
- Start DynamoDB Local on port 8000
- Start DynamoDB Admin UI on port 8001
- Automatically create all required tables

See [devlocal/README.md](../devlocal/README.md) for more details.

### 4. Start the API Server

```bash
cd api
uvicorn main:app --reload --port 8080
```

The API will be available at:
- API: http://localhost:8080
- Interactive API docs: http://localhost:8080/docs
- Alternative API docs: http://localhost:8080/redoc

**Note:** We use port 8080 because port 8000 is used by DynamoDB Local.

## API Structure

```
api/
├── main.py                  # FastAPI app & main routes
├── auth.py                  # JWT authentication logic
├── bluesky_oauth.py         # BlueSky OAuth implementation
├── bluesky_api.py           # BlueSky API client
├── models.py                # Pydantic data models
├── nbhd.py                  # Neighborhoods router
├── users.py                 # Users router
├── dynamodb_client.py       # DynamoDB connection
├── dynamodb_repository.py   # DynamoDB data access layer
├── lambda_handler.py        # AWS Lambda handler (for deployment)
└── requirements.txt         # Python dependencies
```

## Core Features

### Authentication

The API uses BlueSky OAuth 2.0 for authentication with JWT tokens for session management.

**Key endpoints:**
- `GET /auth/login` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout
- `POST /auth/test-login` - Test login (development only)

See [AUTH_README.md](./AUTH_README.md) for detailed authentication documentation.

### Neighborhoods

Manage neighborhood communities and memberships.

**Key endpoints:**
- `POST /api/nbhds` - Create a neighborhood
- `GET /api/nbhds` - List all neighborhoods
- `GET /api/nbhds/{id}` - Get neighborhood details
- `PUT /api/nbhds/{id}` - Update neighborhood
- `DELETE /api/nbhds/{id}` - Delete neighborhood
- `POST /api/nbhds/{id}/join` - Join a neighborhood
- `POST /api/nbhds/{id}/leave` - Leave a neighborhood

### Users

User profile and membership management.

**Key endpoints:**
- `GET /api/users/profile` - Get current user's BlueSky profile
- `GET /api/users/me/nbhds` - Get user's neighborhoods

## Making Authenticated Requests

All protected endpoints require a JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer {your-jwt-token}" \
  http://localhost:8000/api/nbhds
```

From JavaScript:
```javascript
const response = await fetch('http://localhost:8000/api/nbhds', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Development Workflow

### Option 1: Fresh Start with Test Data

```bash
# Terminal 1: Start DynamoDB
cd devlocal
./scripts/reset.sh
python init/seed_data.py

# Terminal 2: Start API
cd api
source venv/bin/activate
uvicorn main:app --reload
```

### Option 2: Persistent Development

```bash
# Terminal 1: Start DynamoDB (preserves existing data)
cd devlocal
./scripts/start.sh

# Terminal 2: Start API
cd api
source venv/bin/activate
uvicorn main:app --reload
```

### Using Test Login

For development without setting up OAuth:

```bash
# Set test credentials in .env.local
BSKY_USERNAME=your.bsky.social
BSKY_PASSWORD=your-app-password

# Then use the test login endpoint
curl -X POST http://localhost:8000/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username":"your.bsky.social","password":"your-app-password"}'
```

## Database Management

### Viewing Data

Open DynamoDB Admin UI:
```bash
open http://localhost:8001
```

### Seeding Test Data

```bash
cd devlocal
python init/seed_users.py  # Create test users
python init/seed_data.py   # Create test neighborhoods
```

### Export/Import Data

```bash
cd devlocal/scripts

# Export
python export_data.py

# Import
python import_data.py ../data/exports/all_items_TIMESTAMP.json
```

## Testing

Run the API and explore endpoints:

```bash
# Start server
uvicorn main:app --reload

# Open interactive docs
open http://localhost:8000/docs
```

The interactive docs allow you to:
- Test all endpoints
- See request/response schemas
- Try authentication flows
- View example data

## Dependencies

Key packages:
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **PyJWT** - JWT token handling
- **httpx** - Async HTTP client for BlueSky API
- **boto3** / **aioboto3** - AWS DynamoDB client
- **python-dotenv** - Environment variable management

See [requirements.txt](./requirements.txt) for full list.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SECRET_KEY` | JWT signing key | Yes | - |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration time | No | 10080 (7 days) |
| `BLUESKY_OAUTH_CLIENT_ID` | BlueSky OAuth client ID | Yes | - |
| `BLUESKY_OAUTH_CLIENT_SECRET` | BlueSky OAuth secret | Yes | - |
| `BLUESKY_OAUTH_REDIRECT_URI` | OAuth callback URL | Yes | - |
| `FRONTEND_URL` | Frontend URL for redirects | No | http://localhost:5173 |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | Yes | - |
| `AWS_REGION` | AWS region | Yes | us-east-1 |
| `DYNAMODB_ENDPOINT_URL` | Local DynamoDB URL | No | - |
| `AWS_ACCESS_KEY_ID` | AWS credentials | Conditional | - |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | Conditional | - |
| `BSKY_USERNAME` | Test login username | No | - |
| `BSKY_PASSWORD` | Test login password | No | - |

## CORS Configuration

The API currently allows all origins for development:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**For production**, restrict to your frontend domain:
```python
allow_origins=["https://yourdomain.com"]
```

## Deployment

The API includes AWS Lambda support via `lambda_handler.py`:

```python
from mangum import Mangum
from main import app

handler = Mangum(app)
```

Deploy using:
- AWS Lambda + API Gateway
- AWS Fargate/ECS
- Traditional VPS/container hosting

Ensure production environment variables are set securely.

## Troubleshooting

### Port Already in Use

If port 8000 is already in use:
```bash
# Use a different port
uvicorn main:app --reload --port 8001

# Or kill the process using port 8000
lsof -ti:8000 | xargs kill -9
```

### DynamoDB Connection Errors

```bash
# Check if DynamoDB is running
curl http://localhost:8000

# Restart DynamoDB
cd devlocal
./scripts/start.sh

# Verify connection
./scripts/check_health.sh
```

### Authentication Issues

- Verify `SECRET_KEY` is set in `.env.local`
- Check BlueSky OAuth credentials are correct
- Ensure `BLUESKY_OAUTH_REDIRECT_URI` matches your setup
- For test login, verify `BSKY_USERNAME` and `BSKY_PASSWORD` are set

### Module Import Errors

```bash
# Ensure you're in the api directory
cd api

# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

## Additional Documentation

- [Authentication Guide](./AUTH_README.md) - Detailed auth documentation
- [Local DynamoDB Setup](../devlocal/README.md) - Database setup guide
- [Frontend README](../nbhd/README.md) - Frontend documentation

## API Endpoints Reference

### Health & Info
- `GET /` - Welcome message
- `GET /health` - Health check

### Authentication
- `GET /auth/login` - Start OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/me` - Current user info
- `POST /auth/logout` - Logout
- `POST /auth/test-login` - Test login (dev only)

### Users
- `GET /api/users/profile` - Get user's BlueSky profile
- `GET /api/users/me/nbhds` - Get user's neighborhoods

### Neighborhoods
- `POST /api/nbhds` - Create neighborhood
- `GET /api/nbhds` - List neighborhoods
- `GET /api/nbhds/{id}` - Get neighborhood
- `PUT /api/nbhds/{id}` - Update neighborhood
- `DELETE /api/nbhds/{id}` - Delete neighborhood
- `POST /api/nbhds/{id}/join` - Join neighborhood
- `POST /api/nbhds/{id}/leave` - Leave neighborhood

For detailed request/response schemas, visit http://localhost:8000/docs when running the server.

## Getting Help

- Check the [interactive API docs](http://localhost:8000/docs)
- Review [AUTH_README.md](./AUTH_README.md) for authentication help
- See [devlocal/README.md](../devlocal/README.md) for database issues
- Open an issue on the project repository

## License

[Add your license here]
