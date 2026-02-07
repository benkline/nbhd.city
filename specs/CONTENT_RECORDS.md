# Content Records & AT Protocol Integration

**Status:** Phase 2 - Design
**Last Updated:** 2026-01-21

---

## Overview

Content records are the core of nbhd.city's "social filesystem" philosophy. All user content (blog posts, pages, etc.) is stored as **AT Protocol records** in DynamoDB (which serves as the Personal Data Server). This enables:

1. **Data portability** - Users own their content as standard AT Protocol records
2. **Multi-app consumption** - Same content appears on static site AND BlueSky timeline
3. **Federation** - Content can be syndicated across the AT Protocol network

**Key Insight:** DynamoDB IS the PDS. Content doesn't live in two places—it lives as AT Protocol records that multiple "apps" (11ty builder, BlueSky client) consume.

---

## Dual Record Pattern

Each piece of content creates TWO linked AT Protocol records:

```
┌────────────────────────────────────┐
│  app.nbhd.blog.post (Full Content) │
│  - Title, full markdown, metadata  │
│  - Source of truth                 │
└──────────────┬─────────────────────┘
               │
               │ linked_record
               ↓
┌────────────────────────────────────┐
│  app.bsky.feed.post (Summary)      │
│  - Excerpt + link to website       │
│  - Appears in BlueSky timeline     │
└────────────────────────────────────┘
```

**Why Dual Records?**
- **Full content** needs markdown, frontmatter, rich metadata (too much for a social post)
- **BlueSky summary** needs to be <300 chars with link back to static site
- **Linked** so updating/deleting full content also updates/deletes summary

---

## AT Protocol Record Structure

### app.nbhd.blog.post (Full Content)

```json
{
  "$type": "app.nbhd.blog.post",
  "title": "My First Post",
  "content": "# Hello World\n\nThis is my **full markdown** blog post content...\n\nCan include images, code blocks, everything.",
  "frontmatter": {
    "date": "2026-01-21T00:00:00Z",
    "tags": ["tech", "blog"],
    "excerpt": "A brief summary of the post",
    "author": "Alice",
    "featured_image": "https://...",
    "seo_description": "Meta description for SEO",
    "custom_field": "Custom values from template schema"
  },
  "site_id": "site-uuid-123",
  "slug": "my-first-post",
  "status": "published",
  "createdAt": "2026-01-21T00:00:00Z",
  "updatedAt": "2026-01-21T00:00:00Z"
}
```

### app.bsky.feed.post (Summary)

```json
{
  "$type": "app.bsky.feed.post",
  "text": "New blog post: My First Post\n\nA brief summary of the post\n\n🔗 https://alice.nbhd.city/posts/my-first-post",
  "facets": [
    {
      "index": {
        "byteStart": 50,
        "byteEnd": 93
      },
      "features": [
        {
          "$type": "app.bsky.richtext.facet#link",
          "uri": "https://alice.nbhd.city/posts/my-first-post"
        }
      ]
    }
  ],
  "createdAt": "2026-01-21T00:00:00Z"
}
```

---

## DynamoDB Schema

### Content Record

```python
{
    # Partition Key + Sort Key
    "PK": "USER#did:plc:abc123",
    "SK": "RECORD#app.nbhd.blog.post#abc123xyz",

    # AT Protocol Fields
    "uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
    "cid": "bafyreib2rxk3rh6kzwq...",  # Content hash (IPLD CID)
    "record_type": "app.nbhd.blog.post",
    "rkey": "abc123xyz",  # Record key (TID format)

    # Record Value (the actual content)
    "value": {
        "$type": "app.nbhd.blog.post",
        "title": "My First Post",
        "content": "# Hello World\n\n...",
        "frontmatter": {...},
        "site_id": "site-uuid-123",
        "slug": "my-first-post",
        "status": "published",
        "createdAt": "2026-01-21T00:00:00Z",
        "updatedAt": "2026-01-21T00:00:00Z"
    },

    # Linked Records
    "linked_record": null,  # For full content, this is null
    "bluesky_post_uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789abc",

    # Metadata
    "created_at": "2026-01-21T00:00:00Z",
    "indexed_at": "2026-01-21T00:00:00Z",
    "updated_at": "2026-01-21T00:00:00Z"
}
```

