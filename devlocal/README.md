# DynamoDB Local Development Environment

This folder provides a complete local development environment for DynamoDB using Docker.

## Quick Start

```bash
# Start everything
cd devlocal
./scripts/start.sh

# Open DynamoDB Admin
open http://localhost:8001
```

That's it! Your local DynamoDB is ready.

## What's Included

- **DynamoDB Local** (port 8000) - AWS official Docker image
- **DynamoDB Admin** (port 8001) - Web UI for managing tables
- **Automated table creation** - Tables created automatically on startup
- **Test data seeding** - Optional seed script for test data
- **Import/export tools** - Backup and restore your local data

## Configuration

### Update Your API Environment

Edit `.env.local` in the project root:

```bash
# DynamoDB Configuration
DYNAMODB_TABLE_NAME=nbhd-city-development
DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
```

### Table Schema

The local table matches production exactly:
- **Table name**: `nbhd-city-development`
- **Primary keys**: PK (Hash), SK (Range)
- **GSI1**: entity_type + created_at (for listing neighborhoods by date)
- **GSI2**: name_lower + SK (for name uniqueness checks)
- **GSI3**: user_id + joined_at (for user memberships)

## Usage

### Start Services

```bash
./scripts/start.sh
```

Services will be available at:
- DynamoDB Local: http://localhost:8000
- DynamoDB Admin: http://localhost:8001

### Stop Services

```bash
./scripts/stop.sh
```

Data is preserved in `./dynamodb_data/`

### Reset Everything

```bash
./scripts/reset.sh
```

This will:
1. Stop all services
2. Delete all data
3. Recreate tables

### Seed Test Data

```bash
python init/seed_data.py
```

This creates:
- 5 test neighborhoods
- Multiple test memberships
- Sample data for development

### Export Data

```bash
cd scripts
python export_data.py
```

Exports are saved to `data/exports/` with timestamps.

### Import Data

```bash
cd scripts
python import_data.py ../data/exports/all_items_20250101_120000.json
```

## Directory Structure

```
devlocal/
├── docker-compose.yml       # Docker services
├── Dockerfile.init          # Table initialization image
├── init/
│   ├── create_tables.py     # Table creation (auto-runs)
│   └── seed_data.py         # Test data seeding
├── scripts/
│   ├── start.sh             # Start services
│   ├── stop.sh              # Stop services
│   ├── reset.sh             # Reset all data
│   ├── export_data.py       # Export to JSON
│   ├── import_data.py       # Import from JSON
│   └── check_health.sh      # Health check
├── data/
│   └── exports/             # JSON exports
└── dynamodb_data/           # Persistent data (git-ignored)
```

## DynamoDB Local Limitations

DynamoDB Local doesn't support:
- Point-in-time recovery (PITR)
- Server-side encryption
- DynamoDB Streams
- PAY_PER_REQUEST billing mode (uses PROVISIONED)
- Auto-scaling
- Global tables

These features work in production but are ignored locally.

## Troubleshooting

### Services won't start

1. Check Docker is running: `docker info`
2. Check ports are free: `lsof -i :8000` and `lsof -i :8001`
3. View logs: `docker-compose logs`

### Table creation fails

1. Wait a few seconds for DynamoDB to be ready
2. Check logs: `docker-compose logs table-init`
3. Manually create: `python init/create_tables.py`

### API can't connect

1. Verify DynamoDB is running: `./scripts/check_health.sh`
2. Check `.env.local` in project root has correct settings
3. Ensure `DYNAMODB_ENDPOINT_URL=http://localhost:8000`

### Reset isn't working

```bash
docker-compose down -v  # Remove volumes
rm -rf dynamodb_data/*  # Delete data
docker-compose up -d    # Restart
```

## Development Workflow

### Option 1: Fresh Start Each Time (Recommended for Testing)

```bash
./scripts/reset.sh          # Reset everything
python init/seed_data.py    # Add test data
cd ../api && uvicorn main:app --reload
```

### Option 2: Persistent Development

```bash
./scripts/start.sh          # Start with existing data
cd ../api && uvicorn main:app --reload
```

### Option 3: Export/Import Pattern

```bash
# Before switching branches
cd devlocal/scripts
python export_data.py       # Backup data

# After switching branches
./scripts/reset.sh          # Clean start
python import_data.py ../data/exports/all_items_TIMESTAMP.json
```

## Integration with API

Your FastAPI app automatically uses the local DynamoDB when `DYNAMODB_ENDPOINT_URL` is set:

```python
# api/dynamodb_client.py already handles this!
DYNAMODB_ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT_URL")  # For local testing

if DYNAMODB_ENDPOINT_URL:
    kwargs["endpoint_url"] = DYNAMODB_ENDPOINT_URL
```

No code changes needed - just set the environment variable!

## Using DynamoDB Admin

The Admin GUI at http://localhost:8001 lets you:
- View all tables and items
- Execute queries and scans
- Add/edit/delete items manually
- View table metrics
- Test GSI queries

Perfect for debugging and development.

## Performance Notes

- DynamoDB Local runs in a single container
- No data replication or durability guarantees
- Much faster than real DynamoDB for small datasets
- Good for development, not for performance testing

## Next Steps

1. Start services: `./scripts/start.sh`
2. Update API config: Edit `.env.local` in project root
3. Seed data: `python init/seed_data.py`
4. Start API: `cd ../api && uvicorn main:app --reload`
5. Open Admin GUI: http://localhost:8001
6. Start developing!

## Additional Resources

- [DynamoDB Local Docs](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [DynamoDB Admin](https://github.com/aaronshaf/dynamodb-admin)
- [Production Terraform Config](../devops/dynamodb.tf)
