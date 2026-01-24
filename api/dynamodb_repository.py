"""
DynamoDB data access layer for neighborhoods, memberships, and users.

This module provides async functions for all database operations,
replacing the previous SQLAlchemy-based crud.py.
"""

from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict
from boto3.dynamodb.conditions import Key
import uuid


# Utility Functions

def generate_id() -> str:
    """Generate a unique ID for new items."""
    return str(uuid.uuid4())


def now_iso() -> str:
    """Get current timestamp in ISO format with UTC timezone."""
    return datetime.now(timezone.utc).isoformat()


# Neighborhood Operations

async def get_neighborhood(table, nbhd_id: str) -> Optional[dict]:
    """
    Get neighborhood by ID.

    Args:
        table: DynamoDB table resource
        nbhd_id: Neighborhood UUID

    Returns:
        dict or None: Neighborhood item if found
    """
    response = await table.get_item(
        Key={"PK": f"NBHD#{nbhd_id}", "SK": "METADATA"}
    )
    return response.get("Item")


async def list_neighborhoods(
    table,
    limit: int = 100,
    last_key: Optional[dict] = None
) -> Tuple[List[dict], Optional[dict]]:
    """
    List all neighborhoods, paginated and sorted by creation date (newest first).

    Args:
        table: DynamoDB table resource
        limit: Maximum number of items to return
        last_key: Last evaluated key from previous query (for pagination)

    Returns:
        tuple: (list of neighborhood items, next pagination key or None)
    """
    params = {
        "IndexName": "GSI1",
        "KeyConditionExpression": Key("entity_type").eq("neighborhood"),
        "ScanIndexForward": False,  # Descending order (newest first)
        "Limit": limit
    }

    if last_key:
        params["ExclusiveStartKey"] = last_key

    response = await table.query(**params)
    return response.get("Items", []), response.get("LastEvaluatedKey")


async def get_neighborhood_with_members(table, nbhd_id: str) -> Tuple[Optional[dict], List[dict]]:
    """
    Get neighborhood and all its members in a single query.

    Args:
        table: DynamoDB table resource
        nbhd_id: Neighborhood UUID

    Returns:
        tuple: (neighborhood dict or None, list of membership dicts)
    """
    response = await table.query(
        KeyConditionExpression=Key("PK").eq(f"NBHD#{nbhd_id}")
    )

    items = response.get("Items", [])
    nbhd = None
    members = []

    for item in items:
        if item["SK"] == "METADATA":
            nbhd = item
        elif item["SK"].startswith("MEMBER#"):
            members.append(item)

    return nbhd, members


# Membership Operations

async def create_membership(table, user_id: str, nbhd_id: str) -> dict:
    """
    Create a membership (user joins neighborhood).

    Args:
        table: DynamoDB table resource
        user_id: BlueSky DID of user
        nbhd_id: Neighborhood UUID

    Returns:
        dict: Created membership item

    Raises:
        ValueError: If membership already exists
    """
    # Check if membership already exists
    existing = await get_membership(table, user_id, nbhd_id)
    if existing:
        raise ValueError("User is already a member of this neighborhood")

    timestamp = now_iso()

    item = {
        "PK": f"NBHD#{nbhd_id}",
        "SK": f"MEMBER#{user_id}",
        "user_id": user_id,
        "neighborhood_id": nbhd_id,
        "joined_at": timestamp,
        "entity_type": "membership"
    }

    # Use batch write for atomicity: create membership + increment count
    await table.put_item(Item=item)

    # Increment member count
    await table.update_item(
        Key={"PK": f"NBHD#{nbhd_id}", "SK": "METADATA"},
        UpdateExpression="ADD member_count :inc",
        ExpressionAttributeValues={":inc": 1}
    )

    return item


