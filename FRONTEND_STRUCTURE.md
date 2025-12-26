# Frontend Structure

## Overview

The nbhd.city frontend has been split into two independent React applications:

1. **Homepage** - Personal user site
2. **Nbhd** - Collaborative community site

Both applications share the same authentication system and backend API but provide distinct user experiences.

## Architecture Decision

### Why Split?

**Separation of Concerns:**
- Homepage focuses on individual user management
- Nbhd focuses on group/community features
- Each can evolve independently

**Deployment Flexibility:**
- Deploy each app separately
- Different update schedules for each
- Easier to scale each independently
- Different teams can work on each without conflicts

**User Experience:**
- Clear distinction between personal and community spaces
- Can optimize UX for each use case
- Users can navigate between both seamlessly via shared auth

## Homepage App (`homepage/`)

### Purpose
Personal space where users manage their profile, connections, and Nbhd participation.

### Key Features
- **Profile Management**: View and edit user profile
- **Activity Feed**: See personal activities and contributions
- **Nbhd List**: View and manage joined Nbhds
- **Connections**: Manage connections with other users
- **Settings**: Manage personal preferences and privacy

### Pages
- `/login` - Authentication via BlueSky
- `/dashboard` - Main homepage dashboard
- `/profile` - User profile page
- `/settings` - Account settings

### Development
```bash
cd homepage
npm install
npm run dev  # Runs on http://localhost:5173
```

### Building for Production
```bash
npm run build  # Output: dist/
```

### Deployment Option
- Deploy to S3 + CloudFront
- Subdomain: `username.nbhd.city` or `home.nbhd.city`
- Can handle thousands of concurrent users

## Nbhd App (`Nbhd/`)

### Purpose
Shared community space where users collaborate on local initiatives, discussions, and events.

### Key Features
- **Nbhd Directory**: Browse and join Nbhds
- **Discussions**: Community discussion boards
- **Events**: Create and manage local events
- **Resources**: Share recommendations and resources
- **Members**: View Nbhd members
- **Projects**: Collaborate on Nbhd projects

### Pages
- `/login` - Authentication via BlueSky
- `/Nbhds` - Browse Nbhds
- `/Nbhd/:id` - View specific Nbhd
- `/Nbhd/:id/discussions` - Discussion board
- `/Nbhd/:id/events` - Events listing
- `/Nbhd/:id/members` - Members directory

### Development
```bash
cd Nbhd
npm install
npm run dev -- --port 5174  # Runs on http://localhost:5174
```

### Building for Production
```bash
npm run build  # Output: dist/
```

### Deployment Option
- Deploy to S3 + CloudFront
- Subdomain: `Nbhd-name.nbhd.city` or `Nbhds.nbhd.city`
- Can handle Nbhd-level traffic

## Running Both Simultaneously

```bash
# Terminal 1: Homepage
cd homepage
npm run dev

# Terminal 2: Nbhd (in a new terminal)
cd Nbhd
npm run dev -- --port 5174
```

Then you can test:
- Homepage: http://localhost:5173
- Nbhd: http://localhost:5174
- API: http://localhost:8000

## Shared Components

Both apps share:

### Authentication Context (`src/contexts/AuthContext.jsx`)
- Global auth state management
- Token storage and validation
- User information management

### API Client (`src/lib/api.js`)
- Axios instance
- Automatic JWT token injection
- Error handling
- Configurable base URL

### Pages Pattern
- Login page (same OAuth flow)
- Dashboard/main page
- Protected routes

### Styling
- CSS Modules for scoped styles
- Consistent color schemes
- Mobile-responsive design

## Shared Backend API

Both apps communicate with the same FastAPI backend:

```
http://localhost:8000  (development)
```

### Authentication Endpoints
- `GET /auth/login` - Start OAuth flow
- `GET /auth/callback` - Receive auth code
- `GET /auth/me` - Get current user (protected)
- `POST /auth/logout` - Logout

### Future Endpoints
Backend needs to support:

