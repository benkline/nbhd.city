# Template Analysis System Specification

**Status:** Phase 2 - Design
**Last Updated:** 2026-01-21

---

## Overview

The Template Analysis System enables nbhd.city to automatically understand the structure and content requirements of 11ty starter projects from GitHub. This system clones templates, scans their markdown files, infers content schemas from frontmatter, and generates dynamic forms for content creation.

**Philosophy:** Templates are "apps" that read from the user's personal filesystem (AT Protocol PDS). The analyzer discovers what data format each app expects.

---

## Architecture

```
GitHub Template Repository
         ↓
   [Git Clone to /tmp]
         ↓
   [Template Validator]
    - Check eleventy.config.js
    - Verify package.json
         ↓
   [Frontmatter Scanner]
    - Find all .md files
    - Parse YAML frontmatter
    - Group by content type
         ↓
   [Schema Inference Engine]
    - Analyze field types
    - Detect required fields
    - Generate JSON Schema
         ↓
   [Store in DynamoDB]
    - Template metadata
    - Inferred schema
    - Content type definitions
```

---

## Components

### 1. Template Validator

**Purpose:** Verify a GitHub repository is a valid 11ty project

**Validation Checks:**
```python
def validate_eleventy_project(path: str) -> tuple[bool, Optional[str]]:
    """
    Returns: (is_valid, error_message)
    """
    # Check for 11ty config file
    if not (
        os.path.exists(f"{path}/eleventy.config.js") or
        os.path.exists(f"{path}/.eleventy.js")
    ):
        return False, "Missing eleventy.config.js or .eleventy.js"

    # Check package.json has @11ty/eleventy
    if not os.path.exists(f"{path}/package.json"):
        return False, "Missing package.json"

    with open(f"{path}/package.json") as f:
        package = json.load(f)
        deps = {**package.get("dependencies", {}), **package.get("devDependencies", {})}
        if "@11ty/eleventy" not in deps:
            return False, "@11ty/eleventy not found in dependencies"

    return True, None
```

**Detectable Template Features:**
- Input directory (default: current directory)
- Output directory (default: `_site/`)
- Template languages (Nunjucks, Liquid, Handlebars, etc.)
- Content directories (`content/`, `posts/`, `src/`, etc.)
- Data directories (`_data/`)
- Layout directories (`_includes/`)

---

### 2. Frontmatter Scanner

**Purpose:** Discover content types and their field structure by analyzing markdown files

**Algorithm:**
```python
def scan_frontmatter(content_dir: str) -> Dict[str, List[Dict]]:
    """
    Returns structure:
    {
        "posts": [
            {"title": "Post 1", "date": "2026-01-01", "tags": ["tech"]},
            {"title": "Post 2", "date": "2026-01-02", "tags": ["blog"]},
            ...
        ],
        "pages": [
            {"title": "About", "layout": "page"},
            ...
        ]
    }
    """
    import frontmatter
    import os
    from collections import defaultdict

    content_types = defaultdict(list)

    # Recursively find all .md files
    for root, dirs, files in os.walk(content_dir):
        for file in files:
            if not file.endswith('.md'):
                continue

            filepath = os.path.join(root, file)

            # Parse frontmatter
            with open(filepath, 'r', encoding='utf-8') as f:
                post = frontmatter.load(f)

                # Determine content type from directory structure
                rel_path = os.path.relpath(root, content_dir)
                content_type = rel_path.split(os.sep)[0] if rel_path != '.' else 'pages'

                # Store frontmatter
                content_types[content_type].append({
                    **post.metadata,
                    '_filepath': filepath,
                    '_content_preview': post.content[:200]
                })

    return dict(content_types)
```

**Content Type Detection:**
- Directory-based: `content/posts/*.md` → "posts"
- Directory-based: `content/pages/*.md` → "pages"
- Fallback: Root-level `.md` files → "pages"

---

### 3. Schema Inference Engine

**Purpose:** Generate JSON Schema from frontmatter samples

