"""
Validator module for 11ty project validation.

Requirement: [ ] Validate 11ty project (check eleventy.config.js, package.json)
"""

import os
import json
from typing import Tuple, Optional


def validate_eleventy_project(path: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that a directory is a valid 11ty project.

    Checks for:
    - eleventy.config.js or .eleventy.js file
    - package.json with @11ty/eleventy dependency

    Returns: (is_valid, error_message)
    """
    if not os.path.exists(path):
        return False, f"Path does not exist: {path}"

    if not os.path.isdir(path):
        return False, f"Path is not a directory: {path}"

    # Check for 11ty config file
    config_paths = [
        os.path.join(path, "eleventy.config.js"),
        os.path.join(path, ".eleventy.js")
    ]

    config_exists = any(os.path.exists(p) for p in config_paths)
    if not config_exists:
        return False, "Missing eleventy.config.js or .eleventy.js"

    # Check for package.json
    package_json_path = os.path.join(path, "package.json")
    if not os.path.exists(package_json_path):
        return False, "Missing package.json"

    # Check for @11ty/eleventy dependency
    try:
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)

        deps = package_data.get("dependencies", {})
        dev_deps = package_data.get("devDependencies", {})
        all_deps = {**deps, **dev_deps}

        if "@11ty/eleventy" not in all_deps:
            return False, "@11ty/eleventy not found in dependencies"

        return True, None

    except json.JSONDecodeError as e:
        return False, f"Invalid package.json: {str(e)}"
    except Exception as e:
        return False, f"Error reading package.json: {str(e)}"
