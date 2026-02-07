#!/usr/bin/env python3
"""
Migration: Add nbhd_did to existing neighborhoods.

Usage:
    python scripts/add_nbhd_did_migration.py
    python scripts/add_nbhd_did_migration.py --dry-run
"""

import asyncio
import aioboto3
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

from atproto.neighborhood_did import generate_neighborhood_did
from boto3.dynamodb.conditions import Key


async def migrate_neighborhoods(dry_run: bool = False):
    """Add DIDs to neighborhoods without them."""

    table_name = os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city")
    region = os.getenv("AWS_REGION", "us-east-1")
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL")

    print(f"Migration: Add nbhd_did to neighborhoods")
    print(f"Table: {table_name}")
    if dry_run:
        print("DRY RUN MODE - No changes will be made")
    print()

    session = aioboto3.Session()
    kwargs = {"region_name": region}
    if endpoint_url:
        kwargs["endpoint_url"] = endpoint_url

    async with session.resource("dynamodb", **kwargs) as dynamodb:
        table = await dynamodb.Table(table_name)

        # Query all neighborhoods
        response = await table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("entity_type").eq("neighborhood")
        )

        neighborhoods = response.get("Items", [])
        print(f"Found {len(neighborhoods)} neighborhoods\n")

        updated = 0
        skipped = 0

        for nbhd in neighborhoods:
            nbhd_id = nbhd.get("id")
            nbhd_name = nbhd.get("name", "Unknown")
            existing_did = nbhd.get("nbhd_did")

            if existing_did:
                print(f"✓ SKIP: {nbhd_name} (already has DID: {existing_did})")
                skipped += 1
                continue

            new_did = generate_neighborhood_did()
            print(f"→ UPDATE: {nbhd_name}")
            print(f"  New DID: {new_did}")

            if not dry_run:
                await table.update_item(
                    Key={"PK": f"NBHD#{nbhd_id}", "SK": "METADATA"},
                    UpdateExpression="SET nbhd_did = :did, updated_at = :updated",
                    ExpressionAttributeValues={
                        ":did": new_did,
                        ":updated": datetime.now(timezone.utc).isoformat()
                    }
                )
                print("  ✓ Updated")
            else:
                print("  (dry run - not applied)")

            updated += 1
            print()

        print("=" * 60)
        print(f"Total: {len(neighborhoods)}, Already had DID: {skipped}, " +
              f"{'Would update' if dry_run else 'Updated'}: {updated}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    asyncio.run(migrate_neighborhoods(dry_run=args.dry_run))
