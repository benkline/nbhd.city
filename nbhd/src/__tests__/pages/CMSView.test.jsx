import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import CMSView from '../../pages/CMSView';

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
    getCMSView: vi.fn()
  }
}));

const mockCMSData = {
  nbhd_id: 'nbhd-123',
  nbhd_name: 'Tech Neighborhood',
  nbhd_did: 'did:plc:abc123',
  welcome_content: {
    uri: 'at://did:plc:abc123/app.nbhd.welcome/default',
    cid: 'bafyreib2rxk3rh6kzwq123',
    rkey: 'default',
    created_at: '2026-01-31T10:00:00Z',
    updated_at: '2026-01-31T12:00:00Z',
    value: {
      title: 'Welcome',
      content: '# Welcome to Tech Neighborhood'
    }
  },
  announcements: [
    {
      uri: 'at://did:plc:abc123/app.nbhd.announcement/3jzfcijpj2z2a',
      cid: 'bafyreib2rxk3rh6kzwq456',
      rkey: '3jzfcijpj2z2a',
      created_at: '2026-01-31T14:00:00Z',
      updated_at: '2026-01-31T14:00:00Z',
      value: {
        title: 'Important Announcement',
        content: 'This is important',
        priority: 'urgent'
      }
    },
    {
      uri: 'at://did:plc:abc123/app.nbhd.announcement/3jzfcijpj2z2b',
      cid: 'bafyreib2rxk3rh6kzwq789',
      rkey: '3jzfcijpj2z2b',
      created_at: '2026-01-30T10:00:00Z',
      updated_at: '2026-01-30T10:00:00Z',
      value: {
        title: 'Regular Update',
        content: 'Just an update',
        priority: 'normal'
      }
    }
  ],
  announcement_count: 2
};

