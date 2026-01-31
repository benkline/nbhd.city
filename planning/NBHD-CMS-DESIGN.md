# Neighborhood CMS & Admin Features Design

**Document Version:** 1.0
**Phase:** 2g
**Last Updated:** 2026-01-31

## Overview

Phase 2g transforms nbhd.city from a site builder into a full Content Management System (CMS) where neighborhoods become AT Protocol personas that can publish content and manage their public presence.

## Architecture Goals

1. **Neighborhoods as First-Class Entities**: Every neighborhood gets a DID and can publish AT Protocol records
2. **Admin Control**: Neighborhood owners control welcome pages, announcements, and metadata
3. **Public Welcome Pages**: Unauthenticated users see welcome instructions or custom content
4. **CMS View**: Admins see all AT Protocol records (content, sites, metadata) in one place
5. **Site Type Distinction**: Separate workflows for personal vs project sites

## Data Model

### Neighborhood Record Enhancement

```
Neighborhoods Table (DynamoDB)
├── id (PK)
├── name
├── created_by (user_id)
├── created_at
├── nbhd_did (NEW) ← Generated on creation
│   └── Format: did:plc:{key} or equivalent
├── metadata (NEW)
│   ├── display_name
│   ├── description
│   └── settings object
└── [existing fields]
```

**Key Points:**
- `nbhd_did` is unique per neighborhood
- Generated on neighborhood creation
- Never changes (immutable identifier)
- Enables DID-based access control for AT Protocol records

### Site Record Enhancement

```
Sites Table (DynamoDB)
├── id (PK)
├── user_id (creator)
├── template_id
├── site_type (NEW) ← "personal" | "project"
├── nbhd_id (conditional)
│   └── Required if site_type="project"
│   └── Optional if site_type="personal"
├── config
└── [existing fields]
```

**Key Points:**
- Personal sites: Belong to individual users, no nbhd association
- Project sites: Belong to neighborhood, created by members
- Query filtering: `GET /api/sites?site_type=personal|project`

### AT Protocol Records for Neighborhood Content

#### Welcome Content Record

```
Record Type: app.nbhd.welcome
Collection: com.atproto.record
Storage: DynamoDB RECORD# partition

Schema:
{
  "title": string,
  "content": string (markdown),
  "updated_at": ISO8601,
  "published_at": ISO8601,
  "author_did": string (nbhd DID),
}

AT URI Format: at://did:plc:xxx/app.nbhd.welcome/default
Record Key: "default" (singleton - only one welcome per nbhd)
```

#### Announcement Record

```
Record Type: app.nbhd.announcement
Collection: com.atproto.record
Storage: DynamoDB RECORD# partition

Schema:
{
  "title": string,
  "content": string (markdown),
  "priority": "normal" | "urgent" | "info",
  "published_at": ISO8601,
  "expires_at": ISO8601 (optional),
  "author_did": string (nbhd DID),
}

AT URI Format: at://did:plc:xxx/app.nbhd.announcement/{rkey}
Record Key: Auto-generated TID (chronologically sortable)
```

#### Neighborhood Metadata Record

```
Record Type: app.nbhd.metadata
Collection: com.atproto.record
Storage: DynamoDB RECORD# partition

Schema:
{
  "display_name": string,
  "description": string,
  "avatar_url": string (optional),
  "banner_url": string (optional),
  "website": string (optional),
  "social_links": object,
  "updated_at": ISO8601,
}

AT URI Format: at://did:plc:xxx/app.nbhd.metadata/default
Record Key: "default" (singleton)
```

## API Routes

### Neighborhood Content Endpoints

