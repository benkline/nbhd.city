# nbhd.city

A full-stack web application for building neighborhood communities. This repository contains the API and frontend for connecting neighbors.

## Project Structure

```
nbhd.city/
├── api/                      # FastAPI backend
│   ├── main.py              # Main application entry point
│   ├── auth.py              # JWT authentication utilities
│   ├── models.py            # Pydantic data models
│   ├── bluesky_oauth.py     # BlueSky OAuth integration
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   ├── .gitignore           # Git ignore rules
│   └── AUTH_README.md       # Authentication documentation
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Page components (Login, Dashboard, etc.)
│   │   ├── contexts/        # React contexts (Auth context)
│   │   ├── lib/             # Utilities (API client)
│   │   ├── styles/          # CSS modules
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── .env.example         # Environment variables template
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   └── FRONTEND_README.md   # Frontend documentation
└── README.md                # This file
```

## Architecture

### Backend

The nbhd.city API is built with **FastAPI** and provides:

- **Authentication**: BlueSky OAuth 2.0 with JWT tokens
- **Real-time Communication**: Async/await support for high concurrency
- **Interactive Documentation**: Auto-generated API docs at `/docs` and `/redoc`

**Key Features:**
- ✅ BlueSky OAuth 2.0 authentication
- ✅ JWT-based session management
- ✅ CORS middleware configured
- ✅ Async request handling
- ✅ Comprehensive authentication documentation

### Frontend

The frontend is built with **React + Vite** and provides:

- **Authentication Context**: Global state management for authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **OAuth Integration**: Seamless BlueSky login flow
- **Responsive Design**: Mobile-friendly interface with CSS modules

**Key Features:**
- ✅ React Router for client-side navigation
- ✅ Axios HTTP client with automatic token injection
- ✅ Clean component-based architecture
- ✅ CSS Modules for scoped styling
- ✅ Fast hot module reloading with Vite

## Quick Start

### Prerequisites

- Python 3.11+ and pip/venv (for API)
- Node.js 16+ and npm (for frontend)

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:benkline/nbhd.city.git
   cd nbhd.city
   ```

2. **Set up Python environment:**
   ```bash
   cd api
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your BlueSky OAuth credentials
   ```

5. **Run the API:**
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **In a new terminal, navigate to the frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # .env should have:
   # VITE_API_URL=http://localhost:8000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Full Stack Running

You should now have:
- API backend at `http://localhost:8000` (/docs for API docs)
- Frontend at `http://localhost:5173` (redirects unauthenticated users to /login)

Visit `http://localhost:5173` in your browser to start!

## API Endpoints

### Health & Status

- `GET /` - Welcome message
- `GET /health` - Health check

### Authentication

- `GET /auth/login` - Initiate BlueSky OAuth login
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/me` - Get current user info (requires JWT)
- `POST /auth/logout` - Logout endpoint (requires JWT)

### Documentation

- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Authentication

This API uses **BlueSky OAuth 2.0** for authentication with **JWT tokens** for session management.

### Login Flow

1. User visits `/auth/login`
2. Redirected to BlueSky authorization page
3. User authorizes the application
4. Redirected back to `/auth/callback` with authorization code
5. API exchanges code for BlueSky tokens
6. API issues a JWT token to the client
7. Client uses JWT token for subsequent requests

### Using Authenticated Endpoints

Include the JWT token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer {your-jwt-token}" \
  http://localhost:8000/auth/me
```

For detailed authentication documentation, see [api/AUTH_README.md](api/AUTH_README.md).

## Configuration

### Backend Environment Variables

See `api/.env.example`:

```
# API Configuration
ENVIRONMENT=development
DEBUG=true

# JWT Configuration
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# BlueSky OAuth
BLUESKY_OAUTH_CLIENT_ID=your-client-id
BLUESKY_OAUTH_CLIENT_SECRET=your-client-secret
BLUESKY_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables

See `frontend/.env.example`:

```
# API URL
VITE_API_URL=http://localhost:8000

# App name
VITE_APP_NAME=nbhd.city
```

## Development

### Project Layout

- **Authentication**: `api/auth.py`, `api/bluesky_oauth.py`
- **Data Models**: `api/models.py`
- **Routes**: `api/main.py`

### Adding Protected Routes

To create an endpoint that requires authentication:

```python
from fastapi import Depends
from auth import get_current_user

@app.get("/api/my-endpoint")
async def my_endpoint(user_id: str = Depends(get_current_user)):
    return {"user_id": user_id}
```

### Running Tests

(Tests to be added)

## Security Considerations

⚠️ **Before deploying to production:**

1. Generate a strong `SECRET_KEY`
2. Enable HTTPS only
3. Update CORS origins to specific domains
4. Use environment variables for all secrets
5. Implement token refresh mechanism
6. Store OAuth states in a persistent database (Redis/DB)
7. Use httpOnly, Secure, SameSite cookies for tokens

See [api/AUTH_README.md](api/AUTH_README.md#security-considerations) for more details.

## Next Steps

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User profiles and neighborhoods
- [ ] Real-time neighborhood events
- [ ] Frontend application (React/Next.js)
- [ ] Deployment pipeline (Docker/Kubernetes)

## Contributing

(Contribution guidelines to be added)

## License

(Add your license here)

## Support

For issues or questions, open an issue on GitHub at https://github.com/benkline/nbhd.city/issues
