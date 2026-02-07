"""
Content Prefilling Module (SSG-014)

Smart content prefilling automatically maps user profile data and previous site
content to new template fields, saving users time when creating or switching sites.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


class ContentPrefiller:
    """
    Maps user data to template fields using intelligent matching.
    """

    FIELD_MAPPINGS = {
        "display_name": ["author", "name", "author_name", "by", "written_by"],
        "bio": ["about", "description", "bio", "author_bio", "author_description"],
        "avatar": ["avatar", "author_avatar", "profile_image", "photo", "headshot"],
        "handle": ["twitter", "social_handle", "username", "handle", "social"],
        "location": ["location", "city", "hometown", "based_in"],
        "email": ["email", "contact_email", "author_email"],
    }

    async def prefill_from_profile(
        self,
        user_profile: Dict,
        template_schema: Dict
    ) -> Dict[str, Any]:
        """
        Generate prefilled values based on user profile.

        Args:
            user_profile: BlueSky profile data
            template_schema: JSON schema from template

        Returns:
            {
                "field_name": {
                    "value": "...",
                    "source": "profile",
                    "confidence": 1.0
                }
            }
        """
        prefilled = {}
        template_fields = template_schema.get("properties", {})

        for profile_field, template_aliases in self.FIELD_MAPPINGS.items():
            profile_value = user_profile.get(profile_field)

            if not profile_value:
                continue

            # Find matching template field
            for alias in template_aliases:
                if alias in template_fields:
                    prefilled[alias] = {
                        "value": profile_value,
                        "source": "profile",
                        "confidence": 0.9
                    }
                    break

        return prefilled

    async def prefill_from_previous_sites(
        self,
        user_did: str,
        new_template_schema: Dict
    ) -> Dict[str, Any]:
        """
        Use content from user's previous sites to prefill.

        Useful when user switches templates or creates similar sites.
        """
        # Get user's other sites
        sites = await list_user_sites(user_did)

        if not sites:
            return {}

        # Use most recent site's config
        last_site = sites[0]
        last_config = last_site.get('config', {})

        prefilled = {}
        new_fields = new_template_schema.get("properties", {})

        # Direct field name matches
        for field, value in last_config.items():
            if field in new_fields:
                prefilled[field] = {
                    "value": value,
                    "source": "previous_site",
                    "confidence": 0.7
                }

        return prefilled

    async def get_prefill_suggestions(
        self,
        user_did: str,
        site_id: str
    ) -> List[Dict]:
        """
        Combine all prefill sources and return suggestions.

        Returns:
        [
            {
                "field": "author",
                "value": "Alice",
                "source": "profile",
                "confidence": 1.0
            },
            ...
        ]
        """
        # Get site and template
        site = await get_site(user_did, site_id)
        template = await get_template(site['template_id'])

        # Get user profile
        profile = await get_user_profile(user_did)

        # Handle missing profile
        if not profile:
            profile = {}

        # Get prefill mappings from different sources
        profile_mappings = await self.prefill_from_profile(
            profile,
            template['schema']
        )

        previous_site_mappings = await self.prefill_from_previous_sites(
            user_did,
            template['schema']
        )

        # Merge (profile takes precedence over previous sites)
        combined = {**previous_site_mappings, **profile_mappings}

        # Convert to list format
        suggestions = [
            {
                "field": field,
                **mapping
            }
            for field, mapping in combined.items()
        ]

        return suggestions


def calculate_confidence(source: str, match_type: str) -> float:
    """Calculate confidence score for prefill suggestion."""

    if match_type == "exact":
        return 1.0
    elif match_type == "direct_mapping":
        return 0.9
    elif match_type == "fuzzy":
        return 0.8
    elif source == "previous_site":
        return 0.7
    else:
        return 0.5


# Placeholder functions that would interact with the database
# These should be imported from appropriate modules in production

async def list_user_sites(user_did: str) -> List[Dict]:
    """Get list of user's sites (sorted by most recent first)"""
    # This would query DynamoDB in production
    return []


async def get_site(user_did: str, site_id: str) -> Dict:
    """Get site details by site_id"""
    # This would query DynamoDB in production
    return {}


async def get_template(template_id: str) -> Dict:
    """Get template metadata and schema"""
    # This would query the templates API in production
    return {}


async def get_user_profile(user_did: str) -> Optional[Dict]:
    """Get user's profile data"""
    # This would query DynamoDB in production
    return None
