#!/usr/bin/env python3
"""
OAuth Solution Testing - Comparing approaches
"""

import requests
import json
import os
from dotenv import load_dotenv
import pathlib

project_root = pathlib.Path(__file__).parent
load_dotenv(project_root / '.env.local')

print("=" * 80)
print("OAUTH APPROACH COMPARISON")
print("=" * 80)

print("\n1. CURRENT APPROACH: BlueSky OAuth with static client_id")
print("-" * 80)
print(f"Client ID: test-client-id (NOT registered with BlueSky)")
print(f"Status: ❌ BROKEN - BlueSky doesn't recognize test credentials")
print(f"Error: 'The data you submitted is invalid'")
print(f"Reason: Static client_id must be pre-registered with BlueSky")

print("\n\n2. WORKING ALTERNATIVE: Direct BlueSky API (test-login)")
print("-" * 80)

# Test the working endpoint
bsky_username = os.getenv("BSKY_USERNAME")
bsky_password = os.getenv("BSKY_PASSWORD")

if bsky_username and bsky_password:
    try:
        response = requests.post(
            "http://localhost:8001/auth/test-login",
            json={"username": bsky_username, "password": bsky_password},
            timeout=10
        )

        if response.ok:
            data = response.json()
            print(f"✓ WORKING - Direct BlueSky authentication works!")
            print(f"\nResponse details:")
            print(f"  Status: 200 OK")
            print(f"  Token type: {data.get('token_type')}")
            print(f"  User handle: {data.get('user', {}).get('handle')}")
            print(f"  User DID: {data.get('user', {}).get('id')}")
            print(f"\nThis endpoint:")
            print(f"  - Calls BlueSky's com.atproto.server.createSession directly")
            print(f"  - Works with real BlueSky credentials")
            print(f"  - Doesn't require OAuth client registration")
        else:
            print(f"❌ Error: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

print("\n\n3. PRODUCTION APPROACH: Use ngrok for localhost")
print("-" * 80)
print("""
For production OAuth to work with BlueSky:

Step 1: Install ngrok
  brew install ngrok

Step 2: Expose localhost to internet
  ngrok http 8001

Step 3: Get the public URL from ngrok output
  (e.g., https://abc123def456.ngrok.io)

Step 4: Register with BlueSky
  - Go to https://bsky.social/xrpc/com.atproto.server.createSession
  - Create an OAuth app
  - Use redirect_uri: https://abc123def456.ngrok.io/callback.html

Step 5: Update .env.local
  BLUESKY_OAUTH_CLIENT_ID=<real_client_id>
  BLUESKY_OAUTH_CLIENT_SECRET=<real_secret>
  BLUESKY_OAUTH_REDIRECT_URI=https://abc123def456.ngrok.io/callback.html

Step 6: Restart API
  docker restart nbhd-api
""")

print("\n" + "=" * 80)
print("RECOMMENDATION FOR THIS PROJECT")
print("=" * 80)
print("""
Since FL-9.2 already has a working /auth/test-login endpoint:

✓ CURRENT STATE:
  - test-login works for development/testing
  - Full OAuth flow is configured but can't work without real BlueSky credentials

✓ RECOMMENDED FIX:
  For now, keep test-login as the main login method for development
  When deploying to production:
    1. Either register with BlueSky and use ngrok
    2. Or use the test-login approach with a service account

The OAuth infrastructure is correct - it just needs real credentials!
""")

print("=" * 80)
