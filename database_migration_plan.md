# PostgreSQL to DynamoDB Migration Plan

## Executive Summary

This document outlines the migration plan from PostgreSQL to DynamoDB for the nbhd.city serverless API running on AWS Lambda + API Gateway.

**Why DynamoDB?**
- Serverless-native: No connection management, perfect for Lambda
- Auto-scaling: Handles traffic spikes automatically
- No cold start DB connections: Major benefit over RDS/PostgreSQL with Lambda
- Cost-effective: Pay only for what you use
- Performance: Single-digit millisecond latency

---

## Current State Analysis

### Current Stack
- **SQLAlchemy 2.0** with async support (`AsyncSession`)
- **asyncpg** for PostgreSQL async driver
- **Alembic** for database migrations
- **PostgreSQL** connection via `postgresql+asyncpg://` URL

### Current Schema

**Nbhd (neighborhoods) Table:**
- id (Integer, Primary Key)
- name (String, Unique)
- description (Text)
- created_by (String) - BlueSky DID
- created_at (DateTime)
- updated_at (DateTime)

**Membership Table:**
- id (Integer, Primary Key)
- user_id (String) - BlueSky DID
- neighborhood_id (Integer, Foreign Key)
- joined_at (DateTime)
- Unique constraint: (user_id, neighborhood_id)

### Current Query Patterns
1. Get all neighborhoods (paginated, ordered by created_at DESC)
2. Get neighborhood by ID
3. Get neighborhood with all members (with relationship)
4. Get neighborhoods by user (user's memberships)
5. Check if user is member of neighborhood
6. Create/delete memberships with uniqueness constraint
7. Count members per neighborhood

---

## DynamoDB Table Design

### Single Table Design

We'll use a **single table design** pattern for optimal performance and cost efficiency.

**Table Name:** `nbhd-city`

#### Access Patterns

| Pattern | Description | Keys Used |
|---------|-------------|-----------|
| 1. Get neighborhood by ID | Get single neighborhood metadata | PK=`NBHD#{id}`, SK=`METADATA` |
| 2. List all neighborhoods | Get all neighborhoods, sorted by creation date | GSI1: PK=`entity_type`, SK=`created_at` |
| 3. Check name uniqueness | Verify neighborhood name is unique | GSI2: PK=`name_lower`, SK=`NBHD#{id}` |
| 4. Get neighborhood members | Get all members of a neighborhood | PK=`NBHD#{id}`, SK begins_with `MEMBER#` |
| 5. Get user's memberships | Get all neighborhoods user belongs to | GSI3: PK=`user_id`, SK=`joined_at` |
| 6. Check membership exists | Verify user is member of neighborhood | PK=`NBHD#{id}`, SK=`MEMBER#{user_id}` |

#### Table Structure

**Primary Key:**
- **PK (Partition Key):** String
- **SK (Sort Key):** String

**Global Secondary Indexes:**

**GSI1 - List Neighborhoods**
- PK: `entity_type` (value: "neighborhood")
- SK: `created_at` (ISO timestamp)
- Projection: ALL

**GSI2 - Name Lookup**
- PK: `name_lower` (lowercase name)
- SK: `NBHD#{nbhd_id}`
- Projection: KEYS_ONLY

**GSI3 - User Memberships**
- PK: `user_id`
- SK: `joined_at` (ISO timestamp)
- Projection: ALL

#### Item Types

**Neighborhood Metadata Item:**
```json
{
  "PK": "NBHD#550e8400-e29b-41d4-a716-446655440000",
  "SK": "METADATA",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Neighborhood",
  "name_lower": "my neighborhood",
  "description": "A cool place for collaboration",
  "created_by": "did:plc:abc123xyz",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z",
  "member_count": 5,
  "entity_type": "neighborhood"
}
```

**Membership Item:**
```json
{
  "PK": "NBHD#550e8400-e29b-41d4-a716-446655440000",
  "SK": "MEMBER#did:plc:abc123xyz",
  "user_id": "did:plc:abc123xyz",
  "neighborhood_id": "550e8400-e29b-41d4-a716-446655440000",
  "joined_at": "2025-01-01T12:00:00Z",
  "entity_type": "membership"
}
```

**Key Design Decisions:**
- Use UUIDs instead of auto-incrementing integers for IDs
- Store `member_count` in neighborhood metadata for fast access
- Denormalize user_id in membership items for GSI3
- Use lowercase name field for case-insensitive uniqueness
- Use ISO timestamps for sorting and compatibility

---

## Implementation Plan

### Phase 1: Infrastructure Setup

#### 1.1 Create DynamoDB Table

**CloudFormation Template:** `infrastructure/dynamodb-table.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: DynamoDB table for nbhd.city

Resources:
  NbhdCityTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: nbhd-city
      BillingMode: PAY_PER_REQUEST  # On-demand pricing
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true

      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: entity_type
          AttributeType: S
        - AttributeName: created_at
          AttributeType: S
        - AttributeName: name_lower
          AttributeType: S
        - AttributeName: user_id
          AttributeType: S
        - AttributeName: joined_at
          AttributeType: S

      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE

      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: entity_type
              KeyType: HASH
            - AttributeName: created_at
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

        - IndexName: GSI2
          KeySchema:
            - AttributeName: name_lower
              KeyType: HASH
            - AttributeName: SK
              KeyType: RANGE
          Projection:
            ProjectionType: KEYS_ONLY

        - IndexName: GSI3
          KeySchema:
            - AttributeName: user_id
              KeyType: HASH
            - AttributeName: joined_at
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

      Tags:
        - Key: Environment
          Value: production
        - Key: Application
          Value: nbhd-city

Outputs:
  TableName:
    Value: !Ref NbhdCityTable
    Export:
      Name: NbhdCityTableName

  TableArn:
    Value: !GetAtt NbhdCityTable.Arn
    Export:
      Name: NbhdCityTableArn
```

**Deploy command:**
```bash
aws cloudformation create-stack \
  --stack-name nbhd-city-dynamodb \
  --template-body file://infrastructure/dynamodb-table.yaml \
  --region us-east-1
```

#### 1.2 Update Lambda IAM Permissions

Add DynamoDB permissions to Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/nbhd-city",
        "arn:aws:dynamodb:*:*:table/nbhd-city/index/*"
      ]
    }
  ]
}
```

#### 1.3 Update Environment Variables

**Lambda Configuration:**
```bash
DYNAMODB_TABLE_NAME=nbhd-city
AWS_REGION=us-east-1
# Remove: DATABASE_URL
```

**Local Development (.env.local):**
```bash
DYNAMODB_TABLE_NAME=nbhd-city-dev
AWS_REGION=us-east-1
AWS_PROFILE=default  # For local testing
```

---

### Phase 2: Code Changes

#### 2.1 Update Dependencies

**Update `api/requirements.txt`:**

```diff
 fastapi>=0.109.0
 uvicorn[standard]>=0.27.0
 pydantic>=2.6.0
 python-dotenv==1.0.0
 PyJWT>=2.8.0
 httpx>=0.25.0
 cryptography>=41.0.0
