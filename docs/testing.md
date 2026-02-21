# Testing Guide

Testing strategy and running tests for nbhd.city.

## Overview

nbhd.city uses comprehensive testing across frontend and backend:

- **Frontend:** Vitest + React Testing Library (component testing)
- **Backend:** pytest (unit and integration testing)
- **Infrastructure:** Terraform tests

## Frontend Testing

### Running Tests

```bash
cd app/UI

# Run all tests once
npm test

# Run in watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
src/__tests__/
├── components/
│   ├── LoginButton.test.jsx
│   ├── SiteCard.test.jsx
│   └── ...
├── pages/
│   ├── HomePage.test.jsx
│   ├── DashboardPage.test.jsx
│   └── ...
└── hooks/
    ├── useAuth.test.jsx
    └── ...
```

### Writing Component Tests

**Example: Testing a button component**

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginButton } from './LoginButton';

describe('LoginButton', () => {
  it('renders login button', () => {
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<LoginButton onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Mocking API Calls

```jsx
import { api } from '../api';
jest.mock('../api');

describe('SiteList', () => {
  it('displays sites from API', async () => {
    api.get.mockResolvedValue({
      data: [{ id: '1', name: 'My Blog' }]
    });

    render(<SiteList />);

    const site = await screen.findByText('My Blog');
    expect(site).toBeInTheDocument();
  });
});
```

### Coverage Goals

| Category | Target |
|----------|--------|
| Line coverage | > 80% |
| Branch coverage | > 75% |
| Function coverage | > 80% |
| Critical paths | > 90% |

### Key Test Scenarios

- **Authentication** - Login, logout, token refresh
- **Forms** - Input validation, submission, error handling
- **API Integration** - Successful calls, error handling, loading states
- **Routing** - Navigation, page loading
- **State Management** - Hook behavior, context updates

## Backend Testing

### Running Tests

```bash
cd app/api

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run specific test function
pytest tests/test_auth.py::test_login_success

# Run with coverage report
pytest --cov=. --cov-report=html

# Run with detailed output and stopping on first failure
pytest -vvs -x
```

### Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── test_auth.py             # Authentication tests
├── test_users.py            # User endpoints
├── test_nbhds.py            # Neighborhood endpoints
├── test_sites.py            # Site endpoints
└── test_content.py          # Content endpoints
```

### Writing API Tests

**Example: Testing an endpoint**

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c

@pytest.mark.asyncio
async def test_create_site(client, auth_headers):
    response = await client.post(
        "/sites",
        json={
            "name": "My Blog",
            "template_id": "blog-minimal",
            "config": {"title": "My Blog"}
        },
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Blog"
    assert "id" in data
```

### Database Testing

Mock DynamoDB for tests:

```python
import pytest
from moto import mock_dynamodb
import boto3

@pytest.fixture
@mock_dynamodb
def dynamodb_table():
    # Create test table
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='test-table',
        KeySchema=[
            {'AttributeName': 'PK', 'KeyType': 'HASH'},
            {'AttributeName': 'SK', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK', 'AttributeType': 'S'},
            {'AttributeName': 'SK', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    return table
```

### Fixtures

Common test fixtures in `conftest.py`:

```python
import pytest

@pytest.fixture
def auth_headers():
    """Returns authorization headers with valid JWT token"""
    return {"Authorization": "Bearer test_token_abc123"}

@pytest.fixture
def sample_user():
    """Returns a sample user object"""
    return {
        "id": "user_123",
        "handle": "testuser.bsky",
        "name": "Test User"
    }

@pytest.fixture
def sample_site():
    """Returns a sample site object"""
    return {
        "id": "site_123",
        "name": "My Blog",
        "template_id": "blog-minimal"
    }
```

### Coverage Goals

| Category | Target |
|----------|--------|
| Line coverage | > 85% |
| Branch coverage | > 80% |
| Critical paths (auth, API) | > 95% |

### Key Test Scenarios

- **Authentication** - OAuth flow, JWT generation, token validation
- **CRUD Operations** - Create, read, update, delete for all entities
- **Authorization** - Permission checks, role-based access
- **Error Handling** - Invalid input, missing resources, server errors
- **Edge Cases** - Empty lists, duplicate IDs, concurrent operations
- **Integration** - Multiple services working together

## Integration Testing

### End-to-End Flow

Test complete user flows:

```python
@pytest.mark.asyncio
async def test_user_creates_and_builds_site(client, auth_headers):
    # 1. Create neighborhood
    nbhd = await client.post("/nbhds", json={"name": "My Nbhd"}, headers=auth_headers)
    nbhd_id = nbhd.json()["id"]

    # 2. Create site
    site = await client.post(
        "/sites",
        json={"name": "Blog", "nbhd_id": nbhd_id, "template_id": "blog-minimal"},
        headers=auth_headers
    )
    site_id = site.json()["id"]

    # 3. Create content
    content = await client.post(
        "/content",
        json={"site_id": site_id, "title": "Post 1", "body": "..."},
        headers=auth_headers
    )

    # 4. Trigger build
    build = await client.post(f"/sites/{site_id}/build", headers=auth_headers)
    assert build.status_code == 202  # Accepted (async)
```

## GitHub Actions CI

### Automated Testing

Tests run automatically on every commit via GitHub Actions:

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd app/UI && npm ci && npm test
      - uses: codecov/codecov-action@v3

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: 3.11
      - run: cd app/api && pip install -r requirements.txt && pytest --cov
      - uses: codecov/codecov-action@v3
```

## Testing Checklist

Before submitting a PR:

- [ ] All new code has tests
- [ ] All tests pass: `npm test` (frontend) and `pytest` (backend)
- [ ] Coverage is not decreased
- [ ] No commented-out code
- [ ] No console.log or print statements
- [ ] Error messages are user-friendly
- [ ] Integration tests for new features

## Performance Testing

### Load Testing (Future)

To test under load:

```bash
# Install load testing tool
pip install locust

# Run load test
locust -f tests/loadtest.py --host http://localhost:8001
```

### Benchmarking (Future)

Track performance over time:

```python
import pytest
from timeit import timeit

def test_query_performance(dynamodb_table):
    # Create test data
    for i in range(1000):
        dynamodb_table.put_item(Item={...})

    # Benchmark query
    def query():
        return dynamodb_table.query(KeyConditionExpression=...)

    time = timeit(query, number=100) / 100
    assert time < 0.1, f"Query too slow: {time}s"
```

## Debugging Tests

### Running Single Test

```bash
# Frontend
npm test -- LoginButton.test.jsx

# Backend
pytest tests/test_auth.py::test_login_success -v
```

### Debug Mode

```bash
# Backend
pytest tests/test_auth.py -v -s --pdb

# Frontend
npm test -- --debug
```

### View Test Coverage

```bash
# Backend
pytest --cov --cov-report=html
open htmlcov/index.html

# Frontend
npm run test:coverage
open coverage/index.html
```

## Related Documentation

- **[Getting Started](./getting-started.md)** - Running tests locally
- **[Backend Guide](./backend.md)** - API structure
- **[Frontend Guide](./frontend.md)** - Component structure
- **[specs/TESTING.md](../specs/TESTING.md)** - Detailed testing specifications

---

**Test Coverage Goal:** > 80% overall, > 95% for critical paths
**CI/CD:** Automated tests on every push
**Time to Run:** Frontend tests ~30s, Backend tests ~1min
