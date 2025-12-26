"""
BlueSky OAuth integration for nbhd.city API.

This module handles authentication via BlueSky's OAuth provider.
Reference: https://github.com/bluesky-social/atproto/tree/main/packages/oauth
"""

import os
import httpx
from urllib.parse import urlencode
from typing import Optional
from fastapi import HTTPException, status

# BlueSky OAuth Configuration
BLUESKY_OAUTH_AUTHORIZATION_ENDPOINT = os.getenv(
    "BLUESKY_OAUTH_AUTHORIZATION_ENDPOINT",
    "https://bsky.social/oauth/authorize"
)
BLUESKY_OAUTH_TOKEN_ENDPOINT = os.getenv(
    "BLUESKY_OAUTH_TOKEN_ENDPOINT",
    "https://bsky.social/oauth/token"
)
BLUESKY_OAUTH_CLIENT_ID = os.getenv("BLUESKY_OAUTH_CLIENT_ID")
BLUESKY_OAUTH_CLIENT_SECRET = os.getenv("BLUESKY_OAUTH_CLIENT_SECRET")
BLUESKY_OAUTH_REDIRECT_URI = os.getenv("BLUESKY_OAUTH_REDIRECT_URI")


def get_oauth_authorize_url(state: str) -> str:
    """
    Generate the BlueSky OAuth authorization URL.

    Args:
        state: A random string for CSRF protection

    Returns:
        The authorization URL to redirect the user to
    """
    if not BLUESKY_OAUTH_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth is not configured"
        )

    params = {
        "client_id": BLUESKY_OAUTH_CLIENT_ID,
        "redirect_uri": BLUESKY_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "atproto transition:generic",
        "state": state,
    }

    return f"{BLUESKY_OAUTH_AUTHORIZATION_ENDPOINT}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> dict:
    """
    Exchange an authorization code for an access token.

    Args:
        code: The authorization code from BlueSky

    Returns:
        Token response containing access_token, refresh_token, did, and handle

    Raises:
        HTTPException: If the token exchange fails
    """
    if not all([BLUESKY_OAUTH_CLIENT_ID, BLUESKY_OAUTH_CLIENT_SECRET, BLUESKY_OAUTH_REDIRECT_URI]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth is not properly configured"
        )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                BLUESKY_OAUTH_TOKEN_ENDPOINT,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": BLUESKY_OAUTH_CLIENT_ID,
                    "client_secret": BLUESKY_OAUTH_CLIENT_SECRET,
                    "redirect_uri": BLUESKY_OAUTH_REDIRECT_URI,
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to exchange authorization code for token"
                )

            token_data = response.json()
            return token_data

        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to communicate with BlueSky OAuth provider: {str(e)}"
            )
