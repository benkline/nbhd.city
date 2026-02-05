import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementManager } from '../../components/AnnouncementManager';

// Mock the API client
vi.mock('../../lib/api');

// Mock the content service
vi.mock('../../services/nbhdContentService', () => ({
  nbhdContentService: {
    getAnnouncements: vi.fn(),
    createAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn()
  }
}));

describe('AnnouncementManager', () => {
  const mockContentService = require('../../services/nbhdContentService').nbhdContentService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating Announcements', () => {
    // [x] Can create announcement
    it('renders create form fields', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      });
    });

    it('validates required fields before submission', async () => {
      const user = userEvent.setup();
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const submitButton = await screen.findByRole('button', { name: /create|submit/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required|title/i)).toBeInTheDocument();
      });
    });

    it('submits announcement with correct data', async () => {
      const user = userEvent.setup();
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });
      mockContentService.createAnnouncement.mockResolvedValue({
        data: { rkey: '3jz...', uri: 'at://...' }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const titleInput = await screen.findByLabelText(/title/i);
      const contentInput = await screen.findByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create|submit/i });

      await user.type(titleInput, 'Important Update');
      await user.type(contentInput, 'This is an announcement');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockContentService.createAnnouncement).toHaveBeenCalledWith(
          'nbhd-123',
          expect.objectContaining({
            title: 'Important Update',
            content: 'This is an announcement'
          })
        );
      });
    });

    it('supports priority level selection', async () => {
      const user = userEvent.setup();
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const prioritySelect = await screen.findByLabelText(/priority/i);
      await user.selectOption(prioritySelect, 'high');

      expect(prioritySelect.value).toBe('high');
    });

    it('clears form after successful creation', async () => {
      const user = userEvent.setup();
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });
      mockContentService.createAnnouncement.mockResolvedValue({
        data: { rkey: '3jz...', uri: 'at://...' }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const titleInput = await screen.findByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create|submit/i });

      await user.type(titleInput, 'Test');
      await user.type(contentInput, 'Test content');
      await user.click(submitButton);

      await waitFor(() => {
        expect(titleInput.value).toBe('');
        expect(contentInput.value).toBe('');
      });
    });
  });

  describe('Listing Announcements', () => {
    // [x] List displays correctly
    it('fetches and displays announcements on mount', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Update 1',
            content: 'Content 1',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText('Update 1')).toBeInTheDocument();
        expect(screen.getByText('Content 1')).toBeInTheDocument();
      });
    });

    it('displays priority badge for each announcement', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Urgent',
            content: 'Urgent update',
            priority: 'high',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/high/i)).toBeInTheDocument();
      });
    });

    it('displays created date for each announcement', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Test',
            content: 'Test',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        // Date should be displayed (exact format depends on component)
        expect(screen.getByText(/2026|january|jan/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no announcements', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/no announcements|empty/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deleting Announcements', () => {
    // [x] Delete works with confirmation
    it('shows delete button for each announcement', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Test',
            content: 'Test',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete|remove/i })).toBeInTheDocument();
      });
    });

    it('shows confirmation dialog before deleting', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Test',
            content: 'Test',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    it('deletes announcement when confirmed', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Test',
            content: 'Test',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });
      mockContentService.deleteAnnouncement.mockResolvedValue({});

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockContentService.deleteAnnouncement).toHaveBeenCalledWith('nbhd-123', '3jz...');
      });
    });

    it('removes announcement from list after deletion', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      mockContentService.getAnnouncements
        .mockResolvedValueOnce({
          data: [
            {
              rkey: '3jz...',
              title: 'Test',
              content: 'Test',
              priority: 'normal',
              created_at: '2026-01-31T10:00:00Z'
            }
          ],
          meta: { pagination: { offset: 0, limit: 10, total: 1 } }
        })
        .mockResolvedValueOnce({
          data: [],
          meta: { pagination: { offset: 0, limit: 10, total: 0 } }
        });

      mockContentService.deleteAnnouncement.mockResolvedValue({});

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/no announcements|empty/i)).toBeInTheDocument();
      });
    });

    it('cancels deletion when not confirmed', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Test',
            content: 'Test',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockContentService.deleteAnnouncement).not.toHaveBeenCalled();
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    // [x] Pagination works
    it('fetches announcements with default pagination', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(mockContentService.getAnnouncements).toHaveBeenCalledWith(
          'nbhd-123',
          10,
          0
        );
      });
    });

    it('shows load more button when more announcements exist', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Test 1',
            content: 'Test',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 25 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load more|next/i })).toBeInTheDocument();
      });
    });

    it('loads next page when load more clicked', async () => {
      const user = userEvent.setup();
      mockContentService.getAnnouncements
        .mockResolvedValueOnce({
          data: [{ rkey: '3jz...', title: 'Test 1', content: 'Test', priority: 'normal', created_at: '2026-01-31T10:00:00Z' }],
          meta: { pagination: { offset: 0, limit: 10, total: 25 } }
        })
        .mockResolvedValueOnce({
          data: [{ rkey: '3jz2...', title: 'Test 2', content: 'Test', priority: 'normal', created_at: '2026-01-31T11:00:00Z' }],
          meta: { pagination: { offset: 10, limit: 10, total: 25 } }
        });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const loadMoreButton = await screen.findByRole('button', { name: /load more|next/i });
      await user.click(loadMoreButton);

      await waitFor(() => {
        expect(mockContentService.getAnnouncements).toHaveBeenCalledWith('nbhd-123', 10, 10);
      });
    });

    it('hides load more button when all announcements loaded', async () => {
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          { rkey: '3jz...', title: 'Test', content: 'Test', priority: 'normal', created_at: '2026-01-31T10:00:00Z' }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /load more|next/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when fetch fails', async () => {
      mockContentService.getAnnouncements.mockRejectedValue(
        new Error('Network error')
      );

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('shows error message when delete fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      mockContentService.getAnnouncements.mockResolvedValue({
        data: [
          {
            rkey: '3jz...',
            title: 'Test',
            content: 'Test',
            priority: 'normal',
            created_at: '2026-01-31T10:00:00Z'
          }
        ],
        meta: { pagination: { offset: 0, limit: 10, total: 1 } }
      });
      mockContentService.deleteAnnouncement.mockRejectedValue(
        new Error('Delete failed')
      );

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('shows error message when create fails', async () => {
      const user = userEvent.setup();
      mockContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });
      mockContentService.createAnnouncement.mockRejectedValue(
        new Error('Create failed')
      );

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const titleInput = await screen.findByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create|submit/i });

      await user.type(titleInput, 'Test');
      await user.type(contentInput, 'Test');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });
});
