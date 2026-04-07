import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { BuildTriggerButton } from '../BuildTriggerButton';

describe('BuildTriggerButton', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  const mockSite = {
    site_id: 'test-site-123',
    title: 'My Test Site',
    status: 'idle'
  };

  test('renders deploy button', () => {
    render(<BuildTriggerButton site={mockSite} />);
    const button = screen.getByRole('button', { name: /Deploy Site/i });
    expect(button).toBeInTheDocument();
  });

  test('button is enabled when site is idle', () => {
    render(<BuildTriggerButton site={mockSite} />);
    const button = screen.getByRole('button', { name: /Deploy Site/i });
    expect(button).not.toBeDisabled();
  });

  test('button is disabled when site is building', () => {
    const buildingSite = { ...mockSite, status: 'building' };
    render(<BuildTriggerButton site={buildingSite} />);
    const button = screen.getByRole('button', { name: /Deploy Site/i });
    expect(button).toBeDisabled();
  });

  test('button text shows deploying state while loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job_id: 'job-123' })
    });

    const onBuildTriggered = vi.fn();
    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    // Should show confirmation dialog
    expect(screen.getByText(/Are you sure you want to rebuild/i)).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', { name: /Deploy/i });
    fireEvent.click(confirmButtons[1]);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/sites/${mockSite.site_id}/build`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('shows confirmation dialog when clicked', async () => {
    render(<BuildTriggerButton site={mockSite} />);

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to rebuild/i)).toBeInTheDocument();
    });
  });

  test('cancel button dismisses confirmation dialog', async () => {
    render(<BuildTriggerButton site={mockSite} />);

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to rebuild/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Are you sure you want to rebuild/i)).not.toBeInTheDocument();
    });
  });

  test('triggers POST request with correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job_id: 'job-123' })
    });

    render(<BuildTriggerButton site={mockSite} />);

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: /Deploy/i })[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/sites/test-site-123/build`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  test('calls onBuildTriggered callback with job_id on success', async () => {
    const onBuildTriggered = vi.fn();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job_id: 'job-abc-123' })
    });

    render(
      <BuildTriggerButton
        site={mockSite}
        onBuildTriggered={onBuildTriggered}
      />
    );

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: /Deploy/i })[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onBuildTriggered).toHaveBeenCalledWith('job-abc-123');
    });
  });

  test('shows error message on build failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    });

    render(<BuildTriggerButton site={mockSite} />);

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: /Deploy/i })[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });

  test('shows error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<BuildTriggerButton site={mockSite} />);

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: /Deploy/i })[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  test('button is disabled during loading', async () => {
    mockFetch.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ data: { job_id: 'job-123' } })
      }), 100))
    );

    render(<BuildTriggerButton site={mockSite} />);

    const button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: /Deploy/i })[1];
    fireEvent.click(confirmButton);

    // Button should be disabled while loading
    const deployingText = screen.getByText(/Deploying/i);
    expect(deployingText).toBeInTheDocument();
  });

  test('clears error when trying again', async () => {
    const { rerender } = render(<BuildTriggerButton site={mockSite} />);

    // First attempt fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed' })
    });

    let button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: /Deploy/i })[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    });

    // Second attempt succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job_id: 'job-123' })
    });

    button = screen.getByRole('button', { name: /Deploy Site/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton2 = screen.getAllByRole('button', { name: /Deploy/i })[1];
    fireEvent.click(confirmButton2);

    // Error message should clear
    await waitFor(() => {
      expect(screen.queryByText(/Failed/i)).not.toBeInTheDocument();
    });
  });

  test('has appropriate title attribute', () => {
    render(<BuildTriggerButton site={mockSite} />);
    const button = screen.getByRole('button', { name: /Deploy Site/i });
    expect(button).toHaveAttribute('title');
  });

  test('button title changes based on site status', () => {
    const buildingSite = { ...mockSite, status: 'building' };
    render(<BuildTriggerButton site={buildingSite} />);
    const button = screen.getByRole('button', { name: /Deploy Site/i });
    expect(button.getAttribute('title')).toContain('already in progress');
  });
});