```
POST /api/nbhds/{id}/content/welcome
├── Auth: require_nbhd_admin(nbhd_id, user_id)
├── Body: { title, content (markdown) }
├── Returns: { uri, cid, rkey, created_at }
└── Action: Creates/updates app.nbhd.welcome record

GET /api/nbhds/{id}/content/welcome
├── Auth: Public
├── Returns: { title, content, updated_at, published_at }
└── Returns: { error: "not_found" } if no welcome content

POST /api/nbhds/{id}/content/announcements
├── Auth: require_nbhd_admin(nbhd_id, user_id)
├── Body: { title, content, priority?, expires_at? }
├── Returns: { uri, cid, rkey, created_at }
└── Action: Creates app.nbhd.announcement record

GET /api/nbhds/{id}/content/announcements
├── Auth: Public
├── Query: ?limit=50&offset=0 (pagination)
├── Returns: [{ rkey, title, content, priority, published_at, expires_at }]
└── Sorting: newest first (by TID)

DELETE /api/nbhds/{id}/content/announcements/{rkey}
├── Auth: require_nbhd_admin(nbhd_id, user_id)
├── Returns: { deleted: true }
└── Action: Soft-deletes announcement record (marked as deleted)

GET /api/nbhds/{id}/content/cms
├── Auth: require_nbhd_admin(nbhd_id, user_id)
├── Returns: CMS View (see below)
└── Aggregates all AT Protocol records for this nbhd
```

### CMS View Response Format

```json
{
  "nbhd_id": "string",
  "nbhd_did": "did:plc:xxx",
  "welcome": {
    "uri": "at://did:plc:xxx/app.nbhd.welcome/default",
    "cid": "bafyreib2rxk3rh6kzwq...",
    "rkey": "default",
    "created_at": "2026-01-31T10:00:00Z",
    "updated_at": "2026-01-31T12:00:00Z",
    "content_preview": "Welcome to..."
  },
  "announcements": [
    {
      "uri": "at://did:plc:xxx/app.nbhd.announcement/3jzfcijpj2z2a",
      "cid": "bafyreib2rxk3rh6kzwq...",
      "rkey": "3jzfcijpj2z2a",
      "created_at": "2026-01-31T14:00:00Z",
      "title": "Announcement title",
      "priority": "normal",
      "content_preview": "First 100 chars..."
    }
  ],
  "sites": [
    {
      "id": "site-123",
      "name": "Project Blog",
      "site_type": "project",
      "status": "published",
      "url": "https://project.nbhd.city"
    }
  ],
  "metadata": {
    "uri": "at://did:plc:xxx/app.nbhd.metadata/default",
    "cid": "bafyreib2rxk3rh6kzwq...",
    "display_name": "Tech Neighborhood",
    "description": "A community for tech enthusiasts"
  }
}
```

## Admin Access Control

### `require_nbhd_admin()` Middleware

```python
def require_nbhd_admin(nbhd_id: str, user_id: str):
    """
    Verify user is the neighborhood creator/owner.
    Raises 403 Forbidden if not authorized.
    """
    nbhd = db.get_neighborhood(nbhd_id)
    if nbhd.created_by != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return nbhd
```

**Who can access admin endpoints:**
- Neighborhood creator/owner only
- All modification endpoints (POST, PUT, DELETE) require this
- GET endpoints (except CMS) are public

## Frontend Component Architecture

### Component Hierarchy

```
AdminPage.jsx
├── AccessCheck (redirects non-owners)
├── TabNavigation (Welcome | Announcements | Settings | Sites)
│
├── Welcome Tab
│   └── WelcomeContentEditor.jsx
│       └── ContentEditor.jsx (existing, reused)
│
├── Announcements Tab
│   └── AnnouncementManager.jsx
│       ├── AnnouncementForm.jsx (create)
│       └── AnnouncementList.jsx (list/delete)
│
├── Settings Tab
│   └── NbhdSettingsForm.jsx
│       ├── DisplayName input
│       ├── Description textarea
│       └── Links inputs
│
└── Sites Tab
    └── SitesTab.jsx
        └── SiteManagementDashboard.jsx (existing, filtered)

WelcomePage.jsx (public route)
├── AccessCheck (public)
├── WelcomePageDisplay.jsx
│   ├── DefaultWelcomeInstructions.jsx (if no content)
│   └── MarkdownRenderer.jsx (if content exists)

CMSView.jsx (admin only)
├── AccessCheck (admin only)
├── RecordFilterBar.jsx
├── ContentRecordsList.jsx
│   └── RecordItem.jsx (each record)
│       └── ATProtocolInspector.jsx (CID/rkey details)
```

### Component Reuse Strategy

