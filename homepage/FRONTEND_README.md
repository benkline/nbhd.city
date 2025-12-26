# nbhd.city Frontend

A React + Vite application for the nbhd.city neighborhood community platform. Authenticates via BlueSky OAuth and communicates with the FastAPI backend.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS Modules** - Scoped styling

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx          # Login page
│   │   ├── AuthSuccess.jsx    # OAuth callback handler
│   │   └── Dashboard.jsx      # Protected dashboard
│   ├── contexts/
│   │   └── AuthContext.jsx    # Authentication state management
│   ├── lib/
│   │   └── api.js             # Axios API client
│   ├── styles/
│   │   ├── Login.module.css
│   │   ├── AuthSuccess.module.css
│   │   └── Dashboard.module.css
│   ├── App.jsx                # Main app component
│   ├── App.css                # Global styles
│   └── main.jsx               # Entry point
├── .env.example               # Environment variables template
├── package.json
└── vite.config.js
```

## Setup

### Prerequisites

- Node.js 16+ and npm

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_APP_NAME=nbhd.city
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## Authentication Flow

### 1. Login Page

User lands on `/login` and sees a login button.

```jsx
// Clicking the button redirects to:
http://localhost:8000/auth/login
```

### 2. BlueSky OAuth

User is redirected to BlueSky's authorization page to grant permissions.

### 3. OAuth Callback

BlueSky redirects back to your API at:
```
http://localhost:8000/auth/callback?code={code}&state={state}
```

The API validates the code and redirects to the frontend:
```
http://localhost:5173/auth/success?token={jwt_token}
```

### 4. Auth Success Page

The frontend extracts the JWT token from the URL and stores it in localStorage.

### 5. Dashboard

User is redirected to the protected dashboard with their user information.

## Key Components

### AuthContext

Manages global authentication state:
- `isAuthenticated` - Whether user is logged in
- `token` - Current JWT token
- `user` - Current user data
- `isLoading` - Loading state
- `login()` - Store token and fetch user info
- `logout()` - Clear authentication

**Usage:**
```jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) return <Redirect to="/login" />;

  return <div>Welcome {user.user_id}</div>;
}
```

### API Client

Axios instance with automatic token injection:

```jsx
import apiClient from './lib/api';

// Token is automatically added to Authorization header
const response = await apiClient.get('/auth/me');
```

### Protected Routes

Create protected pages by checking `isAuthenticated`:

```jsx
export default function MyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <YourContent />;
}
```

## Development Tips

### Hot Module Replacement

Vite provides fast HMR. Changes to your React components will update instantly in the browser without losing state.

### Debugging

- Open browser DevTools (F12)
- Check Network tab to see API calls
- Check Application tab to verify token is stored
- React DevTools browser extension for component debugging

### Environment Variables

All environment variables must start with `VITE_` to be exposed to the client:

```env
VITE_API_URL=http://localhost:8000
VITE_FEATURE_FLAG=true
```

Access them with:
```javascript
import.meta.env.VITE_API_URL
import.meta.env.VITE_FEATURE_FLAG
```

## Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Output is in `dist/` folder:**
   - Minified JavaScript
   - Optimized CSS
   - Hashed filenames for caching

3. **Preview production build:**
   ```bash
   npm run preview
   ```

4. **Deploy to a web server:**
   - Upload contents of `dist/` folder
   - Configure web server to serve `index.html` for all routes (for React Router)

## Security Considerations

### Before Production

1. **CORS**: Update API to only accept requests from your frontend domain
2. **Token Storage**:
   - Current: localStorage (suitable for SPAs)
   - Better: httpOnly cookies (requires backend support)
3. **HTTPS**: Always use HTTPS in production
4. **API URL**: Use environment-specific API URLs
5. **CSP Headers**: Implement Content Security Policy headers
6. **XSS Protection**: Sanitize any user-generated content

### Token Management

```jsx
// Current implementation stores token in localStorage
localStorage.setItem('auth_token', token);

// Access token when needed
const token = localStorage.getItem('auth_token');

// Clear on logout
localStorage.removeItem('auth_token');
```

For production, consider:
- httpOnly, Secure, SameSite cookies
- Token refresh mechanism
- Automatic logout on token expiration

## Troubleshooting

### "Cannot find module" errors

Run `npm install` to ensure all dependencies are installed.

### CORS errors when calling API

- Ensure API is running on `http://localhost:8000`
- Check `VITE_API_URL` in `.env` matches your API URL
- Verify API has CORS middleware configured

### Token not being sent to API

- Check that token is stored: `localStorage.getItem('auth_token')`
- Check Network tab in DevTools to see Authorization header
- Verify API expects `Bearer {token}` format

### Infinite redirect loop

- Clear localStorage: `localStorage.clear()`
- Check console for errors
- Verify `/auth/me` endpoint is returning correct response format

## Next Steps

- [ ] Add form validation and error handling
- [ ] Implement user profile page
- [ ] Add neighborhood listing and map view
- [ ] Create event creation and management
- [ ] Add real-time notifications
- [ ] Implement comprehensive error boundaries
- [ ] Add unit and integration tests

## Contributing

(Contribution guidelines to be added)

## License

(Add your license here)