**Type Inference Rules:**
```python
def infer_field_type(values: List[Any]) -> Dict:
    """
    Infer JSON Schema type from sample values.

    Returns: {"type": "string", "format": "date-time", ...}
    """
    # Remove None values
    values = [v for v in values if v is not None]

    if not values:
        return {"type": "string"}  # Default

    # Check for ISO 8601 dates
    if all(isinstance(v, str) and is_iso_date(v) for v in values):
        return {"type": "string", "format": "date-time"}

    # Check for arrays
    if all(isinstance(v, list) for v in values):
        # Infer item type from first non-empty array
        for v in values:
            if v:
                item_type = type(v[0]).__name__
                return {
                    "type": "array",
                    "items": {"type": map_python_type_to_json(item_type)}
                }
        return {"type": "array"}

    # Check for booleans
    if all(isinstance(v, bool) for v in values):
        return {"type": "boolean"}

    # Check for numbers
    if all(isinstance(v, (int, float)) for v in values):
        return {"type": "number"}

    # Default: string
    return {"type": "string"}

def is_iso_date(value: str) -> bool:
    """Check if string matches ISO 8601 date format."""
    try:
        from datetime import datetime
        datetime.fromisoformat(value.replace('Z', '+00:00'))
        return True
    except:
        return False
```

**Required Field Detection:**
- A field is marked `required: true` if it appears in >80% of samples
- Edge case: If samples < 3, all fields are optional

**Schema Generation:**
```python
def generate_schema(frontmatter_samples: List[Dict]) -> Dict:
    """
    Generate JSON Schema from frontmatter samples.

    Example output:
    {
        "type": "object",
        "properties": {
            "title": {"type": "string", "title": "Title"},
            "date": {"type": "string", "format": "date-time", "title": "Date"},
            "tags": {"type": "array", "items": {"type": "string"}, "title": "Tags"}
        },
        "required": ["title", "date"]
    }
    """
    all_fields = defaultdict(list)
    total_samples = len(frontmatter_samples)

    # Collect all field values
    for sample in frontmatter_samples:
        for key, value in sample.items():
            if key.startswith('_'):  # Skip internal fields
                continue
            all_fields[key].append(value)

    # Build schema
    schema = {
        "type": "object",
        "properties": {},
        "required": []
    }

    for field_name, values in all_fields.items():
        # Infer type
        field_schema = infer_field_type(values)
        field_schema["title"] = field_name.replace('_', ' ').replace('-', ' ').title()

        schema["properties"][field_name] = field_schema

        # Mark as required if appears in >80% of samples
        occurrence_rate = len([v for v in values if v is not None]) / total_samples
        if occurrence_rate > 0.8:
            schema["required"].append(field_name)

    return schema
```

---

### 4. Template Registry (DynamoDB Schema)

```python
{
    "PK": "TEMPLATE#{template_id}",
    "SK": "METADATA",

    # Basic Info
    "template_id": "template-uuid-123",
    "name": "My Blog Template",
    "description": "A minimal blog template",
    "github_url": "https://github.com/user/11ty-blog",
    "github_commit_sha": "abc123def456",  # Pin to version

    # Ownership
    "is_custom": True,  # vs built-in templates
    "owner_did": "did:plc:abc123",
    "is_public": False,  # Private to owner or shared?

    # Analysis Results
    "status": "ready" | "analyzing" | "failed",
    "analyzed_at": "2026-01-21T00:00:00Z",
    "analysis_error": null,

    # Schema (inferred from frontmatter)
    "schema": {
        "type": "object",
        "properties": {...},
        "required": [...]
    },

    # Content Types (organized by directory)
    "content_types": {
        "posts": {
            "directory": "content/posts",
            "count": 5,  # Number of sample files
            "schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "date": {"type": "string", "format": "date-time"},
                    "tags": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["title", "date"]
            }
        },
        "pages": {
            "directory": "content/pages",
            "count": 2,
            "schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "layout": {"type": "string"}
                },
                "required": ["title"]
            }
        }
    },

    # Template Features
    "features": {
        "has_blog": True,
        "has_rss": True,
        "has_tags": True,
        "has_search": False,
        "template_engine": "nunjucks"
    },

    # Preview
    "preview_url": "https://s3.../preview.png",
    "tags": ["blog", "minimal", "markdown"],

    # Metadata
    "created_at": "2026-01-21T00:00:00Z",
    "updated_at": "2026-01-21T00:00:00Z"
}
```

