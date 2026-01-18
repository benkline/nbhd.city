# Testing Strategy & Standards

**Focus:** Testing philosophy, frameworks, coverage targets, test types
**Phase:** Applied throughout all phases, starting Phase 1
**Last Updated:** 2026-01-10

---

## Testing Philosophy

**Goal:** Ship confident code with minimal bugs and regressions.

**Approach:**
- Test critical paths thoroughly (high ROI)
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for user workflows
- Manual testing for edge cases
- Avoid over-testing (don't test framework code)

**Coverage Targets:**
- **Backend:** 70%+ line coverage for new code
- **Frontend:** 60%+ for component logic (not styling)
- **Critical paths:** 100% coverage
- **Existing code:** Maintain or improve current coverage

---

## Backend Testing (Python/FastAPI)

### Test Framework

**Framework:** pytest
**Mocking:** unittest.mock + pytest-mock
**Database:** pytest fixtures with DynamoDB mock
**API Testing:** pytest + httpx client

### Project Structure

```
api/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures (DB, auth, etc)
│   ├── unit/
│   │   ├── test_auth.py
│   │   ├── test_models.py
│   │   ├── test_dynamodb_repository.py
│   │   └── test_bluesky_api.py
│   ├── integration/
│   │   ├── test_endpoints.py
│   │   ├── test_auth_flow.py
│   │   ├── test_neighborhoods.py
│   │   ├── test_sites.py
│   │   └── test_pds_endpoints.py    # Phase 2
│   └── fixtures/
│       ├── sample_users.py
│       ├── sample_neighborhoods.py
│       └── sample_sites.py
```

### Test Types

#### Unit Tests

**What:** Individual functions/classes in isolation

**Example:** `test_auth.py`
```python
import pytest
from api.auth import create_jwt, verify_jwt

def test_create_jwt_contains_user_did():
    token = create_jwt(user_did="did:plc:abc123")
    decoded = verify_jwt(token)
    assert decoded['did'] == "did:plc:abc123"

def test_jwt_expires_after_7_days():
    token = create_jwt(user_did="did:plc:abc123")
    # Advance time 8 days
    with freezegun.freeze_time("2026-01-18"):
        with pytest.raises(JWTExpired):
            verify_jwt(token)
```

**Coverage:** ~30% of test suite

#### Integration Tests

**What:** Multiple components working together

**Example:** `test_endpoints.py`
```python
@pytest.mark.asyncio
async def test_create_site_endpoint(client, auth_headers, dynamodb_mock):
    response = await client.post(
        "/api/sites",
        json={
            "title": "My Blog",
            "template": "blog",
            "config": {"author": "Alice"}
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()['data']['title'] == "My Blog"

@pytest.mark.asyncio
async def test_template_selection_flow(client, auth_headers):
    # Get templates
    templates_response = await client.get("/api/templates")
    assert len(templates_response.json()['data']) > 0

    # Select one
    template_id = templates_response.json()['data'][0]['id']

    # Create site
    site_response = await client.post(
        "/api/sites",
        json={"template": template_id, "config": {}},
        headers=auth_headers
    )
    assert site_response.status_code == 201
```

**Coverage:** ~50% of test suite

#### E2E Tests

**What:** Full user workflows (optional for Phase 2)

**Example:** `test_auth_flow.py`
```python
@pytest.mark.asyncio
async def test_full_bluesky_oauth_flow(client, mock_bluesky_oauth):
    # 1. Start login
    response = await client.get("/auth/login")
    assert "bluesky.com" in response.headers['location']

    # 2. Simulate OAuth callback
    response = await client.get(
        "/auth/callback",
        params={
            "code": "auth_code_123",
            "state": mock_bluesky_oauth.state
        }
    )

    # 3. Verify redirect has token
    assert "token=" in response.headers['location']
```

**Coverage:** ~20% of test suite

### Running Tests

```bash
# All tests
pytest api/tests

# Specific test file
pytest api/tests/unit/test_auth.py

# With coverage
pytest api/tests --cov=api --cov-report=html

# Specific test
pytest api/tests/unit/test_auth.py::test_create_jwt_contains_user_did

# Watch mode
pytest-watch api/tests
```

### Test Fixtures (conftest.py)

```python
import pytest
from boto3 import Session
from moto import mock_dynamodb

@pytest.fixture
def dynamodb_mock():
    """Mock DynamoDB for testing"""
    with mock_dynamodb():
        yield dynamodb.create_table(...)

@pytest.fixture
def auth_headers(dynamodb_mock):
    """Headers with valid JWT token"""
    token = create_jwt(user_did="did:plc:test123")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_user(dynamodb_mock):
    """Pre-populated test user"""
    user = User(did="did:plc:test123", handle="alice@bsky.social")
    dynamodb_mock.put_item(user)
    return user
```

### Mocking Strategy

**What to mock:**
- External APIs (BlueSky, GitHub)
- AWS services (S3, Lambda, CloudFront)
- Email sending
- Firehose subscriptions

**What NOT to mock:**
- Database queries (use mock DB)
- HTTP client (test real HTTP if possible)
- Business logic

```python
# Mock BlueSky API
@pytest.fixture
def mock_bluesky(monkeypatch):
    def fake_get_profile(did):
        return {
            "displayName": "Alice",
            "avatar": "https://...",
            "did": did
        }
    monkeypatch.setattr("api.bluesky.get_profile", fake_get_profile)

# Mock S3
@pytest.fixture
def mock_s3(monkeypatch):
    def fake_upload(bucket, key, data):
        return f"s3://{bucket}/{key}"
    monkeypatch.setattr("api.storage.upload_to_s3", fake_upload)
```

---

## Frontend Testing (React)

### Test Framework

**Framework:** Vitest (Vite-native)
**Component Testing:** @testing-library/react
**Mocking:** vitest.mock() + MSW (Mock Service Worker)

### Project Structure

```
nbhd/src/
├── __tests__/
│   ├── setup.ts              # Global test setup
│   ├── mocks/
│   │   ├── handlers.ts       # MSW request handlers
│   │   ├── api.ts            # API mocks
│   │   └── data.ts           # Sample data
│   ├── unit/
│   │   ├── contexts/AuthContext.test.jsx
│   │   ├── hooks/useMembers.test.js
│   │   └── services/api.test.js
│   └── components/
│       ├── TemplateGallery.test.jsx
│       ├── SiteConfigForm.test.jsx
│       └── SiteEditor.test.jsx
```

### Test Types

#### Unit Tests

**What:** Individual hooks, utilities, logic

**Example:** `hooks/useMembers.test.js`
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useMembers } from '../useMembers';

