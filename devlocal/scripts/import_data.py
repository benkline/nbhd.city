#!/usr/bin/env python3
"""
Import JSON data into local DynamoDB.
Useful for restoring backed up development data.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
import aioboto3
from botocore.exceptions import ClientError


# Configuration
DYNAMODB_ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city-development")


async def import_data(json_file):
    """Import data from JSON file to DynamoDB."""

    print("=" * 60)
    print("Importing Data to DynamoDB")
    print("=" * 60)
    print(f"Endpoint: {DYNAMODB_ENDPOINT_URL}")
    print(f"Table: {TABLE_NAME}")
    print(f"Source: {json_file}")
    print("=" * 60)

    # Load JSON data
    with open(json_file, 'r') as f:
        items = json.load(f)

    print(f"\nLoaded {len(items)} items from JSON")

    session = aioboto3.Session()

    async with session.resource(
        'dynamodb',
        endpoint_url=DYNAMODB_ENDPOINT_URL,
        region_name=AWS_REGION
    ) as dynamodb:
        table = await dynamodb.Table(TABLE_NAME)

        # Import items
        success_count = 0
        error_count = 0

        print("\nImporting items...")
        for i, item in enumerate(items, 1):
            try:
                await table.put_item(Item=item)
                success_count += 1

                if i % 10 == 0 or i == len(items):
                    print(f"  Imported {i}/{len(items)} items...")

            except ClientError as e:
                error_count += 1
                print(f"  ! Error importing item {i}: {e}")

        print(f"\n✓ Import complete!")
        print(f"  - Success: {success_count} items")
        if error_count > 0:
            print(f"  - Errors: {error_count} items")

    print("=" * 60)


if __name__ == "__main__":
    # Set environment
    os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"

    if len(sys.argv) < 2:
        print("Usage: python import_data.py <json_file>")
        print("\nExample:")
        print("  python import_data.py ../data/exports/all_items_20250101_120000.json")
        sys.exit(1)

    json_file = sys.argv[1]

    if not Path(json_file).exists():
        print(f"Error: File not found: {json_file}")
        sys.exit(1)

    asyncio.run(import_data(json_file))
