# Social Site Generation & Distributed Publishing

## Overview

nbhd.city enables neighborhoods to create and publish social websites through a **distributed, schema-driven workflow**. Rather than a monolithic CMS, the platform separates concerns:

- **Template Repositories** (external) - Manage presentation, styling, and structure
- **nbhd.city** - Manage content, dynamic schemas, and deployment
- **AT Protocol PDS** - Store content as portable, federated records
- **S3 + CloudFront** - Serve static sites globally

This architecture ensures communities own their content while keeping the platform lean and scalable.

---

## Core Philosophy: Content, Not Presentation

### What nbhd.city Manages

✅ **Content Creation & Management**
- Dynamic content editors
- Schema-driven forms
- Frontmatter and body
- AT Protocol record storage

✅ **Content Transformation & Deployment**
- Build orchestration (11ty)
- Static site generation
- S3 upload and CDN invalidation
- Subdomain hosting

✅ **Federated Distribution**
- AT Protocol record storage (PDS)
- Content portability
- BlueSky integration
- Data ownership

### What Template Repositories Manage

🎨 **Presentation & Styling**
- HTML/CSS/JavaScript structure
- Visual design and theming
- Asset management
- Layout templates

🔧 **Technical Structure**
- 11ty configuration
- Build process details
- Plugin dependencies
- Performance optimization

**This separation is intentional.** Managing CSS, JavaScript, and design across all user sites would be out of scope for nbhd.city. Instead, users leverage existing 11ty starter projects—whether from the Eleventy community or custom repositories maintained by developers who specialize in design and web technologies.

---

## The Social Website Generation Workflow

### Phase 12: Template Analysis

Every site starts with an 11ty starter project on GitHub. Users provide the URL, and nbhd.city analyzes the repository to understand its structure:

```
User Input: GitHub URL (e.g., https://github.com/11ty/eleventy-base-blog)
    ↓
[TemplateURLInput.jsx] → POST /api/templates/analyze-url
    ↓
Lambda: template_analyzer
  • Clone repository (shallow clone)
  • Validate 11ty structure (.eleventy.js, package.json)
  • Scan content directories (src/, posts/, content/, pages/, etc.)
  • Extract frontmatter from sample markdown files
  • Infer JSON schema from frontmatter patterns
    ↓
Store in DynamoDB
  • Template metadata (GitHub URL, commit SHA, analysis date)
  • Inferred content types (e.g., "post", "project", "page")
  • JSON schemas for each content type
  • Sample records from existing files
    ↓
[Analysis Results Display]
  • Show discovered content types
  • Display inferred schema fields with types
  • Preview sample frontmatter values
    ↓
Save to User Template Library
  • User clicks "Save to My Templates"
  • Template appears in personal template gallery
  • Can be reused for future site creation
```

**Output:** A saved template with inferred schema, ready for site creation.

**Key Insight:** The schema inference is automatic. Users don't manually configure content types—nbhd.city learns the template's structure by examining actual content.

---

### Phase 13: Site Creation

Users select an analyzed template from their personal library and create a site with automatic schema setup:

```
User selects template from gallery
    ↓
[SiteCreationWizard.jsx]
  • Template selection
  • Site configuration (title, tagline, colors, etc.)
  • Schema assignment (uses inferred schema from analysis)
    ↓
POST /api/sites → Backend creates site
  • Store site metadata in DynamoDB
  • Reference template and schema
  • Initialize site content collection
    ↓
Site Setup Complete
  • CMS automatically configured with inferred schema
  • User can immediately start creating content
  • Content forms match template's structure
```

**Output:** A new site with a fully configured CMS ready for content creation.

**Why This Matters:** Users never manually define content types or forms. The system learns from the template and adapts automatically.

---

### Phase 14: Content Management

The CMS dynamically adapts to each template's schema. Users create content using forms generated from analyzed frontmatter:

```
User opens Site Content Manager
    ↓
[DynamicSchemaService]
  • Fetch template schema from DynamoDB
  • Transform JSON schema to form field definitions
  • Generate validators and constraints
    ↓
[EnhancedContentEditor.jsx]
  • Display dynamic forms (title, date, tags, custom fields)
  • All fields based on inferred schema
  • Real-time validation
  • Help text and field guidance
    ↓
User creates/edits content
    ↓
Validate against schema
  • All required fields present
  • Types match (string, date, array, boolean, etc.)
  • Constraints satisfied (length, enum, patterns)
    ↓
POST /api/content → Backend saves
  • Transform form data to AT Protocol record
  • Store as: RECORD#app.nbhd.blog.{type}#{rkey}
  • Generate CID (content hash)
  • Save to DynamoDB under user's DID
    ↓
Content Record Structure:
{
  "PK": "USER#{user_did}",
  "SK": "RECORD#app.nbhd.blog.post#{rkey}",
  "uri": "at://did:plc:user123/app.nbhd.blog.post/rkey123",
  "cid": "bafy2bzaced...",
  "value": {
    "site_id": "site-uuid",
    "title": "My Post",
    "content": "# Markdown...",
    "frontmatter": {
      "date": "2026-03-07",
      "tags": ["web", "11ty"],
      // ... all inferred schema fields
    }
  },
  "created_at": "2026-03-07T10:30Z"
}
```

