"""
Tests for NBHD-001: Nbhd DID & Data Model Enhancement.
"""
import pytest
from app.api.models import SiteCreate
from app.api.atproto.neighborhood_did import generate_neighborhood_did, is_valid_neighborhood_did


class TestNbhdDIDGeneration:
    """Test neighborhood DID generation."""

    def test_generate_neighborhood_did_format(self):
        """Generated DIDs should follow did:plc format."""
        did = generate_neighborhood_did()
        assert did.startswith('did:plc:')
        assert len(did) > 28  # did:plc: (8 chars) + 20+ char identifier

    def test_generate_neighborhood_did_unique(self):
        """Multiple calls should generate unique DIDs."""
        did1 = generate_neighborhood_did()
        did2 = generate_neighborhood_did()
        assert did1 != did2

    def test_is_valid_neighborhood_did_valid(self):
        """Validate valid DID format."""
        # Generate a real DID and validate it
        did = generate_neighborhood_did()
        assert is_valid_neighborhood_did(did) is True

    def test_is_valid_neighborhood_did_invalid(self):
        """Validate invalid DIDs are rejected."""
        assert is_valid_neighborhood_did('') is False
        assert is_valid_neighborhood_did('invalid') is False
        assert is_valid_neighborhood_did('did:plc:') is False
        assert is_valid_neighborhood_did('did:plc:abc') is False  # Too short
        assert is_valid_neighborhood_did('did:key:z6MkhaXgBZDvotKL5sKFgyXrSV9nYqV4KxQWq7CakqGc9tVk') is False  # Wrong type


class TestSiteTypeValidation:
    """Test site type validation in Pydantic models."""

    def test_personal_site_no_nbhd_id(self):
        """Personal sites should not require nbhd_id."""
        site = SiteCreate(
            title="My Blog",
            template="blog",
            site_type="personal"
        )
        assert site.nbhd_id is None
        assert site.site_type == "personal"

    def test_personal_site_rejects_nbhd_id(self):
        """Personal sites should reject nbhd_id if provided."""
        with pytest.raises(ValueError, match="not allowed for personal sites"):
            SiteCreate(
                title="My Blog",
                template="blog",
                site_type="personal",
                nbhd_id="nbhd123"
            )

    def test_project_site_requires_nbhd_id(self):
        """Project sites should require nbhd_id."""
        with pytest.raises(ValueError, match="required for project sites"):
            SiteCreate(
                title="Project Site",
                template="blog",
                site_type="project"
            )

    def test_project_site_with_nbhd_id(self):
        """Project sites should accept nbhd_id."""
        site = SiteCreate(
            title="Project Site",
            template="blog",
            site_type="project",
            nbhd_id="nbhd123"
        )
        assert site.nbhd_id == "nbhd123"
        assert site.site_type == "project"

    def test_nbhd_site_requires_nbhd_id(self):
        """Nbhd sites should require nbhd_id."""
        with pytest.raises(ValueError, match="required for nbhd sites"):
            SiteCreate(
                title="Nbhd Site",
                template="blog",
                site_type="nbhd"
            )

    def test_nbhd_site_with_nbhd_id(self):
        """Nbhd sites should accept nbhd_id."""
        site = SiteCreate(
            title="Nbhd Site",
            template="blog",
            site_type="nbhd",
            nbhd_id="nbhd123"
        )
        assert site.nbhd_id == "nbhd123"
        assert site.site_type == "nbhd"

    def test_default_site_type_is_personal(self):
        """Default site_type should be personal."""
        site = SiteCreate(
            title="My Site",
            template="blog"
        )
        assert site.site_type == "personal"
        assert site.nbhd_id is None

    def test_site_create_with_config(self):
        """SiteCreate should accept config dict."""
        config = {"title_color": "blue", "sidebar": True}
        site = SiteCreate(
            title="My Site",
            template="blog",
            config=config
        )
        assert site.config == config

    def test_site_response_has_all_fields(self):
        """SiteResponse should include site_type, nbhd_id, and url fields."""
        from app.api.models import SiteResponse

        site = SiteResponse(
            site_id="site123",
            user_id="user123",
            title="My Blog",
            template="blog",
            status="draft",
            config={},
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
            site_type="personal",
            nbhd_id=None,
            url="https://site123.nbhd.city"
        )
        assert site.site_type == "personal"
        assert site.nbhd_id is None
        assert site.url == "https://site123.nbhd.city"

    def test_site_response_with_nbhd_site(self):
        """SiteResponse should properly handle nbhd sites."""
        from app.api.models import SiteResponse

        site = SiteResponse(
            site_id="site456",
            user_id="user123",
            title="Nbhd Page",
            template="blog",
            status="draft",
            config={},
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
            site_type="nbhd",
            nbhd_id="nbhd789",
            url="https://nbhd.city/neighborhoods/nbhd789/pages/"
        )
        assert site.site_type == "nbhd"
        assert site.nbhd_id == "nbhd789"
        assert "nbhd789" in site.url
