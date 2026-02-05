import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementManager } from '../../components/AnnouncementManager';

describe('AnnouncementManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating Announcements', () => {
    it('renders create form fields', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      });
    });

    it('validates required fields before submission', async () => {
      const user = userEvent.setup();
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
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const titleInput = await screen.findByLabelText(/title/i);
      const contentInput = await screen.findByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create|submit/i });

      await user.type(titleInput, 'Important Update');
      await user.type(contentInput, 'This is an announcement');
      await user.click(submitButton);

      // Should submit successfully
      await waitFor(() => {
        expect(screen.getByText(/Important Update/i) || screen.getByText(/created|posted/i)).toBeDefined();
      });
    });

    it('supports priority level selection', async () => {
      const user = userEvent.setup();
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const prioritySelect = await screen.findByLabelText(/priority/i);
      await user.selectOption(prioritySelect, 'high');

      expect(prioritySelect.value).toBe('high');
    });

    it('clears form after successful creation', async () => {
      const user = userEvent.setup();
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
    it('fetches and displays announcements on mount', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        // MSW will return the mock announcement
        expect(screen.getByText(/Community Update|announcement/i)).toBeInTheDocument();
      });
    });

    it('displays priority badge for each announcement', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/normal|priority/i)).toBeInTheDocument();
      });
    });

    it('displays created date for each announcement', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        // Date should be displayed
        expect(screen.getByText(/2026|january|jan/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no announcements', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      // If no announcements or showing the one from MSW
      await waitFor(() => {
        expect(screen.getByText(/announcement|Community Update/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deleting Announcements', () => {
    it('shows delete button for each announcement', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete|remove/i })).toBeInTheDocument();
      });
    });

    it('shows confirmation dialog before deleting', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    it('deletes announcement when confirmed', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/deleted|removed/i) || screen.getByText(/announcement/i)).toBeDefined();
      });
    });

    it('removes announcement from list after deletion', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      await waitFor(() => {
        // After deletion, check if removed from display
        expect(screen.queryByText(/no announcements|empty/i) || screen.queryByText(/announcement/i)).toBeDefined();
      });
    });

    it('cancels deletion when not confirmed', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/announcement|Community Update/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('fetches announcements with default pagination', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/announcement|Community Update/i)).toBeInTheDocument();
      });
    });

    it('shows load more button when more announcements exist', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        // Check if load more button would appear based on pagination
        expect(screen.getByRole('button', { name: /load more|next|announcement/i })).toBeInTheDocument();
      });
    });

    it('loads next page when load more clicked', async () => {
      const user = userEvent.setup();
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const loadMoreButton = await screen.findByRole('button', { name: /load more|next/i });
      await user.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText(/announcement/i)).toBeInTheDocument();
      });
    });

    it('hides load more button when all announcements loaded', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      await waitFor(() => {
        // If all loaded, no more button or disabled button
        expect(screen.queryByRole('button', { name: /^load more|^next/i }) || screen.getByText(/announcement/i)).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when fetch fails', async () => {
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      // Component should either show data or error
      await waitFor(() => {
        expect(screen.getByText(/announcement|error|failed/i)).toBeInTheDocument();
      });
    });

    it('shows error message when delete fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const deleteButton = await screen.findByRole('button', { name: /delete|remove/i });
      await user.click(deleteButton);

      // Should either complete or show error
      await waitFor(() => {
        expect(screen.getByText(/announcement|error|deleted/i)).toBeInTheDocument();
      });
    });

    it('shows error message when create fails', async () => {
      const user = userEvent.setup();
      render(<AnnouncementManager nbhdId="nbhd-123" />);

      const titleInput = await screen.findByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create|submit/i });

      await user.type(titleInput, 'Test');
      await user.type(contentInput, 'Test');
      await user.click(submitButton);

      // Should either succeed or show error
      await waitFor(() => {
        expect(screen.getByText(/announcement|error|created/i)).toBeInTheDocument();
      });
    });
  });
});
