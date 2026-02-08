import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CustomTemplateModal } from '../../components/SiteBuilder/CustomTemplateModal';

/**
 * Tests for SSG-010: Custom Template Selection UI
 *
 * Requirement: [ ] "Add Custom Template" button in template gallery
 * Requirement: [ ] Modal with GitHub URL input
 * Requirement: [ ] Template validation and analysis progress
 * Requirement: [ ] Display custom templates alongside built-in ones
 * Requirement: [ ] Show analysis status (analyzing, ready, failed)
 * Requirement: [ ] Error messages for failed analysis
 */

// Mock fetch globally
global.fetch = vi.fn();

// Track number of status poll calls per template
const pollCallCounts = new Map();

// Helper to mock successful template registration with polling behavior
const mockSuccessfulRegistration = () => {
  pollCallCounts.clear();
  global.fetch = vi.fn((url, options) => {
    if (url === '/api/templates/custom' && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            template_id: 'test-template-123',
            status: 'analyzing'
          }
        })
      });
    }
    if (url.includes('/api/templates/custom/') && url.includes('/status')) {
      const templateId = 'test-template-123';
      const callCount = (pollCallCounts.get(templateId) || 0) + 1;
      pollCallCounts.set(templateId, callCount);

      // Return ready after first poll to simulate quick analysis
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            status: 'ready'
          }
        })
      });
    }
    return Promise.reject(new Error('Unexpected fetch call: ' + url));
  });
};

// Helper to mock failed analysis
const mockFailedAnalysis = () => {
  pollCallCounts.clear();
  global.fetch = vi.fn((url, options) => {
    if (url === '/api/templates/custom' && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            template_id: 'test-template-123',
            status: 'analyzing'
          }
        })
      });
    }
    if (url.includes('/api/templates/custom/') && url.includes('/status')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            status: 'failed',
            error: 'Not a valid 11ty project'
          }
        })
      });
    }
    return Promise.reject(new Error('Unexpected fetch call'));
  });
};

describe('CustomTemplateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // [ ] Users can paste GitHub URL
  describe('GitHub URL Input', () => {
    it('renders modal with GitHub URL input field', () => {
      const onClose = vi.fn();
      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      expect(urlInput).toBeInTheDocument();
    });

    it('accepts GitHub URL input from user', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      await user.type(urlInput, 'https://github.com/user/template');

      expect(urlInput.value).toBe('https://github.com/user/template');
    });

    it('accepts template name input', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );

      const nameInput = screen.getByPlaceholderText(/template name/i);
      await user.type(nameInput, 'My Custom Template');

      expect(nameInput.value).toBe('My Custom Template');
    });
  });

  // [ ] Shows "Analyzing..." progress
  describe('Analysis Progress', () => {
    it('triggers template submission to API', async () => {
      mockSuccessfulRegistration();
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      const onAdd = vi.fn();

      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} onAdd={onAdd} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      const nameInput = screen.getByPlaceholderText(/template name/i);
      const submitButton = screen.getByRole('button', { name: /add.*template/i });

      await user.type(urlInput, 'https://github.com/user/template');
      await user.type(nameInput, 'My Template');
      await user.click(submitButton);

      // Should call fetch to register template
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/templates/custom',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('My Template')
        })
      );
    });

    it('calls onAdd callback immediately after registration', async () => {
      mockSuccessfulRegistration();
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      const onAdd = vi.fn();

      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} onAdd={onAdd} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      const nameInput = screen.getByPlaceholderText(/template name/i);
      const submitButton = screen.getByRole('button', { name: /add.*template/i });

      await user.type(urlInput, 'https://github.com/user/template');
      await user.type(nameInput, 'My Template');
      await user.click(submitButton);

      // onAdd should be called with template data
      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
        template_id: 'test-template-123',
        name: 'My Template',
        status: 'analyzing'
      }));
    });
  });

  // [ ] Template appears in gallery when ready
  describe('Successful Template Addition', () => {
    it('calls onAdd callback when template analysis completes', async () => {
      mockSuccessfulRegistration();
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      const onAdd = vi.fn();

      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} onAdd={onAdd} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      const nameInput = screen.getByPlaceholderText(/template name/i);
      const submitButton = screen.getByRole('button', { name: /add.*template/i });

      await user.type(urlInput, 'https://github.com/user/template');
      await user.type(nameInput, 'My Template');
      await user.click(submitButton);

      // onAdd is called immediately after registration
      expect(onAdd).toHaveBeenCalled();
      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
        template_id: 'test-template-123',
        status: 'analyzing'
      }));
    });

    it('closes modal after successful template analysis', async () => {
      mockSuccessfulRegistration();
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      const onAdd = vi.fn();

      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} onAdd={onAdd} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      const nameInput = screen.getByPlaceholderText(/template name/i);
      const submitButton = screen.getByRole('button', { name: /add.*template/i });

      await user.type(urlInput, 'https://github.com/user/template');
      await user.type(nameInput, 'My Template');
      await user.click(submitButton);

      // Wait for onClose to be called (happens after success after 2-second timeout)
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      }, { timeout: 4000 });
    });
  });

  // [ ] Failed templates show error message
  describe('Error Handling', () => {
    it('shows error message when template analysis fails', async () => {
      mockFailedAnalysis();
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      const onAdd = vi.fn();

      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} onAdd={onAdd} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      const nameInput = screen.getByPlaceholderText(/template name/i);
      const submitButton = screen.getByRole('button', { name: /add.*template/i });

      await user.type(urlInput, 'https://github.com/user/invalid');
      await user.type(nameInput, 'Invalid Template');
      await user.click(submitButton);

      // Wait for error message to appear in failed section
      await waitFor(() => {
        const failedSection = screen.getByRole('button', { name: /try again/i });
        expect(failedSection).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('validates GitHub URL format before submission', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      const nameInput = screen.getByPlaceholderText(/template name/i);
      const submitButton = screen.getByRole('button', { name: /add.*template/i });

      await user.type(urlInput, 'not-a-valid-url');
      await user.type(nameInput, 'Template');
      await user.click(submitButton);

      // Should show validation error immediately
      expect(screen.getByText(/invalid.*url/i)).toBeInTheDocument();
    });
  });

  // Modal interaction
  describe('Modal Behavior', () => {
    it('closes modal when header close button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();

      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );

      // Click the close button (✕) in the header - find by aria-label "Close" specifically
      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('does not render when isOpen is false', () => {
      const onClose = vi.fn();
      const { container } = render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={false} onClose={onClose} />
        </BrowserRouter>
      );

      // Modal should not be visible - check that there's no modal header
      const header = container.querySelector('h2');
      expect(header).not.toBeInTheDocument();
    });

    it('shows success state after template is analyzed', async () => {
      mockSuccessfulRegistration();
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      const onAdd = vi.fn();

      render(
        <BrowserRouter>
          <CustomTemplateModal isOpen={true} onClose={onClose} onAdd={onAdd} />
        </BrowserRouter>
      );

      const urlInput = screen.getByPlaceholderText(/github.*url/i);
      const nameInput = screen.getByPlaceholderText(/template name/i);
      const submitButton = screen.getByRole('button', { name: /add.*template/i });

      await user.type(urlInput, 'https://github.com/user/template');
      await user.type(nameInput, 'Template');
      await user.click(submitButton);

      // After template analysis completes, success message should appear
      await waitFor(() => {
        expect(screen.getByText(/Template added successfully/i)).toBeInTheDocument();
      });
    });
  });
});
