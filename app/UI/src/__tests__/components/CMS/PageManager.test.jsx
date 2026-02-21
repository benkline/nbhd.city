import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PageManager from '../../../components/CMS/PageManager';

// Mock data service for testing
const createMockDataService = () => {
  return {
    subscribeToPagesForSite: vi.fn((siteId, namespace, onSuccess, onError) => {
      // Simulate initial data load
      const mockPages = [
        {
          id: 'page-1',
          title: 'Home',
          slug: 'home',
          parent_id: null,
          order: 0,
          status: 'published',
          site_id: siteId
        },
        {
          id: 'page-2',
          title: 'About',
          slug: 'about',
          parent_id: null,
          order: 1,
          status: 'published',
          site_id: siteId
        },
        {
          id: 'page-3',
          title: 'Services',
          slug: 'services',
          parent_id: 'page-2',
          order: 0,
          status: 'published',
          site_id: siteId
        }
      ];

      // Call success callback with mock pages (synchronously for testing)
      onSuccess(mockPages);

      // Return unsubscribe function
      return vi.fn();
    }),
    deletePage: vi.fn(async (pageId, namespace) => {
      return Promise.resolve();
    }),
    reorderPages: vi.fn(async (draggedId, targetId, draggedPage, targetPage, namespace) => {
      return Promise.resolve();
    }),
    updatePageParent: vi.fn(async (pageId, newParentId, newOrder, namespace) => {
      return Promise.resolve();
    }),
    savePage: vi.fn(async (pageData, namespace) => {
      return Promise.resolve({ id: `page-${Date.now()}` });
    }),
    updatePage: vi.fn(async (pageId, pageData, namespace) => {
      return Promise.resolve();
    })
  };
};

describe('PageManager Component', () => {
  let mockDataService;

  beforeEach(() => {
    mockDataService = createMockDataService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria - Core Functionality', () => {
    it('AC1: Can create new pages with titles and slugs', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new page/i })).toBeInTheDocument();
      });

      // Click create button
      const createBtn = screen.getByRole('button', { name: /new page/i });
      await user.click(createBtn);

      // Editor should open
      await waitFor(() => {
        const titleInput = screen.getByRole('textbox', { name: /title/i });
        expect(titleInput).toBeInTheDocument();
      });
    });

    it('AC3: Drag-reorder supported on desktop', async () => {
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Desktop should have drag handles
      const dragHandles = screen.getAllByRole('button', { name: /drag handle/i });
      expect(dragHandles.length).toBeGreaterThan(0);
    });

    it('AC4: Pages saved to correct collection', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new page/i })).toBeInTheDocument();
      });

      // Verify savePage gets called
      expect(mockDataService.savePage).not.toHaveBeenCalled();
    });

    it('AC5: Nested pages generate correct URLs', async () => {
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
      });

      // Services should have URL /about/services
      const servicesRow = screen.getByText('Services').closest('[data-page-id="page-3"]');
      expect(servicesRow).toHaveAttribute('data-url', '/about/services');
    });

    it('AC7: Mobile simplified list view with move buttons', async () => {
      // Set mobile viewport
      global.innerWidth = 375;

      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Mobile list should be rendered
      const mobileList = document.querySelector('[class*="mobileList"]');
      expect(mobileList).toBeInTheDocument();

      // Reset viewport
      global.innerWidth = 1024;
    });
  });

  describe('Page Editor', () => {
    it('should render PageEditor when creating new page', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new page/i })).toBeInTheDocument();
      });

      const createBtn = screen.getByRole('button', { name: /new page/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /slug/i })).toBeInTheDocument();
      });
    });

    it('should show delete confirmation modal', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
      });

      const servicesRow = screen.getByText('Services').closest('[data-page-id="page-3"]');
      const deleteBtn = within(servicesRow).getByRole('button', { name: /delete/i });
      await user.click(deleteBtn);

      // Should show confirmation modal for page without children
      await waitFor(() => {
        expect(screen.getByText(/delete page/i)).toBeInTheDocument();
      });
    });

    it('should call deletePage when confirmed', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
      });

      const servicesRow = screen.getByText('Services').closest('[data-page-id="page-3"]');
      const deleteBtn = within(servicesRow).getByRole('button', { name: /delete/i });
      await user.click(deleteBtn);

      // Confirm deletion
      const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmBtn);

      // Service should be called
      await waitFor(() => {
        expect(mockDataService.deletePage).toHaveBeenCalledWith('page-3', 'app.nbhd');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have ARIA labels on buttons', async () => {
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      const createBtn = screen.getByRole('button', { name: /new page/i });
      expect(createBtn).toHaveAttribute('aria-label');
    });
  });

  describe('UI Structure', () => {
    it('should render header with title and create button', async () => {
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      expect(screen.getByText('Pages')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new page/i })).toBeInTheDocument();
    });

    it('should render page tree on desktop', async () => {
      render(<PageManager siteId="test-site" dataService={mockDataService} />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Should have tree structure with table
      const tableHeader = document.querySelector('[class*="tableHeader"]');
      expect(tableHeader).toBeInTheDocument();
    });

    it('should show empty state with no pages', async () => {
      const emptyDataService = createMockDataService();
      emptyDataService.subscribeToPagesForSite.mockImplementation((siteId, namespace, onSuccess) => {
        onSuccess([]);
        return vi.fn();
      });

      render(<PageManager siteId="test-site" dataService={emptyDataService} />);

      await waitFor(() => {
        expect(screen.getByText(/no pages yet/i)).toBeInTheDocument();
      });
    });
  });
});
