# nbhd.city Project Tickets

## Overview
This document contains epics, user stories, and tasks for nbhd.city - an online static site generator that creates homepages with blogs for members, aggregates posts, and provides collaboration tools via a plugin system.

---

## Epic 1: AT Protocol Integration

### User Story 1.1: Personal Data Store (PDS) Implementation
**As a** neighborhood system administrator
**I want** the nbhd to have a database that functions as a PDS for users
**So that** users can store and manage their personal data according to AT Protocol standards

**Tasks:**
- [ ] Research AT Protocol PDS requirements and specifications
- [ ] Evaluate DynamoDB vs other database options for PDS implementation
- [ ] Design PDS data schema compatible with AT Protocol
- [ ] Implement core PDS storage layer
- [ ] Create PDS read/write API endpoints
- [ ] Add authentication/authorization for PDS access
- [ ] Write unit tests for PDS functionality
- [ ] Document PDS architecture and usage

---

## Epic 2: Core API Development

### User Story 2.1: Account Management
**As a** new user
**I want** to create an account on nbhd.city
**So that** I can have my own homepage and participate in the neighborhood

**Tasks:**
- [ ] Design user account data model
- [ ] Create POST /api/accounts endpoint for account creation

- [ ] Implement account validation (username, email, etc.)
- [ ] Add subdomain generation for user accounts
- [ ] Integrate with Bluesky authentication option
- [ ] Create account activation/verification flow
- [ ] Write API documentation for account endpoints
- [ ] Add integration tests for account creation

### User Story 2.2: Static Site Generator - MVP Themes
**As a** user
**I want** to choose from pre-built themes for my homepage
**So that** I can quickly get a professional-looking site without design work

**Tasks:**
- [ ] Design theme system architecture
- [ ] Create theme configuration schema (colors, fonts, layouts)
- [ ] Implement Theme 1: Minimal/Clean design
- [ ] Implement Theme 2: Bold/Modern design
- [ ] Build theme selection interface
- [ ] Create homepage generation engine from theme templates
- [ ] Add theme preview functionality
- [ ] Write tests for theme rendering

### User Story 2.3: AI Agent Theme Generator
**As a** user
**I want** to generate a custom theme using AI from my logo, colors, and style preferences
**So that** I can have a unique homepage that matches my personal brand

**Tasks:**
- [ ] Research AI models for design generation (consider Claude, GPT-4 Vision, etc.)
- [ ] Design theme generation prompt templates
- [ ] Create API endpoint for theme generation request
- [ ] Implement logo upload and processing
- [ ] Build color palette extraction/suggestion system
- [ ] Integrate AI model for theme generation
- [ ] Create theme preview and refinement interface
- [ ] Add fallback mechanism if AI generation fails
- [ ] Test with various input types and validate outputs

### User Story 2.4: Database Migration to DynamoDB
**As a** system administrator
**I want** to migrate from external Postgres to embedded DynamoDB
**So that** the system is simpler to deploy and maintain

**Tasks:**
- [ ] Audit current Postgres schema and usage patterns
- [ ] Design DynamoDB database schema
- [ ] Create migration scripts from Postgres to DynamoDB
- [ ] Update database connection layer to support DynamoDB

### User Story 2.5: Database needs for at://
**As a** system administrator
**I want** to... 
**So that** ...
**Tasks:**
- [ ] Configure DynamoDB for PDS requirements
- [ ] Implement data backup and recovery procedures
- [ ] Performance test DynamoDB under expected load
- [ ] Update deployment documentation

---

## Epic 3: Neighborhood (nbhd) Features

### User Story 3.1: Neighborhood Landing Page
**As a** visitor
**I want** to view a neighborhood landing page with login capability
**So that** I can learn about the neighborhood and access my account

**Tasks:**
- [ ] Design landing page layout and content structure
- [ ] Implement landing page with neighborhood description
- [ ] Create login form component
- [ ] Add "Create Account" call-to-action
- [ ] Implement responsive design for mobile/tablet
- [ ] Add neighborhood branding/customization options
- [ ] Create tests for landing page functionality

### User Story 3.2: Account Creation Flow
**As a** new user
**I want** multiple options to create an account (native or Bluesky)
**So that** I can choose the authentication method that works best for me

**Tasks:**
- [ ] Design account creation UI with option selection
- [ ] Implement native account creation flow
- [ ] Integrate Bluesky OAuth authentication

- [ ] Create subdomain assignment logic based on username
- [ ] Add subdomain availability checking
- [ ] Implement email verification for native accounts
- [ ] Create onboarding flow after account creation
- [ ] Add error handling and user feedback

### User Story 3.3: Project Homepage Management
**As a** user
**I want** to create homepages for projects separate from my account
**So that** I can showcase different projects independently

**Tasks:**
- [ ] Design project data model (separate from user accounts)
- [ ] Create UI for project creation and management
- [ ] Implement project-to-user relationship
- [ ] Add project subdomain/slug generation
- [ ] Build project homepage configuration interface
- [ ] Allow theme selection per project
- [ ] Create project listing page for users
- [ ] Add project privacy settings (public/private)

### User Story 3.4: Bluesky List Integration
**As a** neighborhood member
**I want** to integrate with Bluesky lists
**So that** I can follow and organize neighborhood members on Bluesky

**Tasks:**
- [ ] Research Bluesky List API capabilities
- [ ] Design list sync architecture
- [ ] Create API endpoints for list management
- [ ] Implement list creation from neighborhood members
- [ ] Add ability to import existing Bluesky lists
- [ ] Build UI for viewing and managing lists
- [ ] Add automatic list updates when members join
- [ ] Test list synchronization

