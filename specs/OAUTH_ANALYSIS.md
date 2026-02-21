# BlueSky OAuth Implementation Analysis

## Current Error
"The data you submitted is invalid. Please check the form and try again"

## Root Causes Identified

### 1. ✅ FIXED - Incorrect Scope
**Issue**: Hardcoded scope was "atproto transition:generic" (invalid)
**Status**: FIXED - Changed to "atproto" in both `bluesky_oauth.py` and `client-metadata.json`

### 2. ✅ FIXED - Missing Client Metadata Fields
**Issue**: Missing required BlueSky OAuth fields
**Status**: FIXED - Updated `client-metadata.json` with:
- `application_type: "web"`
- `dpop_bound_access_tokens: true`
- Added `refresh_token` to grant_types

### 3. ✅ IMPLEMENTED - PKCE (Proof Key for Public Code Exchange)
**BlueSky Requirement**: MANDATORY for all clients
**Current Status**: IMPLEMENTED ✓
**Implementation**:
- ✅ Added `generate_code_verifier()` function in `bluesky_oauth.py`
- ✅ Added `generate_code_challenge()` function using SHA256
- ✅ Authorization request includes `code_challenge` and `code_challenge_method=S256`
- ✅ Token exchange includes `code_verifier` parameter
- ✅ Code verifier generated and stored in oauth_states during `/auth/login`

### 4. ❌ NOT IMPLEMENTED - PAR (Pushed Authorization Requests)
**BlueSky Requirement**: MANDATORY for all clients
**Current Status**: Directly building auth URL
**What's needed**:
- POST to `/oauth/par` endpoint first to register request
- Receive `request_uri` and `expires_in`
- Use `request_uri` in authorization redirect instead of individual parameters

### 5. ❌ NOT IMPLEMENTED - DPoP (Demonstrating Proof of Possession)
**BlueSky Requirement**: MANDATORY for token-bound access
**Current Status**: `dpop_bound_access_tokens: true` set but not implemented in code
**What's needed**:
- Generate DPoP JWT tokens for each request
- Include `DPoP` header in token endpoint request
- Include `DPoP` header in subsequent API calls

### 6. ❌ PARTIALLY WORKING - Client Metadata Accessibility
**Issue**: For decentralized OAuth, client_id must be a URL BlueSky can fetch
**Current Status**:
- In dev: `test-client-id` (static, not a URL) - Won't work
- In production: `https://nbhd.city/client-metadata.json` - Requires public HTTPS URL
- For localhost testing: Needs ngrok or similar tunnel

## Implementation Options

### Option A: Full BlueSky Compliance (Recommended for Production)
Implement all required features: PKCE, PAR, DPoP
- **Effort**: High (3-5 hours)
- **Complexity**: Medium-High
- **Benefits**: Full production-ready OAuth flow, no fallbacks
- **Libraries needed**:
  - `cryptography` for DPoP JWT signing
  - `httpx` (already have)
  - `secrets` (already have for PKCE)

### Option B: ngrok for Development + Fallback to Test Login
Keep current implementation, use ngrok for localhost testing
- **Effort**: Low (30 min setup)
- **Complexity**: Low
- **Benefits**: Works immediately for testing, test-login endpoint available
- **Limitations**: Won't work without ngrok, not production-ready

### Option C: Implement PKCE Only (Partial Compliance)
Implement PKCE as the most critical missing piece
- **Effort**: Low-Medium (1-2 hours)
- **Complexity**: Low
- **Benefits**: Addresses most common OAuth security requirement
- **Limitations**: Still missing PAR and DPoP, may fail with BlueSky

## Recommended Path

1. **Immediate (for testing)**: Use Option B (ngrok) to validate current flow works
2. **Production**: Implement Option A (full compliance)

## Implementation Steps for Option A (PKCE)

### 1. Generate PKCE pair in authorization request
```python
import secrets
import hashlib
import base64

# Generate code_verifier and code_challenge
code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip('=')
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip('=')
```

### 2. Store code_verifier in state
Extend oauth_states to store: `{state: {code_verifier, frontend_url}}`

### 3. Include in authorization parameters
Add to auth URL: `code_challenge`, `code_challenge_method=S256`

### 4. Use code_verifier in token exchange
Add to token endpoint: `code_verifier`

## Next Steps

1. **Decide on approach**: Option A (full) or Option B (ngrok + test-login)
2. **If Option B**: Run `setup_ngrok_oauth.sh` to test current flow
3. **If Option A**: Begin PKCE implementation (step 1 above)
4. **Verification**: Create test script to validate OAuth flow

## Files to Modify

| File | Change | Complexity |
|------|--------|-----------|
| `app/api/bluesky_oauth.py` | Add PKCE, PAR, DPoP | High |
| `app/api/main.py` | Update oauth_states to store verifier | Medium |
| `app/api/client-metadata.json` | ✅ Already updated | Done |
| `.env.local` | May need ngrok URL in dev | Low |

## Test Cases

```python
# Test PKCE pair generation
def test_pkce_generation():
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    assert len(code_verifier) > 43
    assert len(code_challenge) > 43
    # Verify it's valid S256 challenge

# Test authorization URL contains PKCE
def test_auth_url_has_pkce():
    auth_url = get_oauth_authorize_url(state)
    assert 'code_challenge=' in auth_url
    assert 'code_challenge_method=S256' in auth_url

# Test token exchange includes code_verifier
def test_token_exchange_pkce():
    token_response = exchange_code_for_token(code, code_verifier)
    assert token_response.get('access_token')
```

## Production Deployment Checklist

- [ ] PKCE implemented and tested
- [ ] PAR implemented and tested
- [ ] DPoP implemented and tested
- [ ] Client metadata served from public HTTPS URL
- [ ] BLUESKY_OAUTH_CLIENT_ID set to client-metadata.json URL
- [ ] BLUESKY_OAUTH_REDIRECT_URI uses production domain
- [ ] All environment variables configured
- [ ] End-to-end OAuth flow tested