async def get_membership(table, user_id: str, nbhd_id: str) -> Optional[dict]:
    """
    Check if user is member of neighborhood.

    Args:
        table: DynamoDB table resource
        user_id: BlueSky DID of user
        nbhd_id: Neighborhood UUID

    Returns:
        dict or None: Membership item if exists
    """
    response = await table.get_item(
        Key={"PK": f"NBHD#{nbhd_id}", "SK": f"MEMBER#{user_id}"}
    )
    return response.get("Item")


async def delete_membership(table, user_id: str, nbhd_id: str) -> bool:
    """
    Delete membership (user leaves neighborhood).

    Args:
        table: DynamoDB table resource
        user_id: BlueSky DID of user
        nbhd_id: Neighborhood UUID

    Returns:
        bool: True if membership was deleted, False if didn't exist
    """
    # Check if exists first
    existing = await get_membership(table, user_id, nbhd_id)
    if not existing:
        return False

    # Delete membership
    await table.delete_item(
        Key={"PK": f"NBHD#{nbhd_id}", "SK": f"MEMBER#{user_id}"}
    )

    # Decrement member count
    await table.update_item(
        Key={"PK": f"NBHD#{nbhd_id}", "SK": "METADATA"},
        UpdateExpression="ADD member_count :dec",
        ExpressionAttributeValues={":dec": -1}
    )

    return True


async def get_user_memberships(table, user_id: str) -> List[dict]:
    """
    Get all neighborhoods a user is member of.

    Args:
        table: DynamoDB table resource
        user_id: BlueSky DID of user

    Returns:
        list: List of neighborhood items (with member_count)
    """
    # Query GSI3 to get all memberships for user
    response = await table.query(
        IndexName="GSI3",
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False  # Newest first
    )

    memberships = response.get("Items", [])

    # Fetch full neighborhood details for each membership
    neighborhoods = []
    for membership in memberships:
        nbhd = await get_neighborhood(table, membership["neighborhood_id"])
        if nbhd:
            neighborhoods.append(nbhd)

    return neighborhoods


async def get_neighborhood_members(table, nbhd_id: str) -> List[dict]:
    """
    Get all members of a neighborhood.

    Args:
        table: DynamoDB table resource
        nbhd_id: Neighborhood UUID

    Returns:
        list: List of membership items
    """
    response = await table.query(
        KeyConditionExpression=Key("PK").eq(f"NBHD#{nbhd_id}") & Key("SK").begins_with("MEMBER#")
    )

    return response.get("Items", [])


# User Profile Operations

async def create_user_profile(
    table,
    user_id: str,
    handle: str,
    display_name: Optional[str] = None,
    avatar: Optional[str] = None,
    bio: Optional[str] = None,
    location: Optional[str] = None,
    email: Optional[str] = None
) -> dict:
    """
    Create a user profile.

    Args:
        table: DynamoDB table resource
        user_id: BlueSky DID
        handle: BlueSky handle
        display_name: User's display name
        avatar: Avatar URL
        bio: User bio/about text
        location: User's city/location
        email: User's email address

    Returns:
        dict: Created user profile item

    Raises:
        ValueError: If user profile already exists
    """
    # Check if profile already exists
    existing = await get_user_profile(table, user_id)
    if existing:
        raise ValueError(f"User profile for {user_id} already exists")

    timestamp = now_iso()

    item = {
        "PK": f"USER#{user_id}",
        "SK": "PROFILE",
        "user_id": user_id,
        "handle": handle,
        "display_name": display_name or handle,
        "avatar": avatar,
        "bio": bio or "",
        "location": location or "",
        "email": email or "",
        "created_at": timestamp,
        "updated_at": timestamp,
        "entity_type": "user"
    }

    await table.put_item(Item=item)
    return item


async def get_user_profile(table, user_id: str) -> Optional[dict]:
    """
    Get user profile by ID.

    Args:
        table: DynamoDB table resource
        user_id: BlueSky DID

    Returns:
        dict or None: User profile item if found
    """
    response = await table.get_item(
        Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
    )
    return response.get("Item")


