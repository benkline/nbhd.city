"""
Content Identifier (CID) Generation for AT Protocol Records

CIDs are immutable content hashes used by AT Protocol to identify records.
This module implements CIDv1 generation using SHA-256 + CBOR encoding + base32.

Reference: https://docs.ipfs.tech/concepts/content-addressing/
"""

import base64
import hashlib
import re
from typing import Any, Dict, Union

try:
    import dag_cbor
except ImportError:
    dag_cbor = None


def generate_cid(record_value: Union[Dict[str, Any], Any]) -> str:
    """
    Generate CIDv1 for an AT Protocol record.

    REQUIREMENT: [ ] Implement CID v1 generation (SHA-256 + base32)
    REQUIREMENT: [ ] Create `generate_cid(record_value)` function
    REQUIREMENT: [ ] Ensure immutability (same content → same CID)

    Format: bafy<base32_encoded_sha256_hash>

    Process:
    1. Encode record as canonical DAG-CBOR
    2. Hash with SHA-256
    3. Encode hash as lowercase base32 with 'bafy' prefix

    Args:
        record_value: The record object to generate CID for

    Returns:
        CIDv1 string (e.g., "bafyreib2rxk3rh6kzwq...")

    Raises:
        ValueError: If record cannot be encoded or libraries unavailable

    ACCEPTANCE CRITERIA:
    - CID generation produces valid CIDv1 strings
    - Same record value always produces same CID
    - Different record values produce different CIDs
    - CIDs are base32 encoded (e.g., "bafyreib2rxk3rh6kzwq...")
    """
    if dag_cbor is None:
        raise ImportError("dag-cbor library required for CID generation")

    # Step 1: Encode record as canonical DAG-CBOR
    # DAG-CBOR ensures deterministic encoding (same content → same bytes)
    try:
        cbor_bytes = dag_cbor.encode(record_value)
    except Exception as e:
        raise ValueError(f"Failed to encode record as DAG-CBOR: {e}")

    # Step 2: Hash with SHA-256
    # This creates immutable content identifier
    sha256_hash = hashlib.sha256(cbor_bytes).digest()

    # Step 3: Encode hash as CIDv1 base32
    # CIDv1 format: bafy + base32(sha256_hash)
    # We use lowercase base32 (base32 without padding)
    try:
        # Standard base32 encoding (uppercase with padding)
        b32_with_padding = base64.b32encode(sha256_hash).decode("ascii")

        # Convert to lowercase and remove padding for CIDv1
        # CIDv1 uses base32 without padding
        b32_lowercase = b32_with_padding.rstrip("=").lower()

        # CIDv1 format: bafy + base32
        # 'bafy' = 'baf' (CIDv1 indicator) + 'y' (base32 encoding)
        cid = "bafy" + b32_lowercase
    except Exception as e:
        raise ValueError(f"Failed to encode hash as base32: {e}")

    return cid


def validate_cid(cid: str) -> bool:
    """
    Validate CIDv1 format.

    REQUIREMENT: [ ] Add validation for CID format

    Format validation:
    - Must start with 'bafy'
    - Must contain only base32 characters (a-z, 2-7)
    - Must be 59+ characters (for SHA-256: 4 + 55)

    Args:
        cid: CID string to validate

    Returns:
        True if valid CIDv1, False otherwise

    Raises:
        ValueError: If CID is malformed in way that indicates error
    """
    if not isinstance(cid, str):
        return False

    # Check prefix
    if not cid.startswith("bafy"):
        return False

    # Check base32 characters only
    # base32 uses: a-z (lowercase) and 2-7
    if not re.match(r"^bafy[a-z2-7]+$", cid):
        return False

    # Check reasonable length
    # bafy (4 chars) + base32(32 bytes) = ~56 chars minimum
    # SHA-256 = 32 bytes = ~52 base32 characters
    # So 'bafy' + 52 chars = 56 chars minimum
    if len(cid) < 56:
        return False

    # Maximum reasonable length (allow for future hash algorithms)
    if len(cid) > 200:
        return False

    return True


def extract_cid_hash(cid: str) -> str:
    """
    Extract the base32-encoded hash from a CID.

    Internal utility for testing and debugging.

    Args:
        cid: Valid CIDv1 string

    Returns:
        Base32-encoded hash portion (without 'bafy' prefix)

    Raises:
        ValueError: If CID is invalid
    """
    if not validate_cid(cid):
        raise ValueError(f"Invalid CID format: {cid}")

    return cid[4:]  # Remove 'bafy' prefix


if __name__ == "__main__":
    # Example usage
    record = {
        "$type": "app.nbhd.blog.post",
        "title": "Hello World",
        "content": "This is my first post",
    }

    cid = generate_cid(record)
    print(f"Generated CID: {cid}")
    print(f"Valid CID: {validate_cid(cid)}")

    # Verify immutability
    cid2 = generate_cid(record)
    print(f"Same content produces same CID: {cid == cid2}")

    # Verify different content produces different CID
    record2 = {
        "$type": "app.nbhd.blog.post",
        "title": "Different Post",
        "content": "Different content",
    }
    cid3 = generate_cid(record2)
    print(f"Different content produces different CID: {cid != cid3}")
