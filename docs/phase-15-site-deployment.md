# Phase 15: Site Deployment

**Status:** Pending
**Objective:** Enable users to build and deploy their sites to S3 with automated 11ty builds, asset optimization, and CDN distribution.

## Quick Overview

This phase handles the complete build and deployment pipeline. Users click "Build & Deploy" and their site automatically compiles (11ty), uploads to S3, and gets served via CloudFront CDN. Real-time progress UI shows build status.

**See [social-site-generation.md](./social-site-generation.md#phase-15-site-deployment) for detailed workflow.**

## Key Workflow

```
Build & Deploy → Clone Template → Fetch Content → Build 11ty → Upload S3 → Invalidate CDN → Live
```

## Key Components

- **BuildTriggerButton** - Start build action
- **BuildStatusPoller** - Real-time progress updates
- **BuildHistory** - Past builds and status tracking
- **S3 & CloudFront** - Storage and CDN delivery
- **site_builder Lambda** - 11ty orchestration

## Tickets Included

- **SSG-025:** Build Trigger and Status UI
- **SSG-026:** Build Pipeline & S3 Infrastructure Verification
- **SSG-027:** End-to-End Workflow Testing

## Success Criteria

✅ Builds trigger reliably from CMS
✅ Real-time progress updates
✅ Sites deploy to S3 correctly
✅ CloudFront invalidation works
✅ Error messages are clear
✅ Build time < 5 minutes
✅ Infrastructure fully configured
✅ Complete workflow tested end-to-end
