"""
Record Key (rkey) Generation using TID Format (AT Protocol)

TID = Timestamp Identifier, used for chronologically-sortable record keys.
Format: 64-bit integer with:
- 40 bits: timestamp (microseconds since Unix epoch)
- 10 bits: random bits (for uniqueness within same microsecond)
- Total: sortable, unique, URL-safe (base32 encoded)

Reference: https://github.com/bluesky-social/atproto/blob/main/packages/common/src/util.ts
"""

import time
import random
import base64
import re
from typing import Tuple


def generate_rkey() -> str:
    """
    Generate TID (Timestamp Identifier) for AT Protocol record key.

    REQUIREMENT: [ ] Create `generate_rkey()` function
    REQUIREMENT: [ ] Use TID format: timestamp (microseconds) + random bits
    REQUIREMENT: [ ] Base32 encoding for human-readable keys
    REQUIREMENT: [ ] Ensure chronological sorting (newer records sort later)
    REQUIREMENT: [ ] Ensure global uniqueness (no collisions)

    Format:
    - Timestamp: microseconds since Unix epoch (40 bits)
    - Random: 10 random bits
    - Encoded: Base32 (lowercase, URL-safe)

    Returns:
        str: TID in base32 format (e.g., "3jzfcijpj2z2a")

    Example:
        >>> rkey = generate_rkey()
        >>> len(rkey)
        13
        >>> rkey.islower()
        True
        >>> import re
        >>> bool(re.match(r'^[a-z2-7]{13}$', rkey))
        True
    """
    # Step 1: Get current timestamp in microseconds
    timestamp_us = int(time.time() * 1_000_000)

    # Step 2: Generate 10 random bits (0-1023)
    random_bits = random.getrandbits(10)

    # Step 3: Combine: timestamp (shifted left 10 bits) OR'd with random bits
    # This creates a 64-bit integer where:
    # - Upper 50 bits (40+10): timestamp information
    # - Lower 10 bits: random bits for uniqueness
    tid_int = (timestamp_us << 10) | random_bits

    # Step 4: Convert to bytes (8 bytes = 64 bits)
    tid_bytes = tid_int.to_bytes(8, byteorder="big")

    # Step 5: Base32 encode (RFC 4648)
    # Standard base32 uses uppercase letters and padding
    b32_with_padding = base64.b32encode(tid_bytes).decode("ascii")

    # Step 6: Remove padding and convert to lowercase (CIDv1 style)
    # AT Protocol TIDs use lowercase base32 without padding
    b32_lowercase = b32_with_padding.rstrip("=").lower()

    return b32_lowercase


def extract_tid_timestamp(rkey: str) -> int:
    """
    Extract the timestamp component from a TID.

    Internal utility for decoding TIDs.

    Args:
        rkey: Base32-encoded TID (e.g., "3jzfcijpj2z2a")

    Returns:
        int: Microseconds since Unix epoch (when record was created)

    Raises:
        ValueError: If TID format is invalid
    """
    if not isinstance(rkey, str) or not rkey:
        raise ValueError("rkey must be non-empty string")

    if not re.match(r"^[a-z2-7]{13}$", rkey):
        raise ValueError(f"Invalid TID format: {rkey}")

    # Decode base32 back to integer
    tid_int = _base32_to_int(rkey)

    # Extract timestamp (upper 50 bits, right-shifted by 10)
    timestamp_us = tid_int >> 10

    return timestamp_us


def extract_tid_components(rkey: str) -> Tuple[int, int]:
    """
    Extract both timestamp and random components from a TID.

    Internal utility for detailed TID analysis.

    Args:
        rkey: Base32-encoded TID (e.g., "3jzfcijpj2z2a")

    Returns:
        Tuple[int, int]: (timestamp_microseconds, random_bits)

    Raises:
        ValueError: If TID format is invalid
    """
    if not isinstance(rkey, str) or not rkey:
        raise ValueError("rkey must be non-empty string")

    if not re.match(r"^[a-z2-7]{13}$", rkey):
        raise ValueError(f"Invalid TID format: {rkey}")

    # Decode base32 back to integer
    tid_int = _base32_to_int(rkey)

    # Extract components
    timestamp_us = tid_int >> 10  # Upper 50+ bits
    random_bits = tid_int & 0x3FF  # Lower 10 bits (0x3FF = 1023)

    return timestamp_us, random_bits


def _base32_to_int(rkey: str) -> int:
    """
    Convert base32-encoded string to integer.

    Helper function for decoding TIDs. This correctly decodes the unpadded
    base32 string back to the original 8-byte integer value.

    Args:
        rkey: Base32-encoded string (lowercase, 13 chars, no padding)

    Returns:
        int: Decoded integer (as 64-bit value)

    Raises:
        ValueError: If decoding fails
    """
    # Add proper padding back for base32 decode
    # 13 base32 chars encode 8 bytes with 3 padding chars
    rkey_upper = rkey.upper()
    rkey_with_padding = rkey_upper + "=" * 3  # Always 3 padding chars for 8 bytes

    try:
        tid_bytes = base64.b32decode(rkey_with_padding)
    except Exception as e:
        raise ValueError(f"Failed to decode base32 TID: {e}")

    # Convert bytes to integer
    result = int.from_bytes(tid_bytes, byteorder="big")
    return result


def validate_rkey(rkey: str) -> bool:
    """
    Validate TID format.

    Args:
        rkey: String to validate

    Returns:
        bool: True if valid TID, False otherwise
    """
    if not isinstance(rkey, str):
        return False

    if not re.match(r"^[a-z2-7]{13}$", rkey):
        return False

    return True


if __name__ == "__main__":
    # Example usage
    print("Generating sample TIDs...")
    rkeys = [generate_rkey() for _ in range(5)]

    for i, rkey in enumerate(rkeys):
        ts, random = extract_tid_components(rkey)
        print(f"{i+1}. {rkey} (ts={ts}, random={random})")

    # Verify sorting
    print("\nVerifying chronological sorting...")
    sorted_rkeys = sorted(rkeys)
    print(f"Original: {rkeys}")
    print(f"Sorted:   {sorted_rkeys}")
    print(f"Match: {rkeys == sorted_rkeys}")

    # Verify uniqueness
    print("\nVerifying uniqueness...")
    large_batch = [generate_rkey() for _ in range(1000)]
    unique_count = len(set(large_batch))
    print(f"Generated 1000 TIDs, {unique_count} unique (duplicates: {1000 - unique_count})")
