"""
AT Protocol DID (Decentralized Identifier) utilities.

Implements DID generation and management for nbhd members.
Supports did:plc format (service-independent, key-based DIDs).

Reference: https://atproto.com/specs/did
"""

import os
import base32
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

__all__ = [
    'generate_keypair',
    'generate_did',
    'encode_public_key',
    'format_did_document',
]


def generate_keypair(bits: int = 2048) -> tuple[bytes, bytes]:
    """
    Generate RSA keypair for DID.

    Args:
        bits: RSA key size (default: 2048)

    Returns:
        Tuple of (public_key_bytes, private_key_bytes)

    Example:
        >>> public_pem, private_pem = generate_keypair()
        >>> print(public_pem[:30])
        b'-----BEGIN PUBLIC KEY-----'
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=bits,
        backend=default_backend()
    )

    # Export to PEM format
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    return public_pem, private_pem


def encode_public_key(public_key_pem: bytes) -> str:
    """
    Encode public key for DID.

    Converts PEM format to base32-encoded form used in DID.

    Args:
        public_key_pem: Public key in PEM format (bytes)

    Returns:
        Base32-encoded key suitable for DID

    Example:
        >>> key_bytes = b'...'
        >>> encoded = encode_public_key(key_bytes)
        >>> print(encoded)
        'abcd1234xyz789...'
    """
    # Remove PEM headers
    key_data = public_key_pem.replace(b'-----BEGIN PUBLIC KEY-----', b'')
    key_data = key_data.replace(b'-----END PUBLIC KEY-----', b'')
    key_data = key_data.replace(b'\n', b'')
    key_data = key_data.replace(b'\r', b'')

    # Decode from base64 (PEM is base64-encoded)
    import base64
    key_bytes = base64.b64decode(key_data)

    # Encode as base32 for DID
    # Use standard base32 encoding
    encoded = base32.rfc4648_encode(key_bytes).decode('ascii').rstrip('=').lower()

    return encoded


def generate_did() -> str:
    """
    Generate a new DID in did:plc format.

    Format: did:plc:{base32_encoded_key_material}

    Returns:
        A valid did:plc identifier

    Example:
        >>> did = generate_did()
        >>> print(did)
        'did:plc:z72i7hdynmk6r22ghf7jicvam'
        >>> assert did.startswith('did:plc:')
    """
    # For did:plc, the key material is a base32-encoded public key
    # We generate a random seed and derive the DID from it

    # Generate a random 32-byte seed
    seed = os.urandom(32)

    # Encode as base32
    encoded_seed = base32.rfc4648_encode(seed).decode('ascii').rstrip('=').lower()

    # Create DID
    did = f"did:plc:{encoded_seed}"

    return did


def format_did_document(
    did: str,
    public_key_pem: bytes,
    service_endpoint: str = "https://api.nbhd.city"
) -> dict:
    """
    Format a complete DID document.

    DID documents describe how to find and verify a DID holder.

    Args:
        did: The DID identifier
        public_key_pem: Public key in PEM format
        service_endpoint: URL where DID holder can be reached

    Returns:
        DID document dict suitable for JSON

    Example:
        >>> did = "did:plc:abc123"
        >>> public_key = b'...'
        >>> doc = format_did_document(did, public_key)
        >>> print(doc['id'])
        'did:plc:abc123'
    """
    # Extract key ID from DID (typically the DID itself)
    key_id = f"{did}#key-0"

    # Encode public key for the document
    encoded_key = encode_public_key(public_key_pem)

    document = {
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": did,
        "publicKey": [
            {
                "id": key_id,
                "type": "RsaVerificationKey2018",
                "controller": did,
                "publicKeyPem": public_key_pem.decode('utf-8'),
                "publicKeyBase32": encoded_key,
            }
        ],
        "service": [
            {
                "id": f"{did}#atproto_pds",
                "type": "AtprotoPersonalDataServer",
                "serviceEndpoint": service_endpoint,
            }
        ],
        "authentication": [key_id],
        "assertionMethod": [key_id],
    }

    return document


# Implement base32 encoding if not available
class base32:
    @staticmethod
    def rfc4648_encode(data: bytes) -> bytes:
        """RFC 4648 base32 encoding."""
        import base64
        # Python's base64 has standard base32
        return base64.b32encode(data)


if __name__ == "__main__":
    # Example usage
    print("DID Generation Examples:")
    print()

    # Generate keypair
    print("1. Generate keypair:")
    public_key, private_key = generate_keypair()
    print(f"   Public key: {public_key[:50]}...")
    print(f"   Private key: {private_key[:50]}...")
    print()

    # Generate DID
    print("2. Generate DID:")
    did = generate_did()
    print(f"   DID: {did}")
    print()

    # Format DID document
    print("3. Format DID document:")
    doc = format_did_document(did, public_key)
    print(f"   Document ID: {doc['id']}")
    print(f"   Has public key: {'publicKey' in doc}")
    print(f"   Service endpoint: {doc['service'][0]['serviceEndpoint']}")
