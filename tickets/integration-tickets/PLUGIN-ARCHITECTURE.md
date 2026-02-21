# Plugin Architecture - Design & Implementation Tickets

**Created:** 2026-02-16
**Context:** nbhrs-chat was accidentally integrated into nbhd.city. Need to establish proper plugin architecture.
**Related:** Commit `0cad1db` - Removed all nbhrs-chat references

---

## Overview

Establish a formal plugin architecture for nbhd.city that allows:
- Separate development of plugins in `/nbhd-plugins/`
- Clean integration into main app without code contamination
- Proper testing and validation before integration
- Clear conventions for plugin developers

---

## PLUGIN-ARCH-001: Define Plugin Architecture Specification

**Type:** Architecture / Design Document
**Priority:** HIGH
**Estimate:** M
**Depends On:** None

### Requirements

- [ ] Define plugin directory structure and conventions
- [ ] Document how plugins register routes (backend)
- [ ] Document how plugins register pages (frontend)
- [ ] Define plugin configuration format (plugin.config.json)
- [ ] Specify plugin metadata requirements
- [ ] Document database schema extension mechanism
- [ ] Document environment variable conventions for plugins
- [ ] Create examples for each integration point

### Plugin Structure

Define standard structure for plugins in `/nbhd-plugins/{plugin-name}/`:

```
nbhd-plugins/
├── {plugin-name}/
│   ├── plugin.config.json          # Metadata & configuration
│   ├── requirements.txt            # Python dependencies
│   ├── README.md                   # Plugin documentation
│   ├── api/                        # Backend routes
│   │   ├── __init__.py
│   │   ├── router.py              # FastAPI router
│   │   └── models.py              # Pydantic models
│   ├── frontend/                   # Frontend components
│   │   ├── pages/                 # Page components
│   │   ├── components/            # Reusable components
│   │   └── hooks/                 # Custom React hooks
│   ├── infrastructure/             # Terraform/CloudFormation
│   │   └── resources.tf
│   └── tests/                      # Plugin tests
│       ├── test_api.py
│       └── test_integration.py
```

### Plugin Configuration Format

Define standardized `plugin.config.json`:

```json
{
  "id": "plugin-name",
  "version": "0.1.0",
  "name": "Human Readable Name",
  "description": "What this plugin does",
  "author": "Author Name",

  "backend": {
    "router": {
      "module": "plugin_name.api.router",
      "object": "router",
      "prefix": "/api/plugin",
      "tags": ["plugin"]
    }
  },

  "frontend": {
    "routes": [
      {
        "path": "/some/route/:param",
        "component": "SomeComponent",
        "layout": "full|sidebar|minimal"
      }
    ]
  },

  "database": {
    "indexes": [
      {
        "name": "PluginGSI1",
        "hash_key": "plugin_attr_1",
        "range_key": "plugin_attr_2"
      }
    ],
    "attributes": [
      {
        "name": "plugin_attr_1",
        "type": "S"
      }
    ]
  },

  "environment": {
    "PLUGIN_VAR_NAME": {
      "description": "What this var does",
      "example": "example-value"
    }
  },

  "dependencies": {
    "python": ["package>=1.0.0"],
    "npm": ["package@^1.0.0"]
  }
}
```

### Acceptance Criteria

- [ ] Architecture document created at `/specs/PLUGIN_ARCHITECTURE.md`
- [ ] Contains plugin directory structure guidelines
- [ ] Documents all integration points (routes, components, DB, env vars)
- [ ] Includes example plugin.config.json with all fields
- [ ] Specifies import path conventions
- [ ] Defines validation requirements for plugin.config.json
- [ ] Documents testing requirements for plugins
- [ ] Includes migration guide from ad-hoc integration (nbhrs-chat example)

---

## PLUGIN-ARCH-002: Create Plugin Loader Utility

**Type:** Backend / Infrastructure
**Priority:** HIGH
**Estimate:** M
**Depends On:** PLUGIN-ARCH-001

### Requirements

