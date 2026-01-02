#!/usr/bin/env python3
"""
Seed DynamoDB Local with test user profiles.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path to import from api/
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'api'))

from dynamodb_client import get_table
from dynamodb_repository import create_user_profile


# Test users with realistic data
TEST_USERS = [
    {
        "user_id": "did:plc:testuser1abc",
        "handle": "alice.bsky.test",
        "display_name": "Alice Johnson",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        "bio": "Urban gardening enthusiast and community organizer. Love connecting with neighbors!",
        "location": "Portland, OR",
        "email": "alice@example.com"
    },
    {
        "user_id": "did:plc:testuser2def",
        "handle": "bob.bsky.test",
        "display_name": "Bob Chen",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        "bio": "Coffee lover, tech worker, and neighborhood watch coordinator. Always happy to help!",
        "location": "Seattle, WA",
        "email": "bob@example.com"
    },
    {
        "user_id": "did:plc:testuser3ghi",
        "handle": "carol.bsky.test",
        "display_name": "Carol Martinez",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
        "bio": "Small business owner and local events organizer. Let's make our neighborhoods amazing!",
        "location": "San Francisco, CA",
        "email": "carol@example.com"
    }
]


async def seed_users():
    """Seed the database with test user profiles."""

    print("=" * 60)
    print("Seeding DynamoDB Local with Test User Profiles")
    print("=" * 60)

    async with get_table() as table:
        # Create user profiles
        print("\nCreating test user profiles...")
        for user_data in TEST_USERS:
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
            except ValueError as e:
                print(f"  ! Skipped (already exists): {user_data['display_name']}")
                continue

    print("\n" + "=" * 60)
    print("✓ User seeding complete!")
    print("=" * 60)
    print(f"\nCreated {len(TEST_USERS)} test users:")
    for user in TEST_USERS:
        print(f"  - {user['display_name']} (@{user['handle']})")
        print(f"    ID: {user['user_id']}")
        print(f"    Location: {user['location']}")
    print(f"\nView users at: http://localhost:8001")
    print("=" * 60)


if __name__ == "__main__":
    # Set environment for local DynamoDB
    os.environ["DYNAMODB_ENDPOINT_URL"] = "http://localhost:8000"
    os.environ["DYNAMODB_TABLE_NAME"] = "nbhd-city-development"
    os.environ["AWS_REGION"] = "us-east-1"
    os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"

    asyncio.run(seed_users())