-sqlalchemy>=2.0.0
-asyncpg>=0.29.0
-alembic>=1.13.0
-psycopg2-binary>=2.9.9
-greenlet>=3.0.0
+boto3>=1.34.0
+aioboto3>=12.3.0
```

**Install new dependencies:**
```bash
cd api
pip install boto3>=1.34.0 aioboto3>=12.3.0
pip uninstall -y sqlalchemy asyncpg alembic psycopg2-binary greenlet
pip freeze > requirements.txt
```

#### 2.2 Create DynamoDB Client Module

**Create `api/dynamodb_client.py`:**

```python
"""
DynamoDB client configuration for nbhd.city API.
"""

import os
import aioboto3
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Get configuration from environment
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Create aioboto3 session
session = aioboto3.Session()


@asynccontextmanager
async def get_dynamodb_resource():
    """
    Get DynamoDB resource for low-level operations.

    Usage:
        async with get_dynamodb_resource() as dynamodb:
            table = await dynamodb.Table(TABLE_NAME)
            # Use table...
    """
    async with session.resource("dynamodb", region_name=AWS_REGION) as dynamodb:
        yield dynamodb


@asynccontextmanager
async def get_table():
    """
    Get DynamoDB table resource.

    This is the primary method for accessing the table in API endpoints.

    Usage:
        async with get_table() as table:
            response = await table.get_item(Key={"PK": "...", "SK": "..."})
            item = response.get("Item")
    """
    async with session.resource("dynamodb", region_name=AWS_REGION) as dynamodb:
        table = await dynamodb.Table(TABLE_NAME)
        yield table
