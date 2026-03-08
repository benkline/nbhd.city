# Phase 14: Content Management

**Status:** Pending
**Objective:** Provide users with a dynamic CMS that adapts to their site's schema, enabling intuitive content creation and editing.

## Quick Overview

This phase builds the dynamic content management system. The CMS automatically generates forms from the analyzed template's schema. Users create content, and it's stored as AT Protocol records (portable and federated).

**See [social-site-generation.md](./social-site-generation.md#phase-14-content-management) for detailed workflow.**

## Key Workflow

```
Fetch Schema → Generate Forms → Create Content → Validate → Store as AT Protocol Record
```

## Key Components

- **DynamicSchemaService** - Schema-to-form transformation
- **EnhancedContentEditor** - Dynamic form editor
- **FrontmatterForm** - Schema-based form fields
- **Content APIs** - Save/retrieve AT Protocol records

## Tickets Included

- **SSG-022:** Dynamic Schema Service
- **SSG-023:** Template Schema to CMS Integration
- **SSG-024:** Content Save & Retrieval API Integration

## Success Criteria

✅ Forms adapt to template schema
✅ All field types render correctly
✅ Schema validation works
✅ Content stores as AT Protocol records
✅ Content queryable by type and site
