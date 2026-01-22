# Content Prefilling Specification

**Status:** Phase 2c - Design
**Last Updated:** 2026-01-21

---

## Overview

Content prefilling automatically maps user profile data and previous site content to new template fields, saving users time when creating or switching sites. Instead of re-entering their name, bio, avatar, and other common fields, the system suggests smart mappings with a preview before applying.

**Philosophy:** Respect user time—prefill intelligently, but always let users review and approve.

---

## User Workflow

```
User selects template for new site
       ↓
System analyzes template schema
       ↓
┌─────────────────────────────────┐
│ Scan user's profile data        │
│ - BlueSky profile (name, bio)   │
│ - Previous site configs          │
│ - Neighborhood membership info   │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Match profile fields to          │
│ template fields                  │
│ - display_name → author          │
│ - bio → about                    │
│ - avatar → author_avatar         │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Show preview to user             │
│                                  │
│ Template Field  ← Value  Source │
│ author          ← Alice  Profile│
│ about           ← ...    Profile│
│ author_avatar   ← img    Profile│
└──────────┬──────────────────────┘
           │
      User chooses:
           │
    ┌──────┴──────┐
    │             │
 Apply         Start
 Prefill       Fresh
    │             │
    ↓             ↓
Fields      Empty
filled      form
```

---

## Field Mapping Rules

### Standard Mappings

```python
FIELD_MAPPINGS = {
    # Profile field → Template field aliases
    "display_name": ["author", "name", "author_name", "by", "written_by"],
    "bio": ["about", "description", "bio", "author_bio", "author_description"],
    "avatar": ["avatar", "author_avatar", "profile_image", "photo", "headshot"],
    "handle": ["twitter", "social_handle", "username", "handle", "social"],
    "location": ["location", "city", "hometown", "based_in"],
    "email": ["email", "contact_email", "author_email"],
}
```

### Mapping Algorithm

```python
class ContentPrefiller:
    """
    Maps user data to template fields using fuzzy matching.
    """

    FIELD_MAPPINGS = {
        "display_name": ["author", "name", "author_name", "by"],
        "bio": ["about", "description", "bio", "author_bio"],
        "avatar": ["avatar", "author_avatar", "profile_image"],
        "handle": ["twitter", "social_handle", "username"],
        "location": ["location", "city"],
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
                        "confidence": 1.0
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
        sites = await list_user_sites(table, user_did)

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
                    "confidence": 1.0
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
        site = await get_site(table, user_did, site_id)
        template = await get_template(site['template_id'])

        # Get user profile
        profile = await get_user_profile(table, user_did)

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
```

---

## API Endpoint

### GET /api/sites/{site_id}/prefill

**Purpose:** Get prefill suggestions for a site

**Response:**
```json
{
  "suggestions": [
    {
      "field": "author",
      "value": "Alice",
      "source": "profile",
      "confidence": 1.0
    },
    {
      "field": "about",
      "value": "Software engineer and community organizer",
      "source": "profile",
      "confidence": 1.0
    },
    {
      "field": "author_avatar",
      "value": "https://cdn.bsky.app/img/avatar/...",
      "source": "profile",
      "confidence": 1.0
    },
    {
      "field": "accent_color",
      "value": "#007bff",
      "source": "previous_site",
      "confidence": 0.8
    }
  ],
  "template_id": "template-uuid-123",
  "template_name": "Blog Template"
}
```

**Implementation:**
```python
@router.get("/api/sites/{site_id}/prefill")
async def get_prefill_suggestions(
    site_id: str,
    user_did: str = Depends(get_current_user)
):
    """Get prefill suggestions for site config."""

    prefiller = ContentPrefiller()
    suggestions = await prefiller.get_prefill_suggestions(user_did, site_id)

    site = await get_site(table, user_did, site_id)
    template = await get_template(site['template_id'])

    return {
        "suggestions": suggestions,
        "template_id": template['template_id'],
        "template_name": template['name']
    }
```

---

## UI Component: PrefillPreview

