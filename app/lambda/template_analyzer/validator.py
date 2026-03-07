"""
Validator module for 11ty project validation.

Requirement: [ ] Validate 11ty project (check eleventy.config.js, package.json)
"""

import os
import json
from typing import Tuple, Optional
import sys


def validate_eleventy_project(path: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that a directory is a valid 11ty project.

    Checks for:
    - eleventy.config.js or .eleventy.js file
    - package.json with @11ty/eleventy dependency

    Returns: (is_valid, error_message)
    """
    print(f"[VALIDATE] Starting validation of: {path}")

    if not os.path.exists(path):
        error = f"Path does not exist: {path}"
        print(f"[VALIDATE] ERROR: {error}")
        return False, error

    if not os.path.isdir(path):
        error = f"Path is not a directory: {path}"
        print(f"[VALIDATE] ERROR: {error}")
        return False, error

    # Check for 11ty config file
    config_paths = [
        os.path.join(path, "eleventy.config.js"),
        os.path.join(path, ".eleventy.js")
    ]

    print(f"[VALIDATE] Checking for config files: {config_paths}")
    config_exists = any(os.path.exists(p) for p in config_paths)
    if not config_exists:
        error = "Missing eleventy.config.js or .eleventy.js"
        print(f"[VALIDATE] ERROR: {error}")
        return False, error

    print("[VALIDATE] Config file found ✓")

    # Check for package.json
    package_json_path = os.path.join(path, "package.json")
    print(f"[VALIDATE] Checking for: {package_json_path}")
    if not os.path.exists(package_json_path):
        error = "Missing package.json"
        print(f"[VALIDATE] ERROR: {error}")
        return False, error

    print("[VALIDATE] package.json found ✓")

    # Check for @11ty/eleventy dependency
    try:
        print("[VALIDATE] Reading package.json dependencies...")
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)

        deps = package_data.get("dependencies", {})
        dev_deps = package_data.get("devDependencies", {})
        all_deps = {**deps, **dev_deps}

        print(f"[VALIDATE] Found {len(all_deps)} dependencies")
        print("[VALIDATE] Checking for @11ty/eleventy...")

        if "@11ty/eleventy" not in all_deps:
            error = "@11ty/eleventy not found in dependencies"
            print(f"[VALIDATE] ERROR: {error}")
            return False, error

        print("[VALIDATE] ✓ @11ty/eleventy found")
        print("[VALIDATE] ✓✓✓ Validation PASSED")
        return True, None

    except json.JSONDecodeError as e:
        error = f"Invalid package.json: {str(e)}"
        print(f"[VALIDATE] ERROR: {error}")
        return False, error
    except Exception as e:
        error = f"Error reading package.json: {str(e)}"
        print(f"[VALIDATE] EXCEPTION: {error}")
        return False, error