```

#### 2.3 Create DynamoDB Repository Module

**Create `api/dynamodb_repository.py`:**

```python
"""
DynamoDB data access layer for neighborhoods and memberships.

This module provides async functions for all database operations,
replacing the previous SQLAlchemy-based crud.py.
"""

from datetime import datetime, timezone
from typing import Optional, List, Tuple
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
```

#### 2.4 Update API Models

**Update `api/models.py`** to handle UUID IDs instead of integers:

```python
# Change from:
class NbhdResponse(BaseModel):
    id: int
    # ...

# To:
class NbhdResponse(BaseModel):
    id: str  # UUID string
    # ...
```

#### 2.5 Update API Endpoints

**Update `api/nbhd.py`:**

```python
"""
API endpoints for nbhds and membership management.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional

from auth import get_current_user
from dynamodb_client import get_table
from dynamodb_repository import (
    create_membership,
    create_neighborhood,
    delete_membership,
    get_membership,
    get_neighborhood,
    get_neighborhood_with_members,
    list_neighborhoods,
    get_user_memberships,
)
from models import (
    NbhdCreate,
    NbhdDetailResponse,
    NbhdResponse,
    UserMembershipsResponse,
    MembershipResponse,
)

router = APIRouter()


@router.get("/api/nbhds", response_model=list[NbhdResponse])
async def list_nbhds(limit: int = 100, last_key: Optional[str] = None):
    """
    Get all nbhds with pagination.
    Public endpoint - no authentication required.
    """
    async with get_table() as table:
        nbhds, next_key = await list_neighborhoods(table, limit, last_key)
        return nbhds


@router.get("/api/nbhds/{nbhd_id}", response_model=NbhdDetailResponse)
async def get_nbhd_detail(nbhd_id: str):
    """
    Get nbhd details with member list.
    Public endpoint - no authentication required.
    """
    async with get_table() as table:
        nbhd, members = await get_neighborhood_with_members(table, nbhd_id)

        if not nbhd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nbhd with id {nbhd_id} not found",
            )

        # Convert memberships to response model
        member_responses = [
            MembershipResponse(
                id=m["SK"].replace("MEMBER#", ""),  # Extract user_id from SK
                user_id=m["user_id"],
                joined_at=m["joined_at"],
            )
            for m in members
        ]

        return NbhdDetailResponse(
            id=nbhd["id"],
            name=nbhd["name"],
            description=nbhd["description"],
            created_by=nbhd["created_by"],
            created_at=nbhd["created_at"],
            member_count=nbhd.get("member_count", 0),
            members=member_responses,
        )


@router.post("/api/nbhds", response_model=NbhdResponse, status_code=201)
async def create_new_nbhd(
    nbhd_data: NbhdCreate,
    user_id: str = Depends(get_current_user),
):
    """
    Create a new nbhd.
    Requires authentication. Creator is automatically added as first member.
    """
    async with get_table() as table:
        try:
            # Create nbhd
            nbhd = await create_neighborhood(
                table, nbhd_data.name, nbhd_data.description, user_id
            )

            # Auto-join the creator
            await create_membership(table, user_id, nbhd["id"])

            return NbhdResponse(
                id=nbhd["id"],
                name=nbhd["name"],
                description=nbhd["description"],
                created_by=nbhd["created_by"],
                created_at=nbhd["created_at"],
                member_count=1,
            )

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )


@router.get("/api/users/me/nbhds", response_model=UserMembershipsResponse)
async def get_my_nbhds(user_id: str = Depends(get_current_user)):
    """
    Get nbhds that the current user is a member of.
    Requires authentication.
    """
    async with get_table() as table:
        nbhds = await get_user_memberships(table, user_id)
        return UserMembershipsResponse(neighborhoods=nbhds)


@router.post("/api/nbhds/{nbhd_id}/join", status_code=201)
async def join_nbhd(nbhd_id: str, user_id: str = Depends(get_current_user)):
    """
    Join a nbhd.
    Requires authentication.
    """
    async with get_table() as table:
        # Check nbhd exists
        nbhd = await get_neighborhood(table, nbhd_id)
        if not nbhd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nbhd with id {nbhd_id} not found",
            )

        try:
            # Create membership
            await create_membership(table, user_id, nbhd_id)

            return {
                "message": "Successfully joined nbhd",
                "nbhd_id": nbhd_id,
            }

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )


@router.delete("/api/nbhds/{nbhd_id}/leave", status_code=204)
async def leave_nbhd(nbhd_id: str, user_id: str = Depends(get_current_user)):
    """
    Leave a nbhd.
    Requires authentication.
    """
    async with get_table() as table:
        deleted = await delete_membership(table, user_id, nbhd_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You are not a member of this nbhd",
            )

        return None
```

#### 2.6 Update Main Application

**Update `api/main.py`:**

```python
from fastapi import FastAPI, HTTPException, status, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import secrets
import os
import httpx
from dotenv import load_dotenv

# Load environment variables from .env.local file
load_dotenv('.env.local')

from models import Token, User, UserProfile
from auth import create_access_token, get_current_user, get_bluesky_token
from bluesky_oauth import get_oauth_authorize_url, exchange_code_for_token
from bluesky_api import get_bluesky_profile
# REMOVED: from database import init_db, close_db
from nbhd import router as nbhds_router


class TestLoginRequest(BaseModel):
    username: str
    password: str

app = FastAPI(title="nbhd.city API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(nbhds_router, tags=["nbhds"])

# Store OAuth states (in production, use a database or Redis)
oauth_states = {}


# REMOVED: Database startup/shutdown events
# DynamoDB doesn't need connection management


@app.get("/")
def read_root():
    return {"message": "Welcome to nbhd.city API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ... rest of the endpoints remain the same
```

#### 2.7 Remove Old Files

Delete the following files and directories:

```bash
rm api/database.py
rm api/db_models.py
rm api/crud.py
rm -rf api/alembic/
```

**Update `.gitignore`:**
```diff
+# DynamoDB Local (if using for testing)
+dynamodb-local/
+*.db
+
-# PostgreSQL
-*.sql
```

---

### Phase 3: Testing

#### 3.1 Local Testing with DynamoDB Local

**Install DynamoDB Local:**

```bash
# Using Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Or download JAR
wget https://s3.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

**Update `.env.local` for local testing:**
```bash
DYNAMODB_TABLE_NAME=nbhd-city-dev
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT_URL=http://localhost:8000  # For local DynamoDB
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
```

**Update `api/dynamodb_client.py` for local testing:**
```python
# Add support for local endpoint
DYNAMODB_ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT_URL")

@asynccontextmanager
async def get_table():
    kwargs = {"region_name": AWS_REGION}
    if DYNAMODB_ENDPOINT_URL:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT_URL

    async with session.resource("dynamodb", **kwargs) as dynamodb:
        table = await dynamodb.Table(TABLE_NAME)
        yield table
```

**Create local table:**
```bash
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name nbhd-city-dev \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=entity_type,AttributeType=S \
    AttributeName=created_at,AttributeType=S \
    AttributeName=name_lower,AttributeType=S \
    AttributeName=user_id,AttributeType=S \
    AttributeName=joined_at,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"GSI1\",
        \"KeySchema\": [{\"AttributeName\":\"entity_type\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"created_at\",\"KeyType\":\"RANGE\"}],
        \"Projection\":{\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
      },
      {
        \"IndexName\": \"GSI2\",
        \"KeySchema\": [{\"AttributeName\":\"name_lower\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"SK\",\"KeyType\":\"RANGE\"}],
        \"Projection\":{\"ProjectionType\":\"KEYS_ONLY\"},
        \"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
      },
      {
        \"IndexName\": \"GSI3\",
        \"KeySchema\": [{\"AttributeName\":\"user_id\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"joined_at\",\"KeyType\":\"RANGE\"}],
        \"Projection\":{\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
      }
    ]" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

#### 3.2 Unit Tests

**Create `api/tests/test_dynamodb_repository.py`:**

```python
import pytest
from moto import mock_dynamodb
import boto3
from dynamodb_repository import (
    create_neighborhood,
    get_neighborhood,
    list_neighborhoods,
    create_membership,
    get_membership,
)

@pytest.fixture
def dynamodb_table():
    """Create a mock DynamoDB table for testing."""
    with mock_dynamodb():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

        table = dynamodb.create_table(
            TableName="test-table",
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
                {"AttributeName": "entity_type", "AttributeType": "S"},
                {"AttributeName": "created_at", "AttributeType": "S"},
                {"AttributeName": "name_lower", "AttributeType": "S"},
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "joined_at", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "entity_type", "KeyType": "HASH"},
                        {"AttributeName": "created_at", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "GSI2",
                    "KeySchema": [
                        {"AttributeName": "name_lower", "KeyType": "HASH"},
                        {"AttributeName": "SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "KEYS_ONLY"},
                },
                {
                    "IndexName": "GSI3",
                    "KeySchema": [
                        {"AttributeName": "user_id", "KeyType": "HASH"},
                        {"AttributeName": "joined_at", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        yield table


@pytest.mark.asyncio
async def test_create_neighborhood(dynamodb_table):
    """Test creating a neighborhood."""
    nbhd = await create_neighborhood(
        dynamodb_table,
        name="Test Neighborhood",
        description="A test neighborhood",
        created_by="did:plc:test123"
    )

    assert nbhd["name"] == "Test Neighborhood"
    assert nbhd["created_by"] == "did:plc:test123"
    assert "id" in nbhd


@pytest.mark.asyncio
async def test_duplicate_neighborhood_name(dynamodb_table):
    """Test that duplicate neighborhood names are rejected."""
    await create_neighborhood(
        dynamodb_table,
        name="Duplicate",
        description="First",
        created_by="did:plc:user1"
    )

    with pytest.raises(ValueError, match="already exists"):
        await create_neighborhood(
            dynamodb_table,
            name="Duplicate",
            description="Second",
            created_by="did:plc:user2"
        )


@pytest.mark.asyncio
async def test_membership_operations(dynamodb_table):
    """Test creating and checking memberships."""
    # Create neighborhood first
    nbhd = await create_neighborhood(
        dynamodb_table,
        name="Test",
        description="Test",
        created_by="did:plc:creator"
    )

    # Create membership
    membership = await create_membership(
        dynamodb_table,
        user_id="did:plc:user1",
        nbhd_id=nbhd["id"]
    )

    assert membership["user_id"] == "did:plc:user1"
    assert membership["neighborhood_id"] == nbhd["id"]

    # Check membership exists
    existing = await get_membership(
        dynamodb_table,
        user_id="did:plc:user1",
        nbhd_id=nbhd["id"]
    )

    assert existing is not None
```

**Install test dependencies:**
```bash
pip install pytest pytest-asyncio moto[dynamodb]
```

**Run tests:**
```bash
pytest api/tests/
```

#### 3.3 Integration Tests

Test the API endpoints with a local DynamoDB instance:

```bash
# Start local DynamoDB
docker run -p 8000:8000 amazon/dynamodb-local

# Create test table
# (use script from 3.1)

# Start API server
cd api
uvicorn main:app --reload

# Run integration tests (using curl, Postman, or automated tests)
curl http://localhost:8000/api/nbhds
```

---

### Phase 4: Data Migration

#### 4.1 Export Existing Data from PostgreSQL

**Create `scripts/export_postgres_data.py`:**

```python
"""
Export data from PostgreSQL to JSON files.
Run this before migration to backup all data.
"""

import asyncio
import asyncpg
import json
import os
from datetime import datetime


async def export_data():
    """Export all data from PostgreSQL to JSON."""

    # Connect to PostgreSQL
    database_url = os.getenv("DATABASE_URL", "postgresql://localhost/nbhd_city")
    # Convert asyncpg URL format
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(database_url)

    try:
        # Export neighborhoods
        neighborhoods = await conn.fetch("SELECT * FROM neighborhoods ORDER BY id")
        nbhds_data = []
        for nbhd in neighborhoods:
            nbhds_data.append({
                "id": nbhd["id"],
                "name": nbhd["name"],
                "description": nbhd["description"],
                "created_by": nbhd["created_by"],
                "created_at": nbhd["created_at"].isoformat(),
                "updated_at": nbhd["updated_at"].isoformat() if nbhd["updated_at"] else None,
            })

        with open("neighborhoods_export.json", "w") as f:
            json.dump(nbhds_data, f, indent=2)

        print(f"Exported {len(nbhds_data)} neighborhoods")

        # Export memberships
        memberships = await conn.fetch("SELECT * FROM memberships ORDER BY id")
        memberships_data = []
        for m in memberships:
            memberships_data.append({
                "id": m["id"],
                "user_id": m["user_id"],
                "neighborhood_id": m["neighborhood_id"],
                "joined_at": m["joined_at"].isoformat(),
            })

        with open("memberships_export.json", "w") as f:
            json.dump(memberships_data, f, indent=2)

        print(f"Exported {len(memberships_data)} memberships")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(export_data())
```

**Run export:**
```bash
cd scripts
python export_postgres_data.py
```

#### 4.2 Import Data to DynamoDB

**Create `scripts/import_to_dynamodb.py`:**

```python
"""
Import data from JSON exports to DynamoDB.
Maps PostgreSQL integer IDs to UUID format.
"""

import asyncio
import aioboto3
import json
import os
from datetime import datetime
import uuid


async def import_data():
    """Import data from JSON files to DynamoDB."""

    table_name = os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city")
    region = os.getenv("AWS_REGION", "us-east-1")

    session = aioboto3.Session()

    async with session.resource("dynamodb", region_name=region) as dynamodb:
        table = await dynamodb.Table(table_name)

        # Load exported data
        with open("neighborhoods_export.json", "r") as f:
            neighborhoods = json.load(f)

        with open("memberships_export.json", "r") as f:
            memberships = json.load(f)

        # Create ID mapping (old integer ID -> new UUID)
        id_mapping = {}

        # Import neighborhoods
        for nbhd in neighborhoods:
            new_id = str(uuid.uuid4())
            id_mapping[nbhd["id"]] = new_id

            # Count members for this neighborhood
            member_count = sum(1 for m in memberships if m["neighborhood_id"] == nbhd["id"])

            item = {
                "PK": f"NBHD#{new_id}",
                "SK": "METADATA",
                "id": new_id,
                "name": nbhd["name"],
                "name_lower": nbhd["name"].lower(),
                "description": nbhd["description"] or "",
                "created_by": nbhd["created_by"],
                "created_at": nbhd["created_at"],
                "updated_at": nbhd["updated_at"] or nbhd["created_at"],
                "member_count": member_count,
                "entity_type": "neighborhood"
            }

            await table.put_item(Item=item)
            print(f"Imported neighborhood: {nbhd['name']} (old ID {nbhd['id']} -> new ID {new_id})")

        # Import memberships
        for m in memberships:
            new_nbhd_id = id_mapping[m["neighborhood_id"]]

            item = {
                "PK": f"NBHD#{new_nbhd_id}",
                "SK": f"MEMBER#{m['user_id']}",
                "user_id": m["user_id"],
                "neighborhood_id": new_nbhd_id,
                "joined_at": m["joined_at"],
                "entity_type": "membership"
            }

            await table.put_item(Item=item)

        print(f"Imported {len(memberships)} memberships")
        print("Migration complete!")

        # Save ID mapping for reference
        with open("id_mapping.json", "w") as f:
            json.dump(id_mapping, f, indent=2)
        print("ID mapping saved to id_mapping.json")


if __name__ == "__main__":
    asyncio.run(import_data())
```

**Run import:**
```bash
cd scripts
python import_to_dynamodb.py
```

---

### Phase 5: Deployment

#### 5.1 Pre-Deployment Checklist

- [ ] DynamoDB table created in AWS
- [ ] Lambda IAM role updated with DynamoDB permissions
- [ ] Environment variables configured in Lambda
- [ ] Code changes tested locally with DynamoDB Local
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Data exported from PostgreSQL (if applicable)
- [ ] Backup of PostgreSQL database taken

#### 5.2 Deployment Steps

**Option A: Direct Deployment (Low Risk - No Existing Data)**

1. Deploy new Lambda function code
2. Update Lambda environment variables
3. Run data import script (if needed)
4. Test all endpoints
5. Decommission PostgreSQL database

**Option B: Blue-Green Deployment (Recommended for Production)**

1. Deploy new Lambda version (v2) alongside existing (v1)
2. Configure API Gateway with weighted routing:
   - 95% traffic to v1 (PostgreSQL)
   - 5% traffic to v2 (DynamoDB)
3. Monitor v2 for errors and performance
4. Gradually increase v2 traffic: 10% -> 25% -> 50% -> 100%
5. Run data sync script to keep both databases in sync during transition
6. Once v2 is stable at 100%, remove v1
7. Decommission PostgreSQL

**Option C: Maintenance Window (Simplest)**

1. Schedule maintenance window (e.g., 2 hours off-peak)
2. Put site in maintenance mode
3. Export data from PostgreSQL
4. Deploy new Lambda code
5. Import data to DynamoDB
6. Test thoroughly
7. Remove maintenance mode
8. Monitor closely

#### 5.3 Deployment Commands

**Deploy Lambda:**
```bash
# Package application
cd api
pip install -r requirements.txt -t package/
cp *.py package/
cd package
zip -r ../api.zip .
cd ..

# Upload to Lambda
aws lambda update-function-code \
  --function-name nbhd-city-api \
  --zip-file fileb://api.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name nbhd-city-api \
  --environment Variables="{
    DYNAMODB_TABLE_NAME=nbhd-city,
    AWS_REGION=us-east-1,
    ENVIRONMENT=production,
    SECRET_KEY=$SECRET_KEY,
    BLUESKY_OAUTH_CLIENT_ID=$BLUESKY_CLIENT_ID,
    BLUESKY_OAUTH_CLIENT_SECRET=$BLUESKY_CLIENT_SECRET
  }"
```

#### 5.4 Post-Deployment Validation

**Test all endpoints:**
```bash
# Health check
curl https://api.nbhd.city/health

# List neighborhoods
curl https://api.nbhd.city/api/nbhds

# Get neighborhood by ID
curl https://api.nbhd.city/api/nbhds/{id}

# Create neighborhood (requires auth)
curl -X POST https://api.nbhd.city/api/nbhds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Nbhd", "description": "Test"}'

# Join neighborhood
curl -X POST https://api.nbhd.city/api/nbhds/{id}/join \
  -H "Authorization: Bearer $TOKEN"

# Get user memberships
curl https://api.nbhd.city/api/users/me/nbhds \
  -H "Authorization: Bearer $TOKEN"
```

**Monitor CloudWatch:**
- Check Lambda logs for errors
- Monitor DynamoDB read/write capacity
- Check API Gateway latency metrics
- Set up alarms for errors and throttling

---

### Phase 6: Optimization & Monitoring

#### 6.1 Performance Optimization

**Enable DynamoDB Features:**

1. **Point-in-Time Recovery (PITR):**
   ```bash
   aws dynamodb update-continuous-backups \
     --table-name nbhd-city \
     --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
   ```

2. **DynamoDB Streams (for audit trail or event processing):**
   ```bash
   aws dynamodb update-table \
     --table-name nbhd-city \
     --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES
   ```

3. **Auto Scaling (if using provisioned capacity):**
   - Configure auto-scaling policies for table and GSIs
   - Set target utilization to 70%

4. **DAX (DynamoDB Accelerator) - Optional for caching:**
   - Consider if read latency needs to be sub-millisecond
   - Adds cost but reduces DynamoDB read capacity

#### 6.2 Monitoring Setup

**CloudWatch Alarms:**

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name nbhd-city-high-errors \
  --alarm-description "Alert when Lambda errors are high" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=nbhd-city-api

# DynamoDB throttling alarm
aws cloudwatch put-metric-alarm \
  --alarm-name nbhd-city-throttled-requests \
  --alarm-description "Alert when DynamoDB requests are throttled" \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TableName,Value=nbhd-city
```

**Key Metrics to Monitor:**
- Lambda invocation count and duration
- Lambda error rate
- DynamoDB consumed read/write capacity
- DynamoDB throttled requests
- API Gateway 4xx and 5xx errors
- API Gateway latency (p50, p95, p99)

#### 6.3 Cost Optimization

**DynamoDB Cost Tips:**

1. **Use On-Demand if traffic is unpredictable**
   - Pay per request
   - Good for development and low-traffic production

2. **Use Provisioned Capacity if traffic is predictable**
   - Reserve capacity for lower cost
   - Use auto-scaling to handle spikes

3. **Archive old data to S3**
   - Export old neighborhoods/memberships to S3
   - Use DynamoDB TTL for automatic deletion

4. **Optimize GSI projections**
   - Use KEYS_ONLY or INCLUDE projection types where possible
   - Reduces storage costs

**Estimated Monthly Costs (Example):**

Assumptions:
- 1,000 neighborhoods
- 10,000 users
- 100,000 API requests/month
- On-demand pricing

Costs:
- DynamoDB storage: ~1 GB = $0.25
- DynamoDB writes: ~50,000 writes = $60
- DynamoDB reads: ~150,000 reads = $35
- Lambda: 100,000 invocations × 500ms × 512MB = $5
- API Gateway: 100,000 requests = $0.35
- **Total: ~$100/month**

(Production with higher traffic would benefit from provisioned capacity)

---

## Rollback Plan

If issues arise during migration:

### Immediate Rollback (< 1 hour after deployment)

1. **Revert Lambda code to previous version:**
   ```bash
   aws lambda update-function-code \
     --function-name nbhd-city-api \
     --s3-bucket my-backups \
     --s3-key old-api-version.zip
   ```

2. **Restore environment variables:**
   ```bash
   aws lambda update-function-configuration \
     --function-name nbhd-city-api \
     --environment Variables="{DATABASE_URL=postgresql+asyncpg://...}"
   ```

3. **Verify PostgreSQL database is still running**

4. **Test all endpoints**

### Data Recovery

If data was modified in DynamoDB but need to revert:

1. **Restore from Point-in-Time Recovery:**
   ```bash
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name nbhd-city \
     --target-table-name nbhd-city-restored \
     --restore-date-time 2025-01-01T00:00:00Z
   ```

2. **Or restore from PostgreSQL backup:**
   ```bash
   pg_restore -d nbhd_city backup.dump
   ```

---

## Success Criteria

Migration is considered successful when:

- ✅ All API endpoints returning correct data
- ✅ No increase in error rates (< 0.1%)
- ✅ API latency within acceptable range (p95 < 500ms)
- ✅ No data loss (verify record counts)
- ✅ All authentication flows working
- ✅ No DynamoDB throttling errors
- ✅ CloudWatch alarms configured and working
- ✅ Team trained on DynamoDB operations
- ✅ Documentation updated
- ✅ PostgreSQL safely decommissioned

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Infrastructure Setup | 2 hours | AWS access |
| Code Changes | 1 day | - |
| Unit Testing | 4 hours | Code complete |
| Local Integration Testing | 4 hours | DynamoDB Local setup |
| Data Migration Script | 2 hours | Code complete |
| Deploy to Staging | 2 hours | All tests pass |
| Staging Testing | 4 hours | Staging deploy |
| Production Deployment | 2 hours | Staging validated |
| Monitoring & Validation | 24 hours | Production deploy |
| **Total** | **~3-4 days** | - |

For a team familiar with DynamoDB, this could be compressed to 2 days.
For first-time DynamoDB users, add 1-2 days for learning curve.

---

## Appendices

### Appendix A: DynamoDB Best Practices

1. **Design for access patterns first** - Know your queries before schema
2. **Use single-table design** - Reduce costs and complexity
3. **Avoid hot partitions** - Distribute writes across partition keys
4. **Use sparse indexes** - Only index items that need it
5. **Batch operations** - Use BatchGetItem and BatchWriteItem
6. **Handle eventual consistency** - GSIs are eventually consistent
7. **Implement idempotency** - Handle duplicate requests gracefully
8. **Monitor capacity** - Watch for throttling and adjust capacity

### Appendix B: Troubleshooting Guide

**Problem: ProvisionedThroughputExceededException**
- Solution: Increase table capacity or switch to on-demand mode
- Temporary fix: Implement exponential backoff in client

**Problem: ValidationException**
- Solution: Check attribute types match schema
- Common cause: Trying to index non-existent attributes

**Problem: High latency on queries**
- Solution: Ensure you're using the right index for your query
- Check: Are you scanning instead of querying?

**Problem: Data not appearing in GSI**
- Solution: Wait for eventual consistency (~1 second typically)
- Check: Ensure indexed attributes are present in item

### Appendix C: Additional Resources

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [DynamoDB Pricing Calculator](https://aws.amazon.com/dynamodb/pricing/)
- [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html) - GUI tool for design

---

## Document Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-01-01 | AI Assistant | Initial migration plan created |

---

**Next Steps:**
1. Review this plan with the team
2. Get AWS permissions for DynamoDB and Lambda
3. Set up development environment with DynamoDB Local
4. Begin Phase 1: Infrastructure Setup

For questions or clarifications, refer to the troubleshooting guide or AWS documentation.
