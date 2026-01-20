import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SiteManagementDashboard } from '../../components/SiteBuilder/SiteManagementDashboard';

// Mock sites data
const mockSites = [
  {
    site_id: 'site-001',
    title: 'My Blog',
    template: 'blog',
    status: 'published',
    subdomain: 'myblog',
    public_url: 'https://myblog.nbhd.city',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-18T14:30:00Z'
  },
  {
    site_id: 'site-002',
    title: 'Project Portfolio',
    template: 'project',
    status: 'draft',
    subdomain: 'portfolio',
    public_url: 'https://portfolio.nbhd.city',
    created_at: '2026-01-16T09:00:00Z',
    updated_at: '2026-01-16T09:00:00Z'
  },
  {
    site_id: 'site-003',
    title: 'Newsletter',
    template: 'newsletter',
    status: 'building',
    subdomain: 'newsletter',
    public_url: 'https://newsletter.nbhd.city',
    created_at: '2026-01-19T08:00:00Z',
    updated_at: '2026-01-19T08:15:00Z'
  }
];

describe('SiteManagementDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // [x] Displays all user sites from API
  it('fetches and displays all user sites from API', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    // Should display all sites
    expect(await screen.findByText('My Blog')).toBeInTheDocument();
    expect(await screen.findByText('Project Portfolio')).toBeInTheDocument();
    expect(await screen.findByText('Newsletter')).toBeInTheDocument();
  });

  // [x] List all user's sites with status (draft, building, published)
  it('displays site status (draft, building, published)', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    // Check for status badges
    expect(await screen.findByText(/published/i)).toBeInTheDocument();
    expect(await screen.findByText(/draft/i)).toBeInTheDocument();
    expect(await screen.findByText(/building/i)).toBeInTheDocument();
  });

  // [x] Show site URL and deployment status
  it('displays site URL and deployment status', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    // Check for URLs
    expect(await screen.findByText(/myblog\.nbhd\.city/)).toBeInTheDocument();
    expect(await screen.findByText(/portfolio\.nbhd\.city/)).toBeInTheDocument();
    expect(await screen.findByText(/newsletter\.nbhd\.city/)).toBeInTheDocument();
  });

  // [x] "Edit" button to re-configure
  it('renders Edit button for each site', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBe(3);
  });

  // [x] Can edit existing sites
  it('calls onEdit callback when Edit button clicked', async () => {
    const mockOnEdit = vi.fn();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard onEdit={mockOnEdit} />
      </BrowserRouter>
    );

    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockSites[0]);
  });

  // [x] "Delete" button with confirmation
  it('renders Delete button with confirmation dialog', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBe(3);

    // Click first delete button - should show confirmation
    fireEvent.click(deleteButtons[0]);

    // Confirmation message should appear
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  // [x] Delete removes site from dashboard
  it('removes site from dashboard after delete confirmation', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSites })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      }); // DELETE request

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    // Initial render shows all sites
    expect(await screen.findByText('My Blog')).toBeInTheDocument();

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Click confirm button
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Wait for the async delete operation to complete and state to update
    await waitFor(() => {
      expect(screen.queryByText('My Blog')).not.toBeInTheDocument();
    });

    // Other sites should still be visible
    expect(screen.getByText('Project Portfolio')).toBeInTheDocument();
  });

  // [x] "View Live" link to published site
  it('renders View Live link for published sites', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    const viewLiveLinks = await screen.findAllByRole('link', { name: /view live/i });
    expect(viewLiveLinks.length).toBeGreaterThan(0);
  });

  // [x] Links work correctly
  it('View Live links have correct URLs', async () => {
    const publishedSites = [
      {
        site_id: 'site-001',
        title: 'My Blog',
        template: 'blog',
        status: 'published',
        subdomain: 'myblog',
        public_url: 'https://myblog.nbhd.city',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-18T14:30:00Z'
      },
      {
        site_id: 'site-004',
        title: 'Portfolio',
        template: 'project',
        status: 'published',
        subdomain: 'portfolio',
        public_url: 'https://portfolio.nbhd.city',
        created_at: '2026-01-16T09:00:00Z',
        updated_at: '2026-01-16T09:00:00Z'
      }
    ];

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: publishedSites })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    const viewLiveLinks = await screen.findAllByRole('link', { name: /view live/i });

    // Check that links point to the correct URLs
    expect(viewLiveLinks[0]).toHaveAttribute('href', 'https://myblog.nbhd.city');
    expect(viewLiveLinks[1]).toHaveAttribute('href', 'https://portfolio.nbhd.city');
  });

  it('handles empty sites list gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    // Should show empty state message
    expect(await screen.findByText(/no sites yet/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load sites' })
    });
    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <SiteManagementDashboard />
      </BrowserRouter>
    );

    // Should show error message
    expect(await screen.findByText(/error|failed/i)).toBeInTheDocument();
  });
});
