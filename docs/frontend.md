# Frontend Guide

React UI components, page structure, and development practices for nbhd.city.

## Overview

The frontend is a **React 19.2 SPA** built with **Vite 7.2**, deployed as static files to S3 + CloudFront.

**Key Tools:**
- **React Router v7** - Client-side routing (hash-based for static hosting)
- **Axios** - HTTP client with automatic JWT token injection
- **CSS Modules** - Component-scoped styling (no global CSS conflicts)
- **Vitest + React Testing Library** - Component testing

**Development:**
```bash
cd app/UI
npm run dev      # Start on http://localhost:5173
npm test         # Run component tests
npm run build    # Production build
```

## Page Structure

```
src/pages/
├── HomePage.jsx          # Landing page
├── LoginPage.jsx         # BlueSky OAuth login flow
├── DashboardPage.jsx     # User dashboard (authenticated)
├── NbhdPage.jsx          # Neighborhood view
├── SitesPage.jsx         # Browse/manage sites
├── SiteDetailPage.jsx    # Individual site config
├── ContentPage.jsx       # Create/edit content
└── AdminPage.jsx         # Neighborhood admin (owners only)
```

## Core Components

### Authentication
- **LoginButton** - Initiates BlueSky OAuth flow
- **ProtectedRoute** - Wrapper ensuring user is authenticated
- **UserMenu** - Profile dropdown and sign out

### Neighborhoods
- **NbhdCard** - Display neighborhood info (list view)
- **NbhdMemberList** - Browse members, manage roles
- **NbhdForm** - Create or update neighborhood settings
- **JoinNbhdModal** - Join existing neighborhood

### Sites
- **SiteCard** - Display site summary with actions
- **SiteConfigForm** - Template selection + dynamic config fields
- **SitePreview** - Live preview of site config
- **SiteList** - Browse all sites in neighborhood
- **BuildStatus** - Real-time build progress indicator

### Content Management
- **ContentEditor** - Rich text editor for creating content
- **ContentList** - Browse content records
- **ContentPreview** - Preview content before publish
- **SmartPrefill** - Auto-fill from user profile

### Layout
- **Navigation** - Top bar with logo, nav links, user menu
- **Sidebar** - (optional) Navigation sidebar
- **Layout** - Main wrapper for pages

## Component Organization

Each component follows this structure:

```
ComponentName.jsx          # Component code
ComponentName.module.css   # Component styles (CSS Modules)
__tests__/
  ComponentName.test.jsx   # Component tests
```

**Example Component:**

```jsx
import styles from './MyComponent.module.css';

export function MyComponent({ title }) {
  return (
    <div className={styles.container}>
      <h1>{title}</h1>
    </div>
  );
}
```

## API Integration

The **Axios client** automatically injects JWT tokens from localStorage:

```jsx
import { api } from './api';

// GET
const response = await api.get('/nbhds');

// POST
const site = await api.post('/sites', { name: 'My Blog' });

// PUT
await api.put(`/sites/${id}`, { config });

// DELETE
await api.delete(`/sites/${id}`);
```

JWT token is automatically included in all requests. If token is missing or expired, user is redirected to login.

## State Management

Uses **React Context + custom hooks** (no Redux):

```jsx
import { useAuth } from './hooks/useAuth';
import { useNbhd } from './hooks/useNbhd';

export function MyComponent() {
  const { user, isLoading } = useAuth();
  const { nbhd } = useNbhd();

  return <div>Hello, {user.name}!</div>;
}
```

**Common Hooks:**
- `useAuth()` - Current user and login status
- `useNbhd()` - Current neighborhood data
- `useSites()` - User's sites
- `useContent()` - Neighborhood content

## Styling (CSS Modules)

All styles are component-scoped using **CSS Modules** to prevent naming conflicts:

```css
/* ComponentName.module.css */

.container {
  display: flex;
  gap: 1rem;
  padding: 2rem;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
}
```

```jsx
import styles from './ComponentName.module.css';

export function ComponentName() {
  return <div className={styles.container}></div>;
}
```

## Testing Components

Tests use **Vitest + React Testing Library**:

```jsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

**Run Tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Form Handling

Use standard React patterns with controlled inputs:

```jsx
const [form, setForm] = useState({ name: '', description: '' });

function handleChange(e) {
  const { name, value } = e.target;
  setForm(prev => ({ ...prev, [name]: value }));
}

return (
  <input
    name="name"
    value={form.name}
    onChange={handleChange}
  />
);
```

## Error Handling

Display user-friendly error messages:

```jsx
const [error, setError] = useState('');

async function handleSubmit() {
  try {
    await api.post('/sites', formData);
  } catch (err) {
    setError(err.response?.data?.detail || 'Something went wrong');
  }
}

return error && <ErrorMessage message={error} />;
```

## Environment Variables

Frontend environment variables are in `app/UI/.env.local`:

```
VITE_API_URL=http://localhost:8001
```

Access in code:
```jsx
const apiUrl = import.meta.env.VITE_API_URL;
```

## Build for Production

```bash
cd app/UI
npm run build
```

Creates optimized `dist/` folder ready for S3 + CloudFront deployment.

## Key Files

| File | Purpose |
|------|---------|
| `src/main.jsx` | App entry point |
| `src/App.jsx` | Root component with routing |
| `src/api.js` | Axios client setup |
| `src/hooks/` | Custom React hooks |
| `src/pages/` | Page components |
| `src/components/` | Reusable components |
| `src/styles/` | Global CSS (minimal) |

## Related Documentation

- **[Getting Started](./getting-started.md)** - Local dev setup
- **[Backend Guide](./backend.md)** - API endpoints the frontend calls
- **[Site Builder](./site-builder.md)** - 11ty template system
- **[specs/FRONTEND.md](../specs/FRONTEND.md)** - Detailed frontend specs

---

**Development:** `npm run dev` to start with hot reload
**Testing:** `npm test` to run Vitest
**Build:** `npm run build` for production