**Leverage Existing Components:**
- `ContentEditor.jsx` → Wrap for welcome/announcement editing
- `SiteManagementDashboard.jsx` → Reuse with `site_type` filter prop
- `TemplateGallery.jsx` → No changes needed

**New Components Needed:**
- Admin page container and navigation
- Welcome/announcement management UI
- CMS view and record inspector
- Site type selector
- Personal/project site pages

**Why Reuse Works:**
- Components already support configuration via props
- Existing validation and error handling
- Reduces maintenance burden
- Consistent UX across features

## Welcome Page Behavior

### Default Welcome (No Content)

When no welcome content exists, show:

```
┌─────────────────────────────────────┐
│  Welcome to [Neighborhood Name]     │
│                                     │
│  This neighborhood doesn't have a   │
│  welcome page configured yet.       │
│                                     │
│  If you're the neighborhood owner:  │
│  [Go to Admin] button               │
│                                     │
│  Features you can add:              │
│  • Custom welcome message           │
│  • Community guidelines             │
│  • Member directory                 │
│  • Site showcase                    │
└─────────────────────────────────────┘
```

### Custom Welcome (With Content)

When welcome content exists:

```
┌─────────────────────────────────────┐
│  Welcome to [Neighborhood Name]     │
│                                     │
│  [Rendered Markdown Content]        │
│  • Formatted as provided            │
│  • Links are clickable              │
│  • Code blocks are styled           │
│                                     │
│  Last updated: [date]               │
└─────────────────────────────────────┘
```

## Migration Strategy

### For Existing Neighborhoods

1. **Phase 1 - Add DIDs**: Run migration script
   ```bash
   python api/migrations/add_nbhd_did.py
   ```
   - Generates unique DID for each existing neighborhood
   - Stores in DynamoDB
   - Idempotent (safe to run multiple times)

2. **Phase 2 - Add Site Type**: Update site creation
   - New sites automatically have site_type
   - Existing sites get default based on whether they have nbhd_id

3. **Phase 3 - Enable Admin Features**
   - Neighborhood owners see admin button
   - Can immediately create welcome/announcements
   - All stored as AT Protocol records

### Backward Compatibility

- `nbhd_did` optional (nil for old nbhds before migration)
- `site_type` defaults to "personal" if not specified
- Existing APIs continue to work
- No breaking changes to site creation

## Security Considerations

### Admin Access

- Always use `require_nbhd_admin()` on modification endpoints
- Check at start of request handler
- Return 403 for non-owners (never 404, prevents user enumeration)

### Public Access

- Welcome pages accessible to unauthenticated users
- Announcements readable by all
- CMS view admin-only (403 for non-admins)

### AT Protocol Records

- Records immutable once created (updates create new version)
- Soft deletes preserve history
- CID ensures content integrity

## Testing Strategy

### Backend Tests

```
test_nbhd_did_generation.py
├── New neighborhood gets unique DID
├── DIDs are never duplicated
├── Migration script handles existing nbhds
└── DIDs persist across updates

test_nbhd_content_api.py
├── Welcome content CRUD works
├── Announcements CRUD works
├── Non-admins get 403 errors
├── CMS view returns all content
├── Pagination works on announcements
└── AT Protocol record structure valid

test_site_type_filtering.py
├── Filtering by site_type works
├── Personal sites don't require nbhd
├── Project sites require nbhd
└── Query parameters work correctly
```

### Frontend Tests

```
AdminPage.test.jsx
├── Non-owners get redirected
├── Owners can access all tabs
├── Tab switching works
└── Unsaved changes warning shows

WelcomePage.test.jsx
├── Public users can view
├── Default instructions show when no content
├── Markdown renders correctly
└── Loading state displays

CMSView.test.jsx
├── Non-admins get error/redirect
├── Admins see all records
├── Filtering works
├── Pagination works
```

## References

- **Database Schema**: See [DATABASE.md](./DATABASE.md) - AT Protocol section
- **AT Protocol Records**: See [CONTENT_RECORDS.md](./CONTENT_RECORDS.md)
- **API Design**: See [API.md](./API.md)
- **Frontend Architecture**: See [FRONTEND.md](./FRONTEND.md)
- **Content Management**: See [SSG-011 - Content Records API](./tickets.md)
