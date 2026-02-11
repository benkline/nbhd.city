#!/bin/bash
# Setup OAuth with ngrok for local development
# This script:
# 1. Checks if ngrok is installed
# 2. Starts ngrok tunnel to localhost:8001
# 3. Extracts the public URL
# 4. Updates environment variables
# 5. Restarts the API
# 6. Tests the OAuth flow

set -e

echo "================================================================================"
echo "NGROK OAUTH SETUP FOR LOCAL DEVELOPMENT"
echo "================================================================================"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo ""
    echo "❌ ngrok is not installed"
    echo ""
    echo "Install ngrok with:"
    echo "  brew install ngrok"
    echo ""
    exit 1
fi

echo ""
echo "✓ ngrok is installed"

# Check if ngrok is already running
if pgrep -x "ngrok" > /dev/null; then
    echo "⚠️  ngrok is already running"
    echo "    Killing existing process..."
    pkill -f ngrok || true
    sleep 2
fi

echo ""
echo "Starting ngrok tunnel to localhost:8001..."
echo ""

# Start ngrok in background and capture the output
ngrok http 8001 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and extract the public URL
echo "Waiting for ngrok to initialize..."
sleep 3

# Extract the public URL from ngrok API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Could not extract ngrok URL"
    echo "ngrok log:"
    cat /tmp/ngrok.log
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

echo "✓ ngrok tunnel started"
echo "  Public URL: $NGROK_URL"

# Update environment variables
echo ""
echo "Updating .env.local with ngrok URL..."

# Use sed to update the redirect URI
sed -i '' "s|BLUESKY_OAUTH_CLIENT_ID=.*|BLUESKY_OAUTH_CLIENT_ID=$NGROK_URL/client-metadata.json|" /Users/benkline/Projects/nbhd.city/.env.local
sed -i '' "s|BLUESKY_OAUTH_REDIRECT_URI=.*|BLUESKY_OAUTH_REDIRECT_URI=$NGROK_URL/callback.html|" /Users/benkline/Projects/nbhd.city/.env.local

echo "✓ Updated .env.local:"
echo "  BLUESKY_OAUTH_CLIENT_ID=$NGROK_URL/client-metadata.json"
echo "  BLUESKY_OAUTH_REDIRECT_URI=$NGROK_URL/callback.html"

# Restart the API
echo ""
echo "Restarting API server..."
docker restart nbhd-api > /dev/null 2>&1
sleep 3

echo "✓ API server restarted"

# Test the OAuth configuration
echo ""
echo "Testing OAuth configuration..."
echo "================================================================================"

python3 /Users/benkline/Projects/nbhd.city/test_oauth_config.py 2>/dev/null | head -50

echo ""
echo "================================================================================"
echo "✓ NGROK OAUTH SETUP COMPLETE"
echo "================================================================================"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:5173/#/login in your browser"
echo "  2. Click 'Sign in with BlueSky'"
echo "  3. You'll be redirected to BlueSky's OAuth"
echo "  4. After authorizing, you'll be logged in!"
echo ""
echo "To stop ngrok tunnel:"
echo "  pkill -f ngrok"
echo ""
echo "ngrok will remain running in the background."
echo "Check status with: curl http://localhost:4040/api/tunnels"
echo ""
