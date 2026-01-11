# AT Protocol & PDS Integration

**Focus:** Personal Data Server implementation, federation, data portability
**Phase:** 2 (alongside static sites)
**Last Updated:** 2026-01-10

---

## Overview

Each nbhd.city instance becomes a **Personal Data Server (PDS)** on the AT Protocol network, allowing:

- Members to own their data with decentralized identifiers (DIDs)
- Data federation with BlueSky and other AT Protocol services
- Full data portability and interoperability
- Self-hosting of member content

---

## Key Concepts

### DID (Decentralized Identifier)

Unique, cryptographic identifier for each user.

Format: `did:plc:{base32_encoded_key}`

Example: `did:plc:abc123xyz789abc123xyz789`

**Properties:**
- Globally unique
- Cryptographically verifiable
- Not tied to any single service
- User can migrate between servers

### Personal Data Repository

All of a user's data stored in standardized AT Protocol format:
- Profile (name, avatar, bio)
- Posts and notes
- Follows and followers
- Custom data types
- Metadata and timestamps

### Federation

PDS instances connect to BlueSky network and other PDSs:
- Directory of all PDSs on network
- Data sync between servers
- Cross-PDS lookup
- Public feeds and timelines

---

## Architecture

### PDS Components

```
┌─────────────────────────────────────────┐
│    nbhd.city instance (one PDS)         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐   │
│  │   AT Protocol Service Layer      │   │
│  │  (XRPC endpoints)                │   │
│  ├──────────────────────────────────┤   │
│  │ • getRepo(did)                   │   │
│  │ • putRecord(did, collection)     │   │
│  │ • deleteRecord(did, collection)  │   │
│  │ • describeBlobUpload()           │   │
│  └──────────────────────────────────┘   │
│                ↓                         │
│  ┌──────────────────────────────────┐   │
│  │   DynamoDB Data Store            │   │
│  │  (AT Protocol format)            │   │
│  │ • Profiles                       │   │
│  │ • Posts                          │   │
│  │ • Custom records                 │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │   Federation Layer               │   │
│  │  (Sync with BlueSky/other PDSs)  │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
         ↕ (federation)
   ┌─────────────┬──────────┐
   ↓             ↓          ↓
BlueSky      Other PDSs   Apps
```

---

## Implementation Plan (Phase 2)

### Phase 2a: DID Registration & Management

**Tickets:** ATP-003, ATP-004

Members need cryptographic identifiers:

1. Generate DID for each user on signup
2. Create keypair (public/private)
3. Store private key securely
4. Link BlueSky DID to nbhd DID

**Data stored:**
```json
{
  "PK": "USER#did:plc:abc123",
  "SK": "IDENTITY",
  "did": "did:plc:abc123",
  "public_key": "...",
  "private_key_id": "secrets-manager-arn",
  "bluesky_did": "did:plc:xyz789",
  "registered_at": "2026-01-10T00:00:00Z"
}
```

### Phase 2b: Personal Data Repository

**Ticket:** ATP-005

Implement core PDS endpoints:

**XRPC Endpoints:**

```
GET /.well-known/at-uri
  └─ Service discovery

GET /xrpc/com.atproto.repo.getRepo?did={did}
  └─ Fetch user's repository

PUT /xrpc/com.atproto.repo.putRecord
  └─ Write record to repository

DELETE /xrpc/com.atproto.repo.deleteRecord
  └─ Delete record

GET /xrpc/com.atproto.repo.listRecords?did={did}
  └─ List user's records
```

**Supported Collections:**

- `app.bsky.actor.profile` - User profile
- `app.bsky.feed.post` - Posts/notes
- `app.bsky.graph.follow` - Follow records
- `app.bsky.feed.like` - Likes/reactions
- Custom collections (future)

### Phase 2c: Data Sync with BlueSky

**Ticket:** ATP-006

Stream member posts/activities into nbhd:

1. Subscribe to BlueSky firehose
2. Filter for neighborhood member DIDs
3. Store posts in local PDS format
4. Update member feeds
5. Provide access via XRPC endpoints

### Phase 2d: Data Export

**Ticket:** ATP-007

Users can export all data:

```
GET /api/user/export/atproto
```

Returns complete repository in AT Protocol format:
- All records (posts, follows, etc.)
- Metadata
- Can be imported to other PDS

---

## APIs & Integrations

### AT Protocol Core APIs

**User needs to know:**
- How to register DID
- How to access their data
- How to export and migrate

```python
# Frontend/mobile SDK calls

# Get DID
did = await api.get('/api/user/did')

# Get profile via XRPC
profile = await xrpc.call('com.atproto.repo.getRepo', {
    'did': did
})

# List posts
posts = await xrpc.call('com.atproto.repo.listRecords', {
    'did': did,
    'collection': 'app.bsky.feed.post'
})
```

### Federation

Neighborhoods discover each other via:
1. Directory listing (AT Protocol registry)
2. Direct XRPC calls
3. Firehose subscriptions

---

## Data Formats

### Repository Structure

Each user's repository is a merkle tree of records:

```
/
├── /app.bsky.actor/
│   └── profile
│       └── Record: { name, bio, avatar, ... }
│
├── /app.bsky.feed/
│   ├── post
│   │   ├── record-1: { text, createdAt, ... }
│   │   ├── record-2: { text, createdAt, ... }
│   │   └── ...
│   │
│   └── like
│       ├── record-1: { subject: post-uri, ... }
│       └── ...
│
└── /app.bsky.graph/
    └── follow
        ├── record-1: { did: "did:plc:...", ... }
        └── ...
```

### Record Format

```json
{
  "uri": "at://did:plc:abc123/app.bsky.feed.post/abc123",
  "cid": "bafy...",
  "value": {
    "text": "Hello world",
    "facets": [...],
    "createdAt": "2026-01-10T12:30:00.000Z"
  }
}
```

---

## Federation Protocol

### Service Registration

Each PDS registers with AT Protocol directory:
```
{
  "did": "did:plc:xxx...",
  "service_endpoint": "https://api.nbhd.city",
  "public_key": "...",
  "updated_at": "2026-01-10T00:00:00Z"
}
```

### Cross-PDS Queries

```
User A (on PDS1) wants to follow User B (on PDS2)

1. PDS1 looks up User B's DID in directory
2. PDS1 finds PDS2's service endpoint
3. PDS1 calls PDS2 to verify User B
4. PDS1 creates follow record locally
5. PDS1 broadcasts follow to firehose
6. PDS2 indexes follow in User B's followers
```

---

## Migration & Portability

Users can transfer their data from one PDS to another:

1. Export data from old PDS: `GET /api/user/export/atproto`
2. Register new DID on new PDS
3. Import exported records
4. Update directory (old DID → new PDS)

---

## Future Enhancements (Phase 5+)

- Private repositories (encrypted on PDS)
- Custom collection schemas
- Complex federation queries
- Cross-PDS transactions
- Backup/snapshot PDS data

---

## Resources

- [AT Protocol Spec](https://atproto.com)
- [PDS Implementation Guide](https://atproto.com/guides/self-hosting)
- [BlueSky Federation](https://atproto.com/articles/federation)

---

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [DATABASE.md](./DATABASE.md) - Data storage
- [SECURITY.md](./SECURITY.md) - DID key management
