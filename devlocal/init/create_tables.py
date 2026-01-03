#!/usr/bin/env python3
"""
Create DynamoDB tables for local development.
Mirrors the Terraform configuration in devops/dynamodb.tf
"""

import boto3
import os
import time
from botocore.exceptions import ClientError

# Configuration
DYNAMODB_ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city-development")

# AWS credentials (dummy values for local development)
os.environ["AWS_ACCESS_KEY_ID"] = os.getenv("AWS_ACCESS_KEY_ID", "dummy")
os.environ["AWS_SECRET_ACCESS_KEY"] = os.getenv("AWS_SECRET_ACCESS_KEY", "dummy")


def wait_for_dynamodb(client, max_retries=30, delay=2):
    """Wait for DynamoDB Local to be ready."""
    print(f"Waiting for DynamoDB to be ready at {DYNAMODB_ENDPOINT_URL}...")

    for i in range(max_retries):
        try:
            client.list_tables()
            print("✓ DynamoDB is ready!")
            return True
        except Exception as e:
            print(f"  Attempt {i+1}/{max_retries}: {str(e)}")
            time.sleep(delay)

    raise Exception("DynamoDB failed to start")


def table_exists(client, table_name):
    """Check if table already exists."""
    try:
        client.describe_table(TableName=table_name)
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            return False
        raise


def create_table(client, table_name):
    """Create DynamoDB table matching Terraform configuration."""

    print(f"\nCreating table: {table_name}")

    try:
        # Create table with primary keys and GSIs
        response = client.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},   # Partition key
                {"AttributeName": "SK", "KeyType": "RANGE"}   # Sort key
            ],
            AttributeDefinitions=[
                # Primary keys
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},

                # GSI1 attributes (entity_type + created_at)
                {"AttributeName": "entity_type", "AttributeType": "S"},
                {"AttributeName": "created_at", "AttributeType": "S"},

                # GSI2 attributes (name_lower + SK)
                {"AttributeName": "name_lower", "AttributeType": "S"},

                # GSI3 attributes (user_id + joined_at)
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "joined_at", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                # GSI1: List all neighborhoods sorted by creation date
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "entity_type", "KeyType": "HASH"},
                        {"AttributeName": "created_at", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                },
                # GSI2: Name lookup for uniqueness check
                {
                    "IndexName": "GSI2",
                    "KeySchema": [
                        {"AttributeName": "name_lower", "KeyType": "HASH"},
                        {"AttributeName": "SK", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "KEYS_ONLY"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                },
                # GSI3: Get user's memberships
                {
                    "IndexName": "GSI3",
                    "KeySchema": [
                        {"AttributeName": "user_id", "KeyType": "HASH"},
                        {"AttributeName": "joined_at", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                }
            ],
            BillingMode="PROVISIONED",  # DynamoDB Local doesn't support PAY_PER_REQUEST
            ProvisionedThroughput={
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
        )

        print("✓ Table creation initiated")

        # Wait for table to become active
        print("  Waiting for table to become active...")
        waiter = client.get_waiter('table_exists')
        waiter.wait(TableName=table_name)

        print(f"✓ Table '{table_name}' is now active!")

        # Display table info
        table_info = client.describe_table(TableName=table_name)
        print(f"\nTable Details:")
        print(f"  - Table Name: {table_name}")
        print(f"  - Status: {table_info['Table']['TableStatus']}")
        print(f"  - Item Count: {table_info['Table']['ItemCount']}")
        print(f"  - Primary Key: PK (HASH) + SK (RANGE)")
        print(f"  - GSI1: entity_type + created_at (ALL)")
        print(f"  - GSI2: name_lower + SK (KEYS_ONLY)")
        print(f"  - GSI3: user_id + joined_at (ALL)")

        return True

    except ClientError as e:
        print(f"✗ Error creating table: {e}")
        return False


def main():
    """Main function to create tables."""
    print("=" * 60)
    print("DynamoDB Local Table Initialization")
    print("=" * 60)
    print(f"Endpoint: {DYNAMODB_ENDPOINT_URL}")
    print(f"Region: {AWS_REGION}")
    print(f"Table: {TABLE_NAME}")
    print("=" * 60)

    # Create DynamoDB client
    client = boto3.client(
        'dynamodb',
        endpoint_url=DYNAMODB_ENDPOINT_URL,
        region_name=AWS_REGION
    )

    # Wait for DynamoDB to be ready
    wait_for_dynamodb(client)

    # Check if table already exists
    if table_exists(client, TABLE_NAME):
        print(f"\n✓ Table '{TABLE_NAME}' already exists. Skipping creation.")

        # Display existing table info
        table_info = client.describe_table(TableName=TABLE_NAME)
        print(f"\nExisting Table Details:")
        print(f"  - Status: {table_info['Table']['TableStatus']}")
        print(f"  - Item Count: {table_info['Table']['ItemCount']}")

    else:
        # Create table
        success = create_table(client, TABLE_NAME)

        if not success:
            print("\n✗ Table creation failed!")
            exit(1)

    print("\n" + "=" * 60)
    print("✓ Initialization complete!")
    print("=" * 60)
    print(f"\nYou can now:")
    print(f"  - View tables at: http://localhost:8001")
    print(f"  - Configure API to use: {DYNAMODB_ENDPOINT_URL}")
    print(f"  - Run seed data: python init/seed_data.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
