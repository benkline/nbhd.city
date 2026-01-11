# Database Design

**Focus:** DynamoDB schema, data models, access patterns
**Last Updated:** 2026-01-10

---

## Overview

**Single-table design** in DynamoDB with Global Secondary Indexes (GSIs).

All entities (users, neighborhoods, sites, memberships) in one table using composite keys and type attributes.

---

## Primary Key Design

### Composite Keys

**Partition Key (PK):** `{entity_type}#{identifier}`
**Sort Key (SK):** `{sub_type}#{secondary_id}`

**Examples:**
- User: `PK=USER#{did}` / `SK=PROFILE`
- Neighborhood: `PK=NBHD#{id}` / `SK=METADATA`
- Site: `PK=USER#{did}` / `SK=SITE#{site_id}`
- Membership: `PK=NBHD#{id}` / `SK=MEMBER#{did}`

---

## Entity Schemas

### User Profile
```json
{
  "PK": "USER#did:plc:abc123",
  "SK": "PROFILE",
  "did": "did:plc:abc123",
  "bluesky_handle": "alice@bsky.social",
  "bluesky_did": "did:plc:xyz789",
  "display_name": "Alice",
  "avatar_url": "https://...",
  "bio": "Community organizer",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-10T12:30:00Z"
}
```

### Neighborhood
```json
{
  "PK": "NBHD#nbhd-001",
  "SK": "METADATA",
  "id": "nbhd-001",
  "name": "Downtown Collective",
  "slug": "downtown-collective",
  "description": "A neighborhood for downtown residents",
  "creator_did": "did:plc:abc123",
  "created_at": "2026-01-01T00:00:00Z",
  "member_count": 42,
  "privacy": "public",
  "settings": {
    "allow_site_creation": true,
    "require_email_verification": false
  }
}
```

### Membership
```json
{
  "PK": "NBHD#nbhd-001",
  "SK": "MEMBER#did:plc:abc123",
  "role": "member",
  "joined_at": "2026-01-05T10:00:00Z",
  "user_did": "did:plc:abc123",
  "status": "active"
}
```

### Static Site
```json
{
  "PK": "USER#did:plc:abc123",
  "SK": "SITE#site-001",
  "site_id": "site-001",
  "title": "My Blog",
  "template": "blog",
  "status": "published",
  "subdomain": "alice",
  "config": {
    "author": "Alice",
    "accent_color": "#007bff",
    "posts": [...],
    "custom_fields": {...}
  },
  "created_at": "2026-01-07T14:20:00Z",
  "updated_at": "2026-01-10T09:15:00Z",
  "built_at": "2026-01-10T09:16:00Z",
  "public_url": "https://alice.nbhd.city"
}
```

### Build Job (transient)
```json
{
  "PK": "BUILD#site-001",
  "SK": "JOB#{timestamp}",
  "job_id": "job-abc123",
  "site_id": "site-001",
  "status": "completed",
  "started_at": "2026-01-10T09:15:00Z",
  "completed_at": "2026-01-10T09:16:00Z",
  "error": null,
  "log_url": "https://..../logs"
}
```

---

## Global Secondary Indexes (GSIs)

### GSI1: Entity Type Index
```
PK: entity_type
SK: created_at
```
**Use case:** List all users, list all neighborhoods
**Example query:** All users created in January

### GSI2: Neighborhood Name Uniqueness
```
PK: slug
SK: id
```
**Use case:** Check if neighborhood name already taken
**Example query:** Find "downtown-collective"

### GSI3: User Memberships
```
PK: user_did
SK: joined_at
```
**Use case:** List neighborhoods a user is in
**Example query:** Get all neighborhoods for alice@bsky.social

### GSI4: Build Jobs by Site
```
PK: site_id
SK: created_at
```
**Use case:** Get build history for a site
**Example query:** Last 10 builds for "alice-blog"

---

## Access Patterns

### User Profile
```python
# Get user profile
response = dynamodb.get_item(
  PK='USER#did:plc:abc123',
  SK='PROFILE'
)

# List all users (paginated)
response = dynamodb.query(
  IndexName='GSI1',
  KeyConditionExpression='entity_type = :type',
  ExpressionAttributeValues={':type': 'USER'},
  ScanIndexForward=False  # newest first
)
```

### Neighborhood Members
```python
# List all members of a neighborhood
response = dynamodb.query(
  PK='NBHD#nbhd-001',
  KeyConditionExpression='SK begins_with :sk',
  ExpressionAttributeValues={':sk': 'MEMBER#'}
)

# Get specific member
response = dynamodb.get_item(
  PK='NBHD#nbhd-001',
  SK='MEMBER#did:plc:abc123'
)
```

### User's Sites
```python
# List all sites for a user
response = dynamodb.query(
  PK='USER#did:plc:abc123',
  KeyConditionExpression='SK begins_with :sk',
  ExpressionAttributeValues={':sk': 'SITE#'}
)

# Get specific site
response = dynamodb.get_item(
  PK='USER#did:plc:abc123',
  SK='SITE#site-001'
)
```

### Build History
```python
# Get recent builds for a site
response = dynamodb.query(
  IndexName='GSI4',
  PK='site-001',
  ScanIndexForward=False,
  Limit=10
)
```

---

## Backup Strategy

1. **Point-in-Time Recovery (PITR)** - 35-day recovery window
2. **Daily exports** - Lambda exports all data to S3 as JSON daily
3. **Site configs as code** - Stored in DynamoDB as JSON (version-controllable)
4. **No multi-region replication** - Single region keeps costs low

**Recovery SLA:** 24 hours for data restoration

---

## Data Retention

| Data Type | Retention |
|-----------|-----------|
| Active user profiles | Indefinite |
| Deleted accounts | 30-day grace period, then purge |
| Build logs | 90 days |
| Membership history | Indefinite (audit trail) |
| Exported/deleted sites | 7 days before purge |

---

## Considerations

### Why Single Table?

✅ **Advantages:**
- Fewer indexes to maintain
- Single source of truth
- Easier to backup/restore
- Good for serverless (pay-per-request)
- Simpler scaling (one table to scale)

❌ **Tradeoffs:**
- More complex key design
- Larger item sizes (need careful design)
- Harder to query across entities without GSIs

### Why DynamoDB?

✅ **Advantages:**
- Serverless (no ops)
- Automatic scaling
- Pay only for what you use
- Great for variable workloads
- Fast key-value access

❌ **Tradeoffs:**
- Limited query flexibility (no JOINs)
- No transactions across items (atomic updates only within item)
- Complex queries need GSIs

---

## Schema Versioning

**Approach:** Attribute-based versioning

When schema changes:
1. Add new attribute alongside old one
2. Code handles both versions
3. Migration runs in background
4. Eventually remove old attribute

Example:
```json
{
  "PK": "USER#did:plc:abc123",
  "SK": "PROFILE",
  "avatar_url": "https://...",      // old
  "profile_images": {                 // new
    "avatar": { "url": "...", "size": "large" }
  }
}
```

---

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [API.md](./API.md) - How data is accessed via API