**Output:** Content stored as portable AT Protocol records, queryable by type and site.

**The AT Protocol Advantage:** Even though sites are static HTML, content is stored in a federated format. Users own their data through their DID, can export it, migrate it, or share it across networks.

---

### Phase 15: Site Deployment

Users click "Build & Deploy" and their site goes live with one action:

```
User clicks "Build & Deploy" in CMS dashboard
    ↓
POST /api/sites/{site_id}/build → Backend queues job
    ↓
Lambda: site_builder

  Stage 1: Clone Template
    • git clone <template_repo> to /tmp/
    • Checkout commit SHA from analysis

  Stage 2: Fetch Content
    • Query DynamoDB: RECORD#app.nbhd.blog.*#{*}
    • Filter by site_id
    • Retrieve all content records (posts, pages, projects, etc.)

  Stage 3: Transform to 11ty Format
    • Convert AT Protocol records to 11ty data format
    • Create _data/content.json with all records
    • Organize by content type

  Stage 4: Install Dependencies
    • npm install (from template's package.json)

  Stage 5: Run 11ty Build
    • npx @11ty/eleventy
    • Template renders content.json into HTML
    • Output: static HTML + assets

  Stage 6: Upload to S3
    • aws s3 sync _site/ s3://nbhd-sites/{site_id}/
    • Versioning enabled
    • Assets cached

  Stage 7: Invalidate CDN
    • cloudfront.create_invalidation()
    • CDN cache cleared
    • New version available immediately
    ↓
[BuildStatusPoller.jsx] (Real-time Updates)
  • Display progress: Clone → Fetch → Transform → Build → Upload → Deploy
  • Show percentage completion
  • Display any errors with retry option
    ↓
Site Live
  • Accessible at: https://{site_slug}.nbhd.city
  • Served from S3 via CloudFront
  • Users can view live site, copy URL, share
```

**Output:** Static HTML site live on CDN, backed by AT Protocol records.

**Why Static? Why Distributed?**
- **Static**: Blazingly fast, cheap to host, secure (no code execution on server)
- **Distributed**: Content stored as AT Protocol records, users own their data, can query/sync across networks

---

## The Data Model: Schema-Driven Content

### Template Schema (Inferred)

```json
{
  "post": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "minLength": 1 },
      "date": { "type": "string", "format": "date" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "excerpt": { "type": "string" },
      "image": { "type": "string", "format": "uri" },
      "draft": { "type": "boolean", "default": false }
    },
    "required": ["title", "date"]
  },
  "project": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "description": { "type": "string" },
      "image": { "type": "string", "format": "uri" },
      "link": { "type": "string", "format": "uri" },
      "tags": { "type": "array" }
    },
    "required": ["title", "description"]
  }
}
```

### User Content Record (AT Protocol)

```json
{
  "PK": "USER#did:plc:example123",
  "SK": "RECORD#app.nbhd.blog.post#abc123def456",
  "uri": "at://did:plc:example123/app.nbhd.blog.post/abc123def456",
  "cid": "bafy2bzaced3gslgyilhygtwkq3fkyqhxd3k5qqqfusdnz6s3cegv3j4zfcy2",
  "value": {
    "site_id": "site-uuid-789",
    "title": "Building a Blog with nbhd.city",
    "content": "# How to Build a Blog\n\nFirst, analyze a template...",
    "slug": "building-blog-nbhdcity",
    "frontmatter": {
      "date": "2026-03-07",
      "tags": ["tutorial", "blogging"],
      "excerpt": "Learn how to set up your first blog with nbhd.city",
      "image": "https://example.com/image.jpg",
      "draft": false
    }
  },
  "created_at": "2026-03-07T10:30:00Z",
  "updated_at": "2026-03-07T10:30:00Z"
}
```

### How It Flows to Static Sites

When the site builds, content transforms to 11ty format:

```json
{
  "collections": {
    "posts": [
      {
        "url": "/posts/building-blog-nbhdcity/",
        "title": "Building a Blog with nbhd.city",
        "date": "2026-03-07",
        "tags": ["tutorial", "blogging"],
        "excerpt": "Learn how to set up your first blog with nbhd.city",
        "image": "https://example.com/image.jpg",
        "content": "<!-- rendered markdown -->"
      }
    ]
  }
}
```

The 11ty template then renders this into static HTML:

```nunjucks
{% for post in collections.posts %}
  <article>
    <h2>{{ post.title }}</h2>
    <p class="date">{{ post.date | dateFilter }}</p>
    <img src="{{ post.image }}" alt="{{ post.title }}" />
    <p>{{ post.excerpt }}</p>
    <a href="{{ post.url }}">Read more →</a>
  </article>
{% endfor %}
```

