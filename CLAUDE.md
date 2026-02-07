# Claude Code Configuration for nbhd.city

## Project Overview

**nbhd.city** is a self-hosted neighborhood collaboration platform. See `/specs/README.md` for complete documentation.

## Ticket Management

All project tickets are located in `/tickets/`:
- `tickets.md` - Detailed ticket specifications with acceptance criteria
- `ticket-list.md` - Priority order, timeline, and quick checklist

## Skills

⚠️ **All skills are global** (located at `~/.claude/skills/`)
- **next-ticket**: Comprehensive workflow to identify and complete project tickets
  - Reads from `/tickets/` folder
  - Integrated testing and code review guidance
  - Helps with ticket selection, implementation, testing, and completion

## Key Directories

```
├── /app/                # Application code
│   ├── /api/            # Python FastAPI backend
│   ├── /UI/             # React frontend
│   ├── /lambda/         # AWS Lambda functions
│   └── /scripts/        # Migration scripts
├── /specs/              # Architecture and design documentation
├── /tickets/            # Project tickets and specifications
├── /tests/              # Infrastructure tests (Lambda, DevOps)
├── /devops/             # Terraform infrastructure (AWS)
└── CLAUDE.md            # This file
```

## Development Phases

Current project phases are documented in `/specs/PHASES.md`:
1. Phase 1: MVP Foundation ✅
2. Phase 2: AT Protocol Foundation 🔧
3. Phase 3+: Advanced features pending

See `/specs/PHASES.md` for complete roadmap and dependencies.
