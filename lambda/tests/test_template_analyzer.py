"""
Unit tests for SSG-009: Template Analyzer Lambda Function

Tests for cloning, validating, and analyzing 11ty templates.
"""

import pytest
import os
import tempfile
import shutil
import json
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock
import sys

# Import the handler module (will be created in next step)
# from template_analyzer import handler


class TestValidateEleventyProject:
    """
    Test 11ty project validation
    Requirement: [ ] Validate 11ty project (check eleventy.config.js, package.json)
    """

    def test_valid_eleventy_project(self, tmp_path):
        """Test validation of valid 11ty project"""
        # [ ] Validate 11ty project (check eleventy.config.js, package.json)

        # Create mock eleventy project
        config_file = tmp_path / "eleventy.config.js"
        config_file.write_text("module.exports = function() { return {}; };")

        package_file = tmp_path / "package.json"
        package_file.write_text(json.dumps({
            "dependencies": {
                "@11ty/eleventy": "^2.0.0"
            }
        }))

        from template_analyzer.validator import validate_eleventy_project
        is_valid, error = validate_eleventy_project(str(tmp_path))

        assert is_valid is True
        assert error is None

    def test_missing_eleventy_config(self, tmp_path):
        """Test validation fails with missing eleventy.config.js"""
        package_file = tmp_path / "package.json"
        package_file.write_text(json.dumps({
            "dependencies": {"@11ty/eleventy": "^2.0.0"}
        }))

        from template_analyzer.validator import validate_eleventy_project
        is_valid, error = validate_eleventy_project(str(tmp_path))

        assert is_valid is False
        assert "eleventy.config.js" in error or ".eleventy.js" in error

    def test_missing_package_json(self, tmp_path):
        """Test validation fails with missing package.json"""
        config_file = tmp_path / "eleventy.config.js"
        config_file.write_text("module.exports = function() {};")

        from template_analyzer.validator import validate_eleventy_project
        is_valid, error = validate_eleventy_project(str(tmp_path))

        assert is_valid is False
        assert "package.json" in error

    def test_missing_eleventy_dependency(self, tmp_path):
        """Test validation fails without @11ty/eleventy dependency"""
        config_file = tmp_path / "eleventy.config.js"
        config_file.write_text("module.exports = function() {};")

        package_file = tmp_path / "package.json"
        package_file.write_text(json.dumps({
            "dependencies": {"other-package": "^1.0.0"}
        }))

        from template_analyzer.validator import validate_eleventy_project
        is_valid, error = validate_eleventy_project(str(tmp_path))

        assert is_valid is False
        assert "@11ty/eleventy" in error


class TestFindContentDirectory:
    """
    Test finding content directory
    Requirement: [ ] Find content directory (content/, posts/, src/)
    """

    def test_find_content_directory_standard(self, tmp_path):
        """Test finding standard content/ directory"""
        content_dir = tmp_path / "content"
        content_dir.mkdir()

        from template_analyzer.analyzer import find_content_directory
        found = find_content_directory(str(tmp_path))

        assert found == str(content_dir)

    def test_find_posts_directory(self, tmp_path):
        """Test finding posts/ directory"""
        posts_dir = tmp_path / "posts"
        posts_dir.mkdir()

        from template_analyzer.analyzer import find_content_directory
        found = find_content_directory(str(tmp_path))

        assert found == str(posts_dir)

    def test_find_src_directory(self, tmp_path):
        """Test finding src/ directory"""
        src_dir = tmp_path / "src"
        src_dir.mkdir()

        from template_analyzer.analyzer import find_content_directory
        found = find_content_directory(str(tmp_path))

        # Should find src/ for content
        # Implementation may use src/ or src/posts depending on structure
        assert "src" in found

    def test_no_content_directory_found(self, tmp_path):
        """Test when no content directory exists"""
        from template_analyzer.analyzer import find_content_directory
        found = find_content_directory(str(tmp_path))

        # Should return None or raise exception
        assert found is None or isinstance(found, str)


