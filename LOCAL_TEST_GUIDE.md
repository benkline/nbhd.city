# Local Testing Guide

Complete guide to testing nbhd.city authentication flow locally.

## ✅ What's Running

- **Frontend**: http://localhost:5173
- **API Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Network Accessible**: Frontend can reach API at `http://localhost:8000`

## 🔌 Quick Tests

### Test 1: API Health Check

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### Test 2: API Documentation

Open in browser: http://localhost:8000/docs

You can:
- View all endpoints
- Try out requests interactively
- See request/response schemas

### Test 3: Test Protected Endpoint Without Token

```bash
curl http://localhost:8000/auth/me
# Expected: {"detail":"Missing or invalid Authorization header"}
```

### Test 4: Generate JWT Token & Access Protected Endpoint

```bash
cd api

# Generate a test token
TOKEN=$(source venv/bin/activate && python3 << 'EOF'
import jwt
from datetime import datetime, timedelta

secret = 'dev-secret-key-change-in-production'
user_id = 'did:plc:test123'
expire = datetime.utcnow() + timedelta(hours=1)
payload = {
    'sub': user_id,
    'exp': expire,
    'iat': datetime.utcnow()
}
token = jwt.encode(payload, secret, algorithm='HS256')
print(token)
EOF
)

echo "Token: $TOKEN"

# Use the token to access protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/auth/me
# Expected: {"user_id": "did:plc:test123", "authenticated": true}
```

### Test 5: Frontend Login Page

1. Open http://localhost:5173 in your browser
2. You should see the login page
3. There's a "Login with BlueSky" button
4. (We'll test the actual OAuth flow next)

## 🔐 Full OAuth Flow Testing

To test the complete authentication flow with BlueSky:

### Prerequisites

1. **Register your app at BlueSky**:
   - Go to https://atproto.com/docs/oauth
   - Register your application
   - Get `client_id` and `client_secret`

2. **Update `.env` files**:

   Edit `api/.env`:
   ```
   BLUESKY_OAUTH_CLIENT_ID=your-actual-client-id
   BLUESKY_OAUTH_CLIENT_SECRET=your-actual-client-secret
   BLUESKY_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback
   FRONTEND_URL=http://localhost:5173
   ```

3. **Update BlueSky OAuth Settings**:
   - Set redirect URI to: `http://localhost:8000/auth/callback`

### Test the Flow

1. **Restart API** to load new env vars:
   ```bash
   # Kill the running API and restart it
   cd api
   source venv/bin/activate
   uvicorn main:app --reload
   ```

2. **Click Login on Frontend**:
   - Open http://localhost:5173
   - Click "Login with BlueSky"
   - You'll be redirected to BlueSky
   - Authorize the application
   - You'll be redirected back to `/auth/success` with a JWT token
   - Token is stored and you should see the Dashboard

3. **Verify Dashboard**:
   - You should see your authenticated user info
   - Click "Logout" to log out

## 🧪 Manual Testing Scripts

### Test Expired Token

```bash
TOKEN=$(source venv/bin/activate && python3 << 'EOF'
import jwt
from datetime import datetime, timedelta

secret = 'dev-secret-key-change-in-production'
user_id = 'did:plc:test123'
expire = datetime.utcnow() - timedelta(hours=1)  # Expired!
payload = {
    'sub': user_id,
    'exp': expire,
    'iat': datetime.utcnow() - timedelta(hours=2)
}
token = jwt.encode(payload, secret, algorithm='HS256')
print(token)
EOF
)

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/auth/me
# Expected: {"detail":"Token has expired"}
```

### Test Invalid Token

```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:8000/auth/me
# Expected: {"detail":"Invalid token"}
```

### Test Token Without User ID

```bash
TOKEN=$(source venv/bin/activate && python3 << 'EOF'
import jwt
from datetime import datetime, timedelta

secret = 'dev-secret-key-change-in-production'
expire = datetime.utcnow() + timedelta(hours=1)
payload = {
    # Missing 'sub' field!
    'exp': expire,
    'iat': datetime.utcnow()
}
token = jwt.encode(payload, secret, algorithm='HS256')
print(token)
EOF
)

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/auth/me
# Expected: {"detail":"Invalid token: no user ID"}
```

## 📊 Testing Checklist

### API Tests
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] API docs are accessible at /docs
- [ ] Protected endpoints reject requests without token
- [ ] Protected endpoints accept requests with valid token
- [ ] Valid token returns user info
- [ ] Expired token returns error
- [ ] Invalid token returns error
- [ ] Missing Authorization header returns error