**Homepage specific:**
- `GET /api/profile/:user_id` - Get user profile
- `PUT /api/profile/:user_id` - Update profile
- `GET /api/user/activity` - Get user activity
- `GET /api/user/Nbhds` - Get joined Nbhds

**Nbhd specific:**
- `GET /api/Nbhds` - List all Nbhds
- `GET /api/Nbhds/:id` - Get Nbhd details
- `POST /api/Nbhds` - Create Nbhd
- `GET /api/Nbhds/:id/discussions` - Get discussions
- `GET /api/Nbhds/:id/events` - Get events
- `GET /api/Nbhds/:id/members` - Get members

## Development Workflow

### Adding a New Feature

1. **Identify which app it belongs to:**
   - Personal feature → Homepage
   - Community feature → Nbhd

2. **Update the app:**
   ```bash
   cd homepage  # or Nbhd
   # Add your components/pages
   # Add your API calls
   ```

3. **Update backend API if needed:**
   ```bash
   cd api
   # Add new endpoints
   ```

4. **Test both apps work together**

5. **Commit and push**

## File Structure

### Homepage
```
homepage/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── AuthSuccess.jsx
│   │   ├── Dashboard.jsx
│   │   └── Profile.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── api.js
│   ├── styles/
│   │   ├── Login.module.css
│   │   ├── AuthSuccess.module.css
│   │   └── Dashboard.module.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

### Nbhd
```
Nbhd/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── AuthSuccess.jsx
│   │   ├── Nbhds.jsx
│   │   ├── NbhdDetail.jsx
│   │   └── Events.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── api.js
│   ├── styles/
│   │   └── *.module.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

## Environment Variables

Both apps use:
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=nbhd.city
```

## Deployment

### Frontend Deployment Strategy

**Option 1: CloudFront + S3 (Simple)**
- Both apps behind CloudFront
- Route based on URL path
- `/` → Homepage
- `/Nbhds/*` → Nbhd app

**Option 2: Separate Deployments (Recommended)**
- Homepage on `home.nbhd.city`
- Nbhd on `Nbhds.nbhd.city`
- More flexible scaling
- Independent deployments
- Cross-domain auth handled by shared API

### Backend Deployment
- Single API serving both apps
- Lambda + API Gateway
- Handles all authentication
- Shared data models

## Migration Path

### From Original Frontend
1. Both `homepage` and `Nbhd` already exist
2. `frontend/` is the original (can be deprecated)
3. Gradually replace frontend with new structure
4. Users still log in via BlueSky OAuth
5. Same auth token works for both apps

## Future Enhancements

### Shared Libraries
Could extract common code into a shared package:
```
packages/
├── auth-sdk/          # Authentication utilities
├── api-client/        # API communication
└── ui-components/     # Shared components
```

### Cross-App Navigation
Add deep linking:
```javascript
// From Homepage to Nbhd
window.location.href = 'http://localhost:5174/Nbhds/123'

// From Nbhd back to Homepage
window.location.href = 'http://localhost:5173/dashboard'
```

### Unified Dashboard
Create a launcher page that links to both apps.

## Testing

### Test Each App Independently
```bash
cd homepage && npm run dev
# In another terminal
npm test  # When tests added
```

### Integration Testing
Test authentication flow across both apps:
1. Log in via Homepage
2. Visit Nbhd (should stay logged in)
3. Verify same auth token used

### End-to-End Testing
- Test user journey across both apps
- Test Nbhds created in Nbhd appear in Homepage
- Test profile changes in Homepage sync across apps

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Token Not Working Across Apps
- Verify both use same `SECRET_KEY` in API
- Check `VITE_API_URL` points to same backend
- Clear localStorage in both apps

### CORS Errors
- Ensure API allows requests from both ports (5173, 5174)
- Check CORS headers in FastAPI

## Summary

The split frontend architecture provides:
- ✅ Clear separation of concerns
- ✅ Independent scaling and deployment
- ✅ Shared authentication system
- ✅ Flexible future growth
- ✅ Better team organization
- ✅ Easier to maintain each app

Both apps work seamlessly together via the shared API and authentication system while allowing independent development and deployment.
