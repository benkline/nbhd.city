#!/usr/bin/env python3
"""
Seed DynamoDB Local with test data for development.
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from project root .env.local
project_root = Path(__file__).parent.parent.parent
load_dotenv(project_root / '.env.local')

# Add parent directory to path to import from api/
sys.path.insert(0, str(project_root / 'api'))

from dynamodb_client import get_table
from dynamodb_repository import create_neighborhood, create_membership, create_user_profile


# Test users with profiles
TEST_USER_PROFILES = [
    {
        "user_id": "did:plc:testuser1abc",
        "handle": "alice.bsky.test",
        "display_name": "Alice Johnson",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        "bio": "Urban gardening enthusiast and community organizer",
        "location": "Portland, OR",
        "email": "alice@example.com"
    },
    {
        "user_id": "did:plc:testuser2def",
        "handle": "bob.bsky.test",
        "display_name": "Bob Chen",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        "bio": "Coffee lover, tech worker, and neighborhood watch coordinator",
        "location": "Seattle, WA",
        "email": "bob@example.com"
    },
    {
        "user_id": "did:plc:testuser3ghi",
        "handle": "carol.bsky.test",
        "display_name": "Carol Martinez",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
        "bio": "Small business owner and local events organizer",
        "location": "San Francisco, CA",
        "email": "carol@example.com"
    },
]

# Test user IDs (for backward compatibility with neighborhoods)
TEST_USERS = [user["user_id"] for user in TEST_USER_PROFILES]

# Test neighborhoods
TEST_NEIGHBORHOODS = [
    {
        "name": "Downtown Portland",
        "description": "Connect with neighbors in downtown Portland, Oregon",
        "created_by": TEST_USERS[0],
    },
    {
        "name": "North End Boise",
        "description": "Community for North End residents in Boise, Idaho",
        "created_by": TEST_USERS[1],
    },
    {
        "name": "Capitol Hill Seattle",
        "description": "Capitol Hill neighborhood in Seattle, Washington",
        "created_by": TEST_USERS[0],
    },
    {
        "name": "Pearl District",
        "description": "Pearl District neighborhood community",
        "created_by": TEST_USERS[2],
    },
    {
        "name": "East Austin",
        "description": "East Austin community hub",
        "created_by": TEST_USERS[0],  # Alice creates this one too
    },
]


async def seed_data():
    """Seed the database with test data."""

    print("=" * 60)
    print("Seeding DynamoDB Local with Test Data")
    print("=" * 60)

    async with get_table() as table:
        # Create user profiles first
        print("\nCreating test user profiles...")
        for user_data in TEST_USER_PROFILES:
            try:
                user = await create_user_profile(
                    table,
                    user_id=user_data["user_id"],
                    handle=user_data["handle"],
                    display_name=user_data["display_name"],
                    avatar=user_data["avatar"],
                    bio=user_data["bio"],
                    location=user_data["location"],
                    email=user_data["email"]
                )
                print(f"  ✓ Created: {user['display_name']} (@{user['handle']})")
            except ValueError:
                print(f"  ! Skipped (already exists): {user_data['display_name']}")

        created_nbhds = []

        # Create neighborhoods
        print("\nCreating test neighborhoods...")
        for nbhd_data in TEST_NEIGHBORHOODS:
            try:
                nbhd = await create_neighborhood(
                    table,
                    name=nbhd_data["name"],
                    description=nbhd_data["description"],
                    created_by=nbhd_data["created_by"]
                )
                created_nbhds.append(nbhd)
                print(f"  ✓ Created: {nbhd['name']}")
            except ValueError as e:
                print(f"  ! Skipped (already exists): {nbhd_data['name']}")
                continue

        # Create memberships (creators join their neighborhoods)
        print("\nCreating test memberships...")
        for nbhd in created_nbhds:
            try:
                await create_membership(
                    table,
                    user_id=nbhd["created_by"],
                    nbhd_id=nbhd["id"]
                )
                print(f"  ✓ {nbhd['created_by'][:20]}... joined {nbhd['name']}")
            except ValueError:
                print(f"  ! Skipped (already member): {nbhd['name']}")

        # Add additional members to some neighborhoods
        print("\nAdding additional members...")
        if len(created_nbhds) > 0:
            # User 2 joins first neighborhood
            try:
                await create_membership(
                    table,
                    user_id=TEST_USERS[1],
                    nbhd_id=created_nbhds[0]["id"]
                )
                print(f"  ✓ {TEST_USERS[1][:20]}... joined {created_nbhds[0]['name']}")
            except ValueError:
                pass

            # User 3 joins first two neighborhoods
            for i in range(min(2, len(created_nbhds))):
                try:
                    await create_membership(
                        table,
                        user_id=TEST_USERS[2],
                        nbhd_id=created_nbhds[i]["id"]
                    )
                    print(f"  ✓ {TEST_USERS[2][:20]}... joined {created_nbhds[i]['name']}")
                except ValueError:
                    pass

    print("\n" + "=" * 60)
    print("✓ Seeding complete!")
    print("=" * 60)
    print(f"\nCreated:")
    print(f"  - {len(TEST_USER_PROFILES)} user profiles")
    print(f"  - {len(TEST_NEIGHBORHOODS)} neighborhoods")
    print(f"  - Multiple test memberships")
    print(f"\nView data at: http://localhost:8001")
    print("=" * 60)


if __name__ == "__main__":
    # Environment variables are loaded from .env.local
    # Set defaults for local development if not already set
    if not os.getenv("DYNAMODB_ENDPOINT_URL"):
        os.environ["DYNAMODB_ENDPOINT_URL"] = "http://localhost:8000"
    if not os.getenv("DYNAMODB_TABLE_NAME"):
        os.environ["DYNAMODB_TABLE_NAME"] = "nbhd-city-development"
    if not os.getenv("AWS_REGION"):
        os.environ["AWS_REGION"] = "us-east-1"
    if not os.getenv("AWS_ACCESS_KEY_ID"):
        os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
    if not os.getenv("AWS_SECRET_ACCESS_KEY"):
        os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"

    asyncio.run(seed_data())