### Frontend Tests
- [ ] Frontend loads at http://localhost:5173
- [ ] Login page displays correctly
- [ ] "Login with BlueSky" button is visible
- [ ] (With real credentials) OAuth flow works end-to-end
- [ ] Dashboard displays after successful login
- [ ] Logout button clears auth and redirects to login

### Integration Tests
- [ ] Frontend can reach API (no CORS errors)
- [ ] Authorization header is sent correctly
- [ ] Token is stored in localStorage
- [ ] Token is cleared on logout

## 🐛 Troubleshooting

### API Won't Start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill if needed
kill -9 <PID>

# Try restarting
cd api
source venv/bin/activate
uvicorn main:app --reload
```

### Frontend Won't Start
```bash
# Check if port 5173 is in use
lsof -i :5173

# Kill if needed
kill -9 <PID>

# Try restarting
cd frontend
npm run dev
```

### CORS Errors in Console

The API is configured to allow requests from http://localhost:5173. If you see CORS errors:

1. Check that `FRONTEND_URL` in `api/.env` is `http://localhost:5173`
2. Restart the API
3. Hard refresh the frontend (Cmd+Shift+R)

### Token Validation Errors

Make sure the `SECRET_KEY` in `api/.env` is consistent:
- It should be: `dev-secret-key-change-in-production`
- Tokens generated with this key will validate correctly

### OAuth Redirect Issues

If OAuth redirect doesn't work:
1. Verify BlueSky credentials in `api/.env`
2. Ensure `BLUESKY_OAUTH_REDIRECT_URI` is exactly `http://localhost:8000/auth/callback`
3. Check BlueSky OAuth app settings match
4. Restart API to load env variables

## 📝 API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | No | Welcome message |
| `/health` | GET | No | Health check |
| `/auth/login` | GET | No | Initiate OAuth flow |
| `/auth/callback` | GET | No | OAuth callback handler |
| `/auth/me` | GET | **Yes** | Get current user info |
| `/auth/logout` | POST | **Yes** | Logout endpoint |

## 🔑 Environment Variables

### API (api/.env)
```
SECRET_KEY=dev-secret-key-change-in-production
BLUESKY_OAUTH_CLIENT_ID=your-client-id
BLUESKY_OAUTH_CLIENT_SECRET=your-client-secret
BLUESKY_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback
FRONTEND_URL=http://localhost:5173
```

### Frontend (frontend/.env)
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=nbhd.city
```

## 🚀 Next Steps

After testing locally:
1. Fix any issues found
2. Commit changes to git
3. Deploy to AWS using devops/README.md
4. Test in production environment
5. Set up custom domain

## 📚 Additional Resources

- FastAPI Docs: http://localhost:8000/docs
- React DevTools: Browser extension for debugging
- JWT.io: https://jwt.io (to inspect tokens)
- BlueSky OAuth: https://atproto.com/docs/oauth

## 💡 Tips

- **Inspect Tokens**: Paste your JWT token at https://jwt.io
- **View Logs**: Check terminal output for detailed error messages
- **Test Tokens**: Use the scripts above to generate test tokens
- **Browser Console**: Check browser DevTools for frontend errors
- **Network Tab**: Check all requests/responses in DevTools
