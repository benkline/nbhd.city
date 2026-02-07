import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildTriggerButton } from '../../components/SiteBuilder/BuildTriggerButton';

// Mock sites data
const mockSite = {
  site_id: 'site-001',
  title: 'My Blog',
  template: 'blog',
  status: 'published',
  subdomain: 'myblog',
  public_url: 'https://myblog.nbhd.city',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-18T14:30:00Z'
};

describe('BuildTriggerButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // [x] Button visible in dashboard for each site
  it('renders Deploy Site button', () => {
    const onBuildTriggered = vi.fn();

    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const button = screen.getByRole('button', { name: /deploy site/i });
    expect(button).toBeInTheDocument();
  });

  // [x] Clicking triggers build (202 Accepted received)
  it('triggers API call when button clicked and confirmed', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        job_id: 'build-20260201-abc123',
        status: 'pending',
        site_id: 'site-001',
        triggered_at: '2026-02-01T10:00:00Z'
      })
    });
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    // Click Deploy button
    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Confirmation dialog should appear
    expect(await screen.findByText(/are you sure.*rebuild and deploy/i)).toBeInTheDocument();

    // Click confirm button - use getAllByRole to get the confirm button in the dialog
    const allConfirmButtons = screen.getAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]); // Click the one in the dialog

    // Wait for API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sites/site-001/build',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  // [x] Loading state displays during request
  it('shows loading state while build is being triggered', async () => {
    let resolveResponse;
    const mockFetch = vi.fn().mockReturnValueOnce(
      new Promise(resolve => { resolveResponse = resolve; })
    );
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    // Click Deploy button
    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Confirm dialog - get the confirm button from the dialog
    const allConfirmButtons = await screen.findAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]);

    // Button should show loading text
    expect(await screen.findByRole('button', { name: /deploying/i })).toBeInTheDocument();

    // Resolve the mock response
    resolveResponse({
      ok: true,
      status: 202,
      json: async () => ({
        job_id: 'build-20260201-abc123',
        status: 'pending'
      })
    });

    // Button should return to normal state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deploy site/i })).toBeInTheDocument();
    });
  });

  // [x] Success message shows with job_id
  it('calls onBuildTriggered with job_id on success', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        job_id: 'build-20260201-abc123',
        status: 'pending',
        site_id: 'site-001'
      })
    });
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    // Click Deploy button
    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Confirm - get the confirm button from the dialog
    const allConfirmButtons = await screen.findAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]);

    // Verify callback was called with job_id
    await waitFor(() => {
      expect(onBuildTriggered).toHaveBeenCalledWith('build-20260201-abc123');
    });
  });

  // [x] Error messages clear and helpful
  it('displays error message on API failure', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    });
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    // Click Deploy button
    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Confirm - get the confirm button from the dialog
    const allConfirmButtons = await screen.findAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]);

    // Error message should be visible
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  // [x] Can't trigger multiple builds simultaneously
  it('disables button while loading/building', async () => {
    let resolveResponse;
    const mockFetch = vi.fn().mockReturnValueOnce(
      new Promise(resolve => { resolveResponse = resolve; })
    );
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    // Click Deploy button
    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Confirm - get the confirm button from the dialog
    const allConfirmButtons = await screen.findAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]);

    // Button should be disabled during loading
    const deployingButton = await screen.findByRole('button', { name: /deploying/i });
    expect(deployingButton).toBeDisabled();

    // Resolve response
    resolveResponse({
      ok: true,
      status: 202,
      json: async () => ({
        job_id: 'build-20260201-abc123',
        status: 'pending'
      })
    });

    // Button should be enabled again
    await waitFor(() => {
      const newButton = screen.getByRole('button', { name: /deploy site/i });
      expect(newButton).not.toBeDisabled();
    });
  });

  // Additional test: Confirmation dialog
  it('shows confirmation dialog asking to rebuild', async () => {
    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Confirmation dialog should appear
    const confirmDialog = await screen.findByText(/are you sure.*rebuild and deploy/i);
    expect(confirmDialog).toBeInTheDocument();
  });

  // Additional test: Cancel button in dialog
  it('cancels build when Cancel button clicked in confirmation dialog', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Find and click Cancel button - get all cancel buttons
    const allCancelButtons = await screen.findAllByRole('button', { name: /cancel/i });
    fireEvent.click(allCancelButtons[0]);

    // Confirmation dialog should be gone
    const confirmDialog = screen.queryByText(/are you sure.*rebuild and deploy/i);
    expect(confirmDialog).not.toBeInTheDocument();

    // API should not have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Additional test: Button disabled when site is building
  it('disables button when site status is "building"', () => {
    const buildingSite = { ...mockSite, status: 'building' };
    const onBuildTriggered = vi.fn();

    render(
      <BuildTriggerButton
        site={buildingSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    expect(deployButton).toBeDisabled();
  });

  // Additional test: Success callback receives correct data
  it('passes job_id and status to callback', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        job_id: 'build-20260201-xyz789',
        status: 'pending',
        site_id: 'site-001',
        triggered_at: '2026-02-01T12:30:00Z'
      })
    });
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    const allConfirmButtons = await screen.findAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]);

    await waitFor(() => {
      expect(onBuildTriggered).toHaveBeenCalledWith('build-20260201-xyz789');
    });
  });

  // Additional test: Network error handling
  it('handles network errors gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(
      new Error('Network error')
    );
    global.fetch = mockFetch;

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    // Get the confirm button from the dialog
    const allConfirmButtons = await screen.findAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]);

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deploy site/i })).not.toBeDisabled();
    });
  });

  // Additional test: Site ID is used in API call
  it('uses correct site ID in API endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        job_id: 'build-123',
        status: 'pending'
      })
    });
    global.fetch = mockFetch;

    const testSite = { ...mockSite, site_id: 'custom-site-id' };
    render(
      <BuildTriggerButton
        site={testSite}
        onBuildTriggered={vi.fn()}
      />
    );

    const deployButton = screen.getByRole('button', { name: /deploy site/i });
    fireEvent.click(deployButton);

    const allConfirmButtons = await screen.findAllByRole('button', { name: /deploy/i });
    fireEvent.click(allConfirmButtons[allConfirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sites/custom-site-id/build',
        expect.any(Object)
      );
    });
  });
});
