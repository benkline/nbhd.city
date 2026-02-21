# Site Builder Guide

Static site generation using 11ty and template system for nbhd.city.

## Overview

nbhd.city enables neighborhoods to create and deploy static websites using **11ty (Eleventy)** templates.

**How it works:**
1. User selects a template (blog, project portfolio, etc.)
2. User configures the template (title, tagline, colors, etc.)
3. User creates content (blog posts, projects, etc.)
4. One-click build compiles template + content → static HTML
5. Result deployed to `sitename.nbhd.city` subdomain

## Template System

### Pre-built Templates

nbhd.city provides templates for common use cases:

| Template | Purpose | Example Sites |
|----------|---------|---|
| `blog-minimal` | Simple blog | https://myblog.nbhd.city |
| `portfolio-grid` | Project portfolio | https://mywork.nbhd.city |
| `newsletter` | Email newsletter | https://mynews.nbhd.city |
| `wiki` | Knowledge base | https://mywiki.nbhd.city |

### Template Structure

Each template is an 11ty project with:

```
template-name/
├── _includes/
│   ├── base.njk       # Main layout template
│   ├── post.njk       # Post/item template
│   └── components/    # Reusable components
├── styles/
│   └── style.css
├── .eleventy.js       # 11ty configuration
└── schema.json        # Configuration schema
```

### Configuration Schema

Each template defines a **schema.json** that specifies configurable fields:

```json
{
  "title": {
    "type": "string",
    "label": "Site Title",
    "default": "My Site"
  },
  "tagline": {
    "type": "string",
    "label": "Tagline"
  },
  "colors": {
    "type": "object",
    "properties": {
      "primary": { "type": "string", "default": "#0066cc" },
      "accent": { "type": "string", "default": "#ff6600" }
    }
  }
}
```

The schema is used to:
- Generate dynamic configuration form in frontend
- Validate user input
- Pass config to 11ty build

### Custom Templates

(Phase 4 feature) Users can register custom templates from GitHub:

```bash
POST /templates/analyze

{
  "github_repo": "https://github.com/user/my-template",
  "branch": "main"
}
```

Backend analyzes the template and infers its configuration schema automatically.

## Build Process

### Build Trigger

User clicks "Build" button in site dashboard:

```
Frontend → POST /sites/{id}/build → Backend → Lambda Function
```

### Build Execution (AWS Lambda)

Lambda function runs 11ty:

```python
# 1. Fetch template from GitHub
git clone <template_repo>

# 2. Fetch site config from DynamoDB
config = db.get_site(site_id)

# 3. Fetch content records from DynamoDB
content = db.query_content(site_id)

# 4. Run 11ty build
eleventy --input=template --output=_site --formats=md,html

# 5. Upload output to S3
s3.upload_folder('_site/', f's3://nbhd-sites/{site_id}/')

# 6. Invalidate CloudFront cache
cloudfront.invalidate_cache(site_id)
```

**Inputs:**
- Template source (from GitHub or registry)
- Site configuration (from DynamoDB)
- Content records (from DynamoDB)

**Outputs:**
- Static HTML files uploaded to S3
- CloudFront CDN cache cleared
- Build status stored in DynamoDB

### Build Status

Users see real-time build progress:

```javascript
// Poll for build status
const status = await api.get(`/sites/${id}/build/status`);

// Returns:
{
  "status": "building",  // or "success", "failed"
  "progress": 45,        // Percentage
  "message": "Compiling templates...",
  "logs": [...]
}
```

## Content Management

### Content Structure

Content is stored as AT Protocol records in DynamoDB:

```python
{
  'id': 'content_abc123',
  'site_id': 'site_xyz789',
  'type': 'post',           # or 'project', 'page'
  'title': 'My First Post',
  'slug': 'my-first-post',
  'body': 'This is my post...',
  'metadata': {
    'tags': ['hello', 'world'],
    'category': 'blog',
    'date': '2026-02-21'
  },
  'published': true,
  'published_to_bsky': false,
  'created_at': '2026-02-21T10:30Z',
  'updated_at': '2026-02-21T10:30Z'
}
```

### Creating Content

Users create content in the content editor:

```
Frontend → POST /content → Backend → DynamoDB
```

Content is stored with:
- Rich text body (Markdown)
- Metadata (tags, categories, dates)
- Publishing status
- AT Protocol record info (CID, DID, RKey)

### Content to Site Mapping

When template is built, 11ty receives content as data:

