# Plugin System Architecture

**Focus:** Plugin structure, installation, core plugins
**Phase:** 4 (after static sites, PDS, privacy features)
**Last Updated:** 2026-01-10

---

## Overview

Plugins extend nbhd.city with new features without modifying core code.

**Types:**
- **Core plugins** - Shipped with nbhd.city (messaging, projects, calendar)
- **Custom plugins** - Community-developed, installed by admins

Each plugin:
- Has its own API endpoints
- Contributes frontend components
- Can add database tables
- Uses plugin configuration system

---

## Plugin Structure

Each plugin is a self-contained module:

```
plugins/
├── messaging/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── models.py           # Pydantic models
│   │   ├── endpoints.py        # FastAPI routes
│   │   └── repository.py       # Data access
│   ├── frontend/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ChannelList.jsx
│   │   │   └── MessageInput.jsx
│   │   ├── pages/
│   │   │   └── MessagesPage.jsx
│   │   ├── hooks/
│   │   │   └── useMessages.js
│   │   ├── services/
│   │   │   └── messagingService.js
│   │   └── styles/
│   │       └── messaging.module.css
│   ├── infrastructure/
│   │   └── terraform.tf        # Optional: extra infra
│   ├── plugin.config.json      # Manifest
│   └── README.md
```

---

## Plugin Manifest (`plugin.config.json`)

```json
{
  "id": "messaging",
  "name": "Threaded Messaging",
  "version": "1.0.0",
  "description": "Slack-style threaded conversations for neighborhoods",
  "author": "nbhd.city team",
  "author_url": "https://nbhd.city",

  "api_routes": [
    {
      "method": "GET",
      "path": "/api/channels",
      "handler": "api.endpoints.list_channels",
      "auth_required": true,
      "role_required": "member"
    },
    {
      "method": "POST",
      "path": "/api/channels",
      "handler": "api.endpoints.create_channel",
      "auth_required": true,
      "role_required": "admin"
    },
    {
      "method": "POST",
      "path": "/api/messages",
      "handler": "api.endpoints.create_message",
      "auth_required": true,
      "role_required": "member"
    }
  ],

  "frontend_routes": [
    {
      "path": "/messages",
      "component": "pages/MessagesPage.jsx",
      "label": "Messages",
      "icon": "chat"
    }
  ],

  "database_entities": [
    "Channel",
    "Message",
    "Reaction"
  ],

  "permissions": [
    "messaging.read",
    "messaging.write",
    "messaging.moderate"
  ],

  "settings": {
    "max_message_length": 5000,
    "require_approval": false
  }
}
```

---

## Installation Process

### Admin UI Process

1. Navigate to `/admin/plugins`
2. Enter plugin Git URL or select from marketplace
3. System clones repo and validates `plugin.config.json`
4. Display plugin manifest and required permissions
5. Admin reviews and approves
6. System:
   - Clones plugin into `/plugins/{id}`
   - Runs optional Terraform for extra infra
   - Registers API routes
   - Compiles frontend components
   - Deploys changes
7. Plugin becomes active

### CLI Process (Self-hosted)

```bash
# Install plugin
./scripts/install-plugin.sh https://github.com/user/nbhd-plugin-calendar.git

# This script:
# - Clones plugin repo to /plugins/
# - Validates plugin.config.json
# - Merges plugin Terraform into devops/ (if needed)
# - Registers API routes in api/main.py
# - Adds plugin components to nbhd/src/plugins/
# - Runs terraform apply (if Terraform added)
# - Rebuilds and redeploys
```

---

## Plugin Development

### Creating a Plugin

```bash
mkdir my-plugin
cd my-plugin

# Create structure
mkdir api frontend infrastructure
touch api/__init__.py api/models.py api/endpoints.py api/repository.py
touch frontend/components.jsx frontend/services.js
touch infrastructure/terraform.tf
touch plugin.config.json README.md
```

### Example: Simple Task List Plugin

