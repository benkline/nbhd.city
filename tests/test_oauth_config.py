#!/usr/bin/env python3
"""
OAuth Configuration Debugging Script
Tests BlueSky OAuth configuration to identify configuration issues.
"""

import requests
import json
import os
from urllib.parse import urlencode, parse_qs, urlparse
from dotenv import load_dotenv
import pathlib

# Load environment
project_root = pathlib.Path(__file__).parent
load_dotenv(project_root / '.env.local')

print("=" * 80)
print("OAUTH CONFIGURATION DEBUGGING")
print("=" * 80)

# 1. Check environment variables
print("\n1. ENVIRONMENT VARIABLES")
print("-" * 80)
bluesky_client_id = os.getenv("BLUESKY_OAUTH_CLIENT_ID")
bluesky_client_secret = os.getenv("BLUESKY_OAUTH_CLIENT_SECRET")
bluesky_redirect_uri = os.getenv("BLUESKY_OAUTH_REDIRECT_URI")
bluesky_auth_endpoint = os.getenv("BLUESKY_OAUTH_AUTHORIZATION_ENDPOINT")
bluesky_token_endpoint = os.getenv("BLUESKY_OAUTH_TOKEN_ENDPOINT")

print(f"CLIENT_ID: {bluesky_client_id}")
print(f"CLIENT_SECRET: {bluesky_client_secret[:10]}..." if bluesky_client_secret else "CLIENT_SECRET: NOT SET")
print(f"REDIRECT_URI: {bluesky_redirect_uri}")
print(f"AUTH_ENDPOINT: {bluesky_auth_endpoint}")
print(f"TOKEN_ENDPOINT: {bluesky_token_endpoint}")

# 2. Fetch client metadata from API
print("\n2. CLIENT METADATA FROM API")
print("-" * 80)
try:
    response = requests.get("http://localhost:8001/client-metadata.json", timeout=5)
    print(f"Status: {response.status_code}")
    if response.ok:
        metadata = response.json()
        print(json.dumps(metadata, indent=2))
    else:
        print(f"ERROR: {response.text}")
except Exception as e:
    print(f"ERROR: Could not fetch client metadata: {e}")

# 3. Test /auth/login endpoint
print("\n3. TEST /auth/login ENDPOINT")
print("-" * 80)
try:
    response = requests.get("http://localhost:8001/auth/login", allow_redirects=False, timeout=5)
    print(f"Status: {response.status_code}")
    if response.status_code in [301, 302, 303, 307, 308]:
        redirect_url = response.headers.get("location")
        print(f"Redirect URL: {redirect_url}")

        # Parse the URL to see what parameters are being sent
        parsed = urlparse(redirect_url)
        params = parse_qs(parsed.query)

        print(f"\nParsed OAuth Parameters:")
        for key, value in params.items():
            print(f"  {key}: {value[0]}")

        # Check if redirect_uri is in the parameters
        if "redirect_uri" in params:
            print(f"\n⚠️ Redirect URI being sent to BlueSky:")
            print(f"  {params['redirect_uri'][0]}")
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"ERROR: {e}")

# 4. Validate redirect_uri format
print("\n4. REDIRECT URI VALIDATION")
print("-" * 80)
if bluesky_redirect_uri:
    parsed = urlparse(bluesky_redirect_uri)
    print(f"Scheme: {parsed.scheme}")
    print(f"Hostname: {parsed.hostname}")
    print(f"Port: {parsed.port}")
    print(f"Path: {parsed.path}")
    print(f"Query: {parsed.query}")
    print(f"Fragment: {parsed.fragment}")

    # Check for common issues
    issues = []
    if parsed.fragment:
        issues.append("❌ Fragment (#) detected - OAuth doesn't support hash in redirect_uri")
    if parsed.scheme != "https" and parsed.hostname not in ["localhost", "127.0.0.1"]:
        issues.append("⚠️ Non-HTTPS URL (ok for localhost, but will fail in production)")
    if "localhost" in parsed.hostname or "127.0.0.1" in parsed.hostname:
        if parsed.scheme == "http":
            issues.append("✓ Localhost with HTTP is OK for development")

    if issues:
        print("\nValidation Issues:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✓ No obvious formatting issues detected")

# 5. Test with test-login endpoint
print("\n5. TEST /auth/test-login ENDPOINT")
print("-" * 80)
test_credentials = {
    "username": os.getenv("BSKY_USERNAME"),
    "password": os.getenv("BSKY_PASSWORD"),
}

if test_credentials["username"] and test_credentials["password"]:
    try:
        response = requests.post(
            "http://localhost:8001/auth/test-login",
            json=test_credentials,
            timeout=10
        )
        print(f"Status: {response.status_code}")
        if response.ok:
            token_data = response.json()
            print(f"✓ Test login succeeded")
            print(f"  Access Token: {token_data.get('access_token', 'N/A')[:50]}...")
            print(f"  User Handle: {token_data.get('user', {}).get('handle', 'N/A')}")
            print(f"  User ID: {token_data.get('user', {}).get('id', 'N/A')}")
        else:
            print(f"✗ Test login failed: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
else:
    print("⚠️ Test credentials not configured in .env.local")

# 6. Check if BlueSky can reach our redirect URI
print("\n6. CHECK REDIRECT URI ACCESSIBILITY")
print("-" * 80)
if bluesky_redirect_uri:
    try:
        # Check if the path is accessible
        response = requests.get(bluesky_redirect_uri, timeout=5)
        print(f"✓ Redirect URI is accessible")
        print(f"  Status: {response.status_code}")
        print(f"  Content-Type: {response.headers.get('content-type', 'N/A')}")
        if response.status_code == 200:
            print(f"  Content preview: {response.text[:200]}...")
    except Exception as e:
        print(f"✗ Cannot reach redirect URI: {e}")

print("\n" + "=" * 80)
print("DEBUGGING COMPLETE")
print("=" * 80)
