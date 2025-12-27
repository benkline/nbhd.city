from fastapi import FastAPI, HTTPException, status, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import secrets
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from models import Token, User
from auth import create_access_token, get_current_user
from bluesky_oauth import get_oauth_authorize_url, exchange_code_for_token
from database import init_db, close_db
from neighborhoods import router as nbhds_router


class TestLoginRequest(BaseModel):
    username: str
    password: str

app = FastAPI(title="nbhd.city API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(nbhds_router, tags=["nbhds"])

# Store OAuth states (in production, use a database or Redis)
oauth_states = {}


# Database startup/shutdown events
@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    await init_db()


@app.on_event("shutdown")
async def shutdown():
    """Close database connections on shutdown."""
    await close_db()


@app.get("/")
def read_root():
    return {"message": "Welcome to nbhd.city API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/auth/login")
async def login(return_url: str = Query(default=None)):
    """
    Initiate BlueSky OAuth login flow.
    Redirects user to BlueSky authorization endpoint.

    Args:
        return_url: Optional frontend URL to return to after authentication.
                   Defaults to FRONTEND_URL environment variable or http://localhost:5173
    """
    state = secrets.token_urlsafe(32)

    # Store return URL with the state for later retrieval in callback
    frontend_url = return_url or os.getenv("FRONTEND_URL", "http://localhost:5173")
    oauth_states[state] = {"frontend_url": frontend_url}

    auth_url = get_oauth_authorize_url(state)
    return RedirectResponse(url=auth_url)


@app.get("/auth/callback")
async def oauth_callback(code: str = Query(...), state: str = Query(...)):
    """
    Handle BlueSky OAuth callback.
    Exchanges authorization code for access token.
    """
    # Verify state to prevent CSRF attacks
    if state not in oauth_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )

    state_data = oauth_states[state]
    del oauth_states[state]

    try:
        token_data = await exchange_code_for_token(code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate with BlueSky"
        )

    # Create our JWT token
    access_token = create_access_token(token_data["did"])

    # In production, you'd save the user info and BlueSky tokens to your database
    # For now, we'll just return the token
    frontend_url = state_data.get("frontend_url") or os.getenv("FRONTEND_URL", "http://localhost:5173")
    # Redirect to callback.html which handles the static SPA redirect with hash routing
    return RedirectResponse(
        url=f"{frontend_url}/callback.html?token={access_token}",
        status_code=status.HTTP_302_FOUND
    )


@app.get("/auth/me", response_model=dict)
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    Requires valid JWT token in Authorization header.
    """
    return {
        "user_id": user_id,
        "authenticated": True
    }


@app.post("/auth/logout")
async def logout(user_id: str = Depends(get_current_user)):
    """
    Logout endpoint. In this JWT-based system, clients simply discard their token.
    """
    return {"message": "Successfully logged out"}


@app.post("/auth/test-login", response_model=Token)
async def test_login(request: TestLoginRequest):
    """
    Test login endpoint for development/testing.
    Authenticates against credentials in BSKY_USERNAME and BSKY_PASSWORD environment variables.
    """
    test_username = os.getenv("BSKY_USERNAME")
    test_password = os.getenv("BSKY_PASSWORD")

    if not test_username or not test_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Test credentials not configured"
        )

    if request.username != test_username or request.password != test_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Create JWT token with test user ID
    test_user_id = "did:plc:test-user"
    access_token = create_access_token(test_user_id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": test_user_id,
            "handle": request.username,
            "display_name": "Test User",
            "avatar": None,
            "created_at": None
        }
    }
