# BlueSky Integration Specification

**Status:** Phase 2c - Design
**Last Updated:** 2026-01-21

---

## Overview

BlueSky integration enables nbhd.city users to cross-post blog content to their BlueSky timeline. When users create blog posts, they can optionally publish a summary to BlueSky that links back to the full post on their static site.

**Dual Record Pattern:** Each blog post can create two linked AT Protocol records:
1. **app.nbhd.blog.post** - Full content on static site
2. **app.bsky.feed.post** - Summary on BlueSky timeline

**Key Principle:** Content lives once in the PDS (DynamoDB), rendered in multiple formats.

---

## User Workflow

```
User creates blog post in ContentEditor
       ↓
Fills: title, content, frontmatter
       ↓
Toggles: "Publish to BlueSky" ✓
       ↓
Clicks: "Publish"
       ↓
┌─────────────────────────────────┐
│ Create full blog post record    │
│ app.nbhd.blog.post              │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Generate BlueSky summary        │
│ - Extract/create excerpt        │
│ - Build text with link          │
│ - Add link facets               │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Create BlueSky post record      │
│ app.bsky.feed.post              │
│ - Link to full blog post        │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Publish to BlueSky firehose     │
│ (appears in user's timeline)    │
└─────────────────────────────────┘
           │
           ↓
    Rebuild site (async)
           ↓
Both blog post AND BlueSky summary live
```

---

## BlueSky Post Format

### Text Structure

```
New blog post: {title}

{excerpt}

🔗 {url}
```

**Example:**
```
New blog post: Building a Static Site Generator

Learn how I built a static site generator using 11ty and AT Protocol. This post covers template analysis, content storage, and more.

🔗 https://alice.nbhd.city/posts/building-a-static-site-generator
```

### Character Limit

BlueSky posts have a **300 character limit**. The summary generator must:
1. Try full excerpt first
2. Truncate if too long
3. Ensure URL always fits
4. Add "..." if truncated

---

## Summary Generation Algorithm

