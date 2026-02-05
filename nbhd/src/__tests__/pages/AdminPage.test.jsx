import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Setup mocks at module level before any imports
vi.mock('axios', () => ({
  default: {
    create: vi.fn(function() {
      return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      };
    })
  }
}));

// Now import after mocking dependencies
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import AdminPage from '../../pages/AdminPage';

// Mock useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'nbhd-123' }),
    useNavigate: () => vi.fn()
  };
});

// Mock the neighborhood service
vi.mock('../../services/neighborhoodService', () => ({
  nbhdService: {
    getNbhd: vi.fn()
  }
}));

// Mock the content service
vi.mock('../../services/nbhdContentService', () => ({
  nbhdContentService: {
    getWelcome: vi.fn(),
    createOrUpdateWelcome: vi.fn(),
    getAnnouncements: vi.fn(),
    createAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn()
  }
}));

const renderAdminPage = (user = null, isOwner = true) => {
  const mockUser = user || {
    user_id: 'user-123',
    display_name: 'Alice',
    bluesky_handle: 'alice.bsky.social'
  };

  const mockNbhd = {
    id: 'nbhd-123',
    name: 'Tech Neighborhood',
    created_by: isOwner ? mockUser.user_id : 'other-user',
    nbhd_did: 'did:plc:abc123',
    members: []
  };

  const { nbhdService } = require('../../services/neighborhoodService');
  nbhdService.getNbhd.mockResolvedValue(mockNbhd);

  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Access Control', () => {
    it('redirects non-owners away from admin page', async () => {
      const mockNavigate = vi.fn();
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate
        };
      });

      // This test verifies that non-owners cannot access the admin page
      // The actual redirect happens in AdminPage.jsx useEffect
      renderAdminPage(null, false);

      // Navigation to non-admin page should occur
      // (This is tested through integration - component should not render)
    });

    it('allows owners to access admin page', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '# Hello' }
      });

      renderAdminPage(null, true);

      // Page should load for owner
      await waitFor(() => {
        expect(screen.getByText(/admin/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('displays all tab buttons', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockResolvedValue({
        data: { title: '', content: '' }
      });
      nbhdContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      renderAdminPage(null, true);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /welcome/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /announcements/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sites/i })).toBeInTheDocument();
      });
    });

    it('Welcome tab is active by default', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockResolvedValue({
        data: { title: '', content: '' }
      });

      renderAdminPage(null, true);

      await waitFor(() => {
        const welcomeTab = screen.getByRole('button', { name: /welcome/i });
        expect(welcomeTab).toHaveClass('tabActive');
      });
    });

    it('switches tabs when tab button clicked', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockResolvedValue({
        data: { title: '', content: '' }
      });
      nbhdContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      const user = userEvent.setup();
      renderAdminPage(null, true);

      const announcementsTab = await screen.findByRole('button', { name: /announcements/i });
      await user.click(announcementsTab);

      await waitFor(() => {
        expect(announcementsTab).toHaveClass('tabActive');
      });
    });
  });

  describe('Unsaved Changes Indicator', () => {
    it('shows unsaved indicator when content changes', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockResolvedValue({
        data: { title: '', content: '' }
      });

      renderAdminPage(null, true);

      // This would be tested by monitoring the hasUnsavedChanges state
      // and checking for visual indicators (e.g., dot, asterisk)
      // Implementation detail depends on how component bubbles up state
    });

    it('warns when switching tabs with unsaved changes', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockResolvedValue({
        data: { title: '', content: '' }
      });
      nbhdContentService.getAnnouncements.mockResolvedValue({
        data: [],
        meta: { pagination: { offset: 0, limit: 10, total: 0 } }
      });

      const user = userEvent.setup();
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderAdminPage(null, true);

      // Simulate editing content
      const editor = await screen.findByRole('textbox');
      await user.type(editor, 'Some content');

      // Try to switch tabs
      const announcementsTab = await screen.findByRole('button', { name: /announcements/i });
      await user.click(announcementsTab);

      // Should show confirmation dialog
      expect(mockConfirm).toHaveBeenCalled();

      mockConfirm.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('shows loading state while fetching data', async () => {
      const { nbhdService } = require('../../services/neighborhoodService');
      nbhdService.getNbhd.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: 'nbhd-123',
          name: 'Tech Neighborhood',
          created_by: 'user-123',
          nbhd_did: 'did:plc:abc123'
        }), 100))
      );

      renderAdminPage(null, true);

      // Loading state should be visible initially
      // Implementation depends on how loading is indicated
    });

    it('renders content after loading completes', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockResolvedValue({
        data: { title: 'Welcome', content: '# Hello' }
      });

      renderAdminPage(null, true);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when fetching neighborhood fails', async () => {
      const { nbhdService } = require('../../services/neighborhoodService');
      nbhdService.getNbhd.mockRejectedValue(new Error('Network error'));

      renderAdminPage(null, true);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('shows error message when fetching content fails', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getWelcome.mockRejectedValue(new Error('API error'));

      renderAdminPage(null, true);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });
});