**plugin.config.json:**
```json
{
  "id": "tasks",
  "name": "Task List",
  "version": "1.0.0",
  "api_routes": [
    {
      "method": "GET",
      "path": "/api/tasks",
      "handler": "api.endpoints.list_tasks"
    }
  ],
  "frontend_routes": [
    {
      "path": "/tasks",
      "component": "pages/TasksPage.jsx"
    }
  ],
  "permissions": ["tasks.read", "tasks.write"]
}
```

**api/endpoints.py:**
```python
from fastapi import APIRouter, Depends
from .models import Task
from .repository import TaskRepository

router = APIRouter(prefix="/api/tasks")
repo = TaskRepository()

@router.get("")
async def list_tasks(current_user = Depends(get_current_user)):
    """List all tasks for current user"""
    return await repo.get_user_tasks(current_user.did)

@router.post("")
async def create_task(task: Task, current_user = Depends(get_current_user)):
    """Create a new task"""
    return await repo.create_task(current_user.did, task)
```

**frontend/pages/TasksPage.jsx:**
```jsx
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const { get, post } = useApi();

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await get('/api/tasks');
      setTasks(response.data);
    };
    fetchTasks();
  }, []);

  return (
    <div>
      <h1>Tasks</h1>
      {tasks.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  );
}
```

---

## Core Plugins (Phase 4)

### 1. Threaded Messaging

Slack-style channels and threads.

**Features:**
- Create channels (admins)
- Post messages
- Reply in threads
- Emoji reactions
- File uploads
- @mentions with notifications
- Search messages

**Permissions:** `messaging.read`, `messaging.write`, `messaging.moderate`

### 2. Project Management

Kanban board for tracking work.

**Features:**
- Create projects
- Tasks with assignees, due dates
- Stages (discovery, development, testing, shipped)
- Kanban board view
- Progress tracking
- Comments on tasks
- File attachments

**Permissions:** `projects.read`, `projects.write`, `projects.manage`

### 3. Calendar

Event scheduling and sync.

**Features:**
- Create events
- RSVP/attendance
- Google Calendar sync
- iCal export
- Task deadlines
- Recurring events
- Notifications

**Permissions:** `calendar.read`, `calendar.write`

---

## Plugin Registry & Marketplace (Phase 5)

### Plugin Marketplace

Central directory of community plugins:

```
https://plugins.nbhd.city/
├── Featured plugins
├── Search by category
├── Star/review system
├── Documentation
└── Installation one-click button
```

### Community Guidelines

- Plugins must be open-source
- Code reviewed before listing
- Regular security audits
- Terms of service compliance
- Data privacy standards

---

## Plugin Permissions & Security

### Permission Model

Plugins declare required permissions:

```json
{
  "permissions": [
    "messaging.read",      // Can read messages
    "messaging.write",     // Can create messages
    "user.profile.read"    // Can read user profile
  ]
}
```

Admin reviews before installation.

### Plugin Sandbox

Plugins run in same Lambda process but:
- Database access restricted to plugin tables
- Can only access allowed APIs
- Rate limited per plugin
- All requests logged

### Plugin Updates

- Plugins notified of updates via npm-style versioning
- Backward compatibility maintained
- Breaking changes require major version bump
- Admin approval for auto-updates

---

## Plugin Development Checklist

- [ ] plugin.config.json valid
- [ ] API routes documented
- [ ] Frontend components tested
- [ ] README with installation & usage
- [ ] License included (MIT, Apache, etc.)
- [ ] Examples of how to extend
- [ ] Error handling
- [ ] No security vulnerabilities
- [ ] Works with current nbhd version
- [ ] Git repository public

---

## Disabling/Removing Plugins

### Admin can:

```
/admin/plugins/{id}
├── Disable plugin (keep data)
├── Uninstall plugin (remove code)
└── Delete plugin (remove code + data)
```

After removal:
- API routes no longer available
- Frontend components removed
- Plugin data can be exported before deletion

---

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [API.md](./API.md) - API design
- [FRONTEND.md](./FRONTEND.md) - Frontend structure
