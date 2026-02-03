"""
Neighborhood DID generation utilities.

Neighborhoods get DIDs for AT Protocol identification.
"""

import base64
import os
from typing import Optional


def generate_neighborhood_did() -> str:
    """
    Generate a DID for a neighborhood.

    Format: did:plc:{base32_encoded_random}

    Returns:
        A valid did:plc identifier

    Example:
        >>> nbhd_did = generate_neighborhood_did()
        >>> print(nbhd_did)
        'did:plc:z72i7hdynmk6r22ghf7jicvam'
    """
    # Generate 24 random bytes (192 bits) for cryptographic security
    random_bytes = os.urandom(24)
    # Encode to base32 (RFC 4648 - no padding)
    encoded = base64.b32encode(random_bytes).decode('ascii').rstrip('=').lower()
    return f"did:plc:{encoded}"


def is_valid_neighborhood_did(did: str) -> bool:
    """
    Validate neighborhood DID format.

    Args:
        did: DID string to validate

    Returns:
        True if valid, False otherwise
    """
    if not isinstance(did, str):
        return False
    if not did.startswith('did:plc:'):
        return False
    parts = did.split(':')
    if len(parts) != 3:
        return False
    identifier = parts[2]
    # Check if identifier is base32 (lowercase alphanumeric, no padding)
    if not all(c in '0123456789abcdefghijklmnopqrstuvwxyz' for c in identifier):
        return False
    if len(identifier) < 20:
        return False
    return True
