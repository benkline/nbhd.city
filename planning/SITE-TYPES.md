# Site Types: Personal vs Project

**Document Version:** 1.0
**Phase:** 2g (SITES-001, SITES-002, SITES-003)
**Last Updated:** 2026-01-31

## Overview

Phase 2g introduces site type distinction to separate individual member sites from neighborhood project sites. This document defines the data model, API behavior, and UI patterns for site type handling.

## Concept

### Personal Sites
- **Owner**: Individual user
- **Purpose**: Personal blogs, portfolios, resumes
- **Scope**: User's own space
- **Neighborhood**: Optional (no association required)
- **Examples**: "John's Blog", "Jane's Portfolio"

### Project Sites
- **Owner**: Neighborhood (managed by neighborhood owner)
- **Purpose**: Community projects, shared resources
- **Scope**: Neighborhood-wide resource
- **Neighborhood**: Required (must specify which nbhd)
- **Examples**: "Tech Neighborhood Blog", "Community Newsletter"

## Data Model

### Site Record Schema

```
Sites Table (DynamoDB)
├── id (PK) - Unique site ID
├── user_id - Creator/Owner user ID
├── site_type - "personal" | "project" (NEW)
├── nbhd_id (conditional)
│   ├── For personal: Optional (usually null)
│   └── For project: Required (always present)
├── template_id - 11ty template
├── config - Template configuration
├── status - "draft" | "building" | "published"
├── created_at
├── updated_at
└── [other fields]
```

### Validation Rules

```
personal site:
  - site_type = "personal"
  - nbhd_id = null or omitted
  - user_id = authenticated user

project site:
  - site_type = "project"
  - nbhd_id = required, must exist
  - user_id = any authenticated user (can create for any nbhd they access)
    OR nbhd_id owner only (depends on feature design)
```

## API Endpoints

### Create Site

```
POST /api/sites
{
  "name": "My Blog",
  "template_id": "eleventy-blog",
  "site_type": "personal" | "project",
  "nbhd_id": "string (required if project, forbidden if personal)",
  "config": { template_config }
}

Response:
{
  "id": "site-123",
  "name": "My Blog",
  "site_type": "personal",
  "status": "draft",
  "created_at": "2026-01-31T10:00:00Z"
}
```

### List Sites with Filtering

```
GET /api/sites?site_type=personal|project

Filtering logic:
  - ?site_type=personal  → Returns only personal sites for user
  - ?site_type=project   → Returns only project sites user can access
  - no filter            → Returns all sites (personal + project)
  - ?nbhd_id=nbhd-123    → Can combine: project sites for specific nbhd
```

### Implied Access Rules

```
personal sites:
  - Only site creator can view/edit/delete
  - Returned by: GET /api/sites (auth required)

project sites:
  - All authenticated users can view
  - Only nbhd owner can edit/delete
  - Site creator displays in build log (for credit)
  - Returned by: GET /api/sites and GET /api/nbhds/{id}/sites
```

## Frontend Architecture

### Site Type Selection in Forms

```
SiteConfigForm Flow:
1. Show "Site Type" selector (radio buttons)
   ├── Personal (default)
   │   └── Hidden: nbhd_id field
   └── Project
       └── Show: nbhd selector (required)

2. If user selects "Project":
   ├── Fetch list of accessible neighborhoods
   ├── Show dropdown with nbhd names
   └── Validate nbhd_id not empty before submit
```

### Routing Architecture

```
/sites (dashboard)
├── /sites/personal
│   └── PersonalSites.jsx
│       └── Shows: Personal sites only
│       └── Create: Defaults to personal type
│
├── /sites/projects
│   └── ProjectSites.jsx
│       ├── NbhdSelector.jsx (filter by neighborhood)
│       └── Shows: Project sites filtered by nbhd
│       └── Create: Defaults to project type + requires nbhd
│
└── /sites/all (or default view)
    └── AllSites.jsx
        └── Shows: Both personal and project sites
        └── Grouped by type or nbhd
```

### Component Props

```javascript
// SiteManagementDashboard component
<SiteManagementDashboard
  site_type="personal" // "personal", "project", or undefined (all)
  nbhd_id={nbhd_id}    // Filter by neighborhood (optional)
  onCreateSite={handler}
/>
```

## Database Query Patterns

### Query Personal Sites

```python
# For current user only
sites = db.query(
  GSI='user_id-site_type',
  KeyConditionExpression=
    'user_id = :uid AND site_type = :type',
  ExpressionAttributeValues={
    ':uid': user_id,
    ':type': 'personal'
  }
)
```

### Query Project Sites

```python
# By neighborhood
sites = db.query(
  GSI='nbhd_id-site_type',
  KeyConditionExpression=
    'nbhd_id = :nbhd_id AND site_type = :type',
  ExpressionAttributeValues={
    ':nbhd_id': nbhd_id,
    ':type': 'project'
  }
)

# For user across all neighborhoods
sites = db.query(
  IndexName='user_id-site_type',
  KeyConditionExpression=
    'user_id = :uid AND site_type = :type',
  ExpressionAttributeValues={
    ':uid': user_id,
    ':type': 'project'
  }
)
```

### Required GSI for Queries

```
GSI-1: user_id-site_type
  ├── PK: user_id
  ├── SK: site_type
  └── Purpose: Query user's personal or project sites

GSI-2: nbhd_id-site_type
  ├── PK: nbhd_id
  ├── SK: site_type
  └── Purpose: Query sites for a neighborhood
```

## UI Patterns

### Personal Sites Page

