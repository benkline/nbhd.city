"""
Tests for BlueSky Integration (SSG-013)

Verifies dual record creation and BlueSky cross-posting functionality:
- Generate BlueSky summary from blog post (excerpt + link)
- Create app.nbhd.blog.post record (full content)
- Create app.bsky.feed.post record (summary)
- Link records together (linked_record field)
- Generate link facets for URL in BlueSky post
- Publish to BlueSky firehose (stub for now)
- Handle publish toggle (optional BlueSky posting)
"""

import pytest
from datetime import datetime
from typing import Dict


# REQUIREMENT: [ ] Generate BlueSky summary from blog post (excerpt + link)
# ACCEPTANCE: [ ] BlueSky summary under 300 chars
class TestBlueSkyGenerators:
    """Test BlueSky summary generation utilities."""

    def test_generate_summary_uses_explicit_excerpt(self):
        """Use frontmatter excerpt if provided"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "My First Post",
            "content": "# Hello\n\nThis is a very long content that should not be used if excerpt is provided.",
            "frontmatter": {"excerpt": "A brief summary"}
        }

        summary = generate_bluesky_summary(blog_post, "https://alice.nbhd.city/posts/my-post")

        assert "My First Post" in summary['text']
        assert "A brief summary" in summary['text']
        assert "https://alice.nbhd.city" in summary['text']

    def test_generate_summary_extracts_first_paragraph(self):
        """Extract first paragraph if no explicit excerpt"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "Second Post",
            "content": "# Heading\n\nFirst paragraph with important information.\n\nSecond paragraph should be ignored.",
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://alice.nbhd.city/posts/second-post")

        assert "First paragraph with important information" in summary['text']
        assert "Second paragraph" not in summary['text']

    def test_generate_summary_uses_fallback(self):
        """Use first 150 chars as fallback"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "Post",
            "content": "# Title only, no paragraphs" + " " * 500,
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://example.com/post")

        # Should contain some content
        assert "Post" in summary['text']

    def test_generate_summary_respects_300_char_limit(self):
        """Truncate summary if over 300 chars"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "X" * 100,  # Very long title
            "content": "Y" * 500,  # Very long content
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(
            blog_post,
            "https://very.long.url.example.com/posts/with/long/path"
        )

        assert len(summary['text']) <= 300, f"Summary too long: {len(summary['text'])} chars"
        assert "..." in summary['text'], "Should have truncation indicator"

    def test_generate_summary_includes_url(self):
        """Always include URL in summary"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "Test",
            "content": "Short",
            "frontmatter": {}
        }

        url = "https://alice.nbhd.city/posts/test"
        summary = generate_bluesky_summary(blog_post, url)

        assert url in summary['text']

    def test_generate_summary_text_format(self):
        """Summary follows 'New blog post: {title}\\n\\n{excerpt}\\n\\n🔗 {url}' format"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "My Post",
            "content": "Content here.",
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://example.com")

        # Check format
        assert "New blog post:" in summary['text']
        assert "🔗" in summary['text']

    def test_generate_summary_includes_type(self):
        """Summary record has correct type"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "Test",
            "content": "Content",
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://example.com")

        assert summary.get('$type') == 'app.bsky.feed.post'

    def test_generate_summary_includes_facets(self):
        """Summary includes link facets"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "Test",
            "content": "Content",
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://example.com/post")

        assert 'facets' in summary
        assert isinstance(summary['facets'], list)
        assert len(summary['facets']) > 0

    def test_extract_first_paragraph(self):
        """Extract first paragraph from markdown"""
        from bluesky import extract_first_paragraph

        content = """# Title
Some other text

This is the first paragraph.

This is the second paragraph."""

        para = extract_first_paragraph(content)

        assert "This is the first paragraph" in para
        assert "second paragraph" not in para

    def test_extract_first_paragraph_skips_frontmatter(self):
        """Skip frontmatter when extracting paragraph"""
        from bluesky import extract_first_paragraph

        content = """---
title: Test
---

# Title

First paragraph here."""

        para = extract_first_paragraph(content)

        assert "title: Test" not in para
        assert "First paragraph here" in para

    def test_strip_markdown(self):
        """Remove markdown formatting"""
        from bluesky import strip_markdown

        text = "Check out [my link](https://example.com) and **bold** and *italic*"

        cleaned = strip_markdown(text)

        assert "my link" in cleaned
        assert "[" not in cleaned
        assert "**" not in cleaned
        assert "*" not in cleaned


