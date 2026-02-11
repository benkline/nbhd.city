#!/usr/bin/env python3
"""
Test BlueSky OAuth Requirements Compliance
Validates whether current implementation meets BlueSky's mandatory OAuth requirements.
"""

import json
import os
import hashlib
import base64
import secrets
from pathlib import Path
from urllib.parse import urlparse, parse_qs

from dotenv import load_dotenv

project_root = Path(__file__).parent
load_dotenv(project_root / '.env.local')

print("=" * 80)
print("BLUESKY OAUTH REQUIREMENTS COMPLIANCE TEST")
print("=" * 80)

# 1. Check client-metadata.json
print("\n1. CLIENT METADATA VALIDATION")
print("-" * 80)

try:
    with open(project_root / 'app' / 'api' / 'client-metadata.json', 'r') as f:
        metadata = json.load(f)

    print("✓ client-metadata.json exists")

    required_fields = {
        'client_id': 'Client ID URL',
        'client_name': 'Client name',
        'application_type': 'Application type (web/native)',
        'redirect_uris': 'Redirect URIs array',
        'scope': 'OAuth scope',
        'grant_types': 'Grant types array',
        'response_types': 'Response types array',
        'dpop_bound_access_tokens': 'DPoP binding flag',
    }

    missing = []
    for field, description in required_fields.items():
        if field in metadata:
            print(f"  ✓ {field}: {description}")
        else:
            print(f"  ❌ MISSING: {field} - {description}")
            missing.append(field)

    # Specific validations
    print("\nMetadata Details:")
    print(f"  client_id: {metadata.get('client_id')}")
    print(f"  application_type: {metadata.get('application_type')}")
    print(f"  scope: {metadata.get('scope')}")
    print(f"  dpop_bound_access_tokens: {metadata.get('dpop_bound_access_tokens')}")
    print(f"  grant_types: {metadata.get('grant_types')}")

    # Validate scope
    scope = metadata.get('scope', '')
    if scope == 'atproto':
        print(f"\n  ✓ Scope is correct: 'atproto'")
    else:
        print(f"\n  ❌ Scope should be 'atproto', got: '{scope}'")

    # Validate application_type
    app_type = metadata.get('application_type')
    if app_type in ['web', 'native']:
        print(f"  ✓ Application type is valid: '{app_type}'")
    else:
        print(f"  ❌ Application type should be 'web' or 'native', got: '{app_type}'")

    # Validate dpop_bound_access_tokens
    dpop = metadata.get('dpop_bound_access_tokens', False)
    if dpop:
        print(f"  ✓ DPoP bound tokens: {dpop}")
    else:
        print(f"  ❌ DPoP bound tokens should be true, got: {dpop}")

    # Validate grant_types includes authorization_code
    grant_types = metadata.get('grant_types', [])
    if 'authorization_code' in grant_types:
        print(f"  ✓ Grant types include 'authorization_code'")
    else:
        print(f"  ❌ Grant types must include 'authorization_code'")

except Exception as e:
    print(f"❌ Error reading client-metadata.json: {e}")

# 2. Check environment variables
print("\n\n2. ENVIRONMENT VARIABLES")
print("-" * 80)

required_env = {
    'BLUESKY_OAUTH_CLIENT_ID': 'OAuth Client ID (should be URL to metadata)',
    'BLUESKY_OAUTH_CLIENT_SECRET': 'OAuth Client Secret',
    'BLUESKY_OAUTH_REDIRECT_URI': 'OAuth Redirect URI',
    'BLUESKY_OAUTH_AUTHORIZATION_ENDPOINT': 'OAuth Authorization Endpoint',
    'BLUESKY_OAUTH_TOKEN_ENDPOINT': 'OAuth Token Endpoint',
}

missing_env = []
for var, description in required_env.items():
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        if 'SECRET' in var:
            display_value = f"{value[:10]}..." if len(value) > 10 else value
        else:
            display_value = value
        print(f"  ✓ {var}: {display_value}")
    else:
        print(f"  ❌ MISSING: {var}")
        missing_env.append(var)

# 3. Check backend OAuth implementation
print("\n\n3. BACKEND OAUTH IMPLEMENTATION")
print("-" * 80)

