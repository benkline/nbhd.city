import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeContentEditor } from '../../components/WelcomeContentEditor';

// Mock the content service
vi.mock('../../services/nbhdContentService', () => ({
  nbhdContentService: {
    getWelcome: vi.fn(),
    createOrUpdateWelcome: vi.fn()
  }
}));

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
  const mockContentService = require('../../services/nbhdContentService').nbhdContentService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading Content', () => {
    // [x] Loads existing welcome content
    it('fetches welcome content on mount', async () => {
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '# Hello World' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(mockContentService.getWelcome).toHaveBeenCalledWith('nbhd-123');
      });
    });

    it('displays welcome content after loading', async () => {
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '# Hello World' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });

    it('handles missing welcome content gracefully', async () => {
      mockContentService.getWelcome.mockResolvedValue({
        data: null
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Editing and Saving', () => {
    // [x] Can edit and save
    it('can edit and save welcome content', async () => {
      const user = userEvent.setup();
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockContentService.createOrUpdateWelcome).toHaveBeenCalled();
      });
    });

    it('calls createOrUpdateWelcome with correct data', async () => {
      const user = userEvent.setup();
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: 'Old content' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockContentService.createOrUpdateWelcome).toHaveBeenCalledWith(
          'nbhd-123',
          expect.objectContaining({
            title: expect.any(String),
            content: expect.any(String)
          })
        );
      });
    });

    it('shows success message after saving', async () => {
      const user = userEvent.setup();
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '' }
      });
      mockContentService.createOrUpdateWelcome.mockResolvedValue({
        data: { uri: 'at://...', cid: 'bafy...' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/saved|success/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    // [x] Validation works
    it('validates required title field', async () => {
      const user = userEvent.setup();
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: '', content: 'Some content' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/required|title/i)).toBeInTheDocument();
      });
    });

    it('enforces title max length', async () => {
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: '', content: '' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const titleInput = await screen.findByPlaceholderText(/title/i);
      const longTitle = 'a'.repeat(201); // Exceeds 200 char limit

      await userEvent.type(titleInput, longTitle);

      // Component should prevent or show error
      expect(titleInput.value.length).toBeLessThanOrEqual(200);
    });

    it('enforces content max length', async () => {
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const contentInput = await screen.findByPlaceholderText(/content/i);
      const longContent = 'a'.repeat(10001); // Exceeds 10000 char limit

      await userEvent.type(contentInput, longContent);

      // Component should prevent or show error
      expect(contentInput.value.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('Error Handling', () => {
    // [x] Success/error messages display
    it('shows error message when save fails', async () => {
      const user = userEvent.setup();
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '' }
      });
      mockContentService.createOrUpdateWelcome.mockRejectedValue(
        new Error('Failed to save')
      );

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('shows error when fetch fails', async () => {
      mockContentService.getWelcome.mockRejectedValue(
        new Error('Network error')
      );

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('UX Features', () => {
    it('disables save button while saving', async () => {
      const user = userEvent.setup();
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '' }
      });
      mockContentService.createOrUpdateWelcome.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Button should be disabled while saving
      expect(saveButton).toBeDisabled();
    });

    it('re-enables save button after save completes', async () => {
      const user = userEvent.setup();
      mockContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '' }
      });
      mockContentService.createOrUpdateWelcome.mockResolvedValue({
        data: { uri: 'at://...', cid: 'bafy...' }
      });

      render(<WelcomeContentEditor nbhdId="nbhd-123" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });
});