# REQUIREMENT: [ ] Generate link facets for URL in BlueSky post
# ACCEPTANCE: [ ] Link facets correctly formatted
class TestLinkFacets:
    """Test link facet generation."""

    def test_create_link_facets_basic(self):
        """Create link facet with correct byte positions"""
        from bluesky import create_link_facets

        text = "Check out https://example.com"
        facets = create_link_facets(text, "https://example.com")

        assert len(facets) == 1
        assert 'index' in facets[0]
        assert 'features' in facets[0]

    def test_create_link_facets_has_correct_structure(self):
        """Facet has correct BlueSky format"""
        from bluesky import create_link_facets

        text = "Link: https://example.com here"
        facets = create_link_facets(text, "https://example.com")

        facet = facets[0]
        assert 'byteStart' in facet['index']
        assert 'byteEnd' in facet['index']
        assert facet['index']['byteEnd'] > facet['index']['byteStart']

    def test_create_link_facets_uses_byte_positions(self):
        """Use byte positions, not character positions"""
        from bluesky import create_link_facets

        # Text with emoji (multi-byte character)
        text = "🔗 https://example.com"
        facets = create_link_facets(text, "https://example.com")

        # Emoji takes 4 bytes in UTF-8, + space = 5 bytes before URL
        assert facets[0]['index']['byteStart'] == len("🔗 ".encode('utf-8'))

    def test_create_link_facets_feature_format(self):
        """Features array has correct format"""
        from bluesky import create_link_facets

        text = "Visit https://alice.nbhd.city"
        url = "https://alice.nbhd.city"
        facets = create_link_facets(text, url)

        features = facets[0]['features']
        assert len(features) == 1
        assert features[0]['$type'] == 'app.bsky.richtext.facet#link'
        assert features[0]['uri'] == url

    def test_create_link_facets_no_url_in_text(self):
        """Return empty list if URL not in text"""
        from bluesky import create_link_facets

        text = "Some text"
        facets = create_link_facets(text, "https://example.com")

        assert facets == []

    def test_create_link_facets_multiple_urls(self):
        """Handle text with multiple URLs (create facet for first)"""
        from bluesky import create_link_facets

        text = "Check https://example.com and https://other.com"
        # Create facet for first URL
        facets = create_link_facets(text, "https://example.com")

        assert len(facets) >= 1
        assert facets[0]['features'][0]['uri'] == "https://example.com"