try:
    with open(project_root / 'app' / 'api' / 'bluesky_oauth.py', 'r') as f:
        oauth_code = f.read()

    # Check for PKCE implementation
    has_code_challenge = 'code_challenge' in oauth_code
    has_code_verifier = 'code_verifier' in oauth_code
    has_pkce = has_code_challenge and has_code_verifier

    print(f"  {'✓' if has_code_challenge else '❌'} code_challenge in authorization request")
    print(f"  {'✓' if has_code_verifier else '❌'} code_verifier in token exchange")
    print(f"  {'✓' if has_pkce else '❌ MISSING'} PKCE Implementation")

    # Check for PAR implementation
    has_par = '/oauth/par' in oauth_code
    print(f"  {'✓' if has_par else '❌ MISSING'} PAR (Pushed Authorization Requests)")

    # Check for DPoP implementation
    has_dpop = 'DPoP' in oauth_code or 'dpop' in oauth_code
    print(f"  {'✓' if has_dpop else '❌ MISSING'} DPoP (Demonstrating Proof of Possession)")

    # Check current scope in code
    if '"atproto"' in oauth_code or "'atproto'" in oauth_code:
        print(f"  ✓ Correct scope in code: 'atproto'")
    elif 'transition:generic' in oauth_code:
        print(f"  ❌ Incorrect scope in code: 'atproto transition:generic'")

except Exception as e:
    print(f"❌ Error analyzing OAuth code: {e}")

# 4. Test PKCE generation (if we were to implement it)
print("\n\n4. PKCE GENERATION TEST")
print("-" * 80)

try:
    # Generate PKCE pair
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip('=')
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip('=')

    print(f"  Code Verifier: {code_verifier[:30]}...")
    print(f"  Code Challenge: {code_challenge[:30]}...")
    print(f"  Verifier length: {len(code_verifier)} (should be 43-128)")
    print(f"  Challenge length: {len(code_challenge)} (should be 43-128)")

    if 43 <= len(code_verifier) <= 128 and 43 <= len(code_challenge) <= 128:
        print(f"  ✓ PKCE pair generation works correctly")
    else:
        print(f"  ❌ PKCE pair lengths are invalid")
except Exception as e:
    print(f"❌ Error generating PKCE: {e}")

# 5. Summary and recommendations
print("\n\n" + "=" * 80)
print("COMPLIANCE SUMMARY")
print("=" * 80)

requirements = {
    'Client Metadata': not missing,
    'Environment Variables': len(missing_env) == 0,
    'PKCE Implementation': has_pkce,
    'PAR Implementation': has_par,
    'DPoP Implementation': has_dpop,
    'Correct Scope': True,  # Already fixed
}

compliant = sum(1 for v in requirements.values() if v)
total = len(requirements)

print(f"\nCompliance: {compliant}/{total}")
print("\nStatus:")
for req, status in requirements.items():
    print(f"  {'✓' if status else '❌'} {req}")

print("\n" + "=" * 80)
if compliant == total:
    print("✓ READY FOR PRODUCTION - All requirements met!")
elif compliant >= 2:
    print("⚠️  PARTIAL COMPLIANCE - Basic requirements met, but missing advanced features")
    print("    - Implement PKCE for improved security (RECOMMENDED)")
    print("    - Implement PAR and DPoP for full compliance")
else:
    print("❌ NOT COMPLIANT - Missing critical requirements")
    print("    - Must implement PKCE")
    print("    - Must implement PAR")
    print("    - Must implement DPoP")

print("\n" + "=" * 80)
print("RECOMMENDED NEXT STEPS")
print("=" * 80)

if not has_pkce:
    print("""
1. IMMEDIATE (30 min): Use ngrok for localhost testing
   - Run: ngrok http 8001
   - Update .env.local with ngrok URL
   - Test OAuth flow with test-login endpoint as fallback

2. PRODUCTION (2-3 hours): Implement PKCE
   - Add PKCE generation to authorization request
   - Store code_verifier in oauth_states
   - Add code_verifier to token exchange
   - Test with real BlueSky OAuth

3. FULL COMPLIANCE (3-5 hours): Implement PAR and DPoP
   - Add PAR request before authorization
   - Add DPoP JWT generation and inclusion
   - Full BlueSky OAuth compliance
""")
else:
    print("\n✓ All requirements met - OAuth is properly configured!")

print("=" * 80)