describe('useMembers', () => {
  it('fetches and returns members', async () => {
    const { result } = renderHook(() => useMembers('nbhd-001'));

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for API call
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.members).toHaveLength(3);
    expect(result.current.members[0].role).toBe('admin');
  });

  it('handles API errors', async () => {
    const { result } = renderHook(() => useMembers('invalid'));

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

#### Component Tests

**What:** UI components with user interactions

**Example:** `components/TemplateGallery.test.jsx`
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateGallery } from './TemplateGallery';

describe('TemplateGallery', () => {
  it('renders template cards', () => {
    render(<TemplateGallery />);

    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Newsletter')).toBeInTheDocument();
  });

  it('calls onSelect when template selected', () => {
    const onSelect = vi.fn();
    render(<TemplateGallery onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /select/i }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'blog' })
    );
  });

  it('displays preview images', () => {
    render(<TemplateGallery />);

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].src).toMatch(/preview/);
  });
});
```

#### Integration Tests

**What:** Full user flows across components

**Example:** `SiteEditor.test.jsx`
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SiteEditor } from './pages/SiteEditor';

describe('Site Editor Flow', () => {
  it('creates site from template selection to config', async () => {
    render(<SiteEditor />);

    // 1. Select template
    fireEvent.click(screen.getByRole('button', { name: /blog/i }));
    await waitFor(() => {
      expect(screen.getByText(/configure/i)).toBeInTheDocument();
    });

    // 2. Fill config
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'My Blog' }
    });

    // 3. Preview
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));
    await waitFor(() => {
      expect(screen.getByText('My Blog')).toBeInTheDocument();
    });

    // 4. Deploy
    fireEvent.click(screen.getByRole('button', { name: /deploy/i }));
    await waitFor(() => {
      expect(screen.getByText(/building/i)).toBeInTheDocument();
    });
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific test file
npm test -- SiteEditor.test.jsx

# Debug mode
npm run test:debug
```

### Mock Service Worker (MSW)