# REQUIREMENT: [ ] Create app.nbhd.blog.post record (full content)
# REQUIREMENT: [ ] Create app.bsky.feed.post record (summary)
# REQUIREMENT: [ ] Link records together (linked_record field)
# ACCEPTANCE: [ ] Both records created in DynamoDB
# ACCEPTANCE: [ ] Records properly linked
class TestDualRecordCreation:
    """Test creating linked blog and BlueSky records."""

    @pytest.mark.asyncio
    async def test_create_blog_post_record(self):
        """Create full blog post record"""
        from bluesky import create_dual_records
        from unittest.mock import AsyncMock

        mock_table = AsyncMock()

        blog_post_data = {
            "title": "My Blog Post",
            "content": "# Hello\n\nFull content here.",
            "frontmatter": {"date": "2026-01-21T00:00:00Z", "excerpt": "Summary"},
            "site_id": "site-123"
        }

        user_did = "did:plc:abc123"

        # Create records
        records = await create_dual_records(
            mock_table,
            user_did,
            blog_post_data,
            "https://alice.nbhd.city/posts/my-blog-post",
            publish_to_bluesky=False
        )

        assert 'blog_post' in records
        blog_record = records['blog_post']

        # Verify blog record structure
        assert blog_record['uri'].startswith(f"at://{user_did}/app.nbhd.blog.post/")
        assert blog_record['value']['$type'] == 'app.nbhd.blog.post'
        assert blog_record['value']['title'] == "My Blog Post"
        assert blog_record['value']['content'] == "# Hello\n\nFull content here."
        assert blog_record['value']['site_id'] == "site-123"

    @pytest.mark.asyncio
    async def test_create_bluesky_record(self):
        """Create BlueSky post record when publish_to_bluesky=True"""
        from bluesky import create_dual_records
        from unittest.mock import AsyncMock

        mock_table = AsyncMock()

        blog_post_data = {
            "title": "My Blog Post",
            "content": "# Hello\n\nFull content here.",
            "frontmatter": {"date": "2026-01-21T00:00:00Z", "excerpt": "Summary"},
            "site_id": "site-123"
        }

        user_did = "did:plc:abc123"

        # Create records
        records = await create_dual_records(
            mock_table,
            user_did,
            blog_post_data,
            "https://alice.nbhd.city/posts/my-blog-post",
            publish_to_bluesky=True
        )

        assert 'bluesky_post' in records
        bsky_record = records['bluesky_post']

        # Verify BlueSky record structure
        assert bsky_record['uri'].startswith(f"at://{user_did}/app.bsky.feed.post/")
        assert bsky_record['value']['$type'] == 'app.bsky.feed.post'
        assert 'text' in bsky_record['value']
        assert len(bsky_record['value']['text']) <= 300

    @pytest.mark.asyncio
    async def test_skip_bluesky_when_toggle_false(self):
        """Don't create BlueSky record when publish_to_bluesky=False"""
        from bluesky import create_dual_records
        from unittest.mock import AsyncMock

        mock_table = AsyncMock()

        blog_post_data = {
            "title": "My Blog Post",
            "content": "Content",
            "frontmatter": {},
            "site_id": "site-123"
        }

        user_did = "did:plc:abc123"

        records = await create_dual_records(
            mock_table,
            user_did,
            blog_post_data,
            "https://example.com/post",
            publish_to_bluesky=False
        )

        assert 'blog_post' in records
        assert 'bluesky_post' not in records

    @pytest.mark.asyncio
    async def test_records_are_linked(self):
        """Blog and BlueSky records are linked via linked_record"""
        from bluesky import create_dual_records
        from unittest.mock import AsyncMock

        mock_table = AsyncMock()

        blog_post_data = {
            "title": "Post",
            "content": "Content",
            "frontmatter": {},
            "site_id": "site-123"
        }

        user_did = "did:plc:abc123"

        records = await create_dual_records(
            mock_table,
            user_did,
            blog_post_data,
            "https://example.com/post",
            publish_to_bluesky=True
        )

        blog_record = records['blog_post']
        bsky_record = records['bluesky_post']

        # Blog record should have link to BlueSky post
        assert 'bluesky_post_uri' in blog_record
        assert blog_record['bluesky_post_uri'] == bsky_record['uri']

        # BlueSky record should have link to blog post
        assert 'linked_record' in bsky_record
        assert bsky_record['linked_record'] == blog_record['uri']

    @pytest.mark.asyncio
    async def test_records_saved_to_dynamodb(self):
        """Records are saved to DynamoDB"""
        from bluesky import create_dual_records
        from unittest.mock import AsyncMock, call

        mock_table = AsyncMock()

        blog_post_data = {
            "title": "Post",
            "content": "Content",
            "frontmatter": {},
            "site_id": "site-123"
        }

        user_did = "did:plc:abc123"

        await create_dual_records(
            mock_table,
            user_did,
            blog_post_data,
            "https://example.com/post",
            publish_to_bluesky=True
        )

        # Should have called put_item at least twice (blog + BlueSky)
        assert mock_table.put_item.call_count >= 2


