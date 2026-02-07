# BlueSky Integration Audit & AT Protocol Sync Plan

**Status:** Complete
**Date:** 2026-01-29
**Authors:** Claude Code, Ben Kline
**Ticket:** ATP-002

---

## Executive Summary

nbhd.city has existing BlueSky OAuth integration. This audit maps that to AT Protocol DIDs and plans data synchronization.

**Key Finding:** Our current OAuth tokens are BlueSky DIDs. We need to:
1. Extract DID from BlueSky OAuth response
2. Map to local member accounts
3. Sync profile data bidirectionally
4. Plan firehose subscription for member activity

---

## Current BlueSky Integration (Audit)

### What We Have

**OAuth Flow (Working):**
```
User clicks "Login with BlueSky"
  ↓
Redirect to BlueSky OAuth endpoint
  ↓
User authorizes app
  ↓
Redirect back to nbhd with auth code
  ↓
Exchange code for access token
  ↓
Get user profile data
  ↓
Create local user account
```

**Current User Data Model:**
```python
{
    "id": str,              # UUID (local)
    "handle": str,          # BlueSky handle (e.g., "alice.bsky.social")
    "did": str,             # DID (e.g., "did:plc:abc123xyz")
    "display_name": str,    # Display name
    "avatar": str,          # Avatar URL
    "bio": str,             # Bio text
    "created_at": str,      # Account creation timestamp
    "updated_at": str       # Last update timestamp
}
```

**OAuth Integration Points:**
- `app/api/auth.py` - Authentication endpoints
- `app/api/models.py` - User model definition
- BlueSky Client SDK integration

### What's Working

✅ BlueSky OAuth login
✅ User profile fetching
✅ Avatar and bio storage
✅ Handle parsing
✅ Token refresh

### What's Missing for AT Protocol

❌ DID document validation
❌ Public key verification
❌ Signature verification (for records)
❌ Firehose subscription for member activity
❌ Profile data sync (pushing updates back to BlueSky)
❌ DID migration support

---

## BlueSky DID Mapping

### How DIDs Are Structured

**BlueSky Format:** `did:plc:{key_material}`

Example: `did:plc:z72i7hdynmk6r22ghf7jicvam`

**What It Contains:**
- Service endpoint (public.at.bsky.app)
- Public key for verification
- Rotation keys

**Getting DID from OAuth:**

When user logs in with BlueSky OAuth:

```python
# OAuth token response
{
    "access_token": "...",
    "refresh_token": "...",
    "scope": "atproto transition:generic",
    "token_type": "Bearer"
}

# Get user info
response = client.get('xrpc/com.atproto.server.getSession')
{
    "did": "did:plc:z72i7hdynmk6r22ghf7jicvam",  # ← THIS IS THE DID
    "handle": "alice.bsky.social",
    "email": "alice@example.com",
    "emailConfirmed": True,
    "didDoc": { ... }  # ← DID document with public keys
}
```

### Mapping Strategy

```
BlueSky User
    ↓
DID: did:plc:abc123xyz
Handle: alice.bsky.social
    ↓
Local User Account
    ↓
nbhd User
    ├── local_id: UUID (separate from BlueSky)
    ├── bluesky_did: did:plc:abc123xyz
    ├── bluesky_handle: alice.bsky.social
    └── local_did: did:plc:xyz789abc (optional - future)
```

**When User Joins Neighborhood:**
1. User logs in via BlueSky OAuth
2. Extract BlueSky DID from OAuth response
3. Store as `bluesky_did`
4. Generate local nbhd DID (ATP-003) - optional
5. Store both in user profile

---

## Profile Data Sync

### Current Behavior (One-Way)

Currently, we pull BlueSky profile when user logs in:
```
BlueSky OAuth
  ↓
getSession() call
  ↓
Extract profile data
  ↓
Store in local database
  ↓
(No further sync)
```

**Problem:** Profile updates on BlueSky don't sync to nbhd.

### Proposed Solution (Bidirectional)

```
┌──────────────┐
│ BlueSky      │
│ - handle     │◄───── Periodic sync (daily)
│ - avatar     │
│ - bio        │
└──────────────┘
       ↑
       │ xrpc/com.atproto.repo.getRepo
       │
┌──────────────┐
│ nbhd.city    │
│ User Profile │
│ - handle     │
│ - avatar     │
│ - bio        │
└──────────────┘
       ↓
       │ Rebuild site on update
       │
┌──────────────┐
│ Static Site  │
│ About page   │
│ Member list  │
└──────────────┘
```

