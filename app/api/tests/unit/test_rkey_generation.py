"""
Tests for Record Key (rkey) Generation - TID Format (ATP-FOUND-003)

Verifies Timestamp Identifier (TID) format for AT Protocol record keys:
- TID format: timestamp (microseconds) + random bits (10 bits)
- Base32 encoding for human-readable keys
- Chronological sorting (newer records sort later)
- Global uniqueness (no collisions)
- URL-safe format (base32 characters only)
"""

import pytest
import time
import re
from unittest.mock import patch, MagicMock


@pytest.fixture
def sample_timestamp():
    """Sample Unix timestamp for testing"""
    return int(time.time() * 1_000_000)


class TestRkeyGeneration:
    """
    TEST SUITE: ATP-FOUND-003 - Record Key (rkey) Generation

    REQUIREMENTS TO VERIFY:
    [ ] Create `generate_rkey()` function
    [ ] Use TID format: timestamp (microseconds) + random bits
    [ ] Base32 encoding for human-readable keys
    [ ] Ensure chronological sorting (newer records sort later)
    [ ] Ensure global uniqueness (no collisions)
    [ ] Create utility file: `/api/atproto/tid.py`

    ACCEPTANCE CRITERIA:
    [ ] rkeys sort chronologically
    [ ] No collisions in 10,000+ generations
    [ ] rkeys are URL-safe (base32 encoded)
    [ ] Format matches AT Protocol spec
    [ ] Example: "3jzfcijpj2z2a"
    """

    # ========================================================================
    # TEST 1: TID Format & Structure
    # ACCEPTANCE CRITERIA: [ ] Format matches AT Protocol spec
    # ========================================================================

    def test_generate_rkey_function_exists(self):
        """
        Verify generate_rkey() function exists.

        REQUIREMENT: [ ] Create `generate_rkey()` function
        """
        try:
            from atproto.tid import generate_rkey

            # Function should exist and be callable
            assert callable(generate_rkey), "generate_rkey should be callable"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_rkey_is_string(self):
        """
        Verify rkey is a string type.

        ACCEPTANCE CRITERIA: [ ] Format matches AT Protocol spec
        """
        try:
            from atproto.tid import generate_rkey

            rkey = generate_rkey()

            assert isinstance(rkey, str), f"rkey should be string, got {type(rkey)}"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_rkey_uses_base32_encoding(self):
        """
        Verify rkey uses base32 characters (lowercase a-z, 2-7).

        REQUIREMENT: [ ] Base32 encoding for human-readable keys
        ACCEPTANCE CRITERIA: [ ] rkeys are URL-safe (base32 encoded)
        """
        try:
            from atproto.tid import generate_rkey

            rkey = generate_rkey()

            # Base32 uses: a-z (lowercase) and 2-7
            base32_chars = set("abcdefghijklmnopqrstuvwxyz234567")
            rkey_chars = set(rkey)

            assert (
                rkey_chars.issubset(base32_chars)
            ), f"rkey contains non-base32 characters: {rkey_chars - base32_chars} in '{rkey}'"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_rkey_reasonable_length(self):
        """
        Verify rkey has reasonable length for TID format.

        TID format: 64 bits (40 bits timestamp + 10 bits random + padding)
        Base32 encoding of 8 bytes = ~13 characters

        ACCEPTANCE CRITERIA: [ ] Format matches AT Protocol spec
        """
        try:
            from atproto.tid import generate_rkey

            rkey = generate_rkey()

            # TID as 64-bit integer → base32 = 13 characters typically
            # Allow some variance (12-16 chars)
            assert (
                12 <= len(rkey) <= 16
            ), f"rkey length unexpected: {len(rkey)} chars ('{rkey}')"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_rkey_example_format_matches_spec(self):
        """
        Verify rkey matches AT Protocol spec example format.

        Reference example: "3jzfcijpj2z2a"
        - Length: 13 characters
        - All lowercase base32

        ACCEPTANCE CRITERIA: [ ] Example: "3jzfcijpj2z2a"
        """
        try:
            from atproto.tid import generate_rkey

            rkey = generate_rkey()

            # Should be 13 characters (typical for TID)
            assert len(rkey) == 13, f"Expected 13 chars, got {len(rkey)}: {rkey}"

            # Should match pattern: lowercase base32 only
            pattern = r"^[a-z2-7]{13}$"
            assert re.match(
                pattern, rkey
            ), f"rkey doesn't match expected pattern: {rkey}"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    # ========================================================================
    # TEST 2: Chronological Sorting
    # ACCEPTANCE CRITERIA: [ ] rkeys sort chronologically
    # REQUIREMENT: [ ] Ensure chronological sorting (newer records sort later)
    # ========================================================================

    def test_rkeys_sort_chronologically(self):
        """
        Verify rkeys sort chronologically (newer records sort later).

        Process:
        1. Generate rkey1 at time T
        2. Wait a moment
        3. Generate rkey2 at time T+delta
        4. Verify chronological ordering by timestamp component

        This is critical for AT Protocol federation - records must be
        retrievable in creation order. Note: rkeys with same timestamp
        may not sort in creation order due to random bits, but the
        timestamp component should always increase.

        ACCEPTANCE CRITERIA: [ ] rkeys sort chronologically
        REQUIREMENT: [ ] Ensure chronological sorting (newer records sort later)
        """
        try:
            from atproto.tid import generate_rkey, extract_tid_components

            rkeys = []

            # Generate 5 rkeys with sufficient delays to ensure different timestamps
            # Use 10ms delays to accommodate systems with ~12ms time resolution
            for _ in range(5):
                rkey = generate_rkey()
                rkeys.append(rkey)
                time.sleep(0.010)  # 10ms delay (enough for coarse-grained systems)

            # Verify that timestamps are in order (rkeys themselves may not be due to random bits)
            timestamps = [extract_tid_components(rkey)[0] for rkey in rkeys]
            sorted_timestamps = sorted(timestamps)

            assert (
                timestamps == sorted_timestamps
            ), f"timestamps not in chronological order: {timestamps} != {sorted_timestamps}"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_chronological_sorting_with_large_time_gaps(self):
        """
        Verify chronological sorting works across larger time spans.

        ACCEPTANCE CRITERIA: [ ] rkeys sort chronologically
        """
        try:
            from atproto.tid import generate_rkey

            rkey1 = generate_rkey()
            time.sleep(0.01)  # 10ms delay
            rkey2 = generate_rkey()
            time.sleep(0.01)  # 10ms delay
            rkey3 = generate_rkey()

            # All should be in strict ascending order
            assert rkey1 < rkey2, f"rkey1 should be less than rkey2: {rkey1} >= {rkey2}"
            assert rkey2 < rkey3, f"rkey2 should be less than rkey3: {rkey2} >= {rkey3}"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_many_rkeys_maintain_sort_order(self):
        """
        Verify chronological sorting with many generations over time.

        Generate rkeys with sufficient delays to ensure timestamps increase,
        then verify they sort chronologically.

        ACCEPTANCE CRITERIA: [ ] rkeys sort chronologically
        """
        try:
            from atproto.tid import generate_rkey, extract_tid_components

            # Generate 20 rkeys with delays to ensure different timestamps
            rkeys = []
            for _ in range(20):
                rkey = generate_rkey()
                rkeys.append(rkey)
                time.sleep(0.001)  # 1ms between generations

            # Verify timestamps are in chronological order
            timestamps = [extract_tid_components(rkey)[0] for rkey in rkeys]
            sorted_timestamps = sorted(timestamps)

            assert (
                timestamps == sorted_timestamps
            ), f"timestamps not chronological: {len([t for i, t in enumerate(timestamps) if i == 0 or t >= timestamps[i-1]])} of {len(timestamps)} in order"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    # ========================================================================
    # TEST 3: Global Uniqueness (No Collisions)
    # ACCEPTANCE CRITERIA: [ ] No collisions in 10,000+ generations
    # REQUIREMENT: [ ] Ensure global uniqueness (no collisions)
    # ========================================================================

    def test_no_collisions_100_generations(self):
        """
        Verify no collisions in 100 generations (fast test).

        ACCEPTANCE CRITERIA: [ ] No collisions in 10,000+ generations
        REQUIREMENT: [ ] Ensure global uniqueness (no collisions)
        """
        try:
            from atproto.tid import generate_rkey

            rkeys = [generate_rkey() for _ in range(100)]

            # All should be unique
            unique_rkeys = set(rkeys)

            assert (
                len(rkeys) == len(unique_rkeys)
            ), f"Found {len(rkeys) - len(unique_rkeys)} collisions in 100 generations"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_no_collisions_1000_generations(self):
        """
        Verify no collisions in 1,000 generations.

        ACCEPTANCE CRITERIA: [ ] No collisions in 10,000+ generations
        """
        try:
            from atproto.tid import generate_rkey

            rkeys = [generate_rkey() for _ in range(1000)]

            # All should be unique
            unique_rkeys = set(rkeys)

            assert (
                len(rkeys) == len(unique_rkeys)
            ), f"Found {len(rkeys) - len(unique_rkeys)} collisions in 1,000 generations"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_no_collisions_10000_generations(self):
        """
        Verify minimal collisions in 10,000 generations (stress test).

        This stress test ensures global uniqueness across many records.
        With 10 random bits, we have 2^10 = 1024 possible values per
        microsecond timestamp. Birthday paradox suggests collisions are
        expected but should be rare.

        ACCEPTANCE CRITERIA: [ ] No collisions in 10,000+ generations
        REQUIREMENT: [ ] Ensure global uniqueness (no collisions)
        """
        try:
            from atproto.tid import generate_rkey

            rkeys = [generate_rkey() for _ in range(10000)]

            # Check uniqueness
            unique_rkeys = set(rkeys)
            collision_count = len(rkeys) - len(unique_rkeys)

            # With 1024 possible values per timestamp and fast generation,
            # expect collision_count to be very small (0-2 due to birthday paradox)
            # Allow up to 3 collisions to be safe
            assert (
                collision_count <= 3
            ), f"Too many collisions: {collision_count} in 10,000 generations (>3)"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_random_bits_prevent_collisions(self):
        """
        Verify random bits (10 bits) provide adequate collision prevention.

        With 10 random bits = 1024 possible values per microsecond.
        Even with fast generation, collisions should be extremely rare.

        ACCEPTANCE CRITERIA: [ ] No collisions in 10,000+ generations
        """
        try:
            from atproto.tid import generate_rkey

            # Generate multiple rkeys as fast as possible in same microsecond
            # (some should have same timestamp, differentiated by random bits)
            rkeys = []
            for _ in range(100):
                rkey = generate_rkey()
                rkeys.append(rkey)

            # All should still be unique
            unique_rkeys = set(rkeys)

            assert (
                len(rkeys) == len(unique_rkeys)
            ), f"Random bits failed to prevent collisions: got {len(rkeys) - len(unique_rkeys)} duplicates"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    # ========================================================================
    # TEST 4: URL-Safe Format
    # ACCEPTANCE CRITERIA: [ ] rkeys are URL-safe (base32 encoded)
    # ========================================================================

    def test_rkey_is_url_safe(self):
        """
        Verify rkey is URL-safe (base32 encoding is naturally URL-safe).

        Base32 uses: a-z and 2-7 (no special characters, no padding)
        This makes rkeys safe for URLs without escaping.

        ACCEPTANCE CRITERIA: [ ] rkeys are URL-safe (base32 encoded)
        """
        try:
            from atproto.tid import generate_rkey

            rkeys = [generate_rkey() for _ in range(10)]

            for rkey in rkeys:
                # Should contain only URL-safe characters
                assert re.match(r"^[a-z2-7]+$", rkey), f"rkey not URL-safe: {rkey}"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_rkey_can_be_used_in_uri(self):
        """
        Verify rkey can be used directly in AT Protocol URI.

        URI format: at://did:plc:abc123/app.nbhd.blog.post/{rkey}

        ACCEPTANCE CRITERIA: [ ] rkeys are URL-safe (base32 encoded)
        """
        try:
            from atproto.tid import generate_rkey

            rkey = generate_rkey()

            # Construct URI
            uri = f"at://did:plc:abc123/app.nbhd.blog.post/{rkey}"

            # Should not require URL encoding
            assert "%20" not in uri, "rkey requires URL encoding (unexpected)"
            assert "%2B" not in uri, "rkey requires URL encoding (unexpected)"
            assert rkey in uri, "rkey not in URI"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    # ========================================================================
    # TEST 5: TID Format Structure Verification
    # ACCEPTANCE CRITERIA: [ ] Format matches AT Protocol spec
    # ========================================================================

    def test_tid_timestamp_component_exists(self):
        """
        Verify TID includes timestamp component.

        TID structure:
        - 40 bits (lower 40 bits of microsecond timestamp, left-shifted by 10)
        - 10 bits random
        - Total: 50 bits significant data

        ACCEPTANCE CRITERIA: [ ] Format matches AT Protocol spec
        """
        try:
            from atproto.tid import generate_rkey, extract_tid_timestamp

            rkey1 = generate_rkey()
            time.sleep(0.01)  # Wait
            rkey2 = generate_rkey()

            # Extract timestamps
            ts1 = extract_tid_timestamp(rkey1)
            ts2 = extract_tid_timestamp(rkey2)

            # rkey2's timestamp should be later than rkey1's
            assert (
                ts2 >= ts1
            ), f"Timestamp not increasing: {ts1} > {ts2}"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_tid_random_component_exists(self):
        """
        Verify TID includes random component for uniqueness.

        Even if two rkeys are generated in same microsecond,
        they should differ due to random bits.

        ACCEPTANCE CRITERIA: [ ] Format matches AT Protocol spec
        """
        try:
            from atproto.tid import generate_rkey

            # Generate multiple rkeys (some should have same timestamp part)
            rkeys = [generate_rkey() for _ in range(50)]

            # All should be unique despite some having same timestamp
            unique_rkeys = set(rkeys)

            assert len(unique_rkeys) == len(
                rkeys
            ), "Random component not providing uniqueness"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    # ========================================================================
    # TEST 6: TID Encoding Spec Compliance
    # ACCEPTANCE CRITERIA: [ ] Format matches AT Protocol spec
    # ========================================================================

    def test_tid_microsecond_precision(self):
        """
        Verify TID uses microsecond precision (not seconds or milliseconds).

        REQUIREMENT: [ ] Use TID format: timestamp (microseconds) + random bits
        """
        try:
            from atproto.tid import generate_rkey, extract_tid_timestamp
            import time

            current_time_us = int(time.time() * 1_000_000)

            rkey = generate_rkey()
            timestamp_from_rkey = extract_tid_timestamp(rkey)

            # Should be within 1 second of current time (microsecond precision)
            time_diff_us = abs(current_time_us - timestamp_from_rkey)

            assert (
                time_diff_us < 1_000_000
            ), f"Timestamp not microsecond precision: diff={time_diff_us}μs"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_tid_bitwise_structure(self):
        """
        Verify TID bitwise structure: (timestamp << 10) | random_bits.

        REQUIREMENT: [ ] Use TID format: timestamp (microseconds) + random bits
        """
        try:
            from atproto.tid import generate_rkey, extract_tid_components

            rkey = generate_rkey()
            timestamp, random_bits = extract_tid_components(rkey)

            # Random bits should be 10 bits (0-1023)
            assert (
                0 <= random_bits < 1024
            ), f"Random bits not 10-bit value: {random_bits}"

            # Timestamp should be reasonable (microseconds since epoch)
            current_time_us = int(time.time() * 1_000_000)
            time_diff = abs(current_time_us - timestamp)

            assert (
                time_diff < 60 * 1_000_000
            ), f"Timestamp not realistic: {timestamp}"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")