Result: Beautiful, optimized HTML rendered once and served statically forever.

---

## Distributed Architecture: Why This Matters

### Content Ownership Through AT Protocol

Rather than storing content in nbhd.city's database, content is stored as **AT Protocol records** under the user's DID:

```
User (DID: did:plc:user123)
  └─ Personal Data Server (PDS)
      ├─ Profile (com.atproto.repo.profile)
      ├─ Posts (app.nbhd.blog.post)
      ├─ Projects (app.nbhd.blog.project)
      └─ Site Config (app.nbhd.site.config)
```

**User Benefits:**
- ✅ **Data Portability**: Export all content anytime
- ✅ **No Vendor Lock-in**: Run nbhd.city elsewhere or use different tools
- ✅ **Network Access**: Content queryable by other AT Protocol services (BlueSky, etc.)
- ✅ **Permanent Records**: Each post has immutable CID hash

### Federated Publishing

Content in nbhd.city can be:
1. **Published to AT Protocol** - Visible in personal data server
2. **Synced to BlueSky** - Posts appear in BlueSky timeline
3. **Queried by other apps** - Any AT Protocol service can access
4. **Replicated elsewhere** - Data can be synced to other instances

### Static Sites + Federated Data = Best of Both Worlds

| Aspect | Benefit |
|--------|---------|
| **Static HTML** | Fast, cheap, secure, scalable |
| **AT Protocol Storage** | Portable, federated, owned by user |
| **Dynamic Schema** | Adapts to any 11ty template |
| **One-Click Deploy** | Simple for non-technical users |

---

## Complete User Journey

```
1. User wants to create a blog
   ↓
2. Browse 11ty template gallery or provide GitHub URL
   ↓
3. nbhd.city analyzes template (schema inference)
   ↓
4. User creates new site with analyzed template
   ↓
5. CMS dynamically generates forms from inferred schema
   ↓
6. User creates content (title, date, tags, excerpt, image, etc.)
   ↓
7. Content stored as AT Protocol records (user owns it)
   ↓
8. User clicks "Build & Deploy"
   ↓
9. Lambda orchestrates: clone → fetch content → build → upload → deploy
   ↓
10. Site live at: https://myblog.nbhd.city
   ↓
11. User's content accessible at:
    • https://myblog.nbhd.city/posts/ (via static site)
    • at://did:plc:user123/app.nbhd.blog.post/* (via PDS)
    • BlueSky timeline (via dual-post feature)
```

---

## Technical Stack Alignment

| Component | Technology | Why? |
|-----------|-----------|------|
| **Content Storage** | DynamoDB + AT Protocol | Scalable, federated, portable |
| **Template Management** | External GitHub repos | Specialization: designers/developers manage presentation |
| **Build Orchestration** | AWS Lambda | Serverless, on-demand, no infrastructure to manage |
| **Static Site Generation** | 11ty | Mature, flexible, template-agnostic |
| **CDN & Hosting** | S3 + CloudFront | Fast, cheap, globally distributed |
| **Content Ownership** | AT Protocol DID | User controls, not platform |

---

## What's Out of Scope (Intentionally)

nbhd.city does **not** manage:
- ❌ CSS/SCSS theming (delegated to template repos)
- ❌ JavaScript interactivity beyond content forms (template responsibility)
- ❌ Asset optimization strategies (11ty plugins handle this)
- ❌ SEO configuration (handled via template frontmatter)
- ❌ Analytics/tracking (user chooses via template)

**Why?** These are better maintained by specialized communities. An 11ty template author knows their design system. nbhd.city provides the infrastructure; experts provide the craft.

---

## Future Possibilities

With this architecture in place:

- **Multi-instance Federation**: Run multiple nbhd.city instances, share content across them
- **Template Marketplaces**: Community shares analyzed templates
- **Advanced Analytics**: Query content via AT Protocol
- **Theme Switching**: Change template without losing content
- **Workflow Automation**: Integrate publishing with external tools via AT Protocol APIs
- **Neighborhood Cross-posting**: Publish content from one site to multiple outlets

---

## Summary

Social site generation in nbhd.city works because:

1. **Content is separated from presentation** - Templates live in their own repos
2. **Schema is inferred, not configured** - Users analyze existing 11ty projects
3. **CMS adapts to content** - Forms generated dynamically from schema
4. **Content is federated** - Stored as AT Protocol records under user's DID
5. **Building is automated** - One click transforms content to static HTML
6. **Hosting is cheap and fast** - Static sites + CDN + S3

The result is a **distributed publishing platform** where users own their data, control their presence, and leverage existing design communities—all without complex server management or vendor lock-in.

---

## Related Documentation

- [Soul of nbhd.city](./soul.md) - Vision and philosophy
- [Site Builder Guide](./site-builder.md) - Technical details of 11ty integration
- [AT Protocol Integration](./atprotocol.md) - Federation and data storage
- [Architecture Overview](./architecture.md) - System design
- [Phases & Roadmap](./phases.md) - Development timeline
