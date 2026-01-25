"""
Template analyzer module for scanning frontmatter and inferring schemas.

Requirements:
- [ ] Find content directory (content/, posts/, src/)
- [ ] Scan all .md files and parse frontmatter
- [ ] Group by content type (posts, pages, etc.)
- [ ] Infer JSON schema from frontmatter samples
"""

import os
from typing import Dict, List, Optional, Any
from collections import defaultdict
import frontmatter
from datetime import datetime


def find_content_directory(path: str) -> Optional[str]:
    """
    Find content directory in 11ty project.

    Looks for:
    - content/
    - posts/
    - src/
    - src/posts/

    Returns: path to content directory or None
    """
    candidate_dirs = [
        os.path.join(path, "content"),
        os.path.join(path, "posts"),
        os.path.join(path, "src"),
        os.path.join(path, "src", "posts"),
    ]

    for candidate in candidate_dirs:
        if os.path.exists(candidate) and os.path.isdir(candidate):
            # Return first existing directory (even if empty)
            return candidate

    # If no candidate directory found, return None
    return None


def scan_frontmatter(content_dir: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Scan all markdown files in directory and extract frontmatter.

    Requirement: [ ] Scan all .md files and parse frontmatter
    Requirement: [ ] Group by content type (posts, pages, etc.)

    Returns: Dict mapping content type to list of frontmatter dictionaries
    """
    content_types = defaultdict(list)

    if not os.path.exists(content_dir):
        return {}

    # Walk directory tree
    for root, dirs, files in os.walk(content_dir):
        for file in files:
            if not file.endswith(".md"):
                continue

            filepath = os.path.join(root, file)

            try:
                # Parse frontmatter
                with open(filepath, 'r', encoding='utf-8') as f:
                    post = frontmatter.load(f)

                # Determine content type from directory structure
                rel_path = os.path.relpath(root, content_dir)
                if rel_path == ".":
                    content_type = "pages"
                else:
                    content_type = rel_path.split(os.sep)[0]

                # Store frontmatter metadata
                metadata = {
                    **post.metadata,
                    "_filepath": filepath,
                    "_content_length": len(post.content)
                }

                content_types[content_type].append(metadata)

            except Exception as e:
                # Skip files with parsing errors
                print(f"Warning: Failed to parse {filepath}: {str(e)}")
                continue

    return dict(content_types)


def infer_field_type(values: List[Any]) -> Dict[str, Any]:
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

    # Check for objects
    if all(isinstance(v, dict) for v in values):
        return {"type": "object"}

    # Default: string
    return {"type": "string"}


def is_iso_date(value: str) -> bool:
    """Check if string matches ISO 8601 date format."""
    try:
        datetime.fromisoformat(value.replace('Z', '+00:00'))
        return True
    except (ValueError, AttributeError):
        return False


def map_python_type_to_json(python_type: str) -> str:
    """Map Python type names to JSON Schema types."""
    type_map = {
        "str": "string",
        "int": "integer",
        "float": "number",
        "bool": "boolean",
        "dict": "object",
        "list": "array",
    }
    return type_map.get(python_type, "string")


def infer_schema(frontmatter_samples: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate JSON Schema from frontmatter samples.

    Requirement: [ ] Infer JSON schema from frontmatter samples

    Returns: JSON Schema object
    """
    if not frontmatter_samples:
        return {"type": "object", "properties": {}, "required": []}

    all_fields = {}
    total_samples = len(frontmatter_samples)

    # Collect all field values
    for sample in frontmatter_samples:
        for key, value in sample.items():
            if key.startswith("_"):  # Skip internal fields
                continue
            if key not in all_fields:
                all_fields[key] = []
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
        field_schema["title"] = field_name.replace("_", " ").replace("-", " ").title()

        schema["properties"][field_name] = field_schema

        # Mark as required if appears in >80% of samples
        occurrence_rate = len([v for v in values if v is not None]) / total_samples
        if occurrence_rate > 0.8:
            schema["required"].append(field_name)

    return schema


def analyze_template(template_path: str) -> Dict[str, Any]:
    """
    Analyze a complete 11ty template.

    Finds content, scans frontmatter, groups by type, and infers schemas.

    Acceptance Criterion: [ ] Successfully analyzes eleventy-base-blog

    Returns: Dict with content_types and metadata
    """
    try:
        from template_analyzer.validator import validate_eleventy_project
    except ImportError:
        from validator import validate_eleventy_project

    # Validate project
    is_valid, error = validate_eleventy_project(template_path)
    if not is_valid:
        return {"error": error, "status": "failed"}

    # Find content directory
    content_dir = find_content_directory(template_path)
    if not content_dir:
        return {"error": "No content directory found", "status": "failed"}

    # Scan frontmatter
    content_types_data = scan_frontmatter(content_dir)
    if not content_types_data:
        return {"error": "No markdown files found", "status": "failed"}

    # Generate schemas
    content_types = {}
    for content_type, samples in content_types_data.items():
        schema = infer_schema(samples)
        content_types[content_type] = {
            "directory": content_dir,
            "schema": schema,
            "count": len(samples)
        }

    return {
        "status": "success",
        "content_types": content_types,
        "analyzed_at": datetime.utcnow().isoformat() + "Z"
    }