```jsx
function PrefillPreview({ siteId, onApply, onCancel }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrefillSuggestions();
  }, [siteId]);

  const fetchPrefillSuggestions = async () => {
    const response = await api.get(`/api/sites/${siteId}/prefill`);
    setSuggestions(response.suggestions);
    setLoading(false);
  };

  const handleApply = () => {
    // Build config object from suggestions
    const config = {};
    suggestions.forEach(s => {
      config[s.field] = s.value;
    });

    onApply(config);
  };

  if (loading) {
    return <div>Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="prefill-empty">
        <p>No prefill suggestions available.</p>
        <button onClick={onCancel}>Continue with empty form</button>
      </div>
    );
  }

  return (
    <div className="prefill-preview">
      <h3>Prefill Content from Your Profile?</h3>
      <p>We found {suggestions.length} fields we can fill in for you.</p>

      <table>
        <thead>
          <tr>
            <th>Template Field</th>
            <th>Will be filled with</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map(s => (
            <tr key={s.field}>
              <td><code>{s.field}</code></td>
              <td className="value-preview">
                {s.value.length > 50
                  ? s.value.slice(0, 50) + '...'
                  : s.value
                }
              </td>
              <td>
                <span className={`source-badge source-${s.source}`}>
                  {s.source === 'profile' ? '👤 Profile' : '📄 Previous Site'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="actions">
        <button
          className="btn-primary"
          onClick={handleApply}
        >
          Apply Prefill
        </button>
        <button
          className="btn-secondary"
          onClick={onCancel}
        >
          Start Fresh
        </button>
      </div>

      <p className="note">
        You can always edit these values after applying.
      </p>
    </div>
  );
}
```

### Integration with SiteConfigForm

```jsx
function SiteConfigForm({ siteId, templateId }) {
  const [config, setConfig] = useState({});
  const [showPrefillPreview, setShowPrefillPreview] = useState(true);

  const handlePrefillApply = (prefilledConfig) => {
    setConfig(prefilledConfig);
    setShowPrefillPreview(false);
    toast.success('Prefilled fields from your profile!');
  };

  const handlePrefillCancel = () => {
    setShowPrefillPreview(false);
  };

  if (showPrefillPreview) {
    return (
      <PrefillPreview
        siteId={siteId}
        onApply={handlePrefillApply}
        onCancel={handlePrefillCancel}
      />
    );
  }

  return (
    <div className="site-config-form">
      {/* Render dynamic form with config values */}
      <DynamicForm
        schema={templateSchema}
        values={config}
        onChange={setConfig}
      />
    </div>
  );
}
```

---

## Advanced Mapping: Fuzzy Matching

For fields that don't have exact matches, use fuzzy string matching:

```python
from difflib import SequenceMatcher

def fuzzy_match_field(profile_field: str, template_fields: List[str], threshold=0.6) -> Optional[str]:
    """
    Find best matching template field using fuzzy string matching.

    Args:
        profile_field: Source field name (e.g., "display_name")
        template_fields: List of template field names
        threshold: Minimum similarity score (0.0 to 1.0)

    Returns:
        Best matching template field or None
    """
    best_match = None
    best_score = 0

    for template_field in template_fields:
        score = SequenceMatcher(None, profile_field, template_field).ratio()

        if score > best_score and score >= threshold:
            best_score = score
            best_match = template_field

    return best_match

# Example usage:
profile_field = "display_name"
template_fields = ["author_full_name", "site_author", "byline"]

match = fuzzy_match_field(profile_field, template_fields)
# Returns: "author_full_name" (closest match)
```

---

## Data Sources

### 1. BlueSky Profile

```python
{
    "did": "did:plc:abc123",
    "handle": "alice.bsky.social",
    "display_name": "Alice",
    "bio": "Software engineer and community organizer",
    "avatar": "https://cdn.bsky.app/img/avatar/...",
    "location": "San Francisco",
    "followersCount": 500,
    "followsCount": 300
}
```

### 2. Previous Site Configs

```python
{
    "site_id": "site-uuid-456",
    "template": "blog",
    "config": {
        "author": "Alice",
        "about": "Welcome to my blog!",
        "accent_color": "#007bff",
        "footer_text": "© 2026 Alice",
        "social_links": [...]
    }
}
```

### 3. Neighborhood Membership (Future)