async def update_user_profile(
    table,
    user_id: str,
    display_name: Optional[str] = None,
    avatar: Optional[str] = None,
    bio: Optional[str] = None,
    location: Optional[str] = None,
    email: Optional[str] = None
) -> Optional[dict]:
    """
    Update user profile.

    Args:
        table: DynamoDB table resource
        user_id: BlueSky DID
        display_name: New display name (optional)
        avatar: New avatar URL (optional)
        bio: New bio text (optional)
        location: New location (optional)
        email: New email (optional)

    Returns:
        dict or None: Updated user profile item
    """
    # Build update expression dynamically
    update_expr = ["updated_at = :updated_at"]
    expr_values = {":updated_at": now_iso()}

    if display_name is not None:
        update_expr.append("display_name = :display_name")
        expr_values[":display_name"] = display_name

    if avatar is not None:
        update_expr.append("avatar = :avatar")
        expr_values[":avatar"] = avatar

    if bio is not None:
        update_expr.append("bio = :bio")
        expr_values[":bio"] = bio

    if location is not None:
        update_expr.append("location = :location")
        expr_values[":location"] = location

    if email is not None:
        update_expr.append("email = :email")
        expr_values[":email"] = email

    response = await table.update_item(
        Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
        UpdateExpression="SET " + ", ".join(update_expr),
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW"
    )

    return response.get("Attributes")


async def get_user_profiles_batch(table, user_ids: List[str]) -> Dict[str, dict]:
    """
    Batch get multiple user profiles.

    Args:
        table: DynamoDB table resource
        user_ids: List of BlueSky DIDs

    Returns:
        dict: Dictionary mapping user_id to profile (only for found profiles)
    """
    if not user_ids:
        return {}

    # DynamoDB batch_get_item limits to 100 items
    user_ids = user_ids[:100]

    # Build keys for batch get
    keys = [{"PK": f"USER#{user_id}", "SK": "PROFILE"} for user_id in user_ids]

    # Use batch_get_item
    import aioboto3
    session = aioboto3.Session()

    # Get table name and endpoint from environment
    import os
    table_name = os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city")
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL")
    region = os.getenv("AWS_REGION", "us-east-1")

    async with session.resource(
        'dynamodb',
        endpoint_url=endpoint_url,
        region_name=region
    ) as dynamodb:
        dyn_table = await dynamodb.Table(table_name)

        # Batch get items
        response = await dyn_table.meta.client.batch_get_item(
            RequestItems={
                table_name: {
                    'Keys': keys
                }
            }
        )

        # Build result dictionary
        profiles = {}
        for item in response.get('Responses', {}).get(table_name, []):
            profiles[item['user_id']] = item

        return profiles


async def list_all_users(
    table,
    limit: int = 100,
    last_key: Optional[dict] = None
) -> Tuple[List[dict], Optional[dict]]:
    """
    List all users, paginated.

    Args:
        table: DynamoDB table resource
        limit: Maximum number of items to return
        last_key: Last evaluated key from previous query (for pagination)

    Returns:
        tuple: (list of user profile items, next pagination key or None)
    """
    params = {
        "IndexName": "GSI1",
        "KeyConditionExpression": Key("entity_type").eq("user"),
        "ScanIndexForward": False,  # Descending order (newest first)
        "Limit": limit
    }

    if last_key:
        params["ExclusiveStartKey"] = last_key

    response = await table.query(**params)
    return response.get("Items", []), response.get("LastEvaluatedKey")


# AT Protocol Record Operations (ATP-FOUND-004)

def _validate_did(did: str) -> None:
    """
    Validate DID format (did:plc:... or similar).

    Args:
        did: DID to validate

    Raises:
        ValueError: If DID is invalid
    """
    if not isinstance(did, str) or not did.startswith("did:"):
        raise ValueError(f"Invalid DID format: {did}")