**Setup:** `mocks/handlers.ts`
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/templates', () => {
    return HttpResponse.json({
      data: [
        { id: 'blog', name: 'Blog', preview: '...' },
        { id: 'project', name: 'Project', preview: '...' },
      ]
    });
  }),

  http.post('/api/sites', ({ request }) => {
    return HttpResponse.json(
      { data: { id: 'site-001', status: 'draft' } },
      { status: 201 }
    );
  }),
];
```

---

## Continuous Integration (CI/CD)

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r api/requirements.txt
      - run: pytest api/tests --cov=api --cov-report=xml
      - uses: codecov/codecov-action@v3

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Test Requirements for PR Merge

- [ ] All tests passing (unit + integration)
- [ ] Coverage not decreased
- [ ] Linters pass (Black, Flake8, ESLint)
- [ ] No security warnings

---

## Performance Testing

### Load Testing (Optional for Phase 2+)

**Tool:** locust or Apache JMeter

**Scenarios:**
- Concurrent site builds
- Template API under load
- PDS firehose processing

```python
# tests/load/locustfile.py
from locust import HttpUser, task

class SiteBuilderUser(HttpUser):
    @task
    def build_site(self):
        self.client.post("/api/sites/site-001/build")
```

### Query Performance

Monitor DynamoDB query latency:
- Get user profile: < 50ms
- List templates: < 200ms
- Get site config: < 100ms

---

## Security Testing

### Manual Security Checklist

- [ ] XSS prevention (test HTML escaping)
- [ ] SQL injection prevention (test parameterized queries)
- [ ] CSRF protection (test form tokens)
- [ ] Authentication required for protected endpoints
- [ ] Authorization enforced (users can't access others' data)
- [ ] Rate limiting applied
- [ ] Secrets never logged

### Automated Security Scanning

- **Python:** `bandit` + `safety`
- **JavaScript:** npm audit + snyk
- **Dependencies:** Dependabot

---

## Manual Testing Checklist

### Phase 2: Static Sites

#### Template System
- [ ] Load templates API
- [ ] Template gallery displays all templates
- [ ] Can select different templates
- [ ] Preview images load
- [ ] Mobile responsive

#### Site Configuration
- [ ] Form loads correct schema for selected template
- [ ] Can edit all config fields
- [ ] Auto-save works (localStorage)
- [ ] Form persists after refresh
- [ ] Validation shows errors for invalid input

#### WASM Preview
- [ ] Preview loads in browser
- [ ] Updates within 1 second of config change
- [ ] Works offline
- [ ] Graceful fallback if WASM unavailable

#### Site Building
- [ ] Build button triggers Lambda
- [ ] Build status updates
- [ ] Build URL returned when complete
- [ ] Errors displayed to user
- [ ] Build history logged

#### Deployment
- [ ] Site live at `username.nbhd.city`
- [ ] Multiple users' sites don't conflict
- [ ] Site updates when re-built
- [ ] Custom domain works (if implemented)

#### Export
- [ ] ZIP downloads successfully
- [ ] ZIP extracts properly
- [ ] README included
- [ ] All files present

### Phase 2: AT Protocol PDS

#### DID Management
- [ ] DIDs generated on signup
- [ ] DIDs unique per user
- [ ] DIDs stored in database
- [ ] Can retrieve user's DID

#### PDS
- [ ] User data accessible via XRPC endpoints
- [ ] AT Protocol format correct
- [ ] BluesSky can verify data

#### Data Sync
- [ ] BlueSky posts appear in nbhd
- [ ] Sync is near real-time
- [ ] No duplicate posts

#### Export/Import
- [ ] Data exports in AT Protocol format
- [ ] Can import to other PDS
- [ ] Data not lost in transfer

---

## Test Data & Fixtures

### Sample Data

**Users:**
- Alice (admin of Main Nbhd)
- Bob (member)
- Charlie (no neighborhood)

**Neighborhoods:**
- Main Nbhd (3 members)
- Dev Nbhd (1 member)

**Sites:**
- Alice's blog (published)
- Bob's project (draft)
- Charlie's newsletter (building)

### Database Seeding

```bash
# Seed test database
python scripts/seed_test_data.py

# Clear test database
python scripts/clear_test_data.py
```

---

## Debugging Tests

### Local Debugging

```bash
# Print debug output
pytest api/tests -v -s

# Drop into debugger on failure
pytest api/tests --pdb

# Run specific test
pytest api/tests/unit/test_auth.py::test_create_jwt -vv
```

### Frontend Debugging

```bash
# Debug mode
npm run test:debug

# Watch specific file
npm test -- --watch SiteEditor.test.jsx
```

---

## Coverage Goals by Phase

| Phase | Backend | Frontend | Notes |
|-------|---------|----------|-------|
| 1 (MVP) | 60% | 40% | Core features only |
| 2 | 70% | 60% | Static sites + PDS |
| 3+ | 75% | 65% | Admin features + plugins |

---

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [tickets.md](./tickets.md) - Testing tickets (TEST-001)