```python
{
    "neighborhood_name": "Tech Community",
    "role": "member",
    "joined_at": "2026-01-01"
}

# Could prefill:
# - "community" → "Tech Community"
# - "affiliated_with" → "Tech Community"
```

---

## Confidence Scoring

Assign confidence scores to prefill suggestions:

- **1.0:** Exact field name match (e.g., `author` → `author`)
- **0.9:** Direct mapping (e.g., `display_name` → `author`)
- **0.8:** Fuzzy match (e.g., `display_name` → `author_name`)
- **0.7:** Previous site data
- **0.5:** Inferred data (e.g., first name from full name)

Only show suggestions with confidence >= 0.7.

```python
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
```

---

## Edge Cases

### 1. No Profile Data

User has minimal profile (no bio, location, etc.)

**Solution:** Fall back to previous site data only

### 2. No Previous Sites

User is creating their first site

**Solution:** Only show profile-based suggestions

### 3. Field Type Mismatch

Profile has string, template expects array

**Solution:** Don't suggest mismatched types

```python
if template_field_type == "array" and not isinstance(profile_value, list):
    continue  # Skip suggestion
```

### 4. Multiple Previous Sites

User has 5 sites with different configs

**Solution:** Use most recent site, or site with same template type

```python
# Prefer site with same template
same_template_sites = [s for s in sites if s['template'] == new_template_type]

if same_template_sites:
    last_site = same_template_sites[0]
else:
    last_site = sites[0]  # Most recent
```

---

## Testing Strategy

**Unit Tests:**
```python
def test_prefill_from_profile():
    profile = {
        "display_name": "Alice",
        "bio": "Software engineer",
        "avatar": "https://example.com/avatar.jpg"
    }

    schema = {
        "properties": {
            "author": {"type": "string"},
            "about": {"type": "string"},
            "author_avatar": {"type": "string"}
        }
    }

    prefiller = ContentPrefiller()
    result = await prefiller.prefill_from_profile(profile, schema)

    assert result["author"]["value"] == "Alice"
    assert result["about"]["value"] == "Software engineer"
    assert result["author_avatar"]["value"] == "https://example.com/avatar.jpg"

def test_fuzzy_match_field():
    profile_field = "display_name"
    template_fields = ["author_full_name", "byline", "random_field"]

    match = fuzzy_match_field(profile_field, template_fields, threshold=0.5)

    assert match == "author_full_name"  # Best match

def test_no_suggestions_if_type_mismatch():
    profile = {"tags": "tech"}  # String
    schema = {
        "properties": {
            "tags": {"type": "array"}  # Expects array
        }
    }

    result = await ContentPrefiller().prefill_from_profile(profile, schema)

    assert "tags" not in result  # Skip due to type mismatch
```

**Integration Tests:**
```python
async def test_prefill_endpoint():
    # Create user with profile
    user_did = "did:plc:test123"
    await create_user_profile(user_did, {
        "display_name": "Test User",
        "bio": "Test bio"
    })

    # Create site
    site_id = await create_site(user_did, template_id="blog")

    # Get prefill suggestions
    response = await client.get(f"/api/sites/{site_id}/prefill")

    assert response.status_code == 200
    data = response.json()

    assert len(data["suggestions"]) > 0
    assert data["suggestions"][0]["field"] == "author"
    assert data["suggestions"][0]["value"] == "Test User"
    assert data["suggestions"][0]["source"] == "profile"
```

---

## Performance Optimization

1. **Cache Profile Data:** Store in-memory for session
2. **Lazy Load Suggestions:** Only fetch when user reaches config step
3. **Batch Queries:** Fetch profile + previous sites in one round-trip
4. **Debounce:** If user selects template, wait 500ms before fetching suggestions

---

## Future Enhancements

1. **AI-Powered Suggestions:** Use LLM to infer mappings for unusual field names
2. **Selective Prefill:** Let user check/uncheck individual suggestions
3. **Template Recommendations:** Suggest templates based on profile/content type
4. **Content Import:** Import blog posts from Medium, Substack, etc.
5. **Collaborative Prefill:** For group sites, aggregate member data
6. **Smart Defaults:** Learn user preferences over time
