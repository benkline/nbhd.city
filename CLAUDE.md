# Claude Code Configuration for nbhd.city

## Project Overview

**nbhd.city** is a self-hosted neighborhood collaboration platform. See `/specs/README.md` for complete documentation.

## Ticket Management

All project tickets are located in `/tickets/`:
- `tickets.md` - Detailed ticket specifications with acceptance criteria
- `ticket-list.md` - Priority order, timeline, and quick checklist

## Infrastructure & DevOps

**Use Terraform exclusively** (not OpenTofu):
- All infrastructure changes go through Terraform
- Run commands from `/devops/` directory
- Always use `terraform plan` before `terraform apply`

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js / npm
- Docker & Docker Compose (for local DynamoDB)
- Git

### Running Locally

**1. Start Local DynamoDB (required for API)**
```bash
cd app/dynamodb
docker-compose up
# DynamoDB runs on http://localhost:8000
```

**2. Start API (with auto-reload)**
```bash
cd app/api
# Install dependencies (first time only)
pip install -r requirements.txt

# Run with auto-reload for development
uvicorn main:app --reload
# API runs on http://localhost:8000
```

**3. Start Frontend (in separate terminal)**
```bash
cd app/UI
# Install dependencies (first time only)
npm install

# Run dev server with hot reload
npm start
# UI runs on http://localhost:3000
```

### Key Development Facts

- **API Auto-reload**: Uses `uvicorn --reload` flag - changes to Python files are automatically detected
- **Frontend Hot-reload**: React dev server automatically recompiles on file changes
- **DynamoDB**: Local Docker container for development/testing
- **Environment**: Uses `DYNAMODB_ENDPOINT_URL` to point to local DynamoDB
- **No Docker restart needed**: Python API changes are picked up automatically with `--reload`

### Ports
- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- DynamoDB: `http://localhost:8000` (internal)
- API Docs: `http://localhost:8000/docs`

### Testing

**Run API integration tests:**
```bash
cd app/api
pytest tests/integration/ -v
# Or specific test:
pytest tests/integration/test_custom_template_persistence.py -v
```

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
│   ├── /dynamodb/       # Local DynamoDB development (Docker)
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
