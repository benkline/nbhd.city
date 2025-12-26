from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import secrets
import os

from models import Token, User
from auth import create_access_token, get_current_user
from bluesky_oauth import get_oauth_authorize_url, exchange_code_for_token

app = FastAPI(title="nbhd.city API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store OAuth states (in production, use a database or Redis)
oauth_states = {}


@app.get("/")
def read_root():
    return {"message": "Welcome to nbhd.city API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/auth/login")
async def login():
    """
    Initiate BlueSky OAuth login flow.
    Redirects user to BlueSky authorization endpoint.
    """
    state = secrets.token_urlsafe(32)
    oauth_states[state] = True

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
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(
        url=f"{frontend_url}/auth/success?token={access_token}",
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
