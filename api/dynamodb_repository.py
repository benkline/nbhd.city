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

async def create_neighborhood(table, name: str, description: Optional[str], created_by: str) -> dict:
    """
    Create a new neighborhood.

    Args:
        table: DynamoDB table resource
        name: Neighborhood name (must be unique)
        description: Optional description
        created_by: BlueSky DID of creator

    Returns:
        dict: Created neighborhood item

    Raises:
        ValueError: If neighborhood name already exists
    """
    # Check if name already exists using GSI2
    response = await table.query(
        IndexName="GSI2",
        KeyConditionExpression=Key("name_lower").eq(name.lower()),
        Limit=1
    )

    if response.get("Items"):
        raise ValueError(f"Neighborhood with name '{name}' already exists")

    # Generate ID and create item
    nbhd_id = generate_id()
    timestamp = now_iso()

    item = {
        "PK": f"NBHD#{nbhd_id}",
        "SK": "METADATA",
        "id": nbhd_id,
        "name": name,
        "name_lower": name.lower(),
        "description": description or "",
        "created_by": created_by,
        "created_at": timestamp,
        "updated_at": timestamp,
        "member_count": 0,  # Will be incremented when creator joins
        "entity_type": "neighborhood"
    }

    await table.put_item(Item=item)
    return item


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


async def update_neighborhood(
    table,
    nbhd_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None
) -> Optional[dict]:
    """
    Update neighborhood metadata.

    Args:
        table: DynamoDB table resource
        nbhd_id: Neighborhood UUID
        name: New name (optional)
        description: New description (optional)

    Returns:
        dict or None: Updated neighborhood item

    Raises:
        ValueError: If new name conflicts with existing neighborhood
    """
    # Build update expression dynamically
    update_expr = ["updated_at = :updated_at"]
    expr_values = {":updated_at": now_iso()}

    if name is not None:
        # Check if new name conflicts with existing neighborhood
        response = await table.query(
            IndexName="GSI2",
            KeyConditionExpression=Key("name_lower").eq(name.lower()),
            Limit=1
        )
        existing = response.get("Items", [])
        if existing and existing[0]["id"] != nbhd_id:
            raise ValueError(f"Neighborhood with name '{name}' already exists")

        update_expr.append("name = :name")
        update_expr.append("name_lower = :name_lower")
        expr_values[":name"] = name
        expr_values[":name_lower"] = name.lower()

    if description is not None:
        update_expr.append("description = :description")
        expr_values[":description"] = description

    response = await table.update_item(
        Key={"PK": f"NBHD#{nbhd_id}", "SK": "METADATA"},
        UpdateExpression="SET " + ", ".join(update_expr),
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW"
    )

    return response.get("Attributes")


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
