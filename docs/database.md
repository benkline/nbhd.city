# Database Guide

DynamoDB schema design and data access patterns for nbhd.city.

## Overview

nbhd.city uses **AWS DynamoDB** (NoSQL) with a **single-table design** that stores all data types (users, neighborhoods, sites, content) in one table.

**Why Single Table?**
- Simpler operations (no joins)
- Better performance (fewer API calls)
- Easier billing prediction
- Flexible schema (NoSQL)

**Primary Key Structure:**
- **PK** (Partition Key) - Identifies entity type and ID
- **SK** (Sort Key) - Secondary identifier for queries

## Table Schema

### Main Table: `nbhd-main`

**Attributes:**
| Attribute | Type | Purpose |
|-----------|------|---------|
| PK | String | Primary identifier (e.g., `USER#uuid`) |
| SK | String | Sort key for queries (e.g., `PROFILE`) |
| data | Map | Entity data (flexible JSON) |
| created_at | String | ISO timestamp |
| updated_at | String | ISO timestamp |
| ttl | Number | (optional) For auto-deletion |

## Item Types

### User Items

```
PK: USER#<user_uuid>
SK: PROFILE

data: {
  "handle": "alice.bsky",
  "name": "Alice",
  "email": "alice@example.com",
  "did": "did:plc:abc123...",
  "profile_picture_url": "https://...",
  "role": "user"
}
```

### Neighborhood Items

```
PK: NBHD#<nbhd_id>
SK: PROFILE

data: {
  "name": "Downtown Neighborhood",
  "description": "Community website",
  "owner_id": "<user_uuid>",
  "members": ["<user_uuid>", "<user_uuid>"],
  "settings": { "public": true, "... ": "..." }
}
```

### Site Items

```
PK: SITE#<site_id>
SK: PROFILE

data: {
  "name": "My Blog",
  "nbhd_id": "<nbhd_id>",
  "template_id": "blog-minimal",
  "config": {
    "title": "My Blog",
    "tagline": "Thoughts and ideas"
  },
  "status": "published",
  "build_history": [{ "timestamp": "...", "status": "success" }]
}
```

### Content Items

```
PK: CONTENT#<content_id>
SK: SITE#<site_id>

data: {
  "title": "My First Post",
  "body": "This is my first post...",
  "metadata": { "tags": ["hello", "world"], "category": "blog" },
  "published": true,
  "published_to_bsky": true
}
```

## Query Patterns

### Get User by ID
```python
response = dynamodb.get_item(
    TableName='nbhd-main',
    Key={
        'PK': {'S': 'USER#abc123'},
        'SK': {'S': 'PROFILE'}
    }
)
```

### List All Sites in Neighborhood
```python
response = dynamodb.query(
    TableName='nbhd-main',
    KeyConditionExpression='PK = :pk',
    ExpressionAttributeValues={
        ':pk': {'S': f'SITE#{site_id}'}
    }
)
```

### Get All Content for a Site
```python
response = dynamodb.query(
    TableName='nbhd-main',
    KeyConditionExpression='PK = :pk AND SK = :sk',
    ExpressionAttributeValues={
        ':pk': {'S': 'CONTENT#...'},
        ':sk': {'S': f'SITE#{site_id}'}
    }
)
```

## Global Secondary Indexes

**GSI: Handle Index** (for user lookups by BlueSky handle)

```
PK: handle
SK: created_at
```

Allows queries like:
```python
response = dynamodb.query(
    TableName='nbhd-main',
    IndexName='handle-index',
    KeyConditionExpression='handle = :h',
    ExpressionAttributeValues={':h': {'S': 'alice.bsky'}}
)
```

**GSI: Membership Index** (for listing neighborhood members)

```
PK: nbhd_id
SK: user_id
```

## AT Protocol Integration

Content records stored in DynamoDB also conform to AT Protocol schemas:

```python
# Example: Content record with AT Protocol metadata
{
  'PK': 'CONTENT#abc123',
  'SK': 'SITE#xyz789',
  'atp': {
    'cid': 'bafy2bzaced...',      # Content Identifier (hash)
    'rkey': 'bafyreabc123...',    # Record key
    'did': 'did:plc:alice...',    # Author DID
    'collection': 'com.nbhd.post'
  },
  'data': { 'title': '...', 'body': '...' }
}
```

See [AT Protocol Integration](./atprotocol.md) for details.

## Scaling Considerations

### Billing
- **On-Demand Mode** - Pay per operation, no capacity planning
- **Provisioned Mode** - Reserve capacity, save money at scale

nbhd.city uses **on-demand pricing** for flexibility.

### Performance
- Use indexes for common queries
- Keep hot items small (frequently accessed)
- Archive old items with TTL

### Backup
- Enable point-in-time recovery
- Regular exports to S3

## Local Development

For local development, nbhd.city runs **DynamoDB Local** in Docker:

```bash
cd app/dynamodb
docker-compose up
```

Local DynamoDB runs on **port 8000** with admin UI on **port 8002**.

Create tables:
```python
import boto3

dynamodb = boto3.client(
    'dynamodb',
    endpoint_url='http://localhost:8000',
    region_name='us-east-1'
)

dynamodb.create_table(
    TableName='nbhd-main',
    KeySchema=[
        {'AttributeName': 'PK', 'KeyType': 'HASH'},
        {'AttributeName': 'SK', 'KeyType': 'RANGE'}
    ],
    AttributeDefinitions=[
        {'AttributeName': 'PK', 'AttributeType': 'S'},
        {'AttributeName': 'SK', 'AttributeType': 'S'},
        {'AttributeName': 'handle', 'AttributeType': 'S'}
    ],
    BillingMode='PAY_PER_REQUEST',
    GlobalSecondaryIndexes=[...]
)
```

## Best Practices

| Practice | Reason |
|----------|--------|
| **Use PK + SK effectively** | Enables efficient queries without scans |
| **Keep items < 400KB** | DynamoDB item size limit |
| **Index hot access patterns** | GSI for common queries |
| **Use TTL for ephemeral data** | Auto-delete old sessions, temp data |
| **Design for your queries** | Denormalize if needed to avoid joins |
| **Monitor usage** | Watch for hot partitions, adjust capacity |

## Common Operations in Code

```python
# Create/Update item
await dynamodb.put_item(
    TableName='nbhd-main',
    Item={
        'PK': {'S': f'USER#{user_id}'},
        'SK': {'S': 'PROFILE'},
        'data': {'M': {...}},
        'updated_at': {'S': datetime.utcnow().isoformat()}
    }
)

# Get item
response = await dynamodb.get_item(
    TableName='nbhd-main',
    Key={'PK': {'S': pk}, 'SK': {'S': sk}}
)

# Query items
response = await dynamodb.query(
    TableName='nbhd-main',
    KeyConditionExpression='PK = :pk',
    ExpressionAttributeValues={':pk': {'S': pk}}
)

# Delete item
await dynamodb.delete_item(
    TableName='nbhd-main',
    Key={'PK': {'S': pk}, 'SK': {'S': sk}}
)
```

## Related Documentation

- **[Architecture](./architecture.md)** - System design overview
- **[Backend Guide](./backend.md)** - How APIs interact with database
- **[AT Protocol Integration](./atprotocol.md)** - Record schemas
- **[specs/DATABASE.md](../specs/DATABASE.md)** - Detailed schema documentation

---

See [specs/DATABASE.md](../specs/DATABASE.md) for complete schema with all fields and indexes.
