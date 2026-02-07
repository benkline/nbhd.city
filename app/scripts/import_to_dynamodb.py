"""
Import data from JSON exports to DynamoDB.
Maps PostgreSQL integer IDs to UUID format.

Usage:
    python scripts/import_to_dynamodb.py
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
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL")  # For local testing

    print(f"Importing to DynamoDB table: {table_name}")
    print(f"Region: {region}")
    if endpoint_url:
        print(f"Endpoint URL: {endpoint_url}")

    session = aioboto3.Session()

    kwargs = {"region_name": region}
    if endpoint_url:
        kwargs["endpoint_url"] = endpoint_url

    async with session.resource("dynamodb", **kwargs) as dynamodb:
        table = await dynamodb.Table(table_name)

        # Load exported data
        try:
            with open("neighborhoods_export.json", "r") as f:
                neighborhoods = json.load(f)
        except FileNotFoundError:
            print("Error: neighborhoods_export.json not found.")
            print("Run export_postgres_data.py first!")
            return

        try:
            with open("memberships_export.json", "r") as f:
                memberships = json.load(f)
        except FileNotFoundError:
            print("Error: memberships_export.json not found.")
            print("Run export_postgres_data.py first!")
            return

        # Create ID mapping (old integer ID -> new UUID)
        id_mapping = {}

        # Import neighborhoods
        print(f"\nImporting {len(neighborhoods)} neighborhoods...")
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
            print(f"  ✓ {nbhd['name']} (old ID {nbhd['id']} -> new ID {new_id})")

        # Import memberships
        print(f"\nImporting {len(memberships)} memberships...")
        for i, m in enumerate(memberships):
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
            if (i + 1) % 10 == 0 or (i + 1) == len(memberships):
                print(f"  ✓ Imported {i + 1}/{len(memberships)} memberships")

        print(f"\n✓ Migration complete!")
        print(f"  - {len(neighborhoods)} neighborhoods imported")
        print(f"  - {len(memberships)} memberships imported")

        # Save ID mapping for reference
        with open("id_mapping.json", "w") as f:
            json.dump(id_mapping, f, indent=2)
        print(f"  - ID mapping saved to id_mapping.json")


if __name__ == "__main__":
    asyncio.run(import_data())
