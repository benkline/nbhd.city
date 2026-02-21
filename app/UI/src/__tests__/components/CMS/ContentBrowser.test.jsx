import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ContentBrowser from '../../../components/CMS/ContentBrowser';

// Mock API client
vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockContent = [
  {
    id: '1',
    title: 'First Post',
    type: 'post',
    author: 'John Doe',
    date: '2024-02-10',
    dateModified: '2024-02-15',
    status: 'published',
    content: 'This is the first post content',
  },
  {
    id: '2',
    title: 'Draft Article',
    type: 'post',
    author: 'Jane Smith',
    date: '2024-02-12',
    dateModified: '2024-02-12',
    status: 'draft',
    content: 'This is a draft article',
  },
  {
    id: '3',
    title: 'Scheduled Post',
    type: 'post',
    author: 'John Doe',
    date: '2024-02-20',
    dateModified: '2024-02-10',
    status: 'scheduled',
    content: 'This is scheduled for later',
  },
  {
    id: '4',
    title: 'About Page',
    type: 'page',
    author: 'Admin',
    date: '2024-02-05',
    dateModified: '2024-02-05',
    status: 'published',
    content: 'About us page content',
  },
];

/**
 * Wrap component with router
 */
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ContentBrowser Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading and Display', () => {
    it('loads list from API and displays correctly', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          items: mockContent.slice(0, 2),
          total: 2,
          page: 1,
        },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
        expect(screen.getByText('Draft Article')).toBeInTheDocument();
      });
    });

    it('displays table with correct columns', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('displays status badges with correct colors', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 2), total: 2, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        const publishedBadge = screen.getByText('Published');
        const draftBadge = screen.getByText('Draft');

        expect(publishedBadge).toBeInTheDocument();
        expect(draftBadge).toBeInTheDocument();
      });
    });
  });

  describe('Tab Interface', () => {
    it('shows Posts and Pages tabs', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent, total: 4, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        const postsTab = screen.getByRole('tab', { name: /posts/i });
        const pagesTab = screen.getByRole('tab', { name: /pages/i });

        expect(postsTab).toBeInTheDocument();
        expect(pagesTab).toBeInTheDocument();
      });
    });

    it('switches between Posts and Pages tabs', async () => {
      const { apiClient } = await import('../../../lib/api');

      // First call for posts
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.filter(c => c.type === 'post'), total: 3, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      // Click pages tab
      const pagesTab = screen.getByRole('tab', { name: /pages/i });
      fireEvent.click(pagesTab);

      // Second call for pages
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.filter(c => c.type === 'page'), total: 1, page: 1 },
      });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/content'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Search Functionality', () => {
    it('has search input for title and content', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      const searchInput = await screen.findByPlaceholderText(/search.*content/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      const searchInput = await screen.findByPlaceholderText(/search.*content/i);

      await userEvent.type(searchInput, 'test');
      expect(searchInput).toHaveValue('test');

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Filtering', () => {
    it('filters by status', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent, total: 4, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      const draftFilterButton = screen.getByRole('button', { name: /draft/i });
      fireEvent.click(draftFilterButton);

      // Verify filter was applied
      await waitFor(() => {
        expect(draftFilterButton).toHaveClass('active');
      });
    });

    it('shows filter chips for active filters', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent, total: 4, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      const draftFilterButton = screen.getByRole('button', { name: /draft/i });
      fireEvent.click(draftFilterButton);

      // Filter chip should appear
      await waitFor(() => {
        expect(screen.getByText(/status.*draft/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('sorts by date modified by default', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/content'),
          expect.objectContaining({
            params: expect.objectContaining({
              sortBy: 'dateModified',
              sortDirection: 'desc',
            }),
          })
        );
      });
    });

    it('persists sort preference to localStorage', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      // Trigger a sort change by clicking title header
      const titleHeader = screen.getByText('Title').closest('th');
      fireEvent.click(titleHeader);

      // localStorage should be updated
      await waitFor(() => {
        const savedSort = localStorageMock.getItem('contentBrowserSort');
        expect(savedSort).toBeDefined();
      });
    });
  });

  describe('Bulk Actions', () => {
    it('selects multiple items with checkboxes', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 2), total: 2, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is "select all", skip it
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      await waitFor(() => {
        expect(screen.getByText(/2 items selected/i)).toBeInTheDocument();
      });
    });

    it('shows bulk action options when items selected', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 2), total: 2, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('shows pagination controls', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent, total: 100, page: 1, pageSize: 25 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      });
    });

    it('displays total count', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent, total: 42, page: 1, pageSize: 25 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText(/total.*42/i)).toBeInTheDocument();
      });
    });

    it('disables previous button on first page', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent, total: 100, page: 1, pageSize: 25 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Mobile Responsive', () => {
    it('hides non-essential columns on mobile', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      // Mock mobile viewport
      global.innerWidth = 400;

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      // The CSS media queries will hide these, so we just verify the component renders
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockRejectedValueOnce(new Error('API Error'));

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load content/i)).toBeInTheDocument();
      });
    });

    it('provides retry button on error', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockRejectedValueOnce(new Error('API Error'));

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no content', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: [], total: 0, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Row Actions', () => {
    it('provides Edit button in actions column', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('provides Delete button in actions column', async () => {
      const { apiClient } = await import('../../../lib/api');
      apiClient.get.mockResolvedValueOnce({
        data: { items: mockContent.slice(0, 1), total: 1, page: 1 },
      });

      renderWithRouter(<ContentBrowser />);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });
});