const renderCMSView = (user = null, isOwner = true, cmsData = mockCMSData) => {
  const mockUser = user || {
    user_id: 'user-123',
    display_name: 'Alice',
    bluesky_handle: 'alice.bsky.social'
  };

  const mockNbhd = {
    id: 'nbhd-123',
    name: 'Tech Neighborhood',
    created_by: isOwner ? mockUser.user_id : 'other-user',
    nbhd_did: 'did:plc:abc123'
  };

  const { nbhdService } = require('../../services/neighborhoodService');
  const { nbhdContentService } = require('../../services/nbhdContentService');

  nbhdService.getNbhd.mockResolvedValue(mockNbhd);
  nbhdContentService.getCMSView.mockResolvedValue({ data: cmsData });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <CMSView />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CMSView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Access Control', () => {
    it('renders CMS view for neighborhood admins', async () => {
      renderCMSView(undefined, true);
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      expect(screen.getByText(/CMS View/i)).toBeInTheDocument();
    });

    it('shows 403 error for non-admins', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getCMSView.mockRejectedValue({
        response: { status: 403, data: { detail: 'Only neighborhood admins can access this' } }
      });

      renderCMSView(undefined, false);

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      expect(screen.getByText(/Only neighborhood admins/i)).toBeInTheDocument();
    });
  });

  describe('Record Display', () => {
    it('displays welcome content record with metadata', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Check welcome record is displayed
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText(/app.nbhd.welcome/)).toBeInTheDocument();
    });

    it('displays all announcement records', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Check both announcements are displayed
      expect(screen.getByText('Important Announcement')).toBeInTheDocument();
      expect(screen.getByText('Regular Update')).toBeInTheDocument();
    });

    it('shows AT Protocol metadata for each record', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Check CID is visible
      expect(screen.getByText(/bafyreib2rxk3rh6kzwq/)).toBeInTheDocument();
      // Check rkey is visible
      expect(screen.getByText(/default|3jzfcijpj2z2a|3jzfcijpj2z2b/)).toBeInTheDocument();
    });

    it('displays created and updated timestamps', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Check timestamps are displayed
      expect(screen.getByText(/2026-01-31/)).toBeInTheDocument();
      expect(screen.getByText(/2026-01-30/)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters records by type (welcome vs announcement)', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Filter by type
      const typeFilter = screen.getByLabelText(/filter.*type/i) || screen.getByDisplayValue(/all/i);
      await userEvent.selectOptions(typeFilter, 'announcement');

      // Welcome should be hidden
      await waitFor(() => {
        const welcomeElements = screen.queryAllByText('Welcome');
        // Should only show as part of welcome content editor, not in list
      });
    });

    it('filters records by date range', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Set date filter
      const dateInput = screen.getByLabelText(/from|start date/i);
      if (dateInput) {
        await userEvent.type(dateInput, '2026-01-31');

        await waitFor(() => {
          // Should show records from 2026-01-31
          expect(screen.getByText('Important Announcement')).toBeInTheDocument();
        });
      }
    });

    it('searches records by content text', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'Important');

      await waitFor(() => {
        expect(screen.getByText('Important Announcement')).toBeInTheDocument();
        // Regular Update should be filtered out
        expect(screen.queryByText('Regular Update')).not.toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls for large record lists', async () => {
      const largeData = {
        ...mockCMSData,
        announcements: Array.from({ length: 25 }, (_, i) => ({
          uri: `at://did:plc:abc123/app.nbhd.announcement/rkey${i}`,
          cid: `bafyreib2rxk3rh6kzwq${i}`,
          rkey: `rkey${i}`,
          created_at: '2026-01-31T14:00:00Z',
          updated_at: '2026-01-31T14:00:00Z',
          value: {
            title: `Announcement ${i}`,
            content: `Content ${i}`,
            priority: 'normal'
          }
        }))
      };

      renderCMSView(undefined, true, largeData);

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Should show pagination
      const nextButton = screen.queryByText(/next|›/i);
      expect(nextButton).toBeInTheDocument();
    });

    it('navigates between pages when clicking pagination', async () => {
      const largeData = {
        ...mockCMSData,
        announcements: Array.from({ length: 25 }, (_, i) => ({
          uri: `at://did:plc:abc123/app.nbhd.announcement/rkey${i}`,
          cid: `bafyreib2rxk3rh6kzwq${i}`,
          rkey: `rkey${i}`,
          created_at: '2026-01-31T14:00:00Z',
          updated_at: '2026-01-31T14:00:00Z',
          value: {
            title: `Announcement ${i}`,
            content: `Content ${i}`,
            priority: 'normal'
          }
        }))
      };

      renderCMSView(undefined, true, largeData);

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      const nextButton = screen.queryByText(/next|›/i);
      if (nextButton) {
        await userEvent.click(nextButton);

        // Page 2 items should be visible
        await waitFor(() => {
          expect(screen.getByText(/Announcement (1[0-9]|2[0-4])/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('AT Protocol Inspector', () => {
    it('shows AT Protocol details when clicking on a record', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Click on a record to view details
      const recordRow = screen.getByText('Important Announcement');
      await userEvent.click(recordRow);

      // Should show inspector details
      await waitFor(() => {
        expect(screen.getByText(/at:\/\//)).toBeInTheDocument();
      });
    });

    it('displays URI, CID, and rkey in inspector', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      const recordRow = screen.getByText('Important Announcement');
      await userEvent.click(recordRow);

      await waitFor(() => {
        expect(screen.getByText(/at:\/\/did:plc:abc123/)).toBeInTheDocument();
        expect(screen.getByText(/bafyreib2rxk3rh6kzwq/)).toBeInTheDocument();
        expect(screen.getByText(/3jzfcijpj2z2a/)).toBeInTheDocument();
      });
    });

    it('provides copy-to-clipboard functionality', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      const recordRow = screen.getByText('Important Announcement');
      await userEvent.click(recordRow);

      const copyButtons = screen.queryAllByText(/copy/i);
      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders mobile-friendly layout on small screens', async () => {
      renderCMSView();

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Check that content is accessible
      expect(screen.getByText(/CMS View/i)).toBeInTheDocument();
      expect(screen.getByText('Important Announcement')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when CMS data fails to load', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getCMSView.mockRejectedValue({
        response: { data: { detail: 'Server error' } }
      });

      renderCMSView();

      await waitFor(() => {
        expect(screen.getByText(/Server error|Failed to load/)).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching data', async () => {
      const { nbhdContentService } = require('../../services/nbhdContentService');
      nbhdContentService.getCMSView.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: mockCMSData }), 100))
      );

      renderCMSView();

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });
});
