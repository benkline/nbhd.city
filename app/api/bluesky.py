"""
BlueSky Integration Module (SSG-013)

Handles creation of dual AT Protocol records for blog posts and BlueSky summaries:
- Generate BlueSky summaries from blog post content
- Create linked records (app.nbhd.blog.post + app.bsky.feed.post)
- Generate link facets for BlueSky posts
- Publish to BlueSky firehose (stub for MVP)
"""

import re
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def generate_bluesky_summary(
    blog_post: Dict,
    static_url: str
) -> Dict:
    """
    Generate BlueSky post from blog post content.

    Returns app.bsky.feed.post record value with:
    - Summary text (title + excerpt + URL)
    - Link facets for URL
    - Proper BlueSky formatting
    - Enforced 300 character limit

    Args:
        blog_post: Dict with 'title', 'content', 'frontmatter'
        static_url: URL to link back to the full blog post

    Returns:
        Dict with $type, text, facets, createdAt
    """
    title = blog_post.get('title', 'Untitled')

    # Get excerpt (priority order)
    excerpt = None

    # 1. Check frontmatter for explicit excerpt
    if 'frontmatter' in blog_post and 'excerpt' in blog_post['frontmatter']:
        excerpt = blog_post['frontmatter']['excerpt']

    # 2. Extract first paragraph from markdown
    if not excerpt:
        excerpt = extract_first_paragraph(blog_post.get('content', ''))

    # 3. Fallback: first 150 chars
    if not excerpt:
        content = strip_markdown(blog_post.get('content', ''))
        excerpt = content[:150] if content else ''

    # Build text in BlueSky format
    text = f"New blog post: {title}\n\n{excerpt}\n\n🔗 {static_url}"

    # Check length (BlueSky limit: 300 chars)
    if len(text) > 300:
        # Calculate overhead (fixed parts of the format)
        overhead = len(f"New blog post: {title}\n\n...\n\n🔗 {static_url}")
        max_excerpt_len = 300 - overhead

        if max_excerpt_len > 0:
            # Truncate excerpt at word boundary
            excerpt = excerpt[:max_excerpt_len].rsplit(' ', 1)[0]
            excerpt += "..."
        else:
            # Title is too long, just truncate everything
            excerpt = ""

        text = f"New blog post: {title}\n\n{excerpt}\n\n🔗 {static_url}"

        # If still too long, truncate aggressively
        if len(text) > 300:
            text = text[:297] + "..."

    # Create link facets
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
    - Get first block of text (paragraph)
    - Strip markdown formatting

    Args:
        markdown_content: Raw markdown content

    Returns:
        Cleaned first paragraph text
    """
    if not markdown_content:
        return ""

    lines = markdown_content.split('\n')

    in_frontmatter = False
    found_heading = False
    skip_first_text = False
    paragraph_lines = []
    found_paragraph = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Skip frontmatter
        if stripped == '---':
            in_frontmatter = not in_frontmatter
            continue

        if in_frontmatter:
            continue

        # Track if we've seen a heading
        if stripped.startswith('#'):
            found_heading = True
            continue

        # Skip empty lines before we find content
        if not found_paragraph and not stripped:
            continue

        # If we've found heading and see text
        if found_heading and stripped and not found_paragraph:
            # Check if there was a blank line between heading and this text
            prev_was_blank = (i > 0 and lines[i-1].strip() == '')

            if prev_was_blank or skip_first_text:
                # This IS the first real paragraph
                found_paragraph = True
                paragraph_lines.append(stripped)
            else:
                # Text immediately after heading with no blank line, skip it
                skip_first_text = True
                continue

        # If we have a paragraph and hit a blank line, we're done
        if found_paragraph and not stripped:
            break

        # If we're past the heading and have paragraph, add text
        if found_paragraph and stripped:
            paragraph_lines.append(stripped)

    paragraph = ' '.join(paragraph_lines)
    return strip_markdown(paragraph)


def strip_markdown(text: str) -> str:
    """
    Remove markdown formatting from text.

    Args:
        text: Text with markdown formatting

    Returns:
        Plain text without markdown
    """
    # Remove links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)

    # Remove bold/italic **text** or *text* -> text
    text = re.sub(r'\*+([^\*]+)\*+', r'\1', text)

    # Remove code `text` -> text
    text = re.sub(r'`([^`]+)`', r'\1', text)

    # Remove HTML tags (if any)
    text = re.sub(r'<[^>]+>', '', text)

    return text.strip()


def create_link_facets(text: str, url: str) -> List[Dict]:
    """
    Create link facets for BlueSky post.

    Facets mark up rich text features like links. The facet marks
    the position of the URL in the text as a clickable link.

    Uses UTF-8 byte positions (not character positions).

    Args:
        text: The post text
        url: The URL to create facet for

    Returns:
        List of facets (empty if URL not found in text)
    """
    # Find URL in text
    url_start = text.find(url)

    if url_start == -1:
        # URL not in text, don't create facet
        return []

    url_end = url_start + len(url)

    # Calculate byte positions (UTF-8 encoding)
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


async def create_dual_records(
    table,
    user_did: str,
    blog_post_data: Dict,
    static_url: str,
    publish_to_bluesky: bool = True
) -> Dict:
    """
    Create linked blog and BlueSky records.

    Creates:
    1. app.nbhd.blog.post record (full content)
    2. app.bsky.feed.post record (summary, optional)

    Links them together via linked_record field.

    Args:
        table: DynamoDB table
        user_did: User's DID
        blog_post_data: Dict with title, content, frontmatter, site_id
        static_url: URL of published blog post
        publish_to_bluesky: Whether to create BlueSky record

    Returns:
        Dict with 'blog_post' and optionally 'bluesky_post'
    """
    from atproto.tid import generate_rkey
    from atproto.cid import generate_cid
    from datetime import datetime

    # 1. Create blog post record
    blog_rkey = generate_rkey()
    blog_value = {
        "$type": "app.nbhd.blog.post",
        "title": blog_post_data.get('title', 'Untitled'),
        "content": blog_post_data.get('content', ''),
        "frontmatter": blog_post_data.get('frontmatter', {}),
        "site_id": blog_post_data.get('site_id'),
        "status": "published",
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }

    blog_cid = generate_cid(blog_value)
    blog_uri = f"at://{user_did}/app.nbhd.blog.post/{blog_rkey}"

    blog_record = {
        "PK": f"USER#{user_did}",
        "SK": f"RECORD#app.nbhd.blog.post#{blog_rkey}",
        "uri": blog_uri,
        "record_type": "app.nbhd.blog.post",
        "rkey": blog_rkey,
        "value": blog_value,
        "cid": blog_cid,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    # Save blog record
    await table.put_item(Item=blog_record)

    results = {"blog_post": blog_record}

    # 2. Optionally create BlueSky record
    if publish_to_bluesky:
        # Generate BlueSky summary
        summary = generate_bluesky_summary(blog_post_data, static_url)

        # Create BlueSky post record
        bsky_rkey = generate_rkey()
        bsky_cid = generate_cid(summary)
        bsky_uri = f"at://{user_did}/app.bsky.feed.post/{bsky_rkey}"

        bsky_record = {
            "PK": f"USER#{user_did}",
            "SK": f"RECORD#app.bsky.feed.post#{bsky_rkey}",
            "uri": bsky_uri,
            "record_type": "app.bsky.feed.post",
            "rkey": bsky_rkey,
            "value": summary,
            "cid": bsky_cid,
            "linked_record": blog_uri,
            "blog_post_uri": blog_uri,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        # Save BlueSky record
        await table.put_item(Item=bsky_record)

        # Update blog record with link to BlueSky post
        await table.update_item(
            Key={"PK": blog_record['PK'], "SK": blog_record['SK']},
            UpdateExpression="SET bluesky_post_uri = :uri",
            ExpressionAttributeValues={":uri": bsky_uri}
        )

        # Also update the returned blog_record object
        blog_record['bluesky_post_uri'] = bsky_uri

        # Publish to firehose (stub for MVP)
        await publish_to_bluesky_firehose(user_did, bsky_record)

        results["bluesky_post"] = bsky_record

    return results


async def publish_to_bluesky_firehose(user_did: str, record: Dict) -> None:
    """
    Publish record to BlueSky firehose.

    MVP: Just log the event (don't actually publish)

    Args:
        user_did: User's DID
        record: The record to publish
    """
    logger.info(f"Would publish to firehose: {record['uri']}")

    # TODO Phase 3: Implement actual firehose emission
    # await relay_client.emit_event({
    #     "did": user_did,
    #     "event": "create",
    #     "collection": record['record_type'],
    #     "rkey": record['rkey'],
    #     "record": record['value']
    # })
