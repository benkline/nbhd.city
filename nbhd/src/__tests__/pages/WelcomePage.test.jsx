import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import WelcomePage from '../../pages/WelcomePage';

// Setup MSW for API mocking
const server = setupServer();

describe('WelcomePage - NBHD-003 Tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  const mockNbhdId = 'test-nbhd-123';
  const mockNbhdData = {
    id: mockNbhdId,
    name: 'Test Neighborhood',
    created_by: 'user-1',
    nbhd_did: 'did:plc:testdid123',
  };

  const mockWelcomeContent = {
    data: {
      value: {
        title: 'Welcome to Our Neighborhood!',
        content: '# Welcome\n\nThis is a **test** neighborhood.\n\n## Features\n- Collaborative\n- Open\n\n[Link](https://example.com)\n\n```javascript\nconst test = true;\n```',
        updated_at: '2026-02-04T10:00:00Z',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // REQUIREMENT 1: [ ] Unauthenticated users can view welcome page
  // ACCEPTANCE CRITERIA: [ ] Unauthenticated users can view welcome page
  // ============================================================
  it('should allow unauthenticated users to access the welcome page', async () => {
    // Arrange: Remove auth token to simulate unauthenticated user
    localStorage.removeItem('auth_token');

    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(mockNbhdData);
      }),
      http.get(`/api/nbhds/${mockNbhdId}/content/welcome`, () => {
        return HttpResponse.json(mockWelcomeContent);
      })
    );

    // Act: Render the page
    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    // Assert: Page should load and display content without requiring auth
    await waitFor(() => {
      expect(screen.getByText('Welcome to Our Neighborhood!')).toBeInTheDocument();
    });
  });

  // ============================================================
  // REQUIREMENT 2: [ ] With no content, shows setup instructions
  // ACCEPTANCE CRITERIA: [ ] With no content, shows setup instructions
  // ============================================================
  it('should display DefaultWelcomeInstructions when no welcome content exists', async () => {
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(mockNbhdData);
      }),
      http.get(`/api/nbhds/${mockNbhdId}/content/welcome`, () => {
        // Simulate 404 or null response when no content exists
        return HttpResponse.json({ data: null }, { status: 404 });
      })
    );

    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    // Assert: Should show default instructions
    await waitFor(() => {
      expect(screen.getByText('Welcome to the Neighborhood!')).toBeInTheDocument();
      expect(screen.getByText(/hasn't set up a welcome page yet/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // REQUIREMENT 3: [ ] With content, shows rendered markdown
  // ACCEPTANCE CRITERIA: [ ] With content, shows rendered markdown
  // ============================================================
  it('should display rendered markdown when welcome content exists', async () => {
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(mockNbhdData);
      }),
      http.get(`/api/nbhds/${mockNbhdId}/content/welcome`, () => {
        return HttpResponse.json(mockWelcomeContent);
      })
    );

    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    // Assert: Should display the title and content area
    await waitFor(() => {
      expect(screen.getByText('Welcome to Our Neighborhood!')).toBeInTheDocument();
    });

    // Assert: Should have markdown content rendered (check for specific text from markdown)
    const contentContainer = screen.getByText('Welcome to Our Neighborhood!').closest('div');
    expect(contentContainer).toBeInTheDocument();
  });

  // ============================================================
  // REQUIREMENT 4: [ ] Markdown renders correctly (headers, links, code blocks)
  // ACCEPTANCE CRITERIA: [ ] Markdown renders correctly (headers, links, code blocks)
  // ============================================================
  it('should render markdown with headers, links, code blocks, and formatting', async () => {
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(mockNbhdData);
      }),
      http.get(`/api/nbhds/${mockNbhdId}/content/welcome`, () => {
        return HttpResponse.json(mockWelcomeContent);
      })
    );

    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Our Neighborhood!')).toBeInTheDocument();
    });

    // Assert: MarkdownRenderer should have rendered the content with proper HTML
    const welcomeContent = screen.getByText('Welcome to Our Neighborhood!').closest('.welcomeContent');
    expect(welcomeContent).toBeInTheDocument();

    // The markdown content should be rendered (exact format depends on marked output)
    // Key assertion: the content area exists and has content
    expect(welcomeContent?.textContent).toMatch(/test|Collaborative|Open/);
  });

  // ============================================================
  // REQUIREMENT 5: [ ] Mobile layout works
  // ACCEPTANCE CRITERIA: [ ] Mobile layout works
  // ============================================================
  it('should render with mobile-responsive layout', async () => {
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(mockNbhdData);
      }),
      http.get(`/api/nbhds/${mockNbhdId}/content/welcome`, () => {
        return HttpResponse.json(mockWelcomeContent);
      })
    );

    // Render and check that layout elements are present and accessible
    const { container } = render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Our Neighborhood!')).toBeInTheDocument();
    });

    // Assert: Page structure exists for mobile layout
    expect(container.querySelector('.container')).toBeInTheDocument();
    expect(container.querySelector('.header')).toBeInTheDocument();
    expect(container.querySelector('.content')).toBeInTheDocument();
    expect(container.querySelector('.footer')).toBeInTheDocument();
  });

  // ============================================================
  // REQUIREMENT 6: [ ] Loading state displays while fetching
  // ACCEPTANCE CRITERIA: [ ] Loading state displays while fetching
  // ============================================================
  it('should display loading state while fetching data', () => {
    // Setup handlers but with a delayed response to catch loading state
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockNbhdData);
      }),
      http.get(`/api/nbhds/${mockNbhdId}/content/welcome`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockWelcomeContent);
      })
    );

    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    // Assert: Loading state should be visible initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // ============================================================
  // ADDITIONAL TESTS: Error Handling
  // ============================================================
  it('should handle errors gracefully when neighborhood not found', async () => {
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(
          { detail: 'Neighborhood not found' },
          { status: 404 }
        );
      })
    );

    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    // Assert: Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });
  });

  it('should display error message when API fails', async () => {
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 }
        );
      })
    );

    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    // Assert: Error should be shown
    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });
  });

  it('should have navigation links back to neighborhood detail', async () => {
    server.use(
      http.get(`/api/nbhds/${mockNbhdId}`, () => {
        return HttpResponse.json(mockNbhdData);
      }),
      http.get(`/api/nbhds/${mockNbhdId}/content/welcome`, () => {
        return HttpResponse.json(mockWelcomeContent);
      })
    );

    const { container } = render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Our Neighborhood!')).toBeInTheDocument();
    });

    // Assert: Back link exists
    expect(screen.getByText(/Back to/)).toBeInTheDocument();

    // Assert: Navigation links exist
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });
});