---

## API Endpoints

### POST /api/templates/custom
**Purpose:** Register a custom 11ty template from GitHub

**Request:**
```json
{
  "name": "My Blog Template",
  "github_url": "https://github.com/user/11ty-blog",
  "is_public": false
}
```

**Response (202 Accepted):**
```json
{
  "template_id": "template-uuid-123",
  "status": "analyzing",
  "message": "Template analysis started",
  "poll_url": "/api/templates/custom/template-uuid-123/status"
}
```

**Validation:**
- GitHub URL format (https://github.com/user/repo or git@github.com:user/repo.git)
- Allowed domains: github.com, gitlab.com, bitbucket.org
- Not already registered (check by github_url)

**Process:**
1. Validate URL format
2. Check if already registered
3. Create template record (status: "analyzing")
4. Invoke analyzer Lambda async
5. Return template_id for polling

---

### GET /api/templates/custom/{template_id}/status
**Purpose:** Check analysis status

**Response (In Progress):**
```json
{
  "template_id": "template-uuid-123",
  "status": "analyzing",
  "progress": 0.5,
  "message": "Scanning frontmatter in content/posts"
}
```

**Response (Complete):**
```json
{
  "template_id": "template-uuid-123",
  "status": "ready",
  "schema": {...},
  "content_types": {...}
}
```

**Response (Failed):**
```json
{
  "template_id": "template-uuid-123",
  "status": "failed",
  "error": "Not a valid 11ty project: missing eleventy.config.js"
}
```

---

### GET /api/templates/{template_id}/content-types
**Purpose:** Get inferred content types and their schemas

**Response:**
```json
{
  "template_id": "template-uuid-123",
  "content_types": {
    "posts": {
      "directory": "content/posts",
      "schema": {...},
      "example_fields": {
        "title": "My First Post",
        "date": "2026-01-01T00:00:00Z",
        "tags": ["tech", "blog"]
      }
    },
    "pages": {
      "directory": "content/pages",
      "schema": {...},
      "example_fields": {
        "title": "About",
        "layout": "page"
      }
    }
  }
}
```

---

## Lambda Function: Template Analyzer

**Location:** `/lambda/template_analyzer/handler.py`

**Runtime:** Python 3.11
**Timeout:** 5 minutes
**Memory:** 512 MB

**Event Schema:**
```json
{
  "template_id": "template-uuid-123",
  "github_url": "https://github.com/user/11ty-blog"
}
```

**Handler Logic:**
```python
async def handler(event, context):
    template_id = event['template_id']
    github_url = event['github_url']

    build_dir = f"/tmp/{uuid.uuid4()}"

    try:
        # Update status
        await update_template_status(template_id, "analyzing", progress=0.1)

        # 1. Clone repo
        await clone_template(github_url, build_dir)
        await update_template_status(template_id, "analyzing", progress=0.3)

        # 2. Validate 11ty project
        is_valid, error = validate_eleventy_project(build_dir)
        if not is_valid:
            await update_template_status(template_id, "failed", error=error)
            return {"status": "failed", "error": error}

        await update_template_status(template_id, "analyzing", progress=0.5)

        # 3. Find content directory
        content_dir = find_content_directory(build_dir)

        # 4. Scan frontmatter
        content_types = scan_frontmatter(content_dir)
        await update_template_status(template_id, "analyzing", progress=0.7)

        # 5. Generate schemas
        schemas = {}
        for content_type, samples in content_types.items():
            schemas[content_type] = {
                "directory": ...,
                "schema": generate_schema(samples),
                "count": len(samples)
            }

        # 6. Get commit SHA
        commit_sha = get_commit_sha(build_dir)

        # 7. Update template record
        await update_template_record(template_id, {
            "status": "ready",
            "analyzed_at": datetime.utcnow().isoformat() + "Z",
            "github_commit_sha": commit_sha,
            "content_types": schemas
        })

        # 8. Cleanup
        subprocess.run(['rm', '-rf', build_dir])

        return {"status": "success"}

    except Exception as e:
        await update_template_status(template_id, "failed", error=str(e))
        raise
```

---

## Error Handling

**Common Errors:**
1. **GitHub repo not found** (404)
   - Response: "Repository not found or not accessible"

2. **Not an 11ty project**
   - Response: "Not a valid 11ty project: missing eleventy.config.js"

3. **No content files found**
   - Response: "No markdown files found in template"

4. **Clone timeout**
   - Response: "Template clone timed out (repo too large?)"

5. **Invalid frontmatter**
   - Response: "Failed to parse frontmatter in {file}: {error}"

---

## Security Considerations

1. **Malicious Repos:**
   - Run clone in isolated Lambda (no network access after clone)
   - Timeout aggressively (5 min max)
   - Don't execute any code from template (just read files)

2. **Rate Limiting:**
   - Max 10 template registrations per user per day
   - Max 3 concurrent analyses per user

3. **URL Validation:**
   - Whitelist: github.com, gitlab.com, bitbucket.org
   - Block: localhost, internal IPs, file:// URLs

4. **Resource Limits:**
   - Max repo size: 100 MB (use shallow clone)
   - Max files scanned: 1000 markdown files
   - Max frontmatter size: 10 KB per file

---

## Testing Strategy

**Unit Tests:**
```python
def test_validate_eleventy_project():
    # Valid project
    assert validate_eleventy_project("/path/to/valid/11ty") == (True, None)

    # Missing config
    assert validate_eleventy_project("/path/to/invalid") == (False, "Missing eleventy.config.js")

def test_infer_field_type():
    # String
    assert infer_field_type(["a", "b", "c"]) == {"type": "string"}

    # Date
    assert infer_field_type(["2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z"]) == {
        "type": "string",
        "format": "date-time"
    }

    # Array
    assert infer_field_type([["a", "b"], ["c"]]) == {
        "type": "array",
        "items": {"type": "string"}
    }

def test_generate_schema():
    samples = [
        {"title": "Post 1", "date": "2026-01-01", "tags": ["a", "b"]},
        {"title": "Post 2", "date": "2026-01-02", "tags": ["c"]}
    ]

    schema = generate_schema(samples)

    assert schema["type"] == "object"
    assert "title" in schema["properties"]
    assert "date" in schema["properties"]
    assert "tags" in schema["properties"]
    assert "title" in schema["required"]
    assert "date" in schema["required"]
```

**Integration Tests:**
```python
async def test_analyze_real_template():
    # Use eleventy-base-blog as test case
    template_id = await register_template(
        "https://github.com/11ty/eleventy-base-blog"
    )

    # Wait for analysis
    await wait_for_analysis(template_id, timeout=60)

    # Verify schema
    template = await get_template(template_id)
    assert template["status"] == "ready"
    assert "posts" in template["content_types"]
    assert "title" in template["content_types"]["posts"]["schema"]["properties"]
```

---

## Performance Optimization

1. **Shallow Clone:** `git clone --depth 1` (only latest commit)
2. **Parallel Analysis:** Scan multiple directories concurrently
3. **Caching:** Store cloned repos in S3 (cache key: commit SHA)
4. **Incremental Updates:** Re-analyze only if commit SHA changed

---

## Future Enhancements

1. **Template Preview Generation:** Screenshot homepage during analysis
2. **Dependency Analysis:** Detect required npm packages
3. **Feature Detection:** Auto-detect RSS, search, comments, analytics
4. **Template Versioning:** Track template updates, notify users
5. **Custom Lexicon Detection:** Scan for AT Protocol collection definitions
6. **Build Time Estimation:** Predict build duration based on template complexity
