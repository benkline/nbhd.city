"""
BlueSky/AT Protocol API integration for fetching user profile data.

This module provides utilities for fetching public profile information
from BlueSky/AT Protocol using public endpoints.
"""

import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException, status

# BlueSky public API endpoints
BLUESKY_PDS = "https://bsky.social"
GET_PROFILE_ENDPOINT = f"{BLUESKY_PDS}/xrpc/app.bsky.actor.getProfile"


async def get_bluesky_profile(actor: str, auth_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch a user's profile from BlueSky using their DID or handle.

    Args:
        actor: The user's DID (did:plc:...) or handle (user.bsky.social)
        auth_token: Optional BlueSky access token for authentication

    Returns:
        Dictionary containing profile information:
        - did: The user's Decentralized Identifier
        - handle: The user's handle
        - displayName: Display name (optional)
        - description: Profile bio (optional)
        - avatar: Avatar image URL (optional)
        - banner: Banner image URL (optional)
        - followersCount: Number of followers
        - followsCount: Number of follows
        - postsCount: Number of posts

    Raises:
        HTTPException: If the profile cannot be fetched
    """
    try:
        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                GET_PROFILE_ENDPOINT,
                params={"actor": actor},
                headers=headers
            )

            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Profile not found for actor: {actor}"
                )

            if response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to authenticate with BlueSky API"
                )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to fetch profile from BlueSky: {response.status_code}"
                )

            profile_data = response.json()
            return profile_data

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to communicate with BlueSky API: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching profile: {str(e)}"
        )