def _validate_uri(uri: str) -> Tuple[str, str, str]:
    """
    Parse and validate AT Protocol URI format.

    URI format: at://did:plc:abc123/app.nbhd.blog.post/3jzfcijpj2z2a

    Args:
        uri: AT URI to parse

    Returns:
        tuple: (user_did, collection, rkey)

    Raises:
        ValueError: If URI format is invalid
    """
    if not isinstance(uri, str) or not uri.startswith("at://"):
        raise ValueError(f"Invalid AT URI format: {uri}")

    # Parse: at://DID/COLLECTION/RKEY
    parts = uri[5:].split("/")  # Remove "at://" prefix
    if len(parts) != 3:
        raise ValueError(f"Invalid AT URI format: {uri}")

    user_did, collection, rkey = parts
    if not user_did.startswith("did:"):
        raise ValueError(f"Invalid DID in URI: {user_did}")

    return user_did, collection, rkey


async def create_record(
    table,
    user_did: str,
    collection: str,
    value: Dict,
    cid: str,
    rkey: str
) -> Dict:
    """
    Create an AT Protocol record in DynamoDB.

    REQUIREMENT: [ ] `create_record(user_did, collection, value)` - Create with CID/rkey
    ACCEPTANCE CRITERIA: [ ] Can create records with valid CID and rkey

    Args:
        table: DynamoDB table resource
        user_did: User's DID (e.g., "did:plc:abc123")
        collection: Collection type (e.g., "app.nbhd.blog.post")
        value: Record value (the actual content)
        cid: Content Identifier (immutable hash)
        rkey: Record key (TID format)

    Returns:
        dict: Created record item

    Raises:
        ValueError: If parameters are invalid
    """
    # Validate inputs
    _validate_did(user_did)
    if not isinstance(collection, str) or not collection:
        raise ValueError("Collection must be non-empty string")
    if not isinstance(value, dict):
        raise ValueError("Value must be dict")
    if not isinstance(cid, str) or not cid:
        raise ValueError("CID must be non-empty string")
    if not isinstance(rkey, str) or not rkey:
        raise ValueError("rkey must be non-empty string")

    # Build AT Protocol URI
    uri = f"at://{user_did}/{collection}/{rkey}"
    timestamp = now_iso()

    # Create record item
    item = {
        "PK": f"USER#{user_did}",
        "SK": f"RECORD#{collection}#{rkey}",
        "uri": uri,
        "cid": cid,
        "record_type": collection,
        "rkey": rkey,
        "user_did": user_did,
        "value": value,
        "linked_record": None,
        "created_at": timestamp,
        "indexed_at": timestamp,
        "updated_at": timestamp
    }

    # Store in DynamoDB
    await table.put_item(Item=item)

    return item


async def get_record(table, uri: str) -> Optional[Dict]:
    """
    Get record by AT Protocol URI.

    REQUIREMENT: [ ] `get_record(uri)` - Get by AT URI
    ACCEPTANCE CRITERIA: [ ] Can retrieve records by AT URI

    Args:
        table: DynamoDB table resource
        uri: AT URI (e.g., "at://did:plc:abc123/app.nbhd.blog.post/3jzfcijpj2z2a")

    Returns:
        dict or None: Record item if found

    Raises:
        ValueError: If URI format is invalid
    """
    # Parse URI
    user_did, collection, rkey = _validate_uri(uri)

    # Get from DynamoDB
    response = await table.get_item(
        Key={
            "PK": f"USER#{user_did}",
            "SK": f"RECORD#{collection}#{rkey}"
        }
    )

    return response.get("Item")