### User Story 3.5: Plugin System Foundation
**As a** developer
**I want** a plugin system architecture
**So that** the neighborhood can be extended with collaboration tools

**Tasks:**
- [ ] Design plugin architecture and lifecycle
- [ ] Define plugin API and interfaces
- [ ] Create plugin registration system
- [ ] Implement plugin discovery and loading
- [ ] Add plugin configuration management
- [ ] Create plugin sandbox/security boundaries
- [ ] Write plugin developer documentation
- [ ] Build example "Hello World" plugin

### User Story 3.6: Chat and Collaboration Plugins
**As a** neighborhood member
**I want** access to chat and collaboration tools
**So that** I can communicate and work with other members

**Tasks:**
- [ ] Design real-time chat plugin architecture
- [ ] Implement WebSocket/real-time connection layer
- [ ] Create chat room/channel system
- [ ] Build chat UI component
- [ ] Add direct messaging functionality
- [ ] Implement notification system for new messages
- [ ] Create file sharing capability in chat
- [ ] Add message history and search

### User Story 3.7: AI Plugin Generator
**As a** neighborhood administrator
**I want** an AI agent that can create custom plugins
**So that** I can quickly add new functionality without manual coding

**Tasks:**
- [ ] Design plugin generation prompt system
- [ ] Create UI for describing desired plugin functionality
- [ ] Implement AI code generation for plugins
- [ ] Add plugin validation and testing automation
- [ ] Create plugin preview/sandbox environment
- [ ] Implement plugin installation from generated code
- [ ] Add feedback loop for plugin refinement
- [ ] Document plugin generation capabilities and limitations

---

## Epic 4: Homepage Features

### User Story 4.1: Static Site Generation
**As a** user
**I want** my homepage to be a static site that doesn't require login
**So that** visitors can view my content without barriers

**Tasks:**
- [ ] Design static site generation pipeline
- [ ] Create homepage template system
- [ ] Implement site build process
- [ ] Add automatic rebuilding on content updates
- [ ] Configure CDN/hosting for static sites
- [ ] Optimize asset delivery (images, CSS, JS)
- [ ] Add sitemap.xml generation
- [ ] Implement RSS feed for blog posts

### User Story 4.2: Blog with Markdown Editor
**As a** user
**I want** to write blog posts using an open-source JavaScript Markdown editor
**So that** I can create formatted content easily

**Tasks:**
- [ ] Evaluate and select open-source Markdown editor (e.g., CodeMirror, EasyMDE)
- [ ] Integrate Markdown editor into blog creation UI
- [ ] Implement blog post data model
- [ ] Create blog post CRUD endpoints
- [ ] Add blog post preview functionality
- [ ] Implement draft vs published status
- [ ] Add image upload and embedding in posts
- [ ] Create blog post listing and detail pages

### User Story 4.3: Blog Post to Bluesky Integration
**As a** user
**I want** to automatically publish blog summaries as Bluesky posts (skeets)
**So that** my followers on Bluesky are notified of new content

**Tasks:**
- [ ] Design blog-to-Bluesky sync system
- [ ] Implement summary generation (manual or AI-powered)
- [ ] Create Bluesky posting API integration
- [ ] Add opt-in/opt-out toggle for auto-posting
- [ ] Include link back to full blog post
- [ ] Handle character limits and formatting
- [ ] Add post status tracking (posted/failed)
- [ ] Create manual retry mechanism for failed posts

### User Story 4.4: Neighborhood Directory
**As a** visitor
**I want** to see a list of neighborhoods on a user's homepage
**So that** I can discover and navigate to other neighborhoods

**Tasks:**
- [ ] Design neighborhood directory UI component
- [ ] Create endpoint to fetch neighborhood list
- [ ] Implement neighborhood search/filter functionality
- [ ] Add neighborhood metadata (description, member count, etc.)
- [ ] Create neighborhood card component
- [ ] Add pagination for large neighborhood lists
- [ ] Implement neighborhood categories/tags
- [ ] Make directory embeddable on homepages

### User Story 4.5: DNS for Bluesky Authentication
**As a** user
**I want** to use DNS for Bluesky authentication on my custom domain
**So that** my Bluesky identity is verified with my homepage domain

**Tasks:**
- [ ] Research Bluesky DNS verification requirements
- [ ] Document DNS record requirements for users
- [ ] Create DNS configuration guide
- [ ] Implement DNS verification check
- [ ] Add verification status display in admin panel
- [ ] Create automated DNS setup for supported providers
- [ ] Add troubleshooting documentation
- [ ] Test with various DNS providers

### User Story 4.6: Homepage Administration Panel
**As a** user
**I want** an admin page to configure my custom domain and update content
**So that** I can manage my homepage without technical knowledge

**Tasks:**
- [ ] Design admin panel UI/UX
- [ ] Create custom domain configuration interface
- [ ] Implement domain verification process
- [ ] Add SSL certificate management
- [ ] Build content editing interface
- [ ] Create theme customization controls
- [ ] Add homepage preview functionality
- [ ] Implement navigation menu editor
- [ ] Add SEO settings (meta tags, descriptions)
- [ ] Create backup and restore functionality

---

## Notes
- Priority order should be determined based on MVP requirements and dependencies
- Each task should be estimated and assigned to sprints
- Consider technical dependencies when scheduling (e.g., PDS must be completed before certain API features)
- Security review needed for authentication, PDS, and plugin system stories