### BlueSky Summary Record

```python
{
    # Partition Key + Sort Key
    "PK": "USER#did:plc:abc123",
    "SK": "RECORD#app.bsky.feed.post#xyz789abc",

    # AT Protocol Fields
    "uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789abc",
    "cid": "bafyreihfj3k2lm...",
    "record_type": "app.bsky.feed.post",
    "rkey": "xyz789abc",

    # Record Value
    "value": {
        "$type": "app.bsky.feed.post",
        "text": "New blog post: My First Post\n\n...",
        "facets": [...],
        "createdAt": "2026-01-21T00:00:00Z"
    },

    # Linked Records
    "linked_record": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
    "blog_post_uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",

    # Metadata
    "created_at": "2026-01-21T00:00:00Z",
    "indexed_at": "2026-01-21T00:00:00Z"
}
```

---

## Content Identifier (CID) Generation

AT Protocol uses **Content Identifiers** (IPLD CIDs) to create immutable content hashes.

```python
import dag_cbor
import multihash
import multibase

def generate_cid(record_value: Dict) -> str:
    """
    Generate CID for AT Protocol record.

    CID = multihash(dag-cbor(record_value))
    """
    # Encode record as DAG-CBOR
    cbor_bytes = dag_cbor.encode(record_value)

    # Hash with SHA-256
    hash_bytes = multihash.digest(cbor_bytes, 'sha2-256')

    # Encode as CIDv1 with base32
    cid = multibase.encode('base32', hash_bytes)

    return cid
```

**Immutability:** If content changes, CID changes. Old record preserved for history.

---

## Record Key (rkey) Generation

Record keys use **TID format** (Timestamp Identifier) for chronological ordering.

```python
import time
import random

def generate_rkey() -> str:
    """
    Generate TID (Timestamp Identifier) for record key.

    Format: Base32-encoded timestamp + random bits
    Sorts chronologically, globally unique
    """
    # Microseconds since Unix epoch
    timestamp_us = int(time.time() * 1_000_000)

    # Add random bits for uniqueness
    random_bits = random.getrandbits(10)

    # Combine and encode
    tid_int = (timestamp_us << 10) | random_bits
    tid_str = base32_encode(tid_int)

    return tid_str

# Example: "3jzfcijpj2z2a"
```

