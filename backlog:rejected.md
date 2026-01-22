## backlog / rejected tickets

### Custom Template System

#### SSG-011: Template Schema Format Research & Design
- **Description:** Define standard template schema format and analysis approach for custom templates
- **Requirements:**
  - [ ] Research 11ty template structure and conventions
  - [ ] Define standardized `template.config.json` format that all templates must provide
  - [ ] Design schema extraction algorithm for analyzing template structure
  - [ ] Document template requirements (folder structure, data files, etc)
  - [ ] Create architecture decision record (ADR) for custom template system
- **Acceptance Criteria:**
  - [ ] Clear documentation of expected template structure
  - [ ] Schema format defined and documented
  - [ ] Examples for Blog, Project, Newsletter templates
  - [ ] Design document ready for implementation
- **Type:** Research/Design
- **Estimate:** M

#### SSG-012: Custom Template Registration API
- **Description:** Implement API endpoints for users to register and manage custom 11ty templates from Git repos
- **Requirements:**
  - [ ] `POST /api/templates/register` - Register new template from Git URL
  - [ ] `GET /api/templates/{id}/analyze` - Trigger template analysis and schema generation
  - [ ] `GET /api/templates/custom` - List user's custom templates
  - [ ] `DELETE /api/templates/{id}` - Remove custom template
  - [ ] Validate Git repo is accessible and contains valid 11ty template
  - [ ] Store template metadata in DynamoDB (repo URL, analysis status, schema, etc)
- **Acceptance Criteria:**
  - [ ] Can register templates from public Git repos
  - [ ] Validation checks template structure before registering
  - [ ] Schema generation triggered automatically on registration
  - [ ] Custom templates stored in DynamoDB with proper user ownership
  - [ ] Returns 400 for invalid templates, 201 for successful registration
- **Type:** Backend/API
- **Estimate:** M

#### SSG-013: Template Analyzer Python Script
- **Description:** Create Python utility to analyze 11ty templates and auto-generate config schemas
- **Requirements:**
  - [ ] Clone/fetch 11ty template from Git repo
  - [ ] Analyze template structure (pages, layouts, data files, assets)
  - [ ] Extract config variables from template documentation/code comments
  - [ ] Generate JSON schema from config requirements
  - [ ] Validate schema against template code
  - [ ] Support multiple template types (blog, portfolio, documentation, etc)
  - [ ] Handle errors gracefully (missing files, invalid syntax, etc)
- **Acceptance Criteria:**
  - [ ] Successfully analyzes Blog, Project, Newsletter templates
  - [ ] Generates valid JSON schemas matching actual template config needs
  - [ ] Handles edge cases (no config docs, custom 11ty plugins, etc)
  - [ ] Runs in under 10 seconds per template
  - [ ] Clear error messages for invalid templates
- **Type:** Backend/Utility
- **Estimate:** L

#### SSG-014: Custom Template Selection & Analysis UI
- **Description:** Build frontend UI for users to register and select custom templates from Git
- **Requirements:**
  - [ ] Form component to input Git repo URL (HTTPS)
  - [ ] "Analyze Template" button to trigger schema generation
  - [ ] Real-time status updates (analyzing, success, error)
  - [ ] Display extracted schema fields and validation rules
  - [ ] "Save Template" to add to user's available templates
  - [ ] Updated TemplateGallery to show both built-in and custom templates
  - [ ] Template preview/details modal with documentation
- **Acceptance Criteria:**
  - [ ] Can input and validate Git URLs
  - [ ] Displays analysis progress to user
  - [ ] Shows generated schema in readable format
  - [ ] Custom templates appear in TemplateGallery alongside built-in ones
  - [ ] Error handling for invalid repos, network issues, etc
  - [ ] Mobile-responsive design
- **Type:** Frontend
- **Estimate:** M

### Templates: Initial Implementations

#### SSG-015: Blog Template (11ty)
- **Description:** Personal blog template with posts, tags, and RSS
- **Requirements:**
  - [ ] Homepage with recent posts
  - [ ] Individual post pages (Markdown)
  - [ ] Tag archive pages
  - [ ] RSS feed generation
  - [ ] Config schema: site title, author, description, accent color
  - [ ] Responsive mobile-first design
- **Acceptance Criteria:**
  - [ ] All pages render correctly
  - [ ] Posts display from data files
  - [ ] RSS feed is valid
  - [ ] Looks good on mobile/tablet/desktop
- **Type:** Template
- **Estimate:** M

#### SSG-016: Project Showcase Template (11ty)
- **Description:** Team project page with gallery and contributors
- **Requirements:**
  - [ ] Project overview
  - [ ] Team member cards
  - [ ] Image gallery
  - [ ] Project status/progress
  - [ ] Config schema: project name, description, team list, gallery images
- **Acceptance Criteria:**
  - [ ] Team members display correctly
  - [ ] Gallery images load
  - [ ] Mobile responsive
  - [ ] Professional appearance
- **Type:** Template
- **Estimate:** M

