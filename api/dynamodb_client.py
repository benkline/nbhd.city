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
DYNAMODB_ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT_URL")  # For local testing

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
    kwargs = {"region_name": AWS_REGION}
    if DYNAMODB_ENDPOINT_URL:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT_URL

    async with session.resource("dynamodb", **kwargs) as dynamodb:
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
    kwargs = {"region_name": AWS_REGION}
    if DYNAMODB_ENDPOINT_URL:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT_URL

    async with session.resource("dynamodb", **kwargs) as dynamodb:
        table = await dynamodb.Table(TABLE_NAME)
        yield table