**Benefits:**
- Records naturally sort by creation time (SK = RECORD#{type}#{rkey})
- No UUID collisions
- Compatible with AT Protocol federation

---

## API Endpoints

### POST /api/sites/{site_id}/content

**Purpose:** Create new blog post or page

**Request:**
```json
{
  "type": "post",
  "title": "My First Post",
  "content": "# Hello World\n\nFull markdown content...",
  "frontmatter": {
    "date": "2026-01-21T00:00:00Z",
    "tags": ["tech", "blog"],
    "excerpt": "A brief summary",
    "author": "Alice"
  },
  "publish_to_bluesky": true,
  "auto_rebuild": true
}
```

**Response (201 Created):**
```json
{
  "record": {
    "uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
    "cid": "bafyreib2rxk3rh6kzwq...",
    "value": {...}
  },
  "bluesky_post": {
    "uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789abc",
    "cid": "bafyreihfj3k2lm..."
  },
  "rebuild_job_id": "job-uuid-456"
}
```

**Process:**
1. Validate site ownership
2. Generate slug from title (lowercase, hyphens, unique)
3. Create `app.nbhd.blog.post` record with CID
4. If `publish_to_bluesky=true`:
   - Generate summary (excerpt or first 200 chars)
   - Create `app.bsky.feed.post` record
   - Link records together
   - Publish to BlueSky firehose
5. If `auto_rebuild=true`:
   - Trigger site rebuild (async)
6. Return record URIs and build job ID

---

### GET /api/sites/{site_id}/content

**Purpose:** List all content for a site

**Query Parameters:**
- `type` (optional): Filter by content type ("post", "page")
- `skip`: Pagination offset (default: 0)
- `limit`: Page size (default: 10, max: 100)

**Response:**
```json
{
  "data": [
    {
      "uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
      "title": "My First Post",
      "slug": "my-first-post",
      "status": "published",
      "created_at": "2026-01-21T00:00:00Z",
      "updated_at": "2026-01-21T00:00:00Z",
      "bluesky_post_uri": "at://..."
    },
    ...
  ],
  "meta": {
    "total": 25,
    "skip": 0,
    "limit": 10
  }
}
```

---

### GET /api/sites/{site_id}/content/{rkey}

**Purpose:** Get specific content record

**Response:**
```json
{
  "uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
  "cid": "bafyreib2rxk3rh6kzwq...",
  "value": {
    "title": "My First Post",
    "content": "# Hello World\n\n...",
    "frontmatter": {...},
    ...
  },
  "bluesky_post": {
    "uri": "at://...",
    "text": "New blog post: ..."
  },
  "created_at": "2026-01-21T00:00:00Z",
  "updated_at": "2026-01-21T00:00:00Z"
}
```

---

### PUT /api/sites/{site_id}/content/{rkey}

**Purpose:** Update content record

**Request:**
```json
{
  "title": "My Updated Post Title",
  "content": "# Updated Content\n\n...",
  "frontmatter": {...},
  "update_bluesky": true,
  "auto_rebuild": true
}
```

**Process:**
1. Create NEW record with updated content (new CID)
2. Mark old record as superseded (keep for history)
3. If `update_bluesky=true`:
   - Delete old BlueSky post
   - Create new BlueSky post with updated link
4. If `auto_rebuild=true`:
   - Trigger site rebuild

**Immutability:** AT Protocol records are immutable. Updates = new record + link to old.

---

### DELETE /api/sites/{site_id}/content/{rkey}

**Purpose:** Delete content record

**Process:**
1. Mark record as deleted (soft delete, keep for history)
2. Delete linked BlueSky post from firehose
3. Trigger site rebuild to remove from static site

---

## Content Workflows

### Creating a Blog Post

```
User fills form in ContentEditor
       ↓
POST /api/sites/{id}/content
       ↓
┌─────────────────────────┐
│ Validate Ownership      │
│ Generate Slug & rkey    │
└────────┬────────────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ↓                              ↓
┌─────────────────────┐    ┌────────────────────────┐
│ Create Full Record  │    │ Create BlueSky Summary │
│ app.nbhd.blog.post  │    │ app.bsky.feed.post     │
│ - Generate CID      │    │ - Generate excerpt     │
│ - Save to DynamoDB  │◄───┤ - Create link facets   │
└────────┬────────────┘    │ - Link to full record  │
         │                 │ - Publish to firehose  │
         │                 └────────────────────────┘
         ↓
┌─────────────────────┐
│ Trigger Rebuild     │
│ - Async Lambda      │
│ - Return job_id     │
└─────────────────────┘
         ↓
   User sees "Building..."
         ↓
   Site updates with new post
         ↓
   BlueSky timeline shows summary
```

---

### Updating Content

```
User edits existing post
       ↓
PUT /api/sites/{id}/content/{rkey}
       ↓
┌─────────────────────────┐
│ Get existing record     │
│ Keep old CID for history│
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ Create NEW record       │
│ - New CID (immutable)   │
│ - Link to old version   │
│ - Update DynamoDB       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ Update BlueSky Post     │
│ - Delete old post       │
│ - Create new with       │
│   updated link          │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ Rebuild Site            │
└─────────────────────────┘
```

---

## BlueSky Summary Generation

```python
def generate_bluesky_summary(blog_post: Dict, static_url: str) -> Dict:
    """
    Generate BlueSky post from blog content.

    Format:
    New blog post: {title}

    {excerpt}

    🔗 {url}
    """
    title = blog_post['title']

    # Get excerpt (priority order)
    excerpt = (
        blog_post.get('frontmatter', {}).get('excerpt') or
        blog_post.get('excerpt') or
        extract_first_paragraph(blog_post['content'])[:150]
    )

    # Build text
    text = f"New blog post: {title}\n\n{excerpt}\n\n🔗 {static_url}"

    # Truncate if needed (BlueSky limit: 300 chars)
    if len(text) > 300:
        max_excerpt = 300 - len(f"New blog post: {title}\n\n...\n\n🔗 {static_url}")
        excerpt = excerpt[:max_excerpt] + "..."
        text = f"New blog post: {title}\n\n{excerpt}\n\n🔗 {static_url}"

    # Create link facet
    url_start = text.index("🔗 ") + 2
    url_end = len(text)

    facets = [
        {
            "index": {
                "byteStart": url_start,
                "byteEnd": url_end
            },
            "features": [
                {
                    "$type": "app.bsky.richtext.facet#link",
                    "uri": static_url
                }
            ]
        }
    ]

    return {
        "$type": "app.bsky.feed.post",
        "text": text,
        "facets": facets,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
```

---

## Query Patterns

### Get all posts for site build

```python
async def get_site_content(table, user_did: str, site_id: str):
    """Fetch all blog posts for 11ty build."""

    response = await table.query(
        KeyConditionExpression=
            Key("PK").eq(f"USER#{user_did}") &
            Key("SK").begins_with("RECORD#app.nbhd.blog.post#"),
        FilterExpression=Attr("value.site_id").eq(site_id)
    )

    items = response.get("Items", [])

    # Transform to 11ty format
    posts = []
    for item in items:
        value = item['value']
        posts.append({
            "title": value['title'],
            "content": value['content'],
            "date": value['frontmatter']['date'],
            "tags": value['frontmatter'].get('tags', []),
            "slug": value['slug'],
            "uri": item['uri'],
            **value['frontmatter']  # Merge all frontmatter
        })

    # Sort by date descending
    posts.sort(key=lambda p: p['date'], reverse=True)

    return posts
```

---

## Testing Strategy

**Unit Tests:**
```python
def test_generate_cid():
    record = {"title": "Test", "content": "Hello"}
    cid1 = generate_cid(record)
    cid2 = generate_cid(record)
    assert cid1 == cid2  # Same content = same CID

    record2 = {"title": "Test", "content": "World"}
    cid3 = generate_cid(record2)
    assert cid1 != cid3  # Different content = different CID

def test_generate_bluesky_summary():
    blog_post = {
        "title": "My Post",
        "content": "# Hello\n\nThis is content...",
        "frontmatter": {"excerpt": "A summary"}
    }

    summary = generate_bluesky_summary(blog_post, "https://alice.nbhd.city/posts/my-post")

    assert "My Post" in summary['text']
    assert "A summary" in summary['text']
    assert "https://alice.nbhd.city" in summary['text']
    assert len(summary['facets']) == 1
    assert summary['facets'][0]['features'][0]['$type'] == "app.bsky.richtext.facet#link"
```

**Integration Tests:**
```python
async def test_create_content_with_bluesky():
    # Create blog post
    response = await client.post("/api/sites/site-123/content", json={
        "title": "Test Post",
        "content": "# Hello",
        "frontmatter": {"date": "2026-01-21T00:00:00Z"},
        "publish_to_bluesky": True
    })

    assert response.status_code == 201
    data = response.json()

    # Verify full record created
    assert "record" in data
    assert data['record']['uri'].startswith("at://")

    # Verify BlueSky post created
    assert "bluesky_post" in data
    assert data['bluesky_post']['uri'].startswith("at://")

    # Verify link between records
    full_record = await get_record(data['record']['uri'])
    assert full_record['bluesky_post_uri'] == data['bluesky_post']['uri']

    bsky_record = await get_record(data['bluesky_post']['uri'])
    assert bsky_record['linked_record'] == data['record']['uri']
```

---

## Future Enhancements

1. **Content Versioning UI:** Show history of edits with diffs
2. **Scheduled Publishing:** Create record now, publish later
3. **Content Templates:** Reusable post templates for common structures
4. **Collaborative Editing:** Multiple authors for group sites
5. **Content Import:** Migrate from Medium, Substack, WordPress
6. **Rich Media:** Native image upload and optimization
7. **Markdown Extensions:** Custom shortcodes for embeds
