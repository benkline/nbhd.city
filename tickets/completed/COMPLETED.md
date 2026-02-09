# Completed Tickets - Chronological Archive

**Last Updated:** 2026-02-08

This file contains all completed tickets arranged by completion date (most recent first).

---

## Phase 9.1: Frontend Login & Authentication

### FL-9.1: Context-Aware Home Page
- **Completed:** 2026-02-08
- **Status:** Ready for Testing
- **PR:** #105
- **Type:** Frontend + Backend
- **Description:** Implement intelligent home page routing that displays appropriate content based on user authentication state and neighborhood configuration

---

## Phase 8: Build Pipeline UI Completion

### BUILD-003: Build History Dashboard
- **Completed:** 2026-02-07
- **Status:** Merged
- **PR:** #98
- **Type:** Frontend
- **Description:** Component to display past builds and their status

### BUILD-002: Build Status Poller
- **Completed:** 2026-02-07
- **Status:** Merged
- **Type:** Frontend
- **Description:** Component to poll and display build status and logs

### BUILD-001: Site Build Trigger UI
- **Completed:** (Early February 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** Add "Deploy Site" button to trigger site builds

---

## Phase 7: Neighborhood CMS & Admin Features

### SITES-003: Project Sites Page
- **Completed:** 2026-02-07
- **Status:** Merged
- **PR:** #96
- **Type:** Frontend
- **Description:** Create dedicated page for viewing and managing project sites

### SITES-001: Site Type Distinction
- **Completed:** 2026-02-05
- **Status:** Merged
- **Type:** Frontend + Backend
- **Description:** Add support for filtering sites by type (personal vs project)

### NBHD-005: CMS View for AT Protocol Data
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** Create CMS view showing all AT Protocol records for the neighborhood

### NBHD-004: Admin Page UI
- **Completed:** 2026-02-05
- **Status:** Merged
- **Type:** Frontend
- **Description:** Create admin interface for neighborhood owners to configure welcome page, announcements, and settings

### NBHD-003: Welcome Page UI
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** Create public-facing welcome page for neighborhoods with setup instructions

### NBHD-002: Neighborhood Content API
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** Create API router for neighborhood-owned AT Protocol content

### NBHD-001: Neighborhood DID & Data Model Enhancement
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** Add DID generation and site type distinction to data model

---

## Phase 6: Build Pipeline & Deployment

### SSG-018: Site Export to ZIP
- **Completed:** 2026-02-01
- **Status:** Merged
- **PR:** #81
- **Type:** Backend
- **Description:** Generate downloadable ZIP of built site files

### SSG-017: Subdomain Routing Setup
- **Completed:** 2026-01-31
- **Status:** Merged
- **PR:** #77
- **Type:** Infrastructure
- **Description:** Configure Route53 + CloudFront for subdomain deployment

### SSG-016-INFRA: Deploy 11ty Site Builder Lambda
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Infrastructure/Terraform
- **Description:** Terraform infrastructure to deploy the 11ty Site Builder Lambda function

### SSG-016: 11ty Lambda Build Function
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend/Lambda/Infrastructure
- **Description:** Lambda function to build static sites from templates and content

### SSG-015-INFRA: Configure API Lambda Permissions for Build Invocation
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Infrastructure/Terraform
- **Description:** Update IAM policies to allow API Lambda to invoke site builder and template analyzer Lambdas

### SSG-015: Site Build Trigger API
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** Endpoint to initiate Lambda build process

---

## Phase 5: Content Management

### SSG-014: Smart Content Prefilling
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend + Frontend
- **Description:** Auto-map user profile data to template content fields

### SSG-013: Dual Record Creation (BlueSky Integration)
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** Create linked AT Protocol records for blog posts and BlueSky summaries

### SSG-012: Content Editor UI Component
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** Rich content editor for creating blog posts and pages

### SSG-011: Content Records API
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** API for creating and managing content as AT Protocol records

---

## Phase 4: Template Analysis System

### SSG-010: Custom Template Selection UI
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** UI for users to add and select custom templates

### SSG-009-INFRA: Deploy Template Analyzer Lambda
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Infrastructure/Terraform
- **Description:** Terraform infrastructure to deploy the Template Analyzer Lambda function

### SSG-009: Template Analyzer Lambda Function
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend/Lambda
- **Description:** Lambda function to clone, validate, and analyze 11ty templates

### SSG-008: Custom Template Registration API
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** API endpoints for registering custom 11ty templates from GitHub

### SSG-007: Template Schema Inference Research
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Research
- **Description:** Research and design frontmatter scanning and JSON schema inference

---

## Phase 3: Template System & Site Config APIs

### SSG-006: Site Configuration Storage API
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** Implement endpoints to save and retrieve site configurations

### SSG-005: Template Management API
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Backend
- **Description:** Implement API endpoints for template discovery and metadata

### SSG-004: Site Management Dashboard
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** Build dashboard to view/manage user's static sites

### SSG-002: Build Site Configuration Form
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** Create dynamic form generator for template-specific config fields

### SSG-001: Create Template Gallery UI Component
- **Completed:** (January 2026)
- **Status:** Merged
- **Type:** Frontend
- **Description:** Build a TemplateGallery component that displays available 11ty templates

---

## Phase 2: AT Protocol Foundation

### ATP-FOUND-004: Basic Record CRUD Operations
- **Completed:** (December 2025)
- **Status:** Merged
- **Type:** Backend
- **Description:** Implement core CRUD operations for AT Protocol records in DynamoDB

### ATP-FOUND-003: Record Key (rkey) Generation
- **Completed:** (December 2025)
- **Status:** Merged
- **Type:** Backend
- **Description:** Implement TID (Timestamp Identifier) format for record keys

### ATP-FOUND-002: CID Generation Utilities
- **Completed:** (December 2025)
- **Status:** Merged
- **Type:** Backend
- **Description:** Implement Content Identifier (CID) generation for AT Protocol records

### ATP-FOUND-001: AT Protocol Record Schema in DynamoDB
- **Completed:** (December 2025)
- **Status:** Merged
- **Type:** Backend/Infrastructure
- **Description:** Extend DynamoDB schema to support AT Protocol record structure

---

## Phase 1: MVP Foundation

✅ **Completed** - All core foundational features implemented

- BlueSky OAuth authentication
- User profiles with BlueSky sync
- Neighborhood creation and membership
- DynamoDB single-table design
- Terraform AWS deployment
- React frontend with basic pages

---

## Summary Statistics

- **Total Completed Tickets:** 31
- **Most Recent Completion:** 2026-02-08 (FL-9.1)
- **Phases Completed:** 1, 2, 3, 4, 5, 6, 7, 8
- **Phase In Progress:** 9.1 (Partial)

---

## Next Tickets (In Progress)

- **FL-9.2** - Enhanced OAuth Login Flow
- **FL-9.3** - Persistent Sessions & Token Refresh
- **FL-9.4** - User Onboarding After First Login
- **FL-9.5** - Logout Flow & Session Cleanup
- **ATP-003** - DID Registration for Members
- **ATP-004** - DID to BlueSky Handle Mapping

---

For detailed specifications of any completed ticket, see the main [tickets.md](../tickets.md) file.
