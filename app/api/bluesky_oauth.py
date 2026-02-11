"""
BlueSky OAuth integration for nbhd.city API.

This module handles authentication via BlueSky's OAuth provider.
Reference: https://github.com/bluesky-social/atproto/tree/main/packages/oauth

Implements required security features:
- PKCE (Proof Key for Code Exchange) - Required by BlueSky
- State parameter for CSRF protection
"""

import os
import httpx
import secrets
import hashlib
import base64
import json
import time
from urllib.parse import urlencode
from typing import Optional
from fastapi import HTTPException, status
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

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


def generate_code_verifier() -> str:
    """
    Generate a PKCE code verifier (43-128 characters).
    Uses secure random bytes encoded in base64url format.
    """
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip('=')


def generate_code_challenge(code_verifier: str) -> str:
    """
    Generate a PKCE code challenge from a code verifier.
    Uses SHA256 hash encoded in base64url format (S256 method).

    Args:
        code_verifier: The PKCE code verifier

    Returns:
        Base64url-encoded SHA256 hash of the verifier
    """
    code_sha = hashlib.sha256(code_verifier.encode()).digest()
    return base64.urlsafe_b64encode(code_sha).decode().rstrip('=')


def generate_dpop_proof(http_method: str, http_url: str, access_token: Optional[str] = None) -> tuple[str, dict]:
    """
    Generate a DPoP (Demonstrating Proof of Possession) proof JWT.

    DPoP is used to bind tokens to the client and prevent token misuse.
    It requires a key pair and includes cryptographic proof in the authorization header.

    Args:
        http_method: HTTP method (POST, GET, etc.)
        http_url: Full URL of the HTTP request
        access_token: Optional access token for refresh/reauth flows

    Returns:
        Tuple of (DPoP JWT string, private key dict for future use)
    """
    # Generate EC P-256 key pair
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    public_key = private_key.public_key()

    # Get public key in JWK format
    public_numbers = public_key.public_numbers()
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": base64.urlsafe_b64encode(public_numbers.x.to_bytes(32, 'big')).decode().rstrip('='),
        "y": base64.urlsafe_b64encode(public_numbers.y.to_bytes(32, 'big')).decode().rstrip('='),
    }

    # Create DPoP proof JWT
    now = int(time.time())
    jti = base64.urlsafe_b64encode(secrets.token_bytes(16)).decode().rstrip('=')

    payload = {
        "typ": "dpop+jwt",
        "alg": "ES256",
        "jwk": jwk
    }

    claims = {
        "jti": jti,
        "htm": http_method.upper(),
        "htu": http_url,
        "iat": now,
    }

    if access_token:
        claims["ath"] = base64.urlsafe_b64encode(
            hashlib.sha256(access_token.encode()).digest()
        ).decode().rstrip('=')

    # Sign the JWT (simplified - would normally use proper JWT library)
    # For this implementation, we'll use a basic JWT structure
    import jwt

    dpop_jwt = jwt.encode(
        claims,
        private_key,
        algorithm="ES256",
        headers={"typ": "dpop+jwt", "jwk": jwk}
    )

    return dpop_jwt, {"private_key": private_key, "public_key": public_key, "jwk": jwk}


def get_oauth_authorize_url(state: str, code_verifier: str) -> str:
    """
    Generate the BlueSky OAuth authorization URL with PKCE.

    Args:
        state: A random string for CSRF protection
        code_verifier: The PKCE code verifier

    Returns:
        The authorization URL to redirect the user to
    """
    if not BLUESKY_OAUTH_CLIENT_ID or not BLUESKY_OAUTH_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth is not properly configured. Set BLUESKY_OAUTH_CLIENT_ID and BLUESKY_OAUTH_REDIRECT_URI in your .env file."
        )

    # Generate PKCE code challenge from verifier
    code_challenge = generate_code_challenge(code_verifier)

    # Build authorization parameters with PKCE
    params = {
        "client_id": BLUESKY_OAUTH_CLIENT_ID,
        "redirect_uri": BLUESKY_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "atproto",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    return f"{BLUESKY_OAUTH_AUTHORIZATION_ENDPOINT}?{urlencode(params)}"


async def exchange_code_for_token(code: str, code_verifier: str) -> dict:
    """
    Exchange an authorization code for an access token using PKCE.

    Args:
        code: The authorization code from BlueSky
        code_verifier: The PKCE code verifier (must match the code_challenge from authorization)

    Returns:
        Token response containing access_token, refresh_token, did, and handle

    Raises:
        HTTPException: If the token exchange fails
    """
    if not all([BLUESKY_OAUTH_CLIENT_ID, BLUESKY_OAUTH_REDIRECT_URI]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth is not properly configured"
        )

    async with httpx.AsyncClient() as client:
        try:
            # Build token request data
            # For public clients (token_endpoint_auth_method: "none"), don't send client_secret
            token_data = {
                "grant_type": "authorization_code",
                "code": code,
                "client_id": BLUESKY_OAUTH_CLIENT_ID,
                "redirect_uri": BLUESKY_OAUTH_REDIRECT_URI,
                "code_verifier": code_verifier,
            }

            # Only include client_secret if it's configured (for backward compatibility with confidential clients)
            if BLUESKY_OAUTH_CLIENT_SECRET:
                token_data["client_secret"] = BLUESKY_OAUTH_CLIENT_SECRET

            # Generate DPoP proof for token endpoint (required by BlueSky when dpop_bound_access_tokens is true)
            dpop_proof, dpop_keys = generate_dpop_proof("POST", BLUESKY_OAUTH_TOKEN_ENDPOINT)

            # Send token request with DPoP proof
            headers = {
                "DPoP": dpop_proof,
            }

            response = await client.post(
                BLUESKY_OAUTH_TOKEN_ENDPOINT,
                data=token_data,
                headers=headers,
            )

            if response.status_code != 200:
                # Try to get error details from BlueSky response
                try:
                    error_data = response.json()
                    error_detail = error_data.get("error_description", error_data.get("error", response.text))
                except:
                    error_detail = response.text

                print(f"BlueSky token exchange error: {error_detail}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"BlueSky OAuth error: {error_detail}"
                )

            token_data = response.json()
            return token_data

        except HTTPException:
            raise
        except Exception as e:
            print(f"Token exchange exception: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to exchange token: {str(e)}"
            )
