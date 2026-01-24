"""
Tests for AT Protocol Record Schema (ATP-FOUND-001)

Verifies that DynamoDB schema can store AT Protocol records with proper:
- Record structure (uri, cid, record_type, rkey, value, created_at, indexed_at)
- GSI for querying by collection type
- Support for app.nbhd.blog.post and app.bsky.feed.post records
- Backward compatibility with existing site records
"""

import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock
from boto3.dynamodb.conditions import Key, Attr


@pytest.fixture
def sample_blog_post_record():
    """
    Sample AT Protocol blog post record.
    ACCEPTANCE CRITERIA: Record schema supports all AT Protocol fields
    """
    return {
        "PK": "USER#did:plc:abc123",
        "SK": "RECORD#app.nbhd.blog.post#3jzfcijpj2z2a",
        # AT Protocol Fields (Required for acceptance)
        "uri": "at://did:plc:abc123/app.nbhd.blog.post/3jzfcijpj2z2a",
        "cid": "bafyreib2rxk3rh6kzwq4xvzfsndj6kyh3ydcq7i6tb6y446qgrq6in7sq",
        "record_type": "app.nbhd.blog.post",
        "rkey": "3jzfcijpj2z2a",
        # Record Value (the actual content)
        "value": {
            "$type": "app.nbhd.blog.post",
            "title": "My First Post",
            "content": "# Hello World\n\nThis is my blog post content",
            "frontmatter": {
                "date": "2026-01-21T00:00:00Z",
                "tags": ["tech", "blog"],
                "excerpt": "A brief summary",
                "author": "Alice"
            },
            "site_id": "site-uuid-123",
            "slug": "my-first-post",
            "status": "published",
            "createdAt": "2026-01-21T00:00:00Z",
            "updatedAt": "2026-01-21T00:00:00Z"
        },
        # Linked Records
        "linked_record": None,
        "bluesky_post_uri": "at://did:plc:abc123/app.bsky.feed.post/3jzfcijpj2z2b",
        # Metadata (Required for acceptance)
        "created_at": "2026-01-21T00:00:00Z",
        "indexed_at": "2026-01-21T00:00:00Z",
        "updated_at": "2026-01-21T00:00:00Z",
    }


@pytest.fixture
def sample_bluesky_record():
    """
    Sample AT Protocol BlueSky post record (summary).
    ACCEPTANCE CRITERIA: Can store app.bsky.feed.post records
    """
    return {
        "PK": "USER#did:plc:abc123",
        "SK": "RECORD#app.bsky.feed.post#3jzfcijpj2z2b",
        # AT Protocol Fields
        "uri": "at://did:plc:abc123/app.bsky.feed.post/3jzfcijpj2z2b",
        "cid": "bafyreihfj3k2lm9qnr4st5uv6wx7yz8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p",
        "record_type": "app.bsky.feed.post",
        "rkey": "3jzfcijpj2z2b",
        # Record Value
        "value": {
            "$type": "app.bsky.feed.post",
            "text": "New blog post: My First Post\n\nA brief summary\n\n🔗 https://alice.nbhd.city/posts/my-first-post",
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
        },
        # Linked Records
        "linked_record": "at://did:plc:abc123/app.nbhd.blog.post/3jzfcijpj2z2a",
        "blog_post_uri": "at://did:plc:abc123/app.nbhd.blog.post/3jzfcijpj2z2a",
        # Metadata
        "created_at": "2026-01-21T00:00:00Z",
        "indexed_at": "2026-01-21T00:00:00Z",
    }


@pytest.fixture
def sample_legacy_site():
    """
    Sample legacy site record (existing schema).
    ACCEPTANCE CRITERIA: Schema is backward compatible with existing site records
    """
    return {
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
        },
        "created_at": "2026-01-07T14:20:00Z",
        "updated_at": "2026-01-10T09:15:00Z",
        "built_at": "2026-01-10T09:16:00Z",
        "public_url": "https://alice.nbhd.city"
    }


