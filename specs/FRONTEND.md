# Frontend Architecture

**Focus:** React structure, pages, state management, styling
**Last Updated:** 2026-01-10

---

## Project Structure

```
nbhd/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Auth/
│   │   ├── Neighborhood/
│   │   ├── SiteBuilder/
│   │   └── Common/
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── NeighborhoodPage.jsx
│   │   ├── SiteEditor.jsx
│   │   └── NotFound.jsx
│   ├── contexts/            # React Context
│   │   ├── AuthContext.jsx
│   │   ├── NbhdContext.jsx
│   │   └── SiteEditorContext.jsx
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useMembers.js
│   │   ├── useSiteEditor.js
│   │   └── useApi.js
│   ├── services/            # API communication
│   │   ├── api.js           # Axios instance + interceptors
│   │   ├── authService.js
│   │   ├── nbhdService.js
│   │   └── siteService.js
│   ├── styles/              # Global + token styles
│   │   ├── global.css
│   │   ├── tokens.css       # Design system
│   │   └── reset.css
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── public/
├── index.html
├── package.json
└── vite.config.js
```

---

## Page Structure

### Public Pages (No auth required)

- **`/` → Home** - Landing page, neighborhood directory
- **`/login` → Login** - BlueSky OAuth login
- **`/neighborhoods/{id}` → Neighborhood Detail** - View neighborhood info, members, member list

### Authenticated Pages (Login required)

- **`/dashboard` → Dashboard** - User's neighborhoods and sites
- **`/neighborhoods/{id}/members` → Members List** - Manage members (admin)
- **`/site-editor/{id}` → Site Editor** - Create/edit static site configuration
- **`/site-editor/{id}/preview` → Live Preview** - WASM preview (or iframe)
- **`/settings` → User Settings** - Profile, privacy, integrations

---

## State Management

### AuthContext

Manages authentication state.

```jsx
{
  token: string | null,
  user: UserProfile | null,
  isLoading: boolean,
  login: () => void,
  logout: () => void,
  refreshProfile: async () => void
}
```

### NbhdContext

Manages current neighborhood and membership.

```jsx
{
  currentNbhd: Neighborhood | null,
  members: Array<Member>,
  membership: Membership | null,
  isAdmin: boolean,
  loadNbhd: async (id) => void,
  loadMembers: async (id) => void
}
```

### SiteEditorContext

Manages site configuration and preview state.

```jsx
{
  site: Site | null,
  config: object,
  isDrafty: boolean,
  buildStatus: "idle" | "building" | "success" | "error",
  updateConfig: (newConfig) => void,
  saveSite: async () => void,
  buildSite: async () => void,
  exportSite: async () => void
}
```

### Custom Hooks

```jsx
// useAuth() - Access auth state + methods
const { token, user, login, logout } = useAuth();

// useNbhd() - Access neighborhood state
const { currentNbhd, members, isAdmin } = useNbhd();

// useApi() - Simplified API calls with auth
const { get, post, put, delete: del, loading, error } = useApi();

// useSiteEditor() - Site config management
const { config, updateConfig, save, build } = useSiteEditor();
```

---

## Component Example: Template Gallery

```jsx
// components/SiteBuilder/TemplateGallery.jsx

import { useState, useEffect } from 'react';
import styles from './TemplateGallery.module.css';

export function TemplateGallery({ onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        setTemplates(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={styles.gallery}>
      {templates.map(template => (
        <div key={template.id} className={styles.card}>
          <img src={template.preview} alt={template.name} />
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <button onClick={() => onSelect(template)}>
            Select
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Styling Strategy

### CSS Modules (Component-scoped)

```css
/* components/SiteBuilder/TemplateGallery.module.css */

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Design Tokens

```css
/* styles/tokens.css */

:root {
  /* Colors */
  --color-primary: #007bff;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-border: #dee2e6;

  /* Typography */
  --font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;

  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
}
```

### Global Styles

```css
/* styles/global.css */

* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-primary);
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: #333;
  background: #fff;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

---

## Routing

Using React Router v7:

```jsx
// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { NbhdContext } from './contexts/NbhdContext';

export function App() {
  return (
    <AuthContext>
      <NbhdContext>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/neighborhoods/:id" element={<NbhdDetail />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/site-editor/:id" element={<SiteEditor />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </NbhdContext>
    </AuthContext>
  );
}
```

---

## Design Principles

1. **Component-scoped styles** - CSS Modules prevent global conflicts
2. **Design tokens** - Colors, spacing, typography in one place
3. **Responsive first** - Mobile → tablet → desktop
4. **Accessibility** - Semantic HTML, ARIA labels where needed
5. **No heavy frameworks** - Custom CSS (Tailwind considered in future)

---

## Performance Considerations

- **Code splitting** - Lazy-load pages with React.lazy()
- **Memoization** - Use React.memo() for expensive components
- **API caching** - Custom hooks cache API responses
- **Asset optimization** - Images lazy-loaded, SVGs inlined where appropriate

---

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [API.md](./API.md) - API communication
