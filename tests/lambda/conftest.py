"""
Pytest configuration and fixtures for template analyzer tests.
"""

import pytest
import sys
import os

# Add parent directory to path so we can import template_analyzer modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
