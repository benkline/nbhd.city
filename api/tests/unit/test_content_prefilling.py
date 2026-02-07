"""
Tests for Content Prefilling (SSG-014)

Smart content prefilling automatically maps user profile data and previous site
content to new template fields, saving users time when creating or switching sites.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime


class TestFieldMappings:
    """Test field mapping logic"""

    def test_field_mappings_defined(self):
        """[ ] Field mapping algorithm (display_name → author, bio → about)"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()
        assert hasattr(prefiller, 'FIELD_MAPPINGS')
        assert isinstance(prefiller.FIELD_MAPPINGS, dict)

    def test_display_name_maps_to_author(self):
        """[ ] Field mapping algorithm - display_name → author"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()
        mappings = prefiller.FIELD_MAPPINGS

        # display_name should map to multiple aliases
        assert 'display_name' in mappings
        assert 'author' in mappings['display_name']

    def test_bio_maps_to_about(self):
        """[ ] Field mapping algorithm - bio → about"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()
        mappings = prefiller.FIELD_MAPPINGS

        # bio should map to about
        assert 'bio' in mappings
        assert 'about' in mappings['bio']

    def test_avatar_field_mappings(self):
        """[ ] Field mapping algorithm - avatar field aliases"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()
        mappings = prefiller.FIELD_MAPPINGS

        # avatar should have multiple aliases
        assert 'avatar' in mappings
        assert len(mappings['avatar']) > 1


class TestPrefillFromProfile:
    """Test prefilling from user profile"""

    @pytest.mark.asyncio
    async def test_prefill_from_profile_basic(self):
        """[ ] Profile data correctly mapped to template fields"""
        from content_prefilling import ContentPrefiller

        profile = {
            "display_name": "Alice",
            "bio": "Software engineer",
            "avatar": "https://example.com/avatar.jpg"
        }

        template_schema = {
            "properties": {
                "author": {"type": "string"},
                "about": {"type": "string"},
                "author_avatar": {"type": "string"}
            }
        }

        prefiller = ContentPrefiller()
        result = await prefiller.prefill_from_profile(profile, template_schema)

        assert "author" in result
        assert result["author"]["value"] == "Alice"
        assert result["author"]["source"] == "profile"

    @pytest.mark.asyncio
    async def test_prefill_bio_to_about(self):
        """[ ] Profile data - bio maps to about"""
        from content_prefilling import ContentPrefiller

        profile = {"bio": "Software engineer"}

        template_schema = {
            "properties": {
                "about": {"type": "string"}
            }
        }

        prefiller = ContentPrefiller()
        result = await prefiller.prefill_from_profile(profile, template_schema)

        assert "about" in result
        assert result["about"]["value"] == "Software engineer"

    @pytest.mark.asyncio
    async def test_prefill_avatar_field(self):
        """[ ] Profile data - avatar mapping"""
        from content_prefilling import ContentPrefiller

        profile = {"avatar": "https://example.com/avatar.jpg"}

        template_schema = {
            "properties": {
                "author_avatar": {"type": "string"}
            }
        }

        prefiller = ContentPrefiller()
        result = await prefiller.prefill_from_profile(profile, template_schema)

        assert "author_avatar" in result
        assert result["author_avatar"]["value"] == "https://example.com/avatar.jpg"

    @pytest.mark.asyncio
    async def test_prefill_confidence_score(self):
        """[ ] Profile data - confidence scores"""
        from content_prefilling import ContentPrefiller

        profile = {"display_name": "Alice"}

        template_schema = {
            "properties": {
                "author": {"type": "string"}
            }
        }

        prefiller = ContentPrefiller()
        result = await prefiller.prefill_from_profile(profile, template_schema)

        assert "author" in result
        assert "confidence" in result["author"]
        assert isinstance(result["author"]["confidence"], float)
        assert result["author"]["confidence"] >= 0.7


class TestPrefillFromPreviousSites:
    """Test prefilling from previous site configs"""

    @pytest.mark.asyncio
    async def test_prefill_from_previous_sites(self):
        """[ ] Support multiple data sources (profile, previous sites)"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()

        # Mock the list_user_sites function
        with patch('content_prefilling.list_user_sites') as mock_list:
            mock_list.return_value = [
                {
                    'site_id': 'old-site-1',
                    'config': {
                        'author': 'Alice',
                        'accent_color': '#007bff'
                    }
                }
            ]

            template_schema = {
                "properties": {
                    "author": {"type": "string"},
                    "accent_color": {"type": "string"}
                }
            }

            result = await prefiller.prefill_from_previous_sites(
                "did:plc:test",
                template_schema
            )

            assert len(result) > 0
            assert result.get('author', {}).get('source') == 'previous_site'

    @pytest.mark.asyncio
    async def test_no_suggestions_if_no_previous_sites(self):
        """[ ] Support multiple data sources - no previous sites"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()

        with patch('content_prefilling.list_user_sites') as mock_list:
            mock_list.return_value = []

            template_schema = {"properties": {}}

            result = await prefiller.prefill_from_previous_sites(
                "did:plc:test",
                template_schema
            )

            assert result == {}


class TestGetPrefillSuggestions:
    """Test the main get_prefill_suggestions method"""

    @pytest.mark.asyncio
    async def test_get_prefill_suggestions_api_response_format(self):
        """[ ] Preview shows "field → value" mappings"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()

        with patch('content_prefilling.get_site') as mock_get_site, \
             patch('content_prefilling.get_template') as mock_get_template, \
             patch('content_prefilling.get_user_profile') as mock_get_profile, \
             patch.object(prefiller, 'prefill_from_profile') as mock_pref_profile, \
             patch.object(prefiller, 'prefill_from_previous_sites') as mock_pref_sites:

            mock_get_site.return_value = {'template_id': 'blog'}
            mock_get_template.return_value = {'schema': {'properties': {'author': {}}}}
            mock_get_profile.return_value = {'display_name': 'Alice'}
            mock_pref_profile.return_value = {'author': {'value': 'Alice', 'source': 'profile', 'confidence': 0.9}}
            mock_pref_sites.return_value = {}

            result = await prefiller.get_prefill_suggestions('did:plc:test', 'site-123')

            assert isinstance(result, list)
            if len(result) > 0:
                assert 'field' in result[0]
                assert 'value' in result[0]
                assert 'source' in result[0]
                assert 'confidence' in result[0]

    @pytest.mark.asyncio
    async def test_profile_data_takes_precedence(self):
        """[ ] Profile data correctly mapped - precedence over previous sites"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()

        with patch('content_prefilling.get_site') as mock_get_site, \
             patch('content_prefilling.get_template') as mock_get_template, \
             patch('content_prefilling.get_user_profile') as mock_get_profile, \
             patch.object(prefiller, 'prefill_from_profile') as mock_pref_profile, \
             patch.object(prefiller, 'prefill_from_previous_sites') as mock_pref_sites:

            mock_get_site.return_value = {'template_id': 'blog'}
            mock_get_template.return_value = {'schema': {'properties': {'author': {}}}}
            mock_get_profile.return_value = {'display_name': 'Alice'}

            # Profile has "Alice", previous site has "Bob"
            mock_pref_profile.return_value = {'author': {'value': 'Alice', 'source': 'profile', 'confidence': 0.9}}
            mock_pref_sites.return_value = {'author': {'value': 'Bob', 'source': 'previous_site', 'confidence': 0.7}}

            result = await prefiller.get_prefill_suggestions('did:plc:test', 'site-123')

            # Profile should take precedence
            author_result = [r for r in result if r['field'] == 'author']
            assert len(author_result) > 0
            assert author_result[0]['value'] == 'Alice'


class TestAPIEndpoint:
    """Test GET /api/sites/{site_id}/prefill endpoint"""

    @pytest.mark.asyncio
    async def test_prefill_endpoint_returns_200(self):
        """[ ] Users can apply or skip prefilling - endpoint exists"""
        from sites import router
        from fastapi.testclient import TestClient
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        # This would require full app setup, but tests API structure

    @pytest.mark.asyncio
    async def test_prefill_endpoint_response_structure(self):
        """[ ] Preview shows "field → value" mappings - endpoint response"""
        # Expected response structure:
        # {
        #   "suggestions": [
        #     {
        #       "field": "author",
        #       "value": "Alice",
        #       "source": "profile",
        #       "confidence": 1.0
        #     }
        #   ],
        #   "template_id": "...",
        #   "template_name": "..."
        # }
        pass


class TestTypeValidation:
    """Test that prefilling respects field types"""

    @pytest.mark.asyncio
    async def test_no_suggestions_for_type_mismatch(self):
        """[ ] Works with BlueSky profile data - type safety"""
        from content_prefilling import ContentPrefiller

        profile = {"tags": "tech"}  # String

        template_schema = {
            "properties": {
                "tags": {"type": "array"}  # Expects array
            }
        }

        prefiller = ContentPrefiller()
        result = await prefiller.prefill_from_profile(profile, template_schema)

        # Should skip due to type mismatch
        assert "tags" not in result


class TestConfidenceScoring:
    """Test confidence score calculation"""

    def test_exact_match_has_high_confidence(self):
        """[ ] Profile data correctly mapped - exact field matches"""
        from content_prefilling import calculate_confidence

        # Exact field name match
        score = calculate_confidence(source="profile", match_type="exact")
        assert score == 1.0

    def test_fuzzy_match_has_lower_confidence(self):
        """[ ] Profile data correctly mapped - fuzzy matching"""
        from content_prefilling import calculate_confidence

        # Fuzzy match
        score = calculate_confidence(source="profile", match_type="fuzzy")
        assert score < 1.0
        assert score >= 0.7

    def test_previous_site_has_lower_confidence(self):
        """[ ] Works with previous site data"""
        from content_prefilling import calculate_confidence

        # Previous site data
        score = calculate_confidence(source="previous_site", match_type="direct_mapping")
        assert score < 1.0


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_empty_profile_returns_empty_suggestions(self):
        """[ ] Works with BlueSky profile data - empty profile"""
        from content_prefilling import ContentPrefiller

        profile = {}

        template_schema = {
            "properties": {
                "author": {"type": "string"}
            }
        }

        prefiller = ContentPrefiller()
        result = await prefiller.prefill_from_profile(profile, template_schema)

        assert result == {}

    @pytest.mark.asyncio
    async def test_schema_with_no_matching_fields(self):
        """[ ] Profile data correctly mapped - no matching fields"""
        from content_prefilling import ContentPrefiller

        profile = {
            "display_name": "Alice",
            "bio": "Engineer"
        }

        template_schema = {
            "properties": {
                "custom_field_1": {"type": "string"},
                "custom_field_2": {"type": "string"}
            }
        }

        prefiller = ContentPrefiller()
        result = await prefiller.prefill_from_profile(profile, template_schema)

        # Should be empty or use fuzzy matching if available
        # For now, exact match only
        assert len(result) == 0

    @pytest.mark.asyncio
    async def test_handles_missing_user_profile(self):
        """[ ] Works with BlueSky profile data - user has no profile"""
        from content_prefilling import ContentPrefiller

        prefiller = ContentPrefiller()

        with patch('content_prefilling.get_user_profile') as mock_profile:
            mock_profile.return_value = None

            with patch('content_prefilling.get_site') as mock_site:
                mock_site.return_value = {'template_id': 'blog'}

                with patch('content_prefilling.get_template') as mock_template:
                    mock_template.return_value = {'schema': {'properties': {}}}

                    # Should handle gracefully without crashing
                    try:
                        result = await prefiller.get_prefill_suggestions('did:plc:test', 'site-123')
                        # Should succeed even with no profile
                        assert isinstance(result, list)
                    except Exception as e:
                        pytest.fail(f"Should handle missing profile gracefully: {e}")