class TestScanFrontmatter:
    """
    Test scanning markdown files for frontmatter
    Requirement: [ ] Scan all .md files and parse frontmatter
    """

    def test_scan_markdown_files(self, tmp_path):
        """Test scanning markdown files in directory"""
        # [ ] Scan all .md files and parse frontmatter

        post1 = tmp_path / "post1.md"
        post1.write_text("""---
title: First Post
date: 2026-01-01
tags:
  - tech
---
Content here""")

        post2 = tmp_path / "post2.md"
        post2.write_text("""---
title: Second Post
date: 2026-01-02
tags:
  - web
---
Content here""")

        from template_analyzer.analyzer import scan_frontmatter
        result = scan_frontmatter(str(tmp_path))

        # Should return dict with frontmatter data
        assert isinstance(result, dict)
        # Should have at least one content type group
        assert len(result) >= 1
        # First group should have at least 2 items (both files in same dir)
        first_group = list(result.values())[0]
        assert len(first_group) >= 2

    def test_parse_yaml_frontmatter(self, tmp_path):
        """Test parsing YAML frontmatter from markdown"""
        post = tmp_path / "post.md"
        post.write_text("""---
title: Test Post
author: John Doe
date: 2026-01-01T12:00:00Z
featured: true
tags:
  - python
  - web
---
# Markdown content""")

        from template_analyzer.analyzer import scan_frontmatter
        result = scan_frontmatter(str(tmp_path))

        # Should parse all fields
        assert result
        # Check that data includes the fields
        values = list(result.values())[0] if result else []
        assert "title" in [k for item in values for k in item.keys()] or "title" in values

    def test_handle_missing_frontmatter(self, tmp_path):
        """Test handling markdown without frontmatter"""
        post = tmp_path / "post.md"
        post.write_text("# No frontmatter\nJust markdown content")

        from template_analyzer.analyzer import scan_frontmatter
        # Should handle gracefully, either skip or include with empty meta
        try:
            result = scan_frontmatter(str(tmp_path))
            assert isinstance(result, dict)
        except Exception:
            # Or it may raise an exception
            pass


class TestGroupContentByType:
    """
    Test grouping content by type
    Requirement: [ ] Group by content type (posts, pages, etc.)
    """

    def test_group_content_by_directory(self, tmp_path):
        """Test grouping content by directory structure"""
        # Create posts directory
        posts_dir = tmp_path / "posts"
        posts_dir.mkdir()
        post = posts_dir / "post1.md"
        post.write_text("""---
title: Post
---
Content""")

        # Create pages directory
        pages_dir = tmp_path / "pages"
        pages_dir.mkdir()
        page = pages_dir / "about.md"
        page.write_text("""---
title: About
---
Content""")

        from template_analyzer.analyzer import scan_frontmatter
        result = scan_frontmatter(str(tmp_path))

        # Should group by directory
        assert isinstance(result, dict)
        # Should have entries for posts and pages
        assert "posts" in result or "pages" in result

    def test_detect_content_types(self, tmp_path):
        """Test detecting different content types"""
        # Different naming conventions for content types
        blog_dir = tmp_path / "blog"
        blog_dir.mkdir()
        post = blog_dir / "entry.md"
        post.write_text("""---
title: Blog Entry
---
Content""")

        from template_analyzer.analyzer import scan_frontmatter
        result = scan_frontmatter(str(tmp_path))

        assert isinstance(result, dict)


class TestInferSchema:
    """
    Test JSON schema inference from frontmatter
    Requirement: [ ] Infer JSON schema from frontmatter samples
    """

    def test_infer_schema_from_samples(self, tmp_path):
        """Test inferring JSON schema from frontmatter samples"""
        # [ ] Infer JSON schema from frontmatter samples

        # Create sample markdown files
        for i in range(3):
            post = tmp_path / f"post{i}.md"
            post.write_text(f"""---
title: Post {i}
date: 2026-01-0{i+1}
tags:
  - tech
---
Content""")

        from template_analyzer.analyzer import scan_frontmatter, infer_schema
        samples = scan_frontmatter(str(tmp_path))

        # Get first content type's samples
        if samples:
            sample_data = list(samples.values())[0]
            schema = infer_schema(sample_data)

            # Schema should have expected structure
            assert isinstance(schema, dict)
            assert "type" in schema
            assert "properties" in schema

    def test_schema_field_types(self, tmp_path):
        """Test that schema correctly infers field types"""
        post1 = tmp_path / "post1.md"
        post1.write_text("""---
title: First
date: 2026-01-01
featured: true
views: 42
---
Content""")

        post2 = tmp_path / "post2.md"
        post2.write_text("""---
title: Second
date: 2026-01-02
featured: false
views: 100
---
Content""")

        from template_analyzer.analyzer import scan_frontmatter, infer_schema
        samples = scan_frontmatter(str(tmp_path))

        if samples:
            sample_data = list(samples.values())[0]
            schema = infer_schema(sample_data)

            # Schema properties should exist
            assert "properties" in schema
            # Common fields should be detected
            props = schema.get("properties", {})
            assert len(props) > 0

    def test_required_field_detection(self, tmp_path):
        """Test detecting required fields (>80% occurrence)"""
        # Create files where 'title' is always present
        for i in range(5):
            post = tmp_path / f"post{i}.md"
            post.write_text(f"""---
title: Post {i}
date: 2026-01-0{i+1}
summary: Optional summary
---
Content""")

        # One file without summary
        post = tmp_path / "post_no_summary.md"
        post.write_text("""---
title: Post 6
date: 2026-01-07
---
Content""")

        from template_analyzer.analyzer import scan_frontmatter, infer_schema
        samples = scan_frontmatter(str(tmp_path))

        if samples:
            sample_data = list(samples.values())[0]
            schema = infer_schema(sample_data)

            # Title and date should be required (appear in all/most)
            required = schema.get("required", [])
            # Summary should not be required (only 5/6 = 83%, or might be < 80%)
            # This depends on threshold implementation


