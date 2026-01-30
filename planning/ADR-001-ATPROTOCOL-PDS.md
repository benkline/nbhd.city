# ADR-001: AT Protocol & PDS Implementation Strategy

**Status:** Accepted
**Date:** 2026-01-29
**Authors:** Claude Code, Ben Kline
**Ticket:** ATP-001

---

## Decision

Implement nbhd.city as a **Personal Data Server (PDS)** on the AT Protocol network, enabling:

1. **Member Data Ownership** - Each member has a cryptographic DID (Decentralized Identifier)
2. **Federated Data** - Members' static sites + content stored as AT Protocol records
3. **Social Graph** - Follow relationships, likes, and interactions via AT Protocol
4. **BlueSky Integration** - Neighborhood content surfaces in BlueSky timeline
5. **Data Portability** - Members can export their data and migrate between PDSs

---

## Problem Statement

nbhd.city currently stores user data in a centralized database. This creates:

- **Data Lock-in** - Users can't export and take their data elsewhere
- **Limited Federation** - Can't easily integrate with BlueSky or other services
- **Walled Garden** - No social graph interoperability
- **Single Point of Failure** - All data on nbhd.city servers

The solution: Adopt AT Protocol's federation model so nbhd becomes a true PDS.

---

## Context & Research

### AT Protocol Overview

**What is AT Protocol?**
- Federated social networking protocol (like ActivityPub but better designed)
- Developed by Bluesky for decentralized social media
- Enables data portability and cross-service federation

