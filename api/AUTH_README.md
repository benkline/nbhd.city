# BlueSky OAuth Authentication

This API uses BlueSky's OAuth 2.0 provider for user authentication, with JWT tokens for session management.

## Setup

### 1. Get OAuth Credentials

1. Register your application at [atproto.com](https://atproto.com/docs/oauth)
2. You'll receive:
   - `client_id`
   - `client_secret`
3. Set your redirect URI to: `http://localhost:8000/auth/callback` (or your production URL)

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
SECRET_KEY=your-super-secret-key
BLUESKY_OAUTH_CLIENT_ID=your-client-id
BLUESKY_OAUTH_CLIENT_SECRET=your-client-secret
BLUESKY_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback
FRONTEND_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
source venv/bin/activate
pip install -r requirements.txt
```

## API Endpoints

### Login Flow

#### 1. `GET /auth/login`

Initiates the BlueSky OAuth login flow. Redirects the user to BlueSky's login page.

```bash
# Redirect the user's browser to:
http://localhost:8000/auth/login
```

#### 2. `GET /auth/callback`

Handles the OAuth callback from BlueSky. Exchanges the authorization code for tokens.

Parameters:
- `code` (query): Authorization code from BlueSky
- `state` (query): State parameter for CSRF protection

Returns:
- Redirects to frontend with JWT token in URL: `{FRONTEND_URL}/auth/success?token={jwt_token}`

### Authenticated Endpoints

#### 3. `GET /auth/me`

Get information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "user_id": "did:plc:example",
  "authenticated": true
}
```

#### 4. `POST /auth/logout`

Logout the current user (discards token on client side).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

## Using Authenticated Endpoints

### From Frontend (JavaScript/TypeScript)

```typescript
// Get the token from URL after OAuth callback
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// Store it (use secure storage in production)
localStorage.setItem('auth_token', token);

// Use it in requests
const response = await fetch('http://localhost:8000/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### From Python

```python
import httpx

token = "your-jwt-token"
headers = {"Authorization": f"Bearer {token}"}

response = httpx.get(
    "http://localhost:8000/auth/me",
    headers=headers
)
print(response.json())
```

### From cURL

```bash
curl -H "Authorization: Bearer {your-jwt-token}" \
  http://localhost:8000/auth/me
```

## Creating Protected Routes

To protect an endpoint, use the `get_current_user` dependency:

```python
from fastapi import FastAPI, Depends
from auth import get_current_user

app = FastAPI()

@app.get("/api/protected")
async def protected_route(user_id: str = Depends(get_current_user)):
    """This endpoint requires a valid JWT token."""
    return {
        "message": f"Hello {user_id}",
        "user_id": user_id
    }
```

## Token Details

- **Type**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Expiration**: 7 days (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Claims**:
  - `sub`: User ID (BlueSky DID)
  - `exp`: Expiration time
  - `iat`: Issued at time

## Security Considerations

1. **In Production**:
   - Set a strong `SECRET_KEY`
   - Use HTTPS only
   - Store tokens in httpOnly cookies or secure storage
   - Implement token refresh mechanism
   - Use a database to track OAuth states instead of in-memory storage

2. **CORS Configuration**:
   - Currently allows all origins (`*`)
   - Restrict to your frontend URL in production:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=["https://yourdomain.com"],
     )
     ```

3. **Token Leakage**:
   - Never log tokens
   - Don't expose tokens in URLs in production
   - Use httpOnly, Secure, SameSite cookies

## Troubleshooting

### "OAuth is not configured"
- Ensure `BLUESKY_OAUTH_CLIENT_ID` is set in `.env`

### "Invalid state parameter"
- OAuth state tokens are stored in memory (server restart clears them)
- In production, use a persistent store like Redis

### Token validation errors
- Ensure `SECRET_KEY` is consistent between token creation and validation
- Check token expiration time
- Verify `Authorization` header format: `Bearer {token}`

## Next Steps

1. **Database Integration**: Store user information and BlueSky tokens in a database
2. **Token Refresh**: Implement refresh token rotation
3. **User Profiles**: Create user profile endpoints
4. **Rate Limiting**: Add rate limiting to OAuth endpoints
5. **Audit Logging**: Log authentication events