### Implementation Plan

**Daily Profile Sync (Background Job):**
```python
async def sync_bluesky_profiles_job():
    """Daily: Sync all member profiles with BlueSky"""
    members = await get_all_members()

    for member in members:
        try:
            # Get latest profile from BlueSky
            repo = await xrpc.get_repo(did=member.bluesky_did)
            profile = repo.get_record('app.bsky.actor.profile')

            # Update local user if changed
            if profile.displayName != member.display_name:
                member.display_name = profile.displayName
                await update_member(member)

            if profile.avatar != member.avatar:
                member.avatar = profile.avatar
                await update_member(member)

            if profile.description != member.bio:
                member.bio = profile.description
                await update_member(member)

            # Trigger site rebuild if profile changed
            await trigger_rebuild(member.site_id)

        except Exception as e:
            log.error(f"Failed to sync {member.id}: {e}")
```

**Implementation Details:**
- Use CloudWatch Events to trigger daily
- Or use APScheduler in FastAPI background tasks
- Implement exponential backoff for retries
- Log sync status for debugging
- Handle rate limiting from BlueSky

---

## Firehose Subscription (For Neighborhood Feed)

### What's the Firehose?

Real-time stream of all events on AT Protocol network:
- New posts
- Follows/unfollows
- Likes
- Profile updates
- Deletes

**Why It Matters:**
- We can build a "neighborhood firehose"
- Show timeline of all members' BlueSky posts
- Discover member activity in real-time

### Current State

❌ Not implemented
- No firehose connection
- Members can't see each other's BlueSky posts on neighborhood site

### Proposed Implementation

**Phase 3a (ATP-006):**
1. Subscribe to AT Protocol firehose
2. Filter for neighborhood member DIDs
3. Store posts in local format (`app.nbhd.blog.post` or custom)
4. Make available via `/app/api/neighborhood/firehose` endpoint

**Data Flow:**
```
AT Protocol Firehose
(all posts, all users)
  ↓
Filter by member DIDs
  ↓
Store in DynamoDB
  ↓
Query via REST API
  ↓
Render in UI
```

**Example Query:**
```python
GET /app/api/neighborhoods/{id}/firehose?limit=50&offset=0

Response:
{
  "posts": [
    {
      "uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789",
      "author": { "handle": "alice.bsky.social", ... },
      "text": "Check out our new neighborhood site!",
      "createdAt": "2026-01-29T12:00:00Z"
    },
    ...
  ],
  "meta": {
    "total": 127,
    "offset": 0,
    "limit": 50
  }
}
```

---

## DID Validation & Verification

### Current Gap

We store DID but don't verify it:
```python
# Current (not verified)
user.did = oauth_response['did']  # Trusts BlueSky's response
```

### Proposed: DID Document Validation

```python
async def validate_bluesky_did(did: str, handle: str) -> bool:
    """Verify DID document matches handle"""
    try:
        # Fetch DID document
        did_doc = await xrpc.resolve_did(did)

        # Verify structure
        assert did_doc['id'] == did
        assert 'publicKey' in did_doc

        # Verify handle from DID document
        # (BlueSky encodes handle in DID document)

        return True
    except Exception:
        return False

# On OAuth login:
if await validate_bluesky_did(did, handle):
    user.bluesky_did = did
    user.bluesky_handle = handle
else:
    raise AuthenticationError("Invalid DID")
```

### Signature Verification (Future)

When syncing data from BlueSky, verify signatures:
```python
async def verify_record_signature(record_uri: str, signature: str) -> bool:
    """Verify record was signed by DID holder"""
    # 1. Get public key from DID document
    # 2. Verify signature using public key
    # 3. Compare author DID with record URI
    pass
```

---

## Gaps & Improvements

### Gap 1: Profile Data Sync Direction

**Current:** One-way (BlueSky → nbhd on login)
**Needed:** Bidirectional (with conflict resolution)

**Solution:**
- Daily sync job (BlueSky → nbhd)
- Update timestamp tracking
- Last-write-wins for conflicts

### Gap 2: No Firehose Connection

**Current:** Can't see neighborhood members' BlueSky posts
**Needed:** Real-time firehose subscription

**Solution:**
- Subscribe to firehose in background
- Filter for member DIDs
- Store in DynamoDB
- Query via REST API

### Gap 3: No DID Verification