```python
def generate_bluesky_summary(blog_post: Dict, static_url: str) -> Dict:
    """
    Generate BlueSky post from blog content.

    Priority for excerpt:
    1. Frontmatter "excerpt" field (manually written)
    2. First paragraph of content (auto-extract)
    3. First 150 chars of content (fallback)

    Returns app.bsky.feed.post record value.
    """
    title = blog_post['title']

    # Get excerpt (priority order)
    excerpt = None

    # 1. Check frontmatter for explicit excerpt
    if 'frontmatter' in blog_post and 'excerpt' in blog_post['frontmatter']:
        excerpt = blog_post['frontmatter']['excerpt']

    # 2. Extract first paragraph from markdown
    if not excerpt:
        excerpt = extract_first_paragraph(blog_post['content'])

    # 3. Fallback: first 150 chars
    if not excerpt:
        content = strip_markdown(blog_post['content'])
        excerpt = content[:150]

    # Build text
    text = f"New blog post: {title}\n\n{excerpt}\n\n🔗 {static_url}"

    # Check length (BlueSky limit: 300 chars)
    if len(text) > 300:
        # Calculate max excerpt length
        # Format: "New blog post: {title}\n\n{excerpt}\n\n🔗 {url}"
        overhead = len(f"New blog post: {title}\n\n...\n\n🔗 {static_url}")
        max_excerpt_len = 300 - overhead

        # Truncate excerpt
        excerpt = excerpt[:max_excerpt_len].rsplit(' ', 1)[0]  # Break at word boundary
        excerpt += "..."

        text = f"New blog post: {title}\n\n{excerpt}\n\n🔗 {static_url}"

    # Create link facet
    facets = create_link_facets(text, static_url)

    return {
        "$type": "app.bsky.feed.post",
        "text": text,
        "facets": facets,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }

def extract_first_paragraph(markdown_content: str) -> str:
    """
    Extract first paragraph from markdown content.

    Rules:
    - Skip frontmatter (---)
    - Skip headings (# )
    - Get first block of text
    - Strip markdown formatting
    """
    lines = markdown_content.split('\n')

    in_frontmatter = False
    paragraph_lines = []

    for line in lines:
        # Skip frontmatter
        if line.strip() == '---':
            in_frontmatter = not in_frontmatter
            continue

        if in_frontmatter:
            continue

        # Skip headings
        if line.strip().startswith('#'):
            continue

        # Skip empty lines before content starts
        if not paragraph_lines and not line.strip():
            continue

        # End of paragraph
        if paragraph_lines and not line.strip():
            break

        paragraph_lines.append(line.strip())

    paragraph = ' '.join(paragraph_lines)
    return strip_markdown(paragraph)

def strip_markdown(text: str) -> str:
    """Remove markdown formatting."""
    import re

    # Remove links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)

    # Remove bold/italic **text** or *text* -> text
    text = re.sub(r'\*+([^\*]+)\*+', r'\1', text)

    # Remove code `text` -> text
    text = re.sub(r'`([^`]+)`', r'\1', text)

    return text
```

---

## Link Facets

BlueSky uses **facets** to mark up rich text features like links, mentions, and hashtags.

### Facet Structure

```python
def create_link_facets(text: str, url: str) -> List[Dict]:
    """
    Create link facets for BlueSky post.

    Facet marks the position of the URL in the text
    as a clickable link.
    """
    # Find URL in text
    url_start = text.find(url)

    if url_start == -1:
        # URL not in text, don't create facet
        return []

    url_end = url_start + len(url)

    # Calculate byte positions (UTF-8)
    byte_start = len(text[:url_start].encode('utf-8'))
    byte_end = len(text[:url_end].encode('utf-8'))

    return [
        {
            "index": {
                "byteStart": byte_start,
                "byteEnd": byte_end
            },
            "features": [
                {
                    "$type": "app.bsky.richtext.facet#link",
                    "uri": url
                }
            ]
        }
    ]
```

**Example:**
```json
{
  "text": "Check out my blog! 🔗 https://alice.nbhd.city",
  "facets": [
    {
      "index": {
        "byteStart": 22,
        "byteEnd": 46
      },
      "features": [
        {
          "$type": "app.bsky.richtext.facet#link",
          "uri": "https://alice.nbhd.city"
        }
      ]
    }
  ]
}
```

**Important:** Use **byte positions**, not character positions (UTF-8 encoding).

---

## Publishing to BlueSky Firehose

### What is the Firehose?

The **BlueSky firehose** is a real-time stream of all public posts on the AT Protocol network. When a PDS creates a new `app.bsky.feed.post` record, it emits an event to the firehose.

### Publishing Flow

```
Create app.bsky.feed.post record in DynamoDB
       ↓
Emit event to BlueSky relay
       ↓
{
  "did": "did:plc:abc123",
  "event": "create",
  "collection": "app.bsky.feed.post",
  "rkey": "xyz789abc",
  "record": {...}
}
       ↓
BlueSky relay broadcasts to subscribers
       ↓
User's BlueSky timeline updated
```

### Implementation (MVP)

**Phase 2c (MVP):** Stub implementation - store record but don't emit to firehose yet

```python
async def publish_to_bluesky_firehose(user_did: str, record: Dict):
    """
    Publish record to BlueSky firehose.

    MVP: Just log the event (don't actually publish)
    Phase 3: Emit to AT Protocol relay
    """
    logger.info(f"Would publish to firehose: {record['uri']}")

    # TODO Phase 3: Implement actual firehose emission
    # await relay_client.emit_event({
    #     "did": user_did,
    #     "event": "create",
    #     "collection": "app.bsky.feed.post",
    #     "rkey": record['rkey'],
    #     "record": record['value']
    # })
```

**Phase 3 (Full PDS):** Implement actual firehose connection

---

## Linked Records

The full blog post and BlueSky summary are **linked** to maintain their relationship.

### Full Blog Post Record

```python
{
    "PK": "USER#did:plc:abc123",
    "SK": "RECORD#app.nbhd.blog.post#abc123xyz",
    "uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
    "value": {
        "$type": "app.nbhd.blog.post",
        "title": "My Post",
        "content": "# Full markdown...",
        ...
    },
    "bluesky_post_uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789abc",  # Link to summary
    "created_at": "2026-01-21T00:00:00Z"
}
```

### BlueSky Summary Record

```python
{
    "PK": "USER#did:plc:abc123",
    "SK": "RECORD#app.bsky.feed.post#xyz789abc",
    "uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789abc",
    "value": {
        "$type": "app.bsky.feed.post",
        "text": "New blog post: My Post\n\n...",
        "facets": [...],
        "createdAt": "2026-01-21T00:00:00Z"
    },
    "linked_record": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",  # Link to full post
    "blog_post_uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
    "created_at": "2026-01-21T00:00:00Z"
}
```

**Benefits of Linking:**
- Update full post → can update/delete BlueSky summary
- Delete full post → automatically delete BlueSky summary
- Query: "Show all BlueSky posts for this blog"

---

## API Integration

### POST /api/sites/{site_id}/content

**Request:**
```json
{
  "type": "post",
  "title": "My First Post",
  "content": "# Hello World\n\nThis is my blog post...",
  "frontmatter": {
    "date": "2026-01-21T00:00:00Z",
    "tags": ["tech", "blog"],
    "excerpt": "A brief summary"
  },
  "publish_to_bluesky": true  ← Toggle
}
```

**Response:**
```json
{
  "record": {
    "uri": "at://did:plc:abc123/app.nbhd.blog.post/abc123xyz",
    "cid": "bafyreib2rxk3rh6kzwq..."
  },
  "bluesky_post": {
    "uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789abc",
    "cid": "bafyreihfj3k2lm...",
    "text": "New blog post: My First Post\n\nA brief summary\n\n🔗 https://alice.nbhd.city/posts/my-first-post"
  }
}
```

### Implementation

```python
@router.post("/api/sites/{site_id}/content")
async def create_content(
    site_id: str,
    content: ContentCreate,
    user_did: str = Depends(get_current_user)
):
    """Create blog post with optional BlueSky cross-posting."""

    # 1. Create full blog post record
    blog_rkey = generate_rkey()
    blog_record = {
        "PK": f"USER#{user_did}",
        "SK": f"RECORD#app.nbhd.blog.post#{blog_rkey}",
        "uri": f"at://{user_did}/app.nbhd.blog.post/{blog_rkey}",
        "record_type": "app.nbhd.blog.post",
        "rkey": blog_rkey,
        "value": {
            "$type": "app.nbhd.blog.post",
            "title": content.title,
            "content": content.content,
            "frontmatter": content.frontmatter,
            "site_id": site_id,
            "slug": slugify(content.title),
            "status": "published",
            "createdAt": datetime.utcnow().isoformat() + "Z"
        },
        "cid": generate_cid({...}),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    await table.put_item(Item=blog_record)

    response = {"record": blog_record}

    # 2. Optionally create BlueSky summary
    if content.publish_to_bluesky:
        # Generate static URL (predict future URL)
        site = await get_site(user_did, site_id)
        static_url = f"https://{site['subdomain']}.nbhd.city/posts/{blog_record['value']['slug']}/"

        # Generate summary
        summary = generate_bluesky_summary(blog_record['value'], static_url)

        # Create BlueSky post record
        bsky_rkey = generate_rkey()
        bsky_record = {
            "PK": f"USER#{user_did}",
            "SK": f"RECORD#app.bsky.feed.post#{bsky_rkey}",
            "uri": f"at://{user_did}/app.bsky.feed.post/{bsky_rkey}",
            "record_type": "app.bsky.feed.post",
            "rkey": bsky_rkey,
            "value": summary,
            "cid": generate_cid(summary),
            "linked_record": blog_record['uri'],
            "blog_post_uri": blog_record['uri'],
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        await table.put_item(Item=bsky_record)

        # Update blog record with link to BlueSky post
        await table.update_item(
            Key={"PK": blog_record['PK'], "SK": blog_record['SK']},
            UpdateExpression="SET bluesky_post_uri = :uri",
            ExpressionAttributeValues={":uri": bsky_record['uri']}
        )

        # Publish to firehose (stub for MVP)
        await publish_to_bluesky_firehose(user_did, bsky_record)

        response["bluesky_post"] = bsky_record

    # 3. Trigger site rebuild
    if content.auto_rebuild:
        job_id = await trigger_build(site_id, user_did)
        response["rebuild_job_id"] = job_id

    return response, 201
```

---

## UI Components

### ContentEditor with BlueSky Toggle

```jsx
function ContentEditor({ siteId, onSave }) {
  const [publishToBluesky, setPublishToBluesky] = useState(true);
  const [autoRebuild, setAutoRebuild] = useState(true);

  const handlePublish = async () => {
    const content = {
      type: 'post',
      title,
      content: markdown,
      frontmatter: {
        date: new Date().toISOString(),
        tags,
        excerpt
      },
      publish_to_bluesky: publishToBluesky,
      auto_rebuild: autoRebuild
    };

    const response = await api.post(`/api/sites/${siteId}/content`, content);

    if (response.bluesky_post) {
      toast.success('Published to blog and BlueSky!');
    } else {
      toast.success('Published to blog!');
    }
  };

  return (
    <div className="content-editor">
      <h2>Create Blog Post</h2>

      {/* Title, content, frontmatter fields... */}

      <div className="publish-options">
        <label>
          <input
            type="checkbox"
            checked={publishToBluesky}
            onChange={(e) => setPublishToBluesky(e.target.checked)}
          />
          Publish summary to BlueSky timeline
        </label>

        <label>
          <input
            type="checkbox"
            checked={autoRebuild}
            onChange={(e) => setAutoRebuild(e.target.checked)}
          />
          Rebuild site automatically
        </label>
      </div>

      <button onClick={handlePublish}>Publish</button>
    </div>
  );
}
```

### BlueSky Preview

```jsx
function BlueSkyPreview({ title, excerpt, siteUrl }) {
  const previewText = `New blog post: ${title}\n\n${excerpt}\n\n🔗 ${siteUrl}`;

  // Truncate if needed
  const displayText = previewText.length > 300
    ? previewText.slice(0, 297) + '...'
    : previewText;

  return (
    <div className="bluesky-preview">
      <h4>BlueSky Preview</h4>
      <div className="preview-card">
        <p>{displayText}</p>
        <span className="char-count">
          {displayText.length} / 300 characters
        </span>
      </div>
    </div>
  );
}
```

---

## Testing Strategy

**Unit Tests:**
```python
def test_generate_bluesky_summary():
    blog_post = {
        "title": "My Post",
        "content": "# Hello\n\nThis is a test post with some content.",
        "frontmatter": {"excerpt": "A test post"}
    }

    summary = generate_bluesky_summary(blog_post, "https://alice.nbhd.city/posts/my-post")

    assert "My Post" in summary['text']
    assert "A test post" in summary['text']
    assert "https://alice.nbhd.city" in summary['text']
    assert len(summary['text']) <= 300
    assert len(summary['facets']) == 1

def test_generate_bluesky_summary_truncation():
    blog_post = {
        "title": "A" * 100,  # Long title
        "content": "B" * 500,  # Long content
        "frontmatter": {}
    }

    summary = generate_bluesky_summary(blog_post, "https://alice.nbhd.city/posts/very-long-post")

    assert len(summary['text']) <= 300
    assert "..." in summary['text']

def test_create_link_facets():
    text = "Check this out: https://example.com"
    facets = create_link_facets(text, "https://example.com")

    assert len(facets) == 1
    assert facets[0]['index']['byteStart'] == 16
    assert facets[0]['index']['byteEnd'] == 35
    assert facets[0]['features'][0]['uri'] == "https://example.com"
```

**Integration Tests:**
```python
async def test_create_content_with_bluesky():
    response = await client.post("/api/sites/site-123/content", json={
        "title": "Test Post",
        "content": "# Hello",
        "frontmatter": {"date": "2026-01-21T00:00:00Z"},
        "publish_to_bluesky": True
    })

    assert response.status_code == 201
    data = response.json()

    # Verify both records created
    assert "record" in data
    assert "bluesky_post" in data

    # Verify BlueSky text format
    bsky_text = data['bluesky_post']['value']['text']
    assert "New blog post: Test Post" in bsky_text
    assert "https://" in bsky_text

    # Verify records linked
    blog_record = await get_record(data['record']['uri'])
    assert blog_record['bluesky_post_uri'] == data['bluesky_post']['uri']
```

---

## Future Enhancements

1. **Threaded Posts:** For long blog posts, create thread of BlueSky posts
2. **Image Cards:** Generate og:image preview cards for links
3. **Hashtag Extraction:** Auto-convert tags to #hashtags in BlueSky post
4. **Mention Detection:** Convert @mentions to BlueSky mentions
5. **Edit Sync:** Update BlueSky post when blog post edited
6. **Delete Sync:** Delete BlueSky post when blog post deleted
7. **Analytics:** Track clicks from BlueSky to blog
8. **Scheduled Posting:** Publish to BlueSky at specific time
