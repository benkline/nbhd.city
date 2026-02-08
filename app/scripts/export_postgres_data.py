"""
Export data from PostgreSQL to JSON files.
Run this before migration to backup all data.

Usage:
    python scripts/export_postgres_data.py
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
    # Convert asyncpg URL format if needed
    if "postgresql+asyncpg://" in database_url:
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    print(f"Connecting to database: {database_url.split('@')[1] if '@' in database_url else database_url}")

    try:
        conn = await asyncpg.connect(database_url)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("Make sure DATABASE_URL environment variable is set correctly.")
        return

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

        print(f"✓ Exported {len(nbhds_data)} neighborhoods to neighborhoods_export.json")

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

        print(f"✓ Exported {len(memberships_data)} memberships to memberships_export.json")
        print(f"\n✓ Export complete! Files saved in current directory.")

    except Exception as e:
        print(f"Error during export: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(export_data())
