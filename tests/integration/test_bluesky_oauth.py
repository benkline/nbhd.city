#!/usr/bin/env python3
"""
Test if BlueSky can access our client metadata
"""

import requests
import json
import os
from dotenv import load_dotenv
import pathlib

# Load environment
project_root = pathlib.Path(__file__).parent
load_dotenv(project_root / '.env.local')

print("=" * 80)
print("BLUESKY OAUTH METADATA ACCESSIBILITY TEST")
print("=" * 80)

client_id = os.getenv("BLUESKY_OAUTH_CLIENT_ID")
print(f"\nClient ID: {client_id}\n")

# Test 1: If client_id is a URL, can BlueSky fetch it?
if client_id.startswith("http://") or client_id.startswith("https://"):
    print("1. Testing if BlueSky can fetch client metadata...")
    print("-" * 80)

    # Try to fetch as if we're BlueSky
    try:
        response = requests.get(client_id, timeout=5)
        print(f"Status: {response.status_code}")

        if response.ok:
            metadata = response.json()
            print("✓ Client metadata is accessible")
            print(f"\nMetadata details:")
            print(f"  client_id in metadata: {metadata.get('client_id', 'NOT SET')}")
            print(f"  redirect_uris: {metadata.get('redirect_uris', [])}")
            print(f"  scope: {metadata.get('scope', 'NOT SET')}")

            # Check if localhost URLs are in the metadata
            redirect_uris = metadata.get('redirect_uris', [])
            localhost_uris = [uri for uri in redirect_uris if 'localhost' in uri]

            print(f"\n  Localhost redirect URIs found: {len(localhost_uris)}")
            for uri in localhost_uris:
                print(f"    - {uri}")

            # Check if the metadata client_id matches the URL
            metadata_client_id = metadata.get('client_id')
            if metadata_client_id and metadata_client_id != client_id:
                print(f"\n⚠️ WARNING: Metadata client_id doesn't match the URL!")
                print(f"  URL: {client_id}")
                print(f"  Metadata: {metadata_client_id}")
                print(f"  BlueSky may reject this as a mismatch!")

        else:
            print(f"✗ Client metadata not accessible")
            print(f"  Response: {response.text}")

    except requests.exceptions.ConnectionError as e:
        print(f"✗ Cannot connect to client metadata URL")
        print(f"  Error: {e}")
        print(f"\n  This is likely the problem! BlueSky cannot reach localhost URLs.")
        print(f"  For production, use a public HTTPS URL.")
        print(f"  For localhost development, you may need to:")
        print(f"    1. Use ngrok or similar to expose localhost to the internet")
        print(f"    2. Or configure BlueSky with a static test client_id/secret")

    except Exception as e:
        print(f"✗ Error: {e}")

else:
    print(f"Client ID is not a URL: {client_id}")
    print("This is a static client ID (not using decentralized OAuth)")
    print("BlueSky will use the BLUESKY_OAUTH_CLIENT_ID and BLUESKY_OAUTH_CLIENT_SECRET directly")

print("\n" + "=" * 80)
print("POSSIBLE SOLUTIONS FOR 'Invalid Data' ERROR")
print("=" * 80)

print("""
The error "The data you submitted is invalid" from BlueSky typically means:

1. **Client metadata URL cannot be reached** (most likely for localhost)
   - BlueSky runs on the internet and cannot reach http://localhost:8001
   - Solution: Use a public HTTPS URL or ngrok tunnel

2. **Redirect URI mismatch**
   - The redirect_uri must be registered in the client metadata
   - Our metadata has both production and localhost URIs registered

3. **Invalid client_id format**
   - Must be either:
     a) A valid HTTPS URL that BlueSky can fetch, OR
     b) A pre-registered static client_id from BlueSky

4. **Scope mismatch**
   - We use: "atproto transition:generic"
   - Verify this is supported by BlueSky's OAuth server

RECOMMENDED FOR LOCAL DEVELOPMENT:
- Use ngrok: ngrok http 8001
- Update BLUESKY_OAUTH_CLIENT_ID in .env.local to the public ngrok URL
- Or: Register a test client_id on BlueSky's developer site
""")

print("=" * 80)