```json
{
  "collections": {
    "posts": [
      {
        "title": "My First Post",
        "slug": "my-first-post",
        "date": "2026-02-21",
        "content": "..."
      }
    ]
  }
}
```

11ty then renders this data using template files:

```
posts/{{ post.slug }}/index.html ← generated for each post
```

## Deployment

### Subdomain Routing

Sites are served at `{site_slug}.{nbhd_domain}.city`:

```
myblog.myneighborhood.nbhd.city
myportfolio.myneighborhood.nbhd.city
mywiki.myneighborhood.nbhd.city
```

**Infrastructure:**
- S3 bucket per site or shared bucket with prefixes
- CloudFront distribution for CDN
- Route 53 for subdomain routing
- SSL/TLS certificate for HTTPS

### Export to Self-Host

(Future feature) Users can export built site as ZIP:

```bash
GET /sites/{id}/export → site.zip

# Contains:
├── index.html
├── posts/
│   ├── my-first-post/index.html
│   └── my-second-post/index.html
├── assets/
│   ├── style.css
│   ├── script.js
│   └── images/
└── 404.html
```

Users can then:
- Host on their own domain
- Push to GitHub Pages
- Deploy to their own server

## 11ty Integration

### 11ty Configuration (.eleventy.js)

```javascript
module.exports = function(eleventyConfig) {
  // Input/output directories
  eleventyConfig.setInputDirectory('src');
  eleventyConfig.setOutputDirectory('_site');

  // Markdown parsing
  eleventyConfig.setLibrary('md', markdownLib);

  // Add filters
  eleventyConfig.addFilter('dateFilter', dateFilter);
  eleventyConfig.addFilter('markdownFilter', markdownFilter);

  // Copy assets
  eleventyConfig.addPassthroughCopy('src/assets');

  return {
    dir: { input: 'src', output: '_site' }
  };
};
```

### Templating Language

Templates use **Nunjucks** (11ty default):

```nunjucks
---
layout: base
title: {{ site.title }}
---

<h1>{{ title }}</h1>

{% for post in collections.posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
    <p>{{ post.data.excerpt }}</p>
  </article>
{% endfor %}
```

## Frontend Components

### Template Gallery

Browse available templates:
- Template preview (screenshot/demo)
- Description
- Configuration fields
- Select button

### Site Configuration Form

Dynamic form based on template schema:
- Generated from `schema.json`
- Real-time validation
- Live preview (if available)

### Site Dashboard

View site details:
- Template info
- Current config
- Build history
- Latest build status
- Publish to subdomains

### Build Status UI

Real-time build progress:
- Build button (triggers rebuild)
- Status indicator (building/success/failed)
- Build logs/errors
- Build history timeline

## Development Workflow

### Creating a New Template

1. Create 11ty project with template structure
2. Write Nunjucks templates
3. Create `schema.json` with configurable fields
4. Test locally: `npx @11ty/eleventy --serve`
5. Push to GitHub
6. Register in template gallery

### Contributing Templates

1. Fork nbhd.city repository
2. Add template to `templates/` directory
3. Submit pull request
4. Review and merge
5. Appears in template gallery for all users

## Current Implementation Status

| Feature | Status | Phase |
|---------|--------|-------|
| Pre-built templates | ✅ Complete | Phase 3 |
| Template gallery UI | ✅ Complete | Phase 3 |
| Site config form | ✅ Complete | Phase 3 |
| Content management UI | 🔧 In Progress | Phase 5 |
| Build trigger API | 🔧 In Progress | Phase 6 |
| 11ty Lambda function | 🔧 In Progress | Phase 6 |
| CloudFront/S3 setup | 🔧 In Progress | Phase 6 |
| Build status UI | 📋 Planned | Phase 8 |
| Export to ZIP | 📋 Planned | Phase 6 |
| Custom template registry | 📋 Planned | Phase 4 |

## Related Documentation

- **[Architecture](./architecture.md)** - How sites fit in system
- **[Backend Guide](./backend.md)** - Site and content APIs
- **[Deployment Guide](./deployment.md)** - CloudFront and S3 setup
- **[Phases & Roadmap](./phases.md)** - Development timeline
- **[specs/TEMPLATE_ANALYSIS.md](../specs/TEMPLATE_ANALYSIS.md)** - Schema analysis
- **[specs/TEMPLATE_GALLERY_DESIGN.md](../specs/TEMPLATE_GALLERY_DESIGN.md)** - UI design

---

**See Also:** [11ty documentation](https://www.11ty.dev/)
