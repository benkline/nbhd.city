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
import sys
import logging

logger = logging.getLogger(__name__)


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
    logger.info(f"[ANALYZER] Finding content directory in: {path}")

    candidate_dirs = [
        os.path.join(path, "content"),
        os.path.join(path, "posts"),
        os.path.join(path, "src"),
        os.path.join(path, "src", "posts"),
    ]

    logger.info(f"[ANALYZER] Checking candidates: {candidate_dirs}")

    for candidate in candidate_dirs:
        exists = os.path.exists(candidate) and os.path.isdir(candidate)
        logger.info(f"[ANALYZER]   {candidate} - exists: {exists}")
        if exists:
            # Return first existing directory (even if empty)
            logger.info(f"[ANALYZER] ✓ Found content directory: {candidate}")
            return candidate

    # If no candidate directory found, return None
    logger.info("[ANALYZER] ✗ No content directory found!")
    return None


def scan_frontmatter(content_dir: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Scan all markdown files in directory and extract frontmatter.

    Requirement: [ ] Scan all .md files and parse frontmatter
    Requirement: [ ] Group by content type (posts, pages, etc.)

    Returns: Dict mapping content type to list of frontmatter dictionaries
    """
    logger.info(f"[ANALYZER] Starting frontmatter scan in: {content_dir}")
    content_types = defaultdict(list)

    if not os.path.exists(content_dir):
        logger.info(f"[ANALYZER] ✗ Content directory does not exist: {content_dir}")
        return {}

    logger.info("[ANALYZER] Walking directory tree...")
    file_count = 0
    md_count = 0

    # Walk directory tree
    for root, dirs, files in os.walk(content_dir):
        logger.info(f"[ANALYZER]   Scanning: {root} ({len(files)} files)")
        for file in files:
            file_count += 1
            if not file.endswith(".md"):
                continue

            md_count += 1
            filepath = os.path.join(root, file)
            logger.info(f"[ANALYZER]     Parsing: {file}")

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
                logger.info(f"[ANALYZER]       ✓ Added to '{content_type}' ({len(metadata)} fields)")

            except Exception as e:
                # Skip files with parsing errors
                logger.info(f"[ANALYZER]     ✗ WARNING: Failed to parse {file}: {str(e)}")
                continue

    logger.info(f"[ANALYZER] ✓ Scanned {file_count} files, found {md_count} markdown files")
    logger.info(f"[ANALYZER] Content types: {list(content_types.keys())}")
    for ctype, items in content_types.items():
        logger.info(f"[ANALYZER]   {ctype}: {len(items)} files")

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


def analyze_template(template_path: str, validate_eleventy_project=None) -> Dict[str, Any]:
    """
    Analyze a complete 11ty template.

    Finds content, scans frontmatter, groups by type, and infers schemas.

    Acceptance Criterion: [ ] Successfully analyzes eleventy-base-blog

    Returns: Dict with content_types and metadata
    """
    logger.info("\n[ANALYZER] ===== STARTING FULL ANALYSIS =====")
    logger.info(f"[ANALYZER] Template path: {template_path}")

    # Validate project
    logger.info("[ANALYZER] STEP 1: Validating project...")
    if validate_eleventy_project is None:
        raise ValueError("validate_eleventy_project function must be provided")
    is_valid, error = validate_eleventy_project(template_path)
    if not is_valid:
        logger.info(f"[ANALYZER] ✗ Validation failed: {error}")
        return {"error": error, "status": "failed"}

    # Find content directory
    logger.info("[ANALYZER] STEP 2: Finding content directory...")
    content_dir = find_content_directory(template_path)
    if not content_dir:
        error = "No content directory found"
        logger.info(f"[ANALYZER] ✗ {error}")
        return {"error": error, "status": "failed"}

    # Scan frontmatter
    logger.info("[ANALYZER] STEP 3: Scanning frontmatter...")
    content_types_data = scan_frontmatter(content_dir)
    if not content_types_data:
        error = "No markdown files found"
        logger.info(f"[ANALYZER] ✗ {error}")
        return {"error": error, "status": "failed"}

    # Generate schemas
    logger.info("[ANALYZER] STEP 4: Generating schemas...")
    content_types = {}
    for content_type, samples in content_types_data.items():
        logger.info(f"[ANALYZER]   Inferring schema for '{content_type}' ({len(samples)} samples)...")
        schema = infer_schema(samples)
        content_types[content_type] = {
            "directory": content_dir,
            "schema": schema,
            "count": len(samples)
        }
        logger.info(f"[ANALYZER]   ✓ Schema has {len(schema.get('properties', {}))} fields")

    logger.info("[ANALYZER] ===== ANALYSIS COMPLETE =====\n")
    return {
        "status": "success",
        "content_types": content_types,
        "analyzed_at": datetime.utcnow().isoformat() + "Z"
    }
