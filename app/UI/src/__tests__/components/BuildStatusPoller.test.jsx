import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { BuildStatusPoller } from '../../components/SiteBuilder/BuildStatusPoller';

const mockSite = {
  site_id: 'site-001',
  title: 'My Blog'
};

const mockJobId = 'build-20260201-abc123';

function createMockResponse(overrides = {}) {
  return {
    ok: true,
    json: async () => ({
      job_id: mockJobId,
      site_id: 'site-001',
      status: 'running',
      started_at: '2026-02-01T10:00:00Z',
      logs: ['Cloning template...', 'Running npm install...'],
      last_updated: '2026-02-01T10:01:00Z',
      ...overrides
    })
  };
}

// Helper to flush pending promises within fake timers
function flushPromises() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
    vi.advanceTimersByTime(0);
  });
}

describe('BuildStatusPoller', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // [x] Fetches status on mount
  it('fetches build status on mount', async () => {
    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `/api/sites/site-001/builds/${mockJobId}`
    );
  });

  // [x] Status updates every 5 seconds while building
  it('polls every 5 seconds', async () => {
    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    // Initial fetch
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance 5 seconds - should poll again
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Advance another 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  // [x] Shows correct status text (pending, running, completed, failed)
  it('displays correct status text', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      createMockResponse({ status: 'running' })
    );
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    const badge = screen.getByTestId('build-status-badge');
    expect(badge.textContent).toContain('RUNNING');
  });

  // [x] Logs display and update as build progresses
  it('displays build logs', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      createMockResponse({
        logs: ['Cloning template...', 'Installing dependencies...', 'Building with 11ty...']
      })
    );
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    expect(screen.getByText('Cloning template...')).toBeInTheDocument();
    expect(screen.getByText('Installing dependencies...')).toBeInTheDocument();
    expect(screen.getByText('Building with 11ty...')).toBeInTheDocument();
  });

  // [x] Stops polling once build completes
  it('stops polling when status is completed', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      createMockResponse({ status: 'completed' })
    );
    global.fetch = mockFetch;

    const onBuildComplete = vi.fn();

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={onBuildComplete}
          onClose={vi.fn()}
        />
      );
    });

    // Initial fetch
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance 5 seconds - should NOT poll again since completed
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // [x] Error messages display on build failure
  it('stops polling on failed status and shows error', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      createMockResponse({
        status: 'failed',
        error_message: 'npm install timeout after 60 seconds'
      })
    );
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    const badge = screen.getByTestId('build-status-badge');
    expect(badge.textContent).toContain('FAILED');
    expect(screen.getByText('Build Failed')).toBeInTheDocument();
    expect(screen.getByText(/npm install timeout/i)).toBeInTheDocument();

    // Should NOT poll again
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // [x] Network errors handled without crashing
  it('handles network errors after 3 consecutive failures', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    // First failure (on mount)
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second failure
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await flushPromises();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Third failure - should show error and stop polling
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await flushPromises();
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);

    expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
  });

  // [x] Cleans up intervals on unmount
  it('cleans up intervals on unmount', async () => {
    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    global.fetch = mockFetch;

    let unmount;
    await act(async () => {
      const result = render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      unmount = result.unmount;
    });

    // Initial fetch
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Unmount component
    unmount();

    // Advance time - should NOT call fetch again
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // [x] Can manually refresh status
  it('supports manual refresh button', async () => {
    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // [x] Shows elapsed time
  it('displays elapsed time', async () => {
    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    global.fetch = mockFetch;

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    // Initially 0s
    expect(screen.getByText(/0:00/)).toBeInTheDocument();

    // Advance 65 seconds
    await act(async () => {
      vi.advanceTimersByTime(65000);
    });

    expect(screen.getByText(/1:05/)).toBeInTheDocument();
  });

  // [x] Calls onBuildComplete on completion
  it('calls onBuildComplete callback when build finishes', async () => {
    const completedData = {
      job_id: mockJobId,
      site_id: 'site-001',
      status: 'completed',
      started_at: '2026-02-01T10:00:00Z',
      logs: ['Done!'],
      last_updated: '2026-02-01T10:05:00Z'
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => completedData
    });
    global.fetch = mockFetch;

    const onBuildComplete = vi.fn();

    await act(async () => {
      render(
        <BuildStatusPoller
          site={mockSite}
          jobId={mockJobId}
          onBuildComplete={onBuildComplete}
          onClose={vi.fn()}
        />
      );
      await flushPromises();
    });

    expect(onBuildComplete).toHaveBeenCalledWith(completedData);
  });
});