- [ ] Create `/app/api/plugin_loader.py` utility
- [ ] Load and validate `plugin.config.json` from plugin directories
- [ ] Dynamically register plugin routers with FastAPI
- [ ] Validate plugin configuration structure
- [ ] Provide hooks for database schema registration
- [ ] Support environment variable injection from plugin config
- [ ] Load plugins from `/nbhd-plugins/` directory
- [ ] Skip plugins with invalid config (with warnings)

### Implementation Details

```python
# app/api/plugin_loader.py

class PluginLoader:
    @staticmethod
    def load_plugins(plugins_dir: str) -> List[PluginConfig]:
        """Discover and load all plugins from plugins directory"""

    @staticmethod
    def validate_config(config: dict) -> PluginConfig:
        """Validate plugin.config.json structure"""

    @staticmethod
    def register_routers(app: FastAPI, plugins: List[PluginConfig]):
        """Register all plugin routers with FastAPI"""

    @staticmethod
    def get_database_schema_updates(plugins: List[PluginConfig]) -> dict:
        """Extract database schema requirements from all plugins"""
```

### Acceptance Criteria

- [ ] `PluginLoader` class created with above methods
- [ ] Validates plugin.config.json schema
- [ ] Dynamically registers FastAPI routers
- [ ] Handles missing/invalid plugins gracefully (logs warnings)
- [ ] Can be used in main.py to load all plugins
- [ ] Unit tests cover happy path and error cases
- [ ] Documentation includes usage examples

---

## PLUGIN-ARCH-003: Update Main Application to Use Plugin Loader

**Type:** Backend / Integration
**Priority:** HIGH
**Estimate:** S
**Depends On:** PLUGIN-ARCH-002

### Requirements

- [ ] Update `app/api/main.py` to use PluginLoader
- [ ] Load plugins from `/nbhd-plugins/` on startup
- [ ] Register plugin routers automatically
- [ ] Log loaded plugins at startup
- [ ] Provide clear error messages for plugin loading failures
- [ ] Support disabling plugins via environment variable

### Implementation

```python
# app/api/main.py

# Load plugins
plugins_dir = pathlib.Path(__file__).parent.parent.parent / "nbhd-plugins"
plugins = PluginLoader.load_plugins(str(plugins_dir))
PluginLoader.register_routers(app, plugins)

# Log startup
for plugin in plugins:
    logger.info(f"Loaded plugin: {plugin.id} v{plugin.version}")
```

### Acceptance Criteria

- [ ] main.py uses PluginLoader to load plugins
- [ ] Plugins from `/nbhd-plugins/` are auto-discovered
- [ ] Routers are registered with correct prefixes
- [ ] Startup logs show which plugins were loaded
- [ ] Application works with zero plugins (backwards compatible)
- [ ] Application continues to work if one plugin fails to load (resilient)
- [ ] Integration tests verify plugins are properly loaded

---

## PLUGIN-ARCH-004: Create Frontend Plugin Registration System

**Type:** Frontend / Infrastructure
**Priority:** MEDIUM
**Estimate:** M
**Depends On:** PLUGIN-ARCH-001

### Requirements

- [ ] Create plugin route registry system for React Router
- [ ] Load plugin.config.json files on build time
- [ ] Dynamically import plugin components
- [ ] Register plugin routes with React Router
- [ ] Support plugin pages with different layouts
- [ ] Validate plugin component exports

### Implementation Details

**Build-time plugin discovery:**
- Scan `/plugins/` directory for `plugin.config.json` files
- Extract route information
- Generate route configuration

**Runtime component loading:**
- Use dynamic imports for plugin components
- Fallback UI for missing/failed components
- Error boundary around plugin routes

### Acceptance Criteria

- [ ] Plugin route discovery system created
- [ ] Can load multiple plugins' routes
- [ ] React Router handles plugin routes
- [ ] Error boundaries prevent plugin crashes affecting main app
- [ ] Build process discovers plugins automatically
- [ ] Documentation shows how to add new plugin route
- [ ] Frontend works without any plugins (backwards compatible)

