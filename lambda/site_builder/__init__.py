"""
Site Builder Lambda function for SSG-016.

Builds static sites from 11ty templates and AT Protocol content records.
"""

from .handler import handler, SiteBuilder

__all__ = ["handler", "SiteBuilder"]