```
┌─────────────────────────────────────┐
│ My Personal Sites                   │
├─────────────────────────────────────┤
│ [+ Create New Site]                 │
├─────────────────────────────────────┤
│                                     │
│ Site Name          Status  Actions  │
│ ──────────────────────────────────  │
│ My Blog           Published [→ Live]│
│ Portfolio         Draft     [Edit]  │
│ Resume            Draft     [Edit]  │
│                                     │
│ Personal sites are your own space   │
│ and are not associated with any     │
│ neighborhood.                       │
└─────────────────────────────────────┘
```

### Project Sites Page

```
┌─────────────────────────────────────┐
│ Neighborhood Project Sites          │
├─────────────────────────────────────┤
│ Filter: [All Neighborhoods ▼]       │
│ [+ Create New Project Site]         │
├─────────────────────────────────────┤
│                                     │
│ Tech Neighborhood                   │
│   Community Blog      Published     │
│   Events Page         Published     │
│                                     │
│ Arts Neighborhood                   │
│   Gallery Site        Draft         │
│                                     │
│ Project sites represent your        │
│ neighborhood. Only neighborhood     │
│ owners can edit them.               │
└─────────────────────────────────────┘
```

### Site Type Badge

```
Personal site:
┌─────────────────┐
│ 🧑 Personal     │
└─────────────────┘

Project site:
┌──────────────────────────────┐
│ 🏘️  Project (Tech Nbhd)      │
└──────────────────────────────┘
```

## Build Pipeline Integration

### Build Artifacts

```
Personal site builds:
└── s3://sites-bucket/personal-{site_id}/{build_id}/
    └── Serves at: personal-site-name.nbhd.city

Project site builds:
└── s3://sites-bucket/project-{nbhd_id}-{site_id}/{build_id}/
    └── Serves at: project-site-name.nbhd.city
       or nbhd-name.nbhd.city/project-name
```

### Build History

Both site types share build infrastructure. Builds include:
- Trigger user (who clicked "Deploy")
- Trigger time
- Build status (pending, running, completed, failed)
- Duration
- Logs/errors

## Migration Strategy

### For Existing Sites

```python
# Migration script: mark existing sites as personal
for site in db.scan(Sites):
  if site.site_type is None:
    if site.nbhd_id:
      # Was project (has nbhd)
      site.site_type = "project"
    else:
      # Was personal (no nbhd)
      site.site_type = "personal"
    db.update_item(site)
```

### Backward Compatibility

- `site_type` optional in requests (defaults to "personal")
- Queries work with or without filter
- Existing sites continue to work
- No breaking changes to site lifecycle

## Validation Rules

### When Creating Personal Site
```
Required:
  ✓ name
  ✓ template_id
  ✓ config

Forbidden:
  ✗ nbhd_id must not be provided or must be null

Computed:
  - site_type = "personal"
  - user_id = authenticated user
```

### When Creating Project Site
```
Required:
  ✓ name
  ✓ template_id
  ✓ config
  ✓ nbhd_id (must exist in database)

Optional:
  - site_type (defaults to "project" if nbhd_id provided)

Validation:
  - User must have access to specified neighborhood
  - Neighborhood must exist
  - Neighborhood must not be deleted

Computed:
  - site_type = "project"
  - user_id = authenticated user
```

## Security Considerations

### Authorization

```
personal site:
  - View: Owner only
  - Edit: Owner only
  - Delete: Owner only

project site:
  - View: All authenticated users
  - Edit: Neighborhood owner only
  - Delete: Neighborhood owner only
  - Build: Neighborhood owner only (or any member, TBD)
```

### Access Patterns

```
Listing sites:
  - Personal: GET /api/sites?site_type=personal
    → Returns only authenticated user's personal sites

  - Project: GET /api/sites?site_type=project
    → Returns all project sites user can access
    → Can filter by nbhd_id
```

## Testing Strategy

### Backend Tests

```
test_site_type_creation.py
├── Create personal site without nbhd_id
├── Create personal site fails if nbhd_id provided
├── Create project site requires nbhd_id
├── Create project site fails without nbhd_id
├── site_type is correctly stored
└── Defaults work correctly

test_site_type_filtering.py
├── Query personal sites for user
├── Query project sites for neighborhood
├── Query project sites for user across nbhds
├── Filter parameter works correctly
├── Pagination works with filtering
└── Empty results handled

test_site_type_validation.py
├── Nonexistent nbhd rejected
├── Deleted neighborhood rejected
├── User access to nbhd validated
└── Type field immutable after creation
```

### Frontend Tests

```
PersonalSites.test.jsx
├── Page loads with personal sites
├── Create button shows
├── Create defaults to personal type
├── List displays correctly
├── Edit/delete actions work
└── nbhd_id not shown

ProjectSites.test.jsx
├── Page loads with project sites
├── Neighborhood filter works
├── Create button shows
├── Create defaults to project type
├── nbhd_id selector shown and required
├── List displays with nbhd info
└── Edit/delete actions work

SiteConfigForm.test.jsx
├── Site type selector shown
├── Selecting personal hides nbhd
├── Selecting project shows nbhd
├── nbhd required validation
├── Form submission includes type
└── Defaults correct
```

## References

- **Ticket**: SITES-001 (Site Type Distinction), SITES-002 (Personal Sites Page), SITES-003 (Project Sites Page)
- **Database**: [DATABASE.md](./DATABASE.md)
- **API**: [API.md](./API.md)
- **Frontend**: [FRONTEND.md](./FRONTEND.md)
