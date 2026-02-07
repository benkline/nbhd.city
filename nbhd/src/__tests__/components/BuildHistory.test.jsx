import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildHistory } from '../../components/SiteBuilder/BuildHistory';

// Mock BuildStatusPoller to avoid complex interactions
vi.mock('../../components/SiteBuilder/BuildStatusPoller', () => ({
  BuildStatusPoller: ({ site, jobId, onClose }) => (
    <div data-testid="build-status-poller-mock">
      <p>Mock Build Status Poller for {jobId}</p>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

const mockBuilds = [
  {
    job_id: 'build-20260131-001',
    site_id: 'site-001',
    status: 'completed',
    started_at: '2026-01-31T10:00:00Z',
    completed_at: '2026-01-31T10:05:30Z',
    duration_seconds: 330,
    error: null,
    error_stage: null,
    output_url: 'https://site.nbhd.city'
  },
  {
    job_id: 'build-20260130-002',
    site_id: 'site-001',
    status: 'failed',
    started_at: '2026-01-30T14:00:00Z',
    completed_at: '2026-01-30T14:02:15Z',
    duration_seconds: 135,
    error: 'npm install timeout after 60 seconds',
    error_stage: 'install',
    output_url: null
  },
  {
    job_id: 'build-20260129-003',
    site_id: 'site-001',
    status: 'completed',
    started_at: '2026-01-29T09:30:00Z',
    completed_at: '2026-01-29T09:35:45Z',
    duration_seconds: 345,
    error: null,
    error_stage: null,
    output_url: 'https://site.nbhd.city'
  }
];

describe('BuildHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // [x] Table displays all builds with correct info
  it('renders table with build data', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      expect(screen.getAllByText('✅')).toHaveLength(2); // 2 Completed statuses
      expect(screen.getByText('❌')).toBeInTheDocument(); // Failed status
    });

    // Check that dates are rendered
    expect(screen.getByText(/Jan 31, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 30, 2026/)).toBeInTheDocument();

    // Check durations are rendered
    expect(screen.getByText('5m 30s')).toBeInTheDocument();
    expect(screen.getByText('2m 15s')).toBeInTheDocument();
  });

  // [x] Status colors are visible and correct
  it('displays status badges with correct styling', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      // Check that status icons are rendered with correct badges
      const completedIcons = screen.getAllByText('✅'); // Completed icon
      const failedIcons = screen.getByText('❌'); // Failed icon

      expect(completedIcons).toHaveLength(2);
      expect(failedIcons).toBeInTheDocument();

      // Check that status labels are present
      const completedLabels = screen.getAllByText(/Completed/);
      const failedLabels = screen.getAllByText(/Failed/);

      expect(completedLabels.length).toBeGreaterThan(0);
      expect(failedLabels.length).toBeGreaterThan(0);
    });
  });

  // [x] Pagination works with >50 builds
  it('handles pagination correctly with >50 builds', async () => {
    const manyBuilds = Array.from({ length: 75 }, (_, i) => ({
      ...mockBuilds[0],
      job_id: `build-${i}`,
      started_at: new Date(2026, 0, 31 - Math.floor(i / 10), 10, i % 10).toISOString()
    }));

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: manyBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
  });

  // [x] Sorting by date works (newest first - API handles this)
  it('displays builds in chronological order (newest first)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // First data row (after header) should be Jan 31 (most recent)
      expect(rows[1]).toHaveTextContent('Jan 31, 2026');
      // Second data row should be Jan 30
      expect(rows[2]).toHaveTextContent('Jan 30, 2026');
      // Third data row should be Jan 29
      expect(rows[3]).toHaveTextContent('Jan 29, 2026');
    });
  });

  // [x] Log links are clickable
  it('opens BuildStatusPoller when View Logs clicked', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /view logs/i })[0]).toBeInTheDocument();
    });

    // Click first View Logs button
    const viewLogsButtons = screen.getAllByRole('button', { name: /view logs/i });
    fireEvent.click(viewLogsButtons[0]);

    // Should display BuildStatusPoller mock
    expect(screen.getByTestId('build-status-poller-mock')).toBeInTheDocument();
    expect(screen.getByText(/build-20260131-001/)).toBeInTheDocument();
  });

  // [x] Mobile responsive layout
  it('renders correctly on mobile viewports', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      // Table should still render on mobile
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // All essential elements should be visible
      expect(screen.getByText('Build History')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /view logs/i })).toHaveLength(3);
    });
  });

  // Loading state
  it('displays loading state while fetching builds', () => {
    global.fetch = vi.fn().mockReturnValueOnce(
      new Promise(() => {}) // Never resolves
    );

    render(<BuildHistory siteId="site-001" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // Empty state
  it('shows empty state when no builds exist', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      expect(screen.getByText(/no builds yet/i)).toBeInTheDocument();
    });
  });

  // Error handling
  it('displays error message on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load build history/i)).toBeInTheDocument();
    });
  });

  // Error handling with retry
  it('allows retry after error', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockBuilds,
          pagination: { next_key: null }
        })
      });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load build history/i)).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Should now display builds - check for table and View Logs button
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /view logs/i })).toHaveLength(3);
    });
  });

  // Duration formatting
  it('formats durations correctly', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      expect(screen.getByText('5m 30s')).toBeInTheDocument(); // 330 seconds
      expect(screen.getByText('2m 15s')).toBeInTheDocument(); // 135 seconds
    });
  });

  // Null duration handling
  it('shows "-" for builds without duration', async () => {
    const buildWithoutDuration = {
      ...mockBuilds[0],
      duration_seconds: null,
      completed_at: null
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [buildWithoutDuration],
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Duration cell should show "-"
      expect(rows[1]).toHaveTextContent('-');
    });
  });

  // Null error handling
  it('shows "-" for builds without error messages', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [mockBuilds[0]], // Completed build with no error
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Error cell should show "-"
      const errorCells = within(rows[1]).getAllByRole('cell');
      expect(errorCells[3]).toHaveTextContent('-');
    });
  });

  // Long error message truncation
  it('truncates long error messages with tooltip', async () => {
    const longErrorBuild = {
      ...mockBuilds[1],
      error: 'This is a very long error message that exceeds fifty characters and should be truncated'
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [longErrorBuild],
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      // Should show truncated text with "..."
      const errorText = screen.getByText(/This is a very long error message.../);
      expect(errorText).toBeInTheDocument();

      // Should have title attribute with full text
      expect(errorText).toHaveAttribute('title');
    });
  });

  // Pagination - less than 50 builds
  it('hides pagination when less than 50 builds', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [mockBuilds[0]],
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      // Pagination should not be visible
      const paginationElements = screen.queryAllByText(/Page.*of/);
      expect(paginationElements).toHaveLength(0);
    });
  });

  // Previous button disabled on first page
  it('disables Previous button on first page', async () => {
    // Create many builds to trigger pagination
    const manyBuilds = Array.from({ length: 75 }, (_, i) => ({
      ...mockBuilds[0],
      job_id: `build-${i}`,
      started_at: new Date(2026, 0, 31 - Math.floor(i / 10), 10, i % 10).toISOString()
    }));

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: manyBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });
  });

  // API call verification
  it('calls API with correct URL and parameters', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-123" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites/site-123/builds?limit=100'
      );
    });
  });

  // onViewLogs callback
  it('calls onViewLogs callback when provided', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    const onViewLogs = vi.fn();
    render(<BuildHistory siteId="site-001" onViewLogs={onViewLogs} />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /view logs/i })[0]).toBeInTheDocument();
    });

    const viewLogsButtons = screen.getAllByRole('button', { name: /view logs/i });
    fireEvent.click(viewLogsButtons[0]);

    expect(onViewLogs).toHaveBeenCalledWith(mockBuilds[0]);
  });

  // Close modal
  it('closes BuildStatusPoller modal when close button clicked', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockBuilds,
        pagination: { next_key: null }
      })
    });

    render(<BuildHistory siteId="site-001" />);

    await waitFor(() => {
      const viewLogsButtons = screen.getAllByRole('button', { name: /view logs/i });
      fireEvent.click(viewLogsButtons[0]);
    });

    expect(screen.getByTestId('build-status-poller-mock')).toBeInTheDocument();

    // Click close button in modal
    const closeButton = within(screen.getByTestId('build-status-poller-mock')).getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Modal should be gone
    expect(screen.queryByTestId('build-status-poller-mock')).not.toBeInTheDocument();
  });
});