# REQUIREMENT: [ ] Publish to BlueSky firehose (stub for now)
class TestBlueSkyPublishing:
    """Test BlueSky firehose publishing (MVP stub)."""

    @pytest.mark.asyncio
    async def test_publish_to_firehose_stub(self):
        """Stub: log firehose event (don't actually publish)"""
        from bluesky import publish_to_bluesky_firehose
        import logging

        user_did = "did:plc:abc123"
        record = {
            "uri": "at://did:plc:abc123/app.bsky.feed.post/xyz789",
            "value": {"$type": "app.bsky.feed.post", "text": "Test"}
        }

        # Should not raise error
        await publish_to_bluesky_firehose(user_did, record)

        # MVP: Just log the event (don't actually emit)


# REQUIREMENT: [ ] Handle publish toggle (optional BlueSky posting)
# ACCEPTANCE: [ ] Can create blog post without BlueSky posting
class TestPublishToggle:
    """Test optional BlueSky posting via toggle."""

    @pytest.mark.asyncio
    async def test_blog_post_without_bluesky(self):
        """Create blog post without BlueSky when toggle is off"""
        from bluesky import create_dual_records
        from unittest.mock import AsyncMock

        mock_table = AsyncMock()

        blog_post_data = {
            "title": "Solo Post",
            "content": "Just a blog post",
            "frontmatter": {},
            "site_id": "site-456"
        }

        user_did = "did:plc:user456"

        records = await create_dual_records(
            mock_table,
            user_did,
            blog_post_data,
            "https://example.com/solo-post",
            publish_to_bluesky=False
        )

        # Should have blog record
        assert 'blog_post' in records
        assert records['blog_post']['value']['title'] == "Solo Post"

        # Should NOT have BlueSky record
        assert 'bluesky_post' not in records

    @pytest.mark.asyncio
    async def test_blog_post_with_bluesky(self):
        """Create blog post with BlueSky when toggle is on"""
        from bluesky import create_dual_records
        from unittest.mock import AsyncMock

        mock_table = AsyncMock()

        blog_post_data = {
            "title": "Cross Posted",
            "content": "A blog post with BlueSky summary",
            "frontmatter": {"excerpt": "Summary for BlueSky"},
            "site_id": "site-789"
        }

        user_did = "did:plc:user789"

        records = await create_dual_records(
            mock_table,
            user_did,
            blog_post_data,
            "https://example.com/cross-posted",
            publish_to_bluesky=True
        )

        # Should have both records
        assert 'blog_post' in records
        assert 'bluesky_post' in records

        # BlueSky text should be in correct format
        bsky_text = records['bluesky_post']['value']['text']
        assert "Cross Posted" in bsky_text
        assert "https://example.com/cross-posted" in bsky_text


# Edge cases and validation
class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_very_long_title_truncation(self):
        """Handle very long post titles"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "A" * 200,
            "content": "Content",
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://example.com/post")

        assert len(summary['text']) <= 300

    def test_unicode_characters_in_summary(self):
        """Handle unicode characters (emoji, special chars)"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "Post with 🎉 emoji",
            "content": "Content with émojis and spëcial çhars",
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://example.com/post")

        assert len(summary['text']) <= 300
        assert "🎉" in summary['text']

    def test_empty_content_fallback(self):
        """Handle empty or minimal content"""
        from bluesky import generate_bluesky_summary

        blog_post = {
            "title": "Title Only",
            "content": "",
            "frontmatter": {}
        }

        summary = generate_bluesky_summary(blog_post, "https://example.com/post")

        # Should still have valid summary
        assert "Title Only" in summary['text']
        assert "https://example.com/post" in summary['text']

    def test_special_characters_in_url(self):
        """Handle URLs with special characters"""
        from bluesky import create_link_facets

        url = "https://example.com/posts/2026-01-21-special-chars-test?utm_source=blog"
        text = f"Check this: {url}"

        facets = create_link_facets(text, url)

        assert len(facets) > 0
        assert facets[0]['features'][0]['uri'] == url