**Current:** Trust BlueSky's DID in OAuth response
**Needed:** Validate DID document

**Solution:**
- Fetch and validate DID document
- Verify handle matches
- Check public keys

### Gap 4: No Handle Verification

**Current:** Store handle from OAuth but don't verify
**Needed:** Verify handle in DID document

**Solution:**
- DID documents contain handle info
- Validate during login

### Gap 5: Limited Profile Updates

**Current:** Profile only updates on login
**Needed:** Regular sync of profile changes

**Solution:**
- Background job for daily sync
- Check for changes
- Trigger rebuild if needed

---

## Implementation Timeline

### Phase 3: AT Protocol Federation

**Week 1-2 (ATP-003, ATP-004):**
- DID registration for members
- Link BlueSky DID to local accounts
- Basic DID validation

**Week 3-4 (ATP-005):**
- XRPC endpoints for PDS
- Profile record storage
- Basic federation

**Week 5-6 (ATP-006):**
- Firehose subscription
- Real-time event handling
- Neighborhood firehose endpoint

**Week 7+ (ATP-007, ATP-008):**
- Data export
- Migration between PDSs
- Cross-PDS federation

### Per-Ticket Checklist

**ATP-003: DID Registration**
- [ ] Generate DID for new members
- [ ] Store in secure location
- [ ] Link BlueSky DID to local DID

**ATP-004: DID Mapping**
- [ ] BlueSky DID → Local DID mapping
- [ ] Handle verification
- [ ] DID document validation

**ATP-005: PDS**
- [ ] XRPC endpoints
- [ ] Profile record storage
- [ ] Record versioning

**ATP-006: Firehose**
- [ ] Firehose subscription
- [ ] Filter for member DIDs
- [ ] Store events in DynamoDB
- [ ] REST API endpoint

**ATP-007: Export**
- [ ] Export all user records
- [ ] AT Protocol format
- [ ] Download as ZIP/JSON

**ATP-008: Migration**
- [ ] Import records to new PDS
- [ ] DID transfer
- [ ] Redirect old DID

---

## Key Design Decisions

### Decision 1: Trust Model

**Chosen:** Trust BlueSky OAuth response, verify with DID document
**Why:** OAuth already verified, but validate DID for extra security

### Decision 2: Sync Frequency

**Chosen:** Daily batch sync + reactive updates
**Why:** Balances freshness with API load

### Decision 3: Firehose vs. Pull

**Chosen:** Firehose subscription (real-time)
**Why:** Better UX, discovers new members, simpler than polling

### Decision 4: Data Store

**Chosen:** DynamoDB (existing schema from ATP-FOUND-001)
**Why:** Single source of truth, good query patterns

---

## Success Criteria

✅ **ATP-002 Complete:**
- [ ] Clear mapping between BlueSky profiles and DIDs
- [ ] Plan for keeping data in sync
- [ ] Identified all gaps and solutions
- [ ] Timeline for closing gaps

✅ **After Phase 3 Complete:**
- [ ] Members' BlueSky DIDs linked to accounts
- [ ] Profile data syncs from BlueSky daily
- [ ] Neighborhood firehose shows members' BlueSky posts
- [ ] DID validation on login
- [ ] Data can be exported in AT Protocol format

---

## References

**BlueSky/AT Protocol:**
- OAuth Flow: https://atproto.com/guides/oauth
- XRPC Spec: https://atproto.com/specs/xrpc
- Firehose: https://github.com/bluesky-social/atproto/discussions

**nbhd.city Docs:**
- [ADR-001-ATPROTOCOL-PDS.md](./ADR-001-ATPROTOCOL-PDS.md)
- [ATPROTOCOL.md](./ATPROTOCOL.md)
- [API.md](./API.md)

**Related Tickets:**
- ATP-001: PDS Architecture
- ATP-003: DID Registration
- ATP-004: DID Mapping
- ATP-005: PDS Implementation
- ATP-006: Firehose Sync
- ATP-007: Data Export
- ATP-008: Migration

---

## Appendix: Current OAuth Code

**Reference Implementation:**
See `app/api/auth.py` - Current BlueSky OAuth endpoints

**Key Functions:**
- `get_bluesky_profile()` - Get user profile via OAuth
- `verify_bluesky_token()` - Verify token is valid
- `refresh_bluesky_token()` - Refresh expired token

**Future Changes Needed:**
- Add DID validation
- Add profile sync job
- Add firehose subscription
- Add DID document fetching

