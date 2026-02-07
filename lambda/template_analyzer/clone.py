"""
Repository cloning module.

Requirement: [ ] Clone GitHub repo to /tmp (shallow clone)
"""

import subprocess
import os
import tempfile
from typing import Tuple, Optional


def clone_repository(github_url: str, dest_path: str, depth: int = 1) -> Tuple[bool, Optional[str]]:
    """
    Clone a GitHub repository to destination path using shallow clone.

    Args:
        github_url: GitHub URL (https://github.com/user/repo)
        dest_path: Destination directory path
        depth: Shallow clone depth (default: 1 for shallow clone)

    Returns: (success, error_message)
    """
    try:
        # Ensure destination directory exists
        os.makedirs(dest_path, exist_ok=True)

        # Use git clone with shallow depth
        cmd = [
            "git",
            "clone",
            "--depth", str(depth),
            github_url,
            dest_path
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            error_msg = result.stderr or "Git clone failed"
            return False, error_msg

        return True, None

    except subprocess.TimeoutExpired:
        return False, "Template clone timed out (repo too large?)"
    except FileNotFoundError:
        return False, "Git not installed or not found in PATH"
    except Exception as e:
        return False, f"Clone failed: {str(e)}"


def cleanup_directory(path: str) -> bool:
    """
    Clean up temporary directory.

    Args:
        path: Directory path to remove

    Returns: True if successful, False otherwise
    """
    try:
        if os.path.exists(path):
            import shutil
            shutil.rmtree(path)
        return True
    except Exception as e:
        print(f"Warning: Failed to cleanup {path}: {str(e)}")
        return False


def get_commit_sha(repo_path: str) -> Optional[str]:
    """
    Get current commit SHA of a repository.

    Args:
        repo_path: Path to git repository

    Returns: Commit SHA or None if failed
    """
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            return result.stdout.strip()

        return None

    except Exception as e:
        print(f"Warning: Failed to get commit SHA: {str(e)}")
        return None
