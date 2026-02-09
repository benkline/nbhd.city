# Development Setup Guide

This guide explains how to set up and run nbhd.city locally.

## Quick Start (Recommended)

The easiest way to start all services at once:

```bash
./start-dev.sh
```

This single command starts:
- **DynamoDB Local** (port 8000) - Local database
- **Backend API** (port 8001) - REST API server
- **Frontend** (port 5173) - Web UI

Then open `http://localhost:5173` in your browser.

## Manual Setup (if needed)

If you prefer to start services individually:

### 1. Start DynamoDB Local and API

```bash
cd app/dynamodb
docker-compose up
```

This starts:
- DynamoDB Local on port 8000
- Backend API on port 8001 (exposed)
- DynamoDB Admin UI at http://localhost:8001

### 2. Start Frontend (in a new terminal)

```bash
cd app/UI
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| DynamoDB Local | 8000 | Database backend (internal) |
| Backend API | 8001 | REST API (external: http://localhost:8001) |
| Frontend | 5173 | Web UI |

## Configuration Files

### Backend Environment (`app/.env.local`)
- `DYNAMODB_ENDPOINT_URL=http://localhost:8000` - Points to local DynamoDB
- `AWS_REGION=us-east-1`
- `BLUESKY_OAUTH_*` - BlueSky OAuth configuration

### Frontend Environment (`app/UI/.env.local`)
- `VITE_API_URL=http://localhost:8001` - Points to local API

## Testing the Login Endpoint

Once everything is running, you can test the login with your BlueSky credentials:

```bash
curl -X POST http://localhost:8001/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username":"your.bsky.handle", "password":"your_password"}'
```

You should get back a JWT token.

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Kill processes on specific ports
lsof -ti:8000,8001,5173 | xargs kill -9
```

### DynamoDB Connection Failed

If the API can't connect to DynamoDB:
1. Make sure Docker is running
2. Check that `docker-compose up` completed successfully
3. Verify DynamoDB is healthy: `curl http://localhost:8000`

### Frontend Shows "Failed to Fetch"

Ensure:
1. Backend API is running on port 8001
2. `app/UI/.env.local` has `VITE_API_URL=http://localhost:8001`
3. Restart the frontend after changing `.env.local`

## Stopping Services

With `start-dev.sh`: Press `Ctrl+C`

Manual setup:
- Frontend: Press `Ctrl+C` in the terminal
- Backend/DynamoDB: `docker-compose down` in the `app/dynamodb` directory

## Docker Images

The setup uses:
- `amazon/dynamodb-local:latest` - Local DynamoDB
- `aaronshaf/dynamodb-admin:latest` - Admin UI
- `python:3.11-slim` - Backend API (built from local Dockerfile)

## Next Steps

1. Run `./start-dev.sh`
2. Go to `http://localhost:5173`
3. Click "Sign In" and use your BlueSky credentials
4. Start developing!
