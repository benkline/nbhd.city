# AT Protocol Integration

BlueSky integration and AT Protocol federation support for nbhd.city.

## Overview

nbhd.city integrates with **AT Protocol** (the decentralized network behind BlueSky) to:
- Enable **BlueSky login** via OAuth 2.0
- Store content using AT Protocol record schemas
- Support **data federation** with BlueSky and other networks
- Enable **data portability** (users can export/migrate their data)

## BlueSky Authentication

### OAuth 2.0 Flow

Users sign in with their BlueSky credentials, enabling authentication without storing passwords:

```
1. User clicks "Sign In with BlueSky"
   └─ Frontend redirects to BlueSky OAuth endpoint

2. User authorizes nbhd.city on BlueSky
   └─ BlueSky returns authorization code

3. Backend exchanges code for user credentials
   └─ Code + client ID/secret → BlueSky token endpoint

4. Backend creates JWT token
   └─ Token stored in frontend localStorage

5. Frontend includes JWT in all API requests
   └─ Backend validates JWT for protected endpoints
```

### OAuth Configuration

**Required Environment Variables:**

```
BLUESKY_OAUTH_CLIENT_ID=your_client_id
BLUESKY_OAUTH_CLIENT_SECRET=your_client_secret
BLUESKY_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Login Endpoints

```
POST /auth/login
Returns: { "auth_url": "https://bsky.social/oauth/authorize?..." }

POST /auth/callback?code=<authorization_code>
Returns: { "access_token": "jwt_token", "user": {...} }
```

## AT Protocol Records

### Record Schema

Content in nbhd.city is stored using AT Protocol record schemas. Each record has:

```python
{
  # AT Protocol metadata
  'atp': {
    'did': 'did:plc:user123...',      # Author's Decentralized ID
    'collection': 'com.nbhd.post',     # Record type
    'rkey': 'bafyreabc123...',         # Record key (unique ID)
    'cid': 'bafy2bzaced...',           # Content Identifier (hash)
    'created_at': '2026-02-21T10:30Z'
  },

  # Content data
  'data': {
    'title': 'My First Post',
    'body': 'This is my first post...',
    'tags': ['hello', 'world'],
    'created_at': '2026-02-21T10:30Z'
  }
}
```

### Record Collections

nbhd.city uses custom AT Protocol collections:

| Collection | Purpose |
|-----------|---------|
| `com.nbhd.post` | Blog posts and articles |
| `com.nbhd.project` | Project portfolio entries |
| `com.nbhd.announcement` | Neighborhood announcements |
| `com.nbhd.site_config` | Site templates and config |

### CID & RKey Generation

**CID** (Content Identifier): Hash of record content
```python
import hashlib
import base32

content_json = json.dumps(record, sort_keys=True)
cid_hash = hashlib.sha256(content_json.encode()).digest()
cid = 'bafy' + base32.encode(cid_hash)
```

**RKey** (Record Key): Sortable identifier for records
```python
from datetime import datetime, timezone

# TID-based rkey (timestamp + random)
now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
rkey = base32.encode(now_ms.to_bytes(8, 'big') + random.randbytes(8))
```

## Dual-Posting to BlueSky

When users publish content, nbhd.city can **automatically post to BlueSky** while keeping the content stored locally:

```python
# 1. Create record in nbhd database
content_record = await db.create_content(title, body)

# 2. Post to BlueSky
bluesky_response = await bluesky.post({
  'text': f"{title}\n\n{body}",
  'created_at': content_record['created_at'],
  'facets': [...]  # Links back to nbhd site
})

# 3. Link BlueSky post URI to local record
content_record['bluesky_uri'] = bluesky_response['uri']
await db.update_content(content_record)
```

**Benefits:**
- Content reaches BlueSky audience
- Users own their content on nbhd.city
- Can still manage content locally without relying on BlueSky

## DID Management

**DID** (Decentralized Identifier) = persistent, user-controlled identifier

Each user gets a DID:
```
did:plc:abc123xyz789...
```

DIDs enable:
- **Identity portability** - User keeps same ID across instances
- **Federation** - Other networks can reference and verify user
- **Data ownership** - DID owner controls the data

## Federation & Interoperability

### Phase 3 & Beyond

Later phases will implement full AT Protocol federation:

**Phase 2 (Current):** Foundation
- Store records with AT Protocol schemas
- CID and RKey generation
- Basic record CRUD

**Phase 9 (Advanced):** Federation
- Personal Data Server (PDS) for each neighborhood
- Sync with BlueSky firehose
- Cross-instance data exchange
- Data portability and migration

See [Phases & Roadmap](./phases.md) for timeline.

## Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| BlueSky OAuth login | ✅ Complete | OAuth 2.0 flow working |
| JWT authentication | ✅ Complete | Token-based API auth |
| AT Protocol schemas | 🔧 In Progress | Phase 2 ATP-FOUND-001 |
| CID generation | 🔧 In Progress | Phase 2 ATP-FOUND-002 |
| Record CRUD | 🔧 In Progress | Phase 2 ATP-FOUND-003,004 |
| Dual-posting to BlueSky | 📋 Planned | Phase 5 content management |
| Full PDS implementation | 📋 Planned | Phase 9 federation |
| Data export/migration | 📋 Planned | Phase 9 federation |

## User Experience

### Sign In Flow
1. User sees "Sign In with BlueSky" button
2. Clicks button → redirected to BlueSky.social
3. Authorizes nbhd.city (first time only)
4. Redirected back to nbhd.city, logged in
5. JWT token stored locally

### Content Creation
1. User creates post in nbhd
2. Nbhd stores content with AT Protocol record format
3. (Future) User can choose to post to BlueSky
4. (Future) Content stored locally, copied to BlueSky
5. (Future) User can export content at any time

## Security Considerations

### JWT Tokens
- Tokens issued by backend after OAuth
- Include user info: `sub` (user ID), `handle`, `name`
- Signed with secret key (never shared)
- Expire after set duration (default: 24 hours)
- Stored in localStorage (frontend)

### BlueSky OAuth
- Uses authorization code flow (most secure)
- Client secret never exposed to frontend
- Backend handles all OAuth operations

### Data Privacy
- Records marked with user DID
- Other users can see public records
- Private records not accessible to unauthorized users

## Environment Setup

For local development, set BlueSky OAuth credentials:

```bash
# app/api/.env.local
BLUESKY_OAUTH_CLIENT_ID=<your_id>
BLUESKY_OAUTH_CLIENT_SECRET=<your_secret>
BLUESKY_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

To get credentials:
1. Create account on BlueSky (bsky.social)
2. Go to Settings → Developer → Create OAuth Client
3. Enter redirect URI: `http://localhost:5173/auth/callback`
4. Copy client ID and secret

## Related Documentation

- **[Backend Guide](./backend.md)** - Auth endpoints
- **[Database Guide](./database.md)** - Record storage
- **[Phases & Roadmap](./phases.md)** - Federation timeline
- **[specs/ATPROTOCOL.md](../specs/ATPROTOCOL.md)** - Detailed AT Protocol specs
- **[specs/BLUESKY_INTEGRATION.md](../specs/BLUESKY_INTEGRATION.md)** - BlueSky integration details

---

**Current Focus:** Phase 2 - Implementing AT Protocol record storage with CID/RKey generation
**Next Phase:** Phase 5 - Dual-posting content to BlueSky
**Final Phase:** Phase 9 - Full PDS federation support