---

## PLUGIN-ARCH-005: Document Plugin Development Guide

**Type:** Documentation
**Priority:** HIGH
**Estimate:** M
**Depends On:** PLUGIN-ARCH-001, PLUGIN-ARCH-002, PLUGIN-ARCH-004

### Requirements

- [ ] Create `/specs/PLUGIN_DEVELOPMENT_GUIDE.md`
- [ ] Step-by-step guide for creating a plugin
- [ ] Template plugin with all integration points
- [ ] Guidelines for code organization
- [ ] Testing requirements for plugins
- [ ] How to register routes, components, database schema
- [ ] How to handle environment variables
- [ ] Validation checklist before submitting plugin
- [ ] Examples for common use cases (API endpoint, page, data table)

### Documentation Structure

```markdown
# Plugin Development Guide

## Getting Started
- Prerequisites
- Plugin structure overview
- Directory layout

## Creating a Plugin
1. Create directory in /nbhd-plugins/{name}
2. Create plugin.config.json
3. Implement API routes
4. Implement frontend components
5. Add tests
6. Validation checklist

## API Integration
- Defining routers
- Authentication & authorization
- Database access

## Frontend Integration
- Creating page components
- Nested routes
- Layout options
- Sharing state with main app

## Database Schema
- Defining indexes
- Data models
- Migration strategy

## Testing
- Unit tests
- Integration tests
- Plugin isolation tests

## Deployment
- Environment variables
- Build process
- Validation steps

## Example: Hello World Plugin
- Step-by-step example
- Files included
- How to test locally
```

### Acceptance Criteria

- [ ] Guide created and clearly written
- [ ] Includes complete working example plugin
- [ ] Step-by-step instructions for each type of plugin
- [ ] Covers common pitfalls (import paths, relative refs, etc.)
- [ ] Includes validation checklist
- [ ] Links to architecture spec and API docs
- [ ] Example plugins demonstrate best practices

---

## PLUGIN-ARCH-006: Create Template Plugin (Hello World)

**Type:** Backend / Frontend / Documentation
**Priority:** MEDIUM
**Estimate:** M
**Depends On:** PLUGIN-ARCH-001, PLUGIN-ARCH-005

### Requirements

- [ ] Create `/nbhd-plugins/hello-world/` template plugin
- [ ] Implement simple API endpoint that returns JSON
- [ ] Implement simple React page component
- [ ] Include database schema example (optional GSI)
- [ ] Include environment variable example
- [ ] Include comprehensive comments
- [ ] Include unit and integration tests
- [ ] Include README with setup instructions
- [ ] Demonstrate best practices for plugin development

### Plugin Features

- Simple GET `/api/hello` endpoint returning greeting
- Page at `/plugins/hello-world/demo`
- Example DynamoDB GSI for querying greetings
- Example environment variable for greeting message

### Acceptance Criteria

- [ ] Template plugin fully functional
- [ ] Can be built and deployed independently
- [ ] All import paths work correctly
- [ ] Tests pass locally
- [ ] README is clear and complete
- [ ] Plugin demonstrates routing, components, database, env vars
- [ ] Can serve as reference for new plugin developers

---

## PLUGIN-ARCH-007: Set Up Plugin Testing Infrastructure

**Type:** Testing / Infrastructure
**Priority:** MEDIUM
**Estimate:** M
**Depends On:** PLUGIN-ARCH-001, PLUGIN-ARCH-002

### Requirements

- [ ] Create plugin testing harness
- [ ] Support plugin unit tests
- [ ] Support plugin integration tests with main app
- [ ] Isolate plugin tests from main app tests
- [ ] Create CI/CD checks for plugin validity
- [ ] Document plugin testing requirements

### Testing Strategy

**Plugin-specific tests:**
- Unit tests in `/nbhd-plugins/{name}/tests/`
- Can be run independently

**Integration tests:**
- Test plugin loads correctly
- Test routes are registered
- Test database schema updates apply
- Test env vars are injected