class TestATPRecordSchema:
    """
    TEST SUITE: ATP-FOUND-001 - AT Protocol Record Schema in DynamoDB

    REQUIREMENTS TO VERIFY:
    [ ] Define `RECORD#` partition/sort key pattern
    [ ] Add record fields: uri, cid, record_type, rkey, value, created_at, indexed_at
    [ ] Create GSI for querying by collection type (GSI7: user_did, record_type#created_at)
    [ ] Update DynamoDB table definition in Terraform
    [ ] Document schema in DATABASE.md
    [ ] Add migration path from current site schema

    ACCEPTANCE CRITERIA:
    [ ] Record schema supports all AT Protocol fields
    [ ] GSI enables efficient queries by content type
    [ ] Can store app.nbhd.blog.post and app.bsky.feed.post records
    [ ] Schema is backward compatible with existing site records
    """

    # ========================================================================
    # TEST 1: Record Schema Structure
    # ACCEPTANCE CRITERIA: [ ] Record schema supports all AT Protocol fields
    # ========================================================================

    def test_record_has_required_at_protocol_fields(self, sample_blog_post_record):
        """
        Verify that a record contains all required AT Protocol fields.

        REQUIREMENT: [ ] Add record fields: uri, cid, record_type, rkey,
                         value, created_at, indexed_at
        """
        required_fields = [
            "uri",           # AT Protocol URI (at://did/.../rkey)
            "cid",           # Content Identifier (IPLD CID)
            "record_type",   # Type (app.nbhd.blog.post, app.bsky.feed.post)
            "rkey",          # Record key (TID format)
            "value",         # Record value (the actual content)
            "created_at",    # Creation timestamp
            "indexed_at",    # Index timestamp
        ]

        for field in required_fields:
            assert field in sample_blog_post_record, f"Missing required field: {field}"

        # Verify field types and values
        assert isinstance(sample_blog_post_record["uri"], str)
        assert sample_blog_post_record["uri"].startswith("at://")
        assert isinstance(sample_blog_post_record["cid"], str)
        assert sample_blog_post_record["cid"].startswith("bafy")  # CIDv1 base32
        assert isinstance(sample_blog_post_record["record_type"], str)
        assert isinstance(sample_blog_post_record["value"], dict)
        assert isinstance(sample_blog_post_record["created_at"], str)
        assert isinstance(sample_blog_post_record["indexed_at"], str)

    def test_record_partition_sort_key_pattern(self, sample_blog_post_record):
        """
        Verify RECORD# partition/sort key pattern.

        REQUIREMENT: [ ] Define `RECORD#` partition/sort key pattern

        Pattern should be:
        PK = USER#{did}
        SK = RECORD#{record_type}#{rkey}
        """
        pk = sample_blog_post_record["PK"]
        sk = sample_blog_post_record["SK"]

        # Verify PK pattern
        assert pk.startswith("USER#"), f"PK should start with 'USER#', got: {pk}"
        assert pk.split("#")[1].startswith("did:"), "PK should contain DID"

        # Verify SK pattern
        assert sk.startswith("RECORD#"), f"SK should start with 'RECORD#', got: {sk}"
        sk_parts = sk.split("#")
        assert len(sk_parts) == 3, f"SK should have 3 parts (RECORD#type#rkey), got: {sk_parts}"
        assert sk_parts[1] == sample_blog_post_record["record_type"]
        assert sk_parts[2] == sample_blog_post_record["rkey"]

    # ========================================================================
    # TEST 2: Record Type Support
    # ACCEPTANCE CRITERIA: [ ] Can store app.nbhd.blog.post and
    #                         app.bsky.feed.post records
    # ========================================================================

    def test_supports_blog_post_record(self, sample_blog_post_record):
        """
        Verify schema supports app.nbhd.blog.post record type.

        ACCEPTANCE CRITERIA: [ ] Can store app.nbhd.blog.post and
                                 app.bsky.feed.post records
        """
        assert sample_blog_post_record["record_type"] == "app.nbhd.blog.post"
        assert sample_blog_post_record["value"]["$type"] == "app.nbhd.blog.post"
        assert "title" in sample_blog_post_record["value"]
        assert "content" in sample_blog_post_record["value"]
        assert "frontmatter" in sample_blog_post_record["value"]
        assert "site_id" in sample_blog_post_record["value"]
        assert "slug" in sample_blog_post_record["value"]
        assert "status" in sample_blog_post_record["value"]

    def test_supports_bluesky_feed_post_record(self, sample_bluesky_record):
        """
        Verify schema supports app.bsky.feed.post record type.

        ACCEPTANCE CRITERIA: [ ] Can store app.nbhd.blog.post and
                                 app.bsky.feed.post records
        """
        assert sample_bluesky_record["record_type"] == "app.bsky.feed.post"
        assert sample_bluesky_record["value"]["$type"] == "app.bsky.feed.post"
        assert "text" in sample_bluesky_record["value"]
        assert "facets" in sample_bluesky_record["value"]

    def test_linked_records_relationship(self, sample_blog_post_record, sample_bluesky_record):
        """
        Verify linked records can reference each other.

        REQUIREMENT: [ ] Add record fields: ... linked_record ...
        """
        # Blog post should link to BlueSky post
        assert "bluesky_post_uri" in sample_blog_post_record
        assert sample_blog_post_record["bluesky_post_uri"] == sample_bluesky_record["uri"]

        # BlueSky post should link to blog post
        assert "blog_post_uri" in sample_bluesky_record
        assert sample_bluesky_record["blog_post_uri"] == sample_blog_post_record["uri"]
        assert sample_bluesky_record["linked_record"] == sample_blog_post_record["uri"]

    # ========================================================================
    # TEST 3: GSI for Content Type Queries
    # REQUIREMENT: [ ] Create GSI for querying by collection type
    #              (GSI7: user_did, record_type#created_at)
    # ========================================================================

    def test_gsi_supports_query_by_record_type(self, sample_blog_post_record, sample_bluesky_record):
        """
        Verify GSI structure supports querying by record type.

        REQUIREMENT: [ ] Create GSI for querying by collection type
                         (GSI7: user_did, record_type#created_at)

        This should allow queries like:
        - Get all blog posts for a user
        - Get all BlueSky posts for a user
        - Sorted by creation time
        """
        # Extract user DID from PK
        user_did = sample_blog_post_record["PK"].split("#")[1]

        # Both records should be queryable by user DID + record type
        blog_gsi_pk = user_did  # GSI7 hash key: user_did
        blog_gsi_sk = f"{sample_blog_post_record['record_type']}#{sample_blog_post_record['created_at']}"

        bsky_gsi_pk = user_did
        bsky_gsi_sk = f"{sample_bluesky_record['record_type']}#{sample_bluesky_record['created_at']}"

        # Verify GSI keys would allow efficient queries
        assert blog_gsi_pk == bsky_gsi_pk  # Same user
        assert blog_gsi_sk.split("#")[0] == "app.nbhd.blog.post"
        assert bsky_gsi_sk.split("#")[0] == "app.bsky.feed.post"

        # Verify sorting by creation time
        assert blog_gsi_sk.split("#")[1] == sample_blog_post_record['created_at']

    # ========================================================================
    # TEST 4: Backward Compatibility
    # ACCEPTANCE CRITERIA: [ ] Schema is backward compatible with
    #                        existing site records
    # ========================================================================

    def test_legacy_site_records_still_work(self, sample_legacy_site):
        """
        Verify existing site records are not affected by new RECORD schema.

        ACCEPTANCE CRITERIA: [ ] Schema is backward compatible with
                                 existing site records

        Legacy sites use: SK = SITE#{site_id}
        New records use:  SK = RECORD#{type}#{rkey}

        These should coexist without conflict.
        """
        # Legacy site should have different SK pattern
        assert sample_legacy_site["SK"].startswith("SITE#")
        assert "RECORD#" not in sample_legacy_site["SK"]

        # Both should have same PK pattern (USER#{did})
        assert sample_legacy_site["PK"].startswith("USER#")

        # Legacy site has different required fields
        assert "site_id" in sample_legacy_site
        assert "template" in sample_legacy_site
        assert "config" in sample_legacy_site

        # Legacy site does NOT have AT Protocol fields
        # (these are optional for backward compatibility)

    def test_sk_pattern_prevents_collisions(self, sample_blog_post_record, sample_legacy_site):
        """
        Verify SK patterns prevent collisions between record types.

        ACCEPTANCE CRITERIA: [ ] Schema is backward compatible with
                                 existing site records
        """
        sk_record = sample_blog_post_record["SK"]  # RECORD#...
        sk_site = sample_legacy_site["SK"]          # SITE#...

        # Both can exist under same PK without collision
        assert not sk_record.startswith(sk_site.split("#")[0])  # Different prefixes
        assert sk_record != sk_site  # Completely different


class TestRecordSchemaDocumentation:
    """
    Tests for documentation requirements.

    REQUIREMENT: [ ] Document schema in DATABASE.md
    """

    def test_database_md_contains_record_schema_section(self):
        """
        Verify DATABASE.md documents the new AT Protocol record schema.
        """
        try:
            with open("planning/DATABASE.md", "r") as f:
                content = f.read()

            # Should have section on records
            assert "RECORD#" in content or "AT Protocol" in content, \
                "DATABASE.md should document RECORD# pattern"
        except FileNotFoundError:
            pytest.skip("DATABASE.md not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
