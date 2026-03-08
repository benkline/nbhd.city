# Phase 12: Template Creation & Analysis

**Status:** In Progress
**Objective:** Enable users to analyze 11ty GitHub starter projects, automatically infer content schemas, and save templates to their personal library.

## Quick Overview

This phase handles automated template analysis. Users provide GitHub URLs to 11ty projects, and nbhd.city analyzes the repository to understand its frontmatter structure and infer content schemas. Analyzed templates are saved to the user's library for future site creation.

**See [social-site-generation.md](./social-site-generation.md#phase-12-template-creation--analysis) for detailed workflow.**

## Key Workflow

```
GitHub URL → Clone & Validate → Scan Frontmatter → Infer Schema → Save to Library
```

## Tickets Included

- **SSG-019:** Template URL Upload Component
- **SSG-020:** Template Analysis API Endpoint
- **SSG-021:** Enhanced Template Analyzer Lambda
- **SSG-028:** Save Analyzed Template to User Library

## Success Criteria

✅ Users can analyze any 11ty GitHub URL
✅ Schema inference detects content types and fields
✅ Analysis completes within 5 minutes
✅ Analyzed templates appear in personal library
✅ Analysis results persist and are reusable