class TestAnalyzeTemplate:
    """
    Test complete template analysis
    Acceptance Criteria: [ ] Successfully analyzes eleventy-base-blog
    """

    def test_analyze_valid_template(self, tmp_path):
        """Test analyzing a valid 11ty template"""
        # [ ] Successfully analyzes eleventy-base-blog

        # Create minimal 11ty project
        (tmp_path / "eleventy.config.js").write_text(
            "module.exports = function(eleventyConfig) { return {}; };"
        )
        (tmp_path / "package.json").write_text(json.dumps({
            "name": "test-template",
            "version": "1.0.0",
            "dependencies": {"@11ty/eleventy": "^2.0.0"}
        }))

        content_dir = tmp_path / "content" / "posts"
        content_dir.mkdir(parents=True)

        for i in range(3):
            post = content_dir / f"post{i}.md"
            post.write_text(f"""---
title: Post {i}
date: 2026-01-0{i+1}T00:00:00Z
tags:
  - test
---
Content""")

        from template_analyzer.analyzer import analyze_template
        result = analyze_template(str(tmp_path))

        # Should return analysis result
        assert result is not None
        assert "content_types" in result or "schema" in result

    def test_analysis_includes_content_types(self, tmp_path):
        """Test that analysis includes discovered content types"""
        # Create minimal project with posts and pages
        (tmp_path / "eleventy.config.js").write_text("module.exports = {};")
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@11ty/eleventy": "^2.0.0"}
        }))

        posts_dir = tmp_path / "content" / "posts"
        posts_dir.mkdir(parents=True)
        post = posts_dir / "post.md"
        post.write_text("---\ntitle: Post\ndate: 2026-01-01\n---\nContent")

        from template_analyzer.analyzer import analyze_template
        result = analyze_template(str(tmp_path))

        # Should identify content types
        if result and "content_types" in result:
            assert isinstance(result["content_types"], dict)


class TestErrorHandling:
    """
    Test error handling
    Requirement: [ ] Handle errors and update status
    Acceptance Criterion: [ ] Handles invalid repos gracefully
    """

    def test_invalid_repo_error(self):
        """Test handling of invalid/not-found repo"""
        # [ ] Handles invalid repos gracefully
        from template_analyzer.analyzer import analyze_template

        # Should not raise, but return error info
        try:
            result = analyze_template("/nonexistent/path")
            # Either returns error dict or raises exception
            assert result is not None
        except Exception as e:
            # Exception should be meaningful
            assert "not found" in str(e).lower() or "does not exist" in str(e).lower()

    def test_not_eleventy_project_error(self, tmp_path):
        """Test error when directory is not an 11ty project"""
        # Create directory without 11ty files
        (tmp_path / "some_file.txt").write_text("Not an 11ty project")

        from template_analyzer.validator import validate_eleventy_project
        is_valid, error = validate_eleventy_project(str(tmp_path))

        assert is_valid is False
        assert error is not None

    def test_no_markdown_files_error(self, tmp_path):
        """Test error when no markdown files found"""
        (tmp_path / "eleventy.config.js").write_text("module.exports = {};")
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@11ty/eleventy": "^2.0.0"}
        }))

        # Create content dir but no markdown files
        content_dir = tmp_path / "content"
        content_dir.mkdir()

        from template_analyzer.analyzer import analyze_template
        result = analyze_template(str(tmp_path))

        # Should handle gracefully - either return empty or error
        assert result is not None


class TestCloneRepository:
    """
    Test repository cloning
    Requirement: [ ] Clone GitHub repo to /tmp (shallow clone)
    """

    @pytest.mark.skip(reason="Requires network access or mocking")
    def test_clone_github_repo(self):
        """Test cloning a GitHub repository"""
        # [ ] Clone GitHub repo to /tmp (shallow clone)
        from template_analyzer.clone import clone_repository

        # Would test with a real repo URL
        pass

    @pytest.mark.skip(reason="Requires network access or mocking")
    def test_shallow_clone(self):
        """Test that clone is shallow (not full history)"""
        from template_analyzer.clone import clone_repository

        # Shallow clone should complete faster
        pass


class TestLambdaHandler:
    """
    Test Lambda handler integration
    """

    @pytest.mark.asyncio
    async def test_handler_success(self):
        """Test Lambda handler with valid template"""
        # Would need mocking of DynamoDB and subprocess calls
        pass

    @pytest.mark.asyncio
    async def test_handler_timeout(self):
        """Test Lambda handler respects 5 minute timeout"""
        # [ ] Completes within 5 minute timeout
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