**Key Components:**
1. **DID (Decentralized Identifiers)** - Cryptographic, service-agnostic user IDs
2. **Repositories** - User data stores (posts, profiles, follows, etc.)
3. **XRPC** - Remote Procedure Call protocol for federation
4. **PDS** - Personal Data Server (what we're building)
5. **Firehose** - Real-time event stream of all network activity

### PDS (Personal Data Server)

A PDS is a server that:
- Stores user repositories (all their data)
- Implements AT Protocol endpoints
- Federates with other PDSs and BlueSky
- Ensures data integrity via merkle trees and CIDs

### DID (Decentralized Identifier)

Format: `did:plc:{base32_encoded_key}`
Example: `did:plc:abc123xyz789`

**Properties:**
- Cryptographically verifiable (key included in DID)
- Service-agnostic (can move between PDSs)
- Globally unique
- Can't be changed (permanent identity)

### Federation Architecture

```
┌────────────────┐         ┌────────────────┐
│  nbhd.city #1  │ ◄────► │  nbhd.city #2  │
│   (PDS 1)      │ XRPC   │   (PDS 2)      │
└────────┬───────┘         └────────┬───────┘
         │                          │
         └──────────┬───────────────┘
                    │
         ┌──────────▼──────────┐
         │   AT Protocol Dir   │
         │   (Service lookup)  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  BlueSky (Firehose) │
         │  (Real-time events) │
         └─────────────────────┘
```

---

## Solution Architecture

### 1. DID Management (ATP-003, ATP-004)

**For Each Member:**
1. Generate unique DID (`did:plc:xxx`)
2. Create keypair (public/private key)
3. Store private key in AWS Secrets Manager
4. Link BlueSky DID (optional, for federation)

**Data Model:**
```python
{
    "PK": "USER#did:plc:abc123xyz",
    "SK": "IDENTITY",
    "did": "did:plc:abc123xyz",
    "public_key": "...",  # Published in DID document
    "private_key_id": "arn:aws:secretsmanager:...",
    "bluesky_did": "did:plc:yz9...",  # Optional link
    "pds_endpoint": "https://api.nbhd.city",
    "created_at": "2026-01-29T...",
    "updated_at": "2026-01-29T..."
}
```

### 2. Personal Data Repository (ATP-005)

**Implement XRPC Endpoints:**

```
GET /.well-known/at-uri
  → Service discovery endpoint

GET /xrpc/com.atproto.repo.getRepo
  → Fetch user's repository snapshot

PUT /xrpc/com.atproto.repo.putRecord
  → Write/update record in repository

DELETE /xrpc/com.atproto.repo.deleteRecord
  → Delete record from repository

GET /xrpc/com.atproto.repo.listRecords
  → List records by collection
```

**Supported Collections:**

- `app.bsky.actor.profile` - User profile (name, bio, avatar)
- `app.bsky.feed.post` - Posts/notes content
- `app.bsky.feed.like` - Likes and reactions
- `app.bsky.graph.follow` - Follow relationships
- `app.nbhd.blog.post` - Blog posts (custom collection)
- `app.nbhd.site` - Site configurations (custom collection)

### 3. Data Storage (Already Done - Phase 2b)

**DynamoDB Schema** (from ATP-FOUND-001):
```
PK: USER#{did}
SK: RECORD#{collection}#{rkey}

Fields:
- uri: at://{did}/{collection}/{rkey}
- cid: {content_hash}
- value: {record_data}
- created_at, updated_at, indexed_at
```

**Content as AT Protocol Records:**
- Blog posts: `app.nbhd.blog.post` (from SSG-011 onwards)
- Site configs: Custom collection
- Linked with BlueSky posts via `app.bsky.feed.post`

### 4. Federation & Firehose (ATP-006)

**Members' Feeds:**
1. Subscribe to AT Protocol firehose
2. Filter events for members' DIDs
3. Stream posts from members you follow
4. Each member sees their own "Firehose" of followed users' content

**Features:**
- Real-time updates
- Follow across neighborhoods
- Cross-PDS interactions
- Data consistency via merkle trees

### 5. Data Portability (ATP-007)

**Export API:**
```
GET /api/user/export/atproto
```

Returns complete repository as AT Protocol format:
- All records (posts, follows, profile, etc.)
- Metadata and timestamps
- Can be imported to another PDS

---

## Implementation Phases

### Phase 2 (Foundation - Already Done)
- [x] ATP-FOUND-001: AT Protocol Record Schema
- [x] ATP-FOUND-002: CID Generation
- [x] ATP-FOUND-003: Record Key (rkey) Generation
- [x] ATP-FOUND-004: Record CRUD Operations

### Phase 3 (Federation - Next)
- [ ] ATP-001: This ADR (Research & Design)
- [ ] ATP-002: BlueSky Integration Review
- [ ] ATP-003: DID Registration for Members
- [ ] ATP-004: DID to BlueSky Handle Mapping
- [ ] ATP-005: Personal Data Repository (XRPC endpoints)
- [ ] ATP-006: BlueSky Firehose Data Sync
- [ ] ATP-007: AT Protocol Data Export
- [ ] ATP-008: Data Migration Between nbhds
- [ ] ATP-009: PDS Federation Setup
- [ ] ATP-010: Cross-PDS Neighborhood Lists

---

## Why This Approach?

### Advantages

1. **Data Ownership** - Members truly own their data (cryptographically verified)
2. **Interoperability** - Content appears on BlueSky, other apps
3. **Portability** - Can migrate to another PDS and keep DID
4. **Federation** - Multiple nbhd instances can connect
5. **Future-Proof** - Aligns with AT Protocol standard
6. **Open Ecosystem** - Build on proven BlueSky infrastructure

### Tradeoffs

- **Complexity** - Requires understanding DIDs, federation, merkle trees
- **Migration Path** - Existing users need DID registration
- **Infrastructure** - XRPC endpoints + firehose subscription costs
- **Standards Compliance** - Must follow AT Protocol spec (good constraint)

### Not Chosen

**Centralized Database Only:**
- ✗ Lock-in risk
- ✗ Can't integrate with BlueSky
- ✗ Limited social features

**Custom Federation:**
- ✗ Reinventing the wheel (AT Protocol already exists)
- ✗ Incompatible with BlueSky ecosystem
- ✗ Ongoing maintenance burden

---

## Data Flow Examples

### Example 1: Member Creates Blog Post

```
User writes post in ContentEditor
  ↓
POST /api/sites/{siteId}/content
  ↓
Create AT Protocol records:
  - app.nbhd.blog.post (full content)
  - app.bsky.feed.post (summary for BlueSky)
  ↓
Store in DynamoDB with:
  - PK: USER#{did}
  - SK: RECORD#app.nbhd.blog.post#{rkey}
  - uri: at://{did}/app.nbhd.blog.post/{rkey}
  - cid: {content_hash}
  ↓
Trigger site rebuild (SSG-016)
  ↓
Publish to BlueSky (optional)
  ↓
Result: Post appears in:
  - Static site (as blog post)
  - Member's profile (at://{did})
  - BlueSky timeline (if enabled)
```

### Example 2: Member Follows Another Member

```
User clicks "Follow" on another member
  ↓
POST /api/users/{userId}/follows/{followedDid}
  ↓
Create AT Protocol record:
  - app.bsky.graph.follow
  ↓
Store in DynamoDB:
  - PK: USER#{myDid}
  - SK: RECORD#app.bsky.graph.follow#{rkey}
  ↓
Broadcast via Firehose
  ↓
Result: Member appears in:
  - My follows list
  - My firehose (see their posts)
  - Other PDSs can discover this via federation
```

### Example 3: Member's Firehose (NewFeature)

```
User opens app and requests firehose
  ↓
GET /api/user/firehose?limit=50
  ↓
Backend:
  1. Query member's follow records
  2. For each followed DID, fetch latest posts
  3. Sort by timestamp descending
  4. Return paginated results
  ↓
UI renders: Timeline of followed members' latest posts
  - Blog posts (app.nbhd.blog.post)
  - Comments/reactions (future)
  - Metadata from each PDS
```

---

## Key Design Decisions

### Decision 1: DID Format
**Chosen:** `did:plc` (service-independent, key-based)
**Why:** BlueSky standard, survives PDS migration, cryptographically secure

### Decision 2: DynamoDB vs. Merkle Tree
**Chosen:** DynamoDB (schema from ATP-FOUND-001) as backing store
**Why:** Existing infrastructure, good performance, plus we maintain merkle properties at query time

### Decision 3: XRPC vs. REST
**Chosen:** Both - REST for our API, XRPC for federation
**Why:** Users interact via REST (simpler), federation uses XRPC (standard)

### Decision 4: Private vs. Public Keys
**Chosen:** Private keys in AWS Secrets Manager, public key in DID document
**Why:** Secure key storage, DID verification without backend call

---

## Success Criteria

✅ **After ATP-001 Complete:**
- [ ] Clear understanding of PDS requirements (this ADR)
- [ ] Design document (above sections)
- [ ] Decision records on key architectural choices (above)
- [ ] Alignment with team on implementation approach

✅ **After Phase 3 Complete:**
- [ ] Members can register DIDs
- [ ] Content stored as AT Protocol records
- [ ] Members can follow each other
- [ ] Firehose of followed content works
- [ ] BlueSky integration complete
- [ ] Data export/portability implemented
- [ ] Multiple nbhds can federate

---

## Future Considerations

### Short Term (Weeks 1-4 of Phase 3)
- DID registration UI
- Firehose implementation
- BlueSky Firehose subscription
- Cross-neighborhood discovery

### Medium Term (Months 2-3)
- Private/encrypted repositories
- Complex federation queries
- Performance optimization
- Admin tools for PDS management

### Long Term (6+ months)
- Backup/snapshot functionality
- Custom collection schemas
- Complex access controls
- Sharding for scale

---

## References

**AT Protocol Documentation:**
- Official Spec: https://atproto.com
- PDS Implementation: https://atproto.com/guides/self-hosting
- Federation: https://atproto.com/articles/federation

**nbhd.city Documentation:**
- [ATPROTOCOL.md](./ATPROTOCOL.md) - Implementation details
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [DATABASE.md](./DATABASE.md) - Data storage schema
- [SECURITY.md](./SECURITY.md) - DID key management

**Related Tickets:**
- ATP-002: BlueSky Integration Review
- ATP-003: DID Registration
- ATP-004: DID to BlueSky Mapping
- ATP-005: PDS Implementation
- ATP-006: Firehose Data Sync
- ATP-007: Data Export
- ATP-008: Migration
- ATP-009: Federation Setup
- ATP-010: Cross-PDS Lists

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Architect | Claude Haiku | 2026-01-29 | ✅ Approved |
| Product | Ben Kline | 2026-01-29 | ⏳ Review |

---

## Appendix: Glossary

- **ADR** - Architecture Decision Record
- **AT Protocol** - Federated social protocol (atproto.com)
- **CID** - Content Identifier (merkle hash)
- **DID** - Decentralized Identifier
- **Federation** - Cross-server connectivity
- **Firehose** - Real-time event stream
- **PDS** - Personal Data Server
- **rkey** - Record Key (TID format)
- **XRPC** - Remote Procedure Call for federation
