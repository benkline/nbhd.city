#!/usr/bin/env python3
"""
Export data from local DynamoDB to JSON files.
Useful for backing up local development data.
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import aioboto3
from dotenv import load_dotenv

# Load environment variables from project root .env.local
project_root = Path(__file__).parent.parent.parent
load_dotenv(project_root / '.env.local')

# Configuration
DYNAMODB_ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city-development")
EXPORT_DIR = Path(__file__).parent.parent / "data" / "exports"


def serialize_item(item):
    """Convert DynamoDB item to JSON-serializable format."""
    result = {}
    for key, value in item.items():
        # DynamoDB types are already Python types with aioboto3
        result[key] = value
    return result


async def export_data():
    """Export all data from DynamoDB to JSON."""

    print("=" * 60)
    print("Exporting DynamoDB Data")
    print("=" * 60)
    print(f"Endpoint: {DYNAMODB_ENDPOINT_URL}")
    print(f"Table: {TABLE_NAME}")
    print("=" * 60)

    # Create export directory
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    # Create timestamp for export
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    session = aioboto3.Session()

    async with session.resource(
        'dynamodb',
        endpoint_url=DYNAMODB_ENDPOINT_URL,
        region_name=AWS_REGION
    ) as dynamodb:
        table = await dynamodb.Table(TABLE_NAME)

        # Scan entire table
        print("\nScanning table...")
        items = []

        scan_kwargs = {}
        done = False

        while not done:
            response = await table.scan(**scan_kwargs)
            items.extend(response.get('Items', []))

            # Check if there are more items
            last_key = response.get('LastEvaluatedKey')
            if last_key:
                scan_kwargs['ExclusiveStartKey'] = last_key
                print(f"  Scanned {len(items)} items so far...")
            else:
                done = True

        print(f"✓ Total items scanned: {len(items)}")

        # Separate items by entity type
        neighborhoods = []
        memberships = []

        for item in items:
            serialized = serialize_item(item)
            if item.get('entity_type') == 'neighborhood':
                neighborhoods.append(serialized)
            elif item.get('entity_type') == 'membership':
                memberships.append(serialized)

        # Write to JSON files
        neighborhoods_file = EXPORT_DIR / f"neighborhoods_{timestamp}.json"
        memberships_file = EXPORT_DIR / f"memberships_{timestamp}.json"
        all_items_file = EXPORT_DIR / f"all_items_{timestamp}.json"

        with open(neighborhoods_file, 'w') as f:
            json.dump(neighborhoods, f, indent=2)
        print(f"\n✓ Exported {len(neighborhoods)} neighborhoods to:")
        print(f"  {neighborhoods_file}")

        with open(memberships_file, 'w') as f:
            json.dump(memberships, f, indent=2)
        print(f"\n✓ Exported {len(memberships)} memberships to:")
        print(f"  {memberships_file}")

        with open(all_items_file, 'w') as f:
            json.dump(items, f, indent=2, default=str)
        print(f"\n✓ Exported all {len(items)} items to:")
        print(f"  {all_items_file}")

    print("\n" + "=" * 60)
    print("✓ Export complete!")
    print("=" * 60)


if __name__ == "__main__":
    # Set environment
    os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"

    asyncio.run(export_data())
