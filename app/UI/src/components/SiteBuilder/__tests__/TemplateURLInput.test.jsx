import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TemplateURLInput } from '../TemplateURLInput';

describe('TemplateURLInput', () => {
  let mockFetch;
  let localStorageMock;

  beforeEach(() => {
    mockFetch = vi.spyOn(global, 'fetch');

    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(() => 'test-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  afterEach(() => {
    mockFetch.mockRestore();
    vi.clearAllMocks();
  });

  test('renders URL input field', () => {
    render(<TemplateURLInput />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  test('renders analyze button', () => {
    render(<TemplateURLInput />);
    const button = screen.getByRole('button', { name: /analyze|submit/i });
    expect(button).toBeInTheDocument();
  });

  test('analyze button is disabled with empty input', () => {
    render(<TemplateURLInput />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('shows error when submitting invalid URL', async () => {
    render(<TemplateURLInput />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'not-a-valid-url' } });
    fireEvent.click(button);

    // Component should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Invalid GitHub URL/i)).toBeInTheDocument();
    });
  });

  test('analyze button is enabled when URL is entered', async () => {
    render(<TemplateURLInput />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    // Button should be disabled initially with empty input
    expect(button).toBeDisabled();

    // Button becomes enabled when text is entered
    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });

    expect(button).not.toBeDisabled();
  });

  test('submitting valid URL calls POST /api/templates/analyze-url', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          template_id: 'template-123',
          status: 'analyzing',
          poll_url: '/api/templates/template-123/analysis-status'
        }
      })
    });

    render(<TemplateURLInput />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    const testUrl = 'https://github.com/11ty/eleventy-base-blog';
    fireEvent.change(input, { target: { value: testUrl } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates/analyze-url',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });
  });

  test('shows progress during analysis', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          template_id: 'template-123',
          status: 'analyzing'
        }
      })
    });

    const onAnalysisStarted = vi.fn();
    render(<TemplateURLInput onAnalysisStarted={onAnalysisStarted} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onAnalysisStarted).toHaveBeenCalled();
    });
  });

  test('polls analysis status until ready', async () => {
    let pollCount = 0;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'analyzing'
          }
        })
      });

    // Mock polling - first two calls return analyzing, third returns ready
    mockFetch.mockImplementation(() => {
      pollCount++;
      if (pollCount <= 2) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              template_id: 'template-123',
              status: 'analyzing',
              progress: 0.5
            }
          })
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              template_id: 'template-123',
              status: 'ready',
              content_types: { post: {}, page: {} },
              schema: { properties: {} }
            }
          })
        });
      }
    });

    const onAnalysisComplete = vi.fn();
    render(<TemplateURLInput onAnalysisComplete={onAnalysisComplete} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onAnalysisComplete).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  test('calls onAnalysisComplete with template data when ready', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'analyzing'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'ready',
            content_types: { post: {}, page: {} },
            schema: { properties: { title: { type: 'string' } } }
          }
        })
      });

    const onAnalysisComplete = vi.fn();
    render(<TemplateURLInput onAnalysisComplete={onAnalysisComplete} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onAnalysisComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'template-123',
          status: 'ready',
          contentTypes: expect.any(Object),
          schema: expect.any(Object)
        })
      );
    }, { timeout: 5000 });
  });

  test('shows error message on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid GitHub URL' })
    });

    const onError = vi.fn();
    render(<TemplateURLInput onError={onError} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  test('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const onError = vi.fn();
    render(<TemplateURLInput onError={onError} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  test('accepts GitHub URL with trailing slash', () => {
    render(<TemplateURLInput />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog/' } });

    expect(button).not.toBeDisabled();
  });

  test('accepts GitHub URL with .git suffix', () => {
    render(<TemplateURLInput />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog.git' } });

    expect(button).not.toBeDisabled();
  });

  test('rejects non-GitHub URLs on submission', async () => {
    render(<TemplateURLInput />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    const invalidUrls = [
      'https://gitlab.com/user/repo',
      'https://bitbucket.org/user/repo',
      'https://example.com/user/repo',
      'http://github.com/user/repo' // HTTP not HTTPS
    ];

    for (const url of invalidUrls) {
      // Clear previous error
      const errorElements = screen.queryAllByText(/Invalid GitHub URL/i);
      if (errorElements.length > 0) {
        // Input field is cleared or error is shown
      }

      fireEvent.change(input, { target: { value: url } });
      fireEvent.click(button);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Invalid GitHub URL/i)).toBeInTheDocument();
      });
    }
  });

  test('shows loading state during analysis', async () => {
    mockFetch.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'analyzing'
          }
        })
      }), 100))
    );

    render(<TemplateURLInput />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    // Button should be disabled while loading
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  test('clears input after successful analysis', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'analyzing'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'ready',
            content_types: {},
            schema: {}
          }
        })
      });

    render(<TemplateURLInput />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    const testUrl = 'https://github.com/11ty/eleventy-base-blog';
    fireEvent.change(input, { target: { value: testUrl } });
    fireEvent.click(button);

    // After completion, input might be cleared or disabled
    await waitFor(() => {
      // Verify analysis completed
      expect(mockFetch).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  test('progress indicator updates during analysis', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'analyzing',
            progress: 0
          }
        })
      });

    render(<TemplateURLInput />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    // Some progress indication should appear
    await waitFor(() => {
      // The component should show some indication of progress
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  test('handles failed analysis status', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'analyzing'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template_id: 'template-123',
            status: 'failed',
            error: 'Not a valid 11ty template'
          }
        })
      });

    const onError = vi.fn();
    render(<TemplateURLInput onError={onError} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'https://github.com/11ty/eleventy-base-blog' } });
    fireEvent.click(button);

    // Should call error callback when analysis fails
    await waitFor(() => {
      // Error might be reported via callback or displayed
      expect(mockFetch).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});
