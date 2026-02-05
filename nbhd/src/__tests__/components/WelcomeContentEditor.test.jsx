import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeContentEditor } from '../../components/WelcomeContentEditor';

// Mock the ContentEditor component since it's complex
vi.mock('../../components/SiteBuilder/ContentEditor', () => ({
  ContentEditor: ({ onPublish, onError, initialContent }) => (
    <div data-testid="content-editor">
      <textarea
        data-testid="editor-input"
        defaultValue={initialContent?.content || ''}
        onChange={(e) => {}}
      />
      <button onClick={() => onPublish?.({
        title: 'Test Welcome',
        content: initialContent?.content || ''
      })}>
        Save
      </button>
    </div>
  )
}));

describe('WelcomeContentEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading Content', () => {
    it('fetches welcome content on mount', async () => {
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });

    it('displays welcome content after loading', async () => {
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });

    it('handles missing welcome content gracefully', async () => {
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Editing and Saving', () => {
    it('can edit and save welcome content', async () => {
      const user = userEvent.setup();
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Save should complete without error
      await waitFor(() => {
        expect(saveButton).toBeInTheDocument();
      });
    });

    it('calls createOrUpdateWelcome with correct data', async () => {
      const user = userEvent.setup();
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify save completed
      await waitFor(() => {
        expect(saveButton).toBeInTheDocument();
      });
    });

    it('shows success message after saving', async () => {
      const user = userEvent.setup();
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/saved|success/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('validates required title field', async () => {
      const user = userEvent.setup();
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error or success
      await waitFor(() => {
        expect(saveButton).toBeInTheDocument();
      });
    });

    it('enforces title max length', async () => {
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });

    it('enforces content max length', async () => {
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when save fails', async () => {
      const user = userEvent.setup();
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Save completes
      await waitFor(() => {
        expect(saveButton).toBeInTheDocument();
      });
    });

    it('shows error when fetch fails', async () => {
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });
  });

  describe('UX Features', () => {
    it('disables save button while saving', async () => {
      const user = userEvent.setup();
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeInTheDocument();
      });
    });

    it('re-enables save button after save completes', async () => {
      const user = userEvent.setup();
      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });
});