async def query_records(
    table,
    user_did: str,
    collection: str
) -> List[Dict]:
    """
    Query all records of a collection for a user.

    REQUIREMENT: [ ] `query_records(user_did, collection)` - List records by type
    ACCEPTANCE CRITERIA: [ ] Can query all posts for a user

    Args:
        table: DynamoDB table resource
        user_did: User's DID
        collection: Collection type (e.g., "app.nbhd.blog.post")

    Returns:
        list: List of record items

    Raises:
        ValueError: If parameters are invalid
    """
    # Validate inputs
    _validate_did(user_did)
    if not isinstance(collection, str) or not collection:
        raise ValueError("Collection must be non-empty string")

    # Query by PK and SK prefix
    response = await table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{user_did}") & Key("SK").begins_with(f"RECORD#{collection}#"),
        ScanIndexForward=False  # Newest first
    )

    return response.get("Items", [])


async def update_record(
    table,
    uri: str,
    new_value: Dict
) -> Dict:
    """
    Update an AT Protocol record (immutable - creates new version).

    REQUIREMENT: [ ] `update_record(uri, new_value)` - Create new version (immutable)
    ACCEPTANCE CRITERIA: [ ] Updates create new record version (preserves history)
    REQUIREMENT: [ ] Link old/new versions on update

    Args:
        table: DynamoDB table resource
        uri: AT URI of record to update
        new_value: New record value

    Returns:
        dict: New record item with link to old version

    Raises:
        ValueError: If URI or value is invalid
    """
    # Validate inputs
    user_did, collection, old_rkey = _validate_uri(uri)
    if not isinstance(new_value, dict):
        raise ValueError("new_value must be dict")

    # Get old record to retrieve CID (needed to generate new one)
    # In practice, caller would provide new CID from generate_cid()
    # For now, we'll mark as linked but note caller responsibility
    old_record = await get_record(table, uri)
    if not old_record:
        raise ValueError(f"Record not found: {uri}")

    # Generate new rkey (caller would do this with generate_rkey())
    # For now, we'll use a simple approach: just append a version marker
    # In practice, this should come from caller or use generate_rkey()
    from atproto.tid import generate_rkey
    new_rkey = generate_rkey()

    # Generate new CID (caller would do this with generate_cid())
    # For now, we'll import and use it
    from atproto.cid import generate_cid
    new_cid = generate_cid(new_value)

    # Build new record with link to old
    new_uri = f"at://{user_did}/{collection}/{new_rkey}"
    timestamp = now_iso()

    new_record = {
        "PK": f"USER#{user_did}",
        "SK": f"RECORD#{collection}#{new_rkey}",
        "uri": new_uri,
        "cid": new_cid,
        "record_type": collection,
        "rkey": new_rkey,
        "user_did": user_did,
        "value": new_value,
        "linked_record": uri,  # Link to old version
        "created_at": timestamp,
        "indexed_at": timestamp,
        "updated_at": timestamp
    }

    # Store new record
    await table.put_item(Item=new_record)

    return new_record


async def delete_record(table, uri: str) -> Dict:
    """
    Soft delete an AT Protocol record (mark as deleted, don't remove).

    REQUIREMENT: [ ] `delete_record(uri)` - Soft delete (mark as deleted)
    ACCEPTANCE CRITERIA: [ ] Deletes are soft (record still exists, marked deleted)

    Args:
        table: DynamoDB table resource
        uri: AT URI of record to delete

    Returns:
        dict: Updated record with deleted_at timestamp

    Raises:
        ValueError: If URI is invalid or record not found
    """
    # Parse URI
    user_did, collection, rkey = _validate_uri(uri)

    # Get record first to verify it exists
    record = await get_record(table, uri)
    if not record:
        raise ValueError(f"Record not found: {uri}")

    # Mark as deleted (soft delete)
    timestamp = now_iso()

    response = await table.update_item(
        Key={
            "PK": f"USER#{user_did}",
            "SK": f"RECORD#{collection}#{rkey}"
        },
        UpdateExpression="SET deleted_at = :deleted_at, updated_at = :updated_at",
        ExpressionAttributeValues={
            ":deleted_at": timestamp,
            ":updated_at": timestamp
        },
        ReturnValues="ALL_NEW"
    )

    return response.get("Attributes", {})
