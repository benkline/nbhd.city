# DynamoDB Migration Implementation - Next Steps

The code migration from PostgreSQL to DynamoDB is now complete! Here's what was done and what you need to do next.

## ✅ Completed

1. **Updated Dependencies** - Replaced SQLAlchemy/PostgreSQL with boto3/aioboto3
2. **Created New Modules**:
   - `api/dynamodb_client.py` - DynamoDB connection management
   - `api/dynamodb_repository.py` - All database operations
3. **Updated Existing Code**:
   - `api/models.py` - Changed IDs from `int` to `str` (UUID)
   - `api/nbhd.py` - Updated all endpoints to use DynamoDB
   - `api/main.py` - Removed database startup/shutdown hooks
4. **Infrastructure**:
   - `infrastructure/dynamodb-table.yaml` - CloudFormation template for DynamoDB table
5. **Migration Scripts**:
   - `scripts/export_postgres_data.py` - Export existing PostgreSQL data
   - `scripts/import_to_dynamodb.py` - Import data to DynamoDB
6. **Configuration**:
   - Updated `api/.env.example` with DynamoDB settings
7. **Cleanup**:
   - Removed old files: `database.py`, `db_models.py`, `crud.py`, `alembic/`

## 🚀 Next Steps

### 1. Install New Dependencies

```bash
cd api
pip install boto3>=1.34.0 aioboto3>=12.3.0
pip uninstall -y sqlalchemy asyncpg alembic psycopg2-binary greenlet
```

### 2. Create DynamoDB Table in AWS

**Option A: Using AWS CLI**
```bash
aws cloudformation create-stack \
  --stack-name nbhd-city-dynamodb \
  --template-body file://infrastructure/dynamodb-table.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --region us-east-1
```

**Option B: Using AWS Console**
1. Go to CloudFormation in AWS Console
2. Create Stack
3. Upload `infrastructure/dynamodb-table.yaml`
4. Set Environment parameter (production/staging/development)
5. Create Stack

### 3. Update Lambda Configuration

**Environment Variables:**
```bash
DYNAMODB_TABLE_NAME=nbhd-city-production  # or whatever you named it
AWS_REGION=us-east-1
```

**IAM Permissions - Add to Lambda execution role:**
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:BatchGetItem",
    "dynamodb:BatchWriteItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/nbhd-city-*",
    "arn:aws:dynamodb:*:*:table/nbhd-city-*/index/*"
  ]
}
```

### 4. Test Locally (Optional but Recommended)

**Install DynamoDB Local:**
```bash
# Using Docker
docker run -p 8000:8000 amazon/dynamodb-local
```

**Create local table:**
```bash
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --cli-input-json file://infrastructure/local-table-config.json
```

**Update `.env.local`:**
```bash
DYNAMODB_TABLE_NAME=nbhd-city-dev
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
```

**Run the API:**
```bash
cd api
uvicorn main:app --reload
```

### 5. Migrate Existing Data (If Any)

**If you have existing PostgreSQL data:**

```bash
# 1. Export from PostgreSQL
cd scripts
DATABASE_URL="postgresql://user:pass@host:5432/dbname" python export_postgres_data.py

# 2. Import to DynamoDB
DYNAMODB_TABLE_NAME=nbhd-city-production \
AWS_REGION=us-east-1 \
python import_to_dynamodb.py
```

This will create:
- `neighborhoods_export.json` - Backup of neighborhoods
- `memberships_export.json` - Backup of memberships
- `id_mapping.json` - Maps old integer IDs to new UUIDs

### 6. Deploy to Lambda

**Package and deploy:**
```bash
cd api
pip install -r requirements.txt -t package/
cp *.py package/
cd package
zip -r ../api.zip .

aws lambda update-function-code \
  --function-name nbhd-city-api \
  --zip-file fileb://../api.zip
```

### 7. Test All Endpoints

```bash
# Health check
curl https://api.nbhd.city/health

# List neighborhoods
curl https://api.nbhd.city/api/nbhds

# Create neighborhood (with auth token)
curl -X POST https://api.nbhd.city/api/nbhds \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Nbhd", "description": "Testing DynamoDB"}'
```

### 8. Monitor

**Set up CloudWatch alarms for:**
- Lambda errors
- DynamoDB throttled requests
- API Gateway 4xx/5xx errors
- API latency

## 📊 Key Changes to Note

### ID Format Changed
- **Before:** Integer IDs (1, 2, 3, ...)
- **After:** UUID strings ("550e8400-e29b-41d4-a716-446655440000")

### Timestamps Changed
- **Before:** Python `datetime` objects
- **After:** ISO format strings ("2025-01-01T12:00:00Z")

### Pagination Changed
- **Before:** `skip` and `limit` parameters
- **After:** `limit` and `last_key` parameters

### No More Transactions
- DynamoDB doesn't support multi-table transactions like PostgreSQL
- Operations are eventually consistent (GSI reads)
- Member counts are denormalized for performance

## 🔧 Troubleshooting

**"Module not found" errors:**
```bash
pip install -r api/requirements.txt
```

**"Table does not exist" error:**
- Make sure CloudFormation stack is created
- Check `DYNAMODB_TABLE_NAME` environment variable
- Verify table name in AWS Console

**"Access Denied" errors:**
- Check Lambda IAM role has DynamoDB permissions
- Verify table ARN in IAM policy matches your table

**Local testing issues:**
- Make sure DynamoDB Local is running
- Check `DYNAMODB_ENDPOINT_URL` is set correctly
- Use dummy AWS credentials for local testing

## 📚 Additional Resources

- Full migration plan: `database_migration_plan.md`
- DynamoDB best practices: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html
- Single table design guide: https://www.alexdebrie.com/posts/dynamodb-single-table/

## 🎉 Benefits of This Migration

✅ **No connection management** - Perfect for Lambda
✅ **Auto-scaling** - Handles traffic spikes automatically
✅ **Lower latency** - Single-digit millisecond response times
✅ **Cost-effective** - Pay only for what you use
✅ **Simpler ops** - No database maintenance, backups are built-in

---

**Questions or issues?** Check the full migration plan in `database_migration_plan.md` or the troubleshooting section above.