**Validation checks:**
- plugin.config.json is valid JSON
- Required fields present
- Import paths are resolvable
- No naming conflicts with main app

### Acceptance Criteria

- [ ] Test harness created
- [ ] Plugin tests can run independently
- [ ] Integration tests verify plugin loading
- [ ] CI/CD validates plugin.config.json
- [ ] CI/CD checks for import path validity
- [ ] Documentation covers plugin testing requirements
- [ ] Example tests in template plugin

---

## PLUGIN-ARCH-008: Create Plugin Validation Checklist

**Type:** Documentation / QA
**Priority:** MEDIUM
**Estimate:** S
**Depends On:** PLUGIN-ARCH-001, PLUGIN-ARCH-007

### Requirements

- [ ] Create pre-integration checklist for plugins
- [ ] Define validation steps before merging plugin code
- [ ] Document common mistakes and how to avoid them
- [ ] Create automated validation script (optional)
- [ ] Define performance requirements
- [ ] Define security requirements

### Validation Checklist

```markdown
# Plugin Integration Checklist

## Configuration
- [ ] plugin.config.json is valid JSON
- [ ] All required fields present
- [ ] No conflicts with existing routes/names
- [ ] Version number is semantic

## Backend
- [ ] All imports are importable
- [ ] Router prefix is unique and follows convention
- [ ] Database schema doesn't conflict with main app
- [ ] Environment variables documented
- [ ] Dependencies listed in requirements.txt

## Frontend
- [ ] All component imports resolve correctly
- [ ] Route paths don't conflict with main app
- [ ] Components are properly exported
- [ ] No global state pollution

## Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Plugin loads without errors
- [ ] Routes are registered correctly
- [ ] Database schema applies correctly

## Documentation
- [ ] README is complete
- [ ] Code has comments for non-obvious logic
- [ ] Environment variables are documented
- [ ] Usage examples provided

## Security
- [ ] No hardcoded credentials
- [ ] Proper authentication checks
- [ ] Input validation on endpoints
- [ ] No data leaks between plugins
```

### Acceptance Criteria

- [ ] Comprehensive checklist created
- [ ] Covers all integration points
- [ ] Includes examples of common mistakes
- [ ] Can be used as PR review checklist
- [ ] Documentation links to this checklist
- [ ] (Optional) Automated validation script

---

## Implementation Order

**Recommended sequence:**

1. **PLUGIN-ARCH-001** - Define architecture (foundation)
2. **PLUGIN-ARCH-002** - Build plugin loader (backend infrastructure)
3. **PLUGIN-ARCH-003** - Integrate loader into main app
4. **PLUGIN-ARCH-004** - Frontend route system
5. **PLUGIN-ARCH-005** - Write development guide
6. **PLUGIN-ARCH-006** - Create template plugin
7. **PLUGIN-ARCH-007** - Set up testing
8. **PLUGIN-ARCH-008** - Create validation checklist

---

## Acceptance Criteria Summary

### Architecture
- [ ] Clear plugin structure documented
- [ ] Integration points well-defined
- [ ] Import path conventions established
- [ ] Examples provided for each integration type

### Implementation
- [ ] Plugin loader working
- [ ] Main app using loader
- [ ] Frontend route system functional
- [ ] Template plugin demonstrates all features
- [ ] Tests validate plugin loading

### Documentation & Quality
- [ ] Developer guide complete
- [ ] Template plugin is reference implementation
- [ ] Testing infrastructure in place
- [ ] Validation checklist available

### Success Metric

Developers can:
1. ✅ Create a new plugin in `/nbhd-plugins/{name}`
2. ✅ Implement API routes, pages, and database schema
3. ✅ Have plugin automatically discovered and loaded
4. ✅ Run tests independently
5. ✅ Submit plugin for integration with confidence
6. ✅ Zero contamination risk to main app code

---

## Related

- Commit: `0cad1db` - Removed nbhrs-chat plugin integration
- Analysis: `/API-CORRUPTION-ANALYSIS.md` - How nbhrs-chat broke the app
