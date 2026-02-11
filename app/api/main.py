from fastapi import FastAPI, HTTPException, status, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import secrets
import os
import httpx
import json
from dotenv import load_dotenv

# Load environment variables from .env.local file in project root
import pathlib
project_root = pathlib.Path(__file__).parent.parent
load_dotenv(project_root / '.env.local')

from models import Token, User, UserProfile
from auth import create_access_token, get_current_user, get_bluesky_token, get_bluesky_handle
from bluesky_oauth import get_oauth_authorize_url, exchange_code_for_token
from bluesky_api import get_bluesky_profile
from nbhd import router as nbhds_router
from users import router as users_router
from templates import router as templates_router
from sites import router as sites_router
from nbhd_content import router as nbhd_content_router


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
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(templates_router, tags=["templates"])
app.include_router(sites_router, tags=["sites"])
app.include_router(nbhd_content_router, tags=["nbhd-content"])

# Store OAuth states (in production, use a database or Redis)
oauth_states = {}


# DynamoDB doesn't need startup/shutdown events
# Connection is managed per-request


@app.get("/")
def read_root():
    return {"message": "Welcome to nbhd.city API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/client-metadata.json")
def get_client_metadata():
    """
    Serve BlueSky OAuth client metadata.
    This file is required for BlueSky's decentralized OAuth flow.
    The URL to this endpoint becomes the client_id for OAuth.
    """
    metadata_path = os.path.join(os.path.dirname(__file__), "client-metadata.json")
    return FileResponse(metadata_path, media_type="application/json")


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

    # Create our JWT token with BlueSky access token and handle included
    access_token = create_access_token(
        user_id=token_data["did"],
        bluesky_token=token_data.get("access_token"),
        bsky_handle=token_data.get("handle")
    )

    # In production, you'd save the user info and BlueSky tokens to your database
    # For now, we'll just return the token
    frontend_url = state_data.get("frontend_url") or os.getenv("FRONTEND_URL", "http://localhost:5173")
    # Redirect to callback.html which handles storing token and redirecting to hash router
    return RedirectResponse(
        url=f"{frontend_url}/callback.html?token={access_token}",
        status_code=status.HTTP_302_FOUND
    )


@app.get("/auth/me", response_model=dict)
async def get_current_user_info(user_id: str = Depends(get_current_user), request: Request = None, bsky_handle: Optional[str] = Depends(get_bluesky_handle)):
    """
    Get the current authenticated user's information.
    Requires valid JWT token in Authorization header.
    """
    return {
        "user_id": user_id,
        "handle": bsky_handle,
        "authenticated": True
    }


@app.get("/api/users/profile", response_model=UserProfile)
async def get_user_profile(
    user_id: str = Depends(get_current_user),
    request: Request = None,
    bsky_token: Optional[str] = Depends(get_bluesky_token)
):
    """
    Get the current authenticated user's full profile from BlueSky.
    Requires valid JWT token in Authorization header.

    Returns profile information including:
    - Display name, avatar, banner
    - Bio/description
    - Followers/follows/posts counts
    """
    profile = await get_bluesky_profile(user_id, auth_token=bsky_token)
    return UserProfile(**profile)


@app.post("/auth/logout")
async def logout(user_id: str = Depends(get_current_user)):
    """
    Logout endpoint. In this JWT-based system, clients simply discard their token.
    """
    return {"message": "Successfully logged out"}


@app.post("/auth/test-login", response_model=Token)
async def test_login(request: TestLoginRequest):
    """
    Test login endpoint for development/testing with real BlueSky credentials.
    Authenticates against BlueSky's production server and returns a JWT token.

    Args:
        request: TestLoginRequest with username and password (BlueSky credentials)

    Returns:
        Token with access_token, token_type, and user info

    Raises:
        HTTPException: If BlueSky authentication fails or credentials are invalid
    """
    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    bluesky_token = None
    user_id = None
    user_handle = None

    try:
        async with httpx.AsyncClient() as client:
            # Authenticate against BlueSky's production XRPC endpoint
            response = await client.post(
                "https://bsky.social/xrpc/com.atproto.server.createSession",
                json={
                    "identifier": request.username,
                    "password": request.password,
                }
            )

            # Check for authentication failures
            if response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid BlueSky credentials. Please check your username/password."
                )
            elif response.status_code != 200:
                error_detail = f"BlueSky authentication failed with status {response.status_code}"
                try:
                    error_data = response.json()
                    if "error" in error_data:
                        error_detail = error_data.get("error", error_detail)
                    if "message" in error_data:
                        error_detail = error_data.get("message", error_detail)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=error_detail
                )

            # Parse successful response
            auth_data = response.json()
            bluesky_token = auth_data.get("accessJwt")
            user_id = auth_data.get("did")
            user_handle = auth_data.get("handle")

            if not user_id or not bluesky_token:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Invalid response from BlueSky: missing DID or token"
                )

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to BlueSky: {str(e)}"
        )
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        print(f"Unexpected error during BlueSky authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication"
        )

    # Create JWT token with BlueSky token and handle
    access_token = create_access_token(user_id, bluesky_token=bluesky_token, bsky_handle=user_handle)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(
            id=user_id,
            handle=user_handle or request.username,
            display_name=None,
            avatar=None,
            created_at=None
        )
    )