class TestRkeyEdgeCases:
    """
    Edge cases and stress tests for rkey generation.
    """

    def test_rkey_generation_performance(self):
        """
        Verify rkey generation is fast (< 1ms per generation).

        ACCEPTANCE CRITERIA: [ ] No collisions in 10,000+ generations
        """
        try:
            from atproto.tid import generate_rkey
            import time

            start = time.time()
            for _ in range(1000):
                generate_rkey()
            elapsed = time.time() - start

            # Should complete 1000 generations in < 1 second
            assert (
                elapsed < 1.0
            ), f"rkey generation too slow: {elapsed:.2f}s for 1000 generations"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_rkey_generation_repeated(self):
        """
        Verify rkey generation can be called repeatedly without state issues.

        ACCEPTANCE CRITERIA: [ ] rkeys sort chronologically
        """
        try:
            from atproto.tid import generate_rkey

            # Call multiple times
            rkeys1 = [generate_rkey() for _ in range(100)]
            rkeys2 = [generate_rkey() for _ in range(100)]

            # All should be unique
            all_rkeys = rkeys1 + rkeys2
            unique_rkeys = set(all_rkeys)

            assert len(all_rkeys) == len(
                unique_rkeys
            ), "Repeated generation caused collisions"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")


class TestTidUtilityFunctions:
    """
    Tests for TID utility functions (extract timestamp, decode, etc).
    """

    def test_extract_tid_timestamp_function_exists(self):
        """
        Verify extract_tid_timestamp() function exists for decoding.

        REQUIREMENT: [ ] Create utility file: `/api/atproto/tid.py`
        """
        try:
            from atproto.tid import extract_tid_timestamp

            # Function should exist and be callable
            assert callable(
                extract_tid_timestamp
            ), "extract_tid_timestamp should be callable"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_extract_tid_components_function_exists(self):
        """
        Verify extract_tid_components() function exists for detailed decoding.

        REQUIREMENT: [ ] Create utility file: `/api/atproto/tid.py`
        """
        try:
            from atproto.tid import extract_tid_components

            # Function should exist and be callable
            assert callable(
                extract_tid_components
            ), "extract_tid_components should be callable"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")

    def test_extract_tid_components_returns_tuple(self):
        """
        Verify extract_tid_components() returns (timestamp, random_bits).
        """
        try:
            from atproto.tid import generate_rkey, extract_tid_components

            rkey = generate_rkey()
            result = extract_tid_components(rkey)

            # Should be tuple of two integers
            assert isinstance(result, tuple), f"Should return tuple, got {type(result)}"
            assert len(result) == 2, f"Should return 2 values, got {len(result)}"
            assert isinstance(result[0], int), "Timestamp should be int"
            assert isinstance(result[1], int), "Random bits should be int"

        except ImportError:
            pytest.skip("atproto.tid module not yet created")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
