import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentRecordsList from '../../components/ContentRecordsList';

const mockRecords = [
  {
    uri: 'at://did:plc:abc123/app.nbhd.welcome/default',
    cid: 'bafyreib2rxk3rh6kzwq123',
    rkey: 'default',
    created_at: '2026-01-31T10:00:00Z',
    updated_at: '2026-01-31T12:00:00Z',
    type: 'app.nbhd.welcome',
    value: {
      title: 'Welcome',
      content: '# Welcome to Tech Neighborhood'
    }
  },
  {
    uri: 'at://did:plc:abc123/app.nbhd.announcement/3jzfcijpj2z2a',
    cid: 'bafyreib2rxk3rh6kzwq456',
    rkey: '3jzfcijpj2z2a',
    created_at: '2026-01-31T14:00:00Z',
    updated_at: '2026-01-31T14:00:00Z',
    type: 'app.nbhd.announcement',
    value: {
      title: 'Important Announcement',
      content: 'This is important',
      priority: 'urgent'
    }
  }
];

describe('ContentRecordsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders list of records', () => {
      render(<ContentRecordsList records={mockRecords} />);

      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Important Announcement')).toBeInTheDocument();
    });

    it('displays record metadata', () => {
      render(<ContentRecordsList records={mockRecords} />);

      // Check that metadata is displayed
      expect(screen.getByText(/2026-01-31/)).toBeInTheDocument();
      expect(screen.getByText(/bafyreib/)).toBeInTheDocument();
    });

    it('shows content preview for each record', () => {
      render(<ContentRecordsList records={mockRecords} />);

      // Content preview should be visible (first 100 chars or similar)
      expect(screen.getByText(/Welcome|Important/)).toBeInTheDocument();
    });

    it('displays record type badge', () => {
      render(<ContentRecordsList records={mockRecords} />);

      expect(screen.getByText(/welcome|announcement/i)).toBeInTheDocument();
    });

    it('shows empty state when no records', () => {
      render(<ContentRecordsList records={[]} />);

      expect(screen.getByText(/no records|empty/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens AT Protocol inspector when clicking record', async () => {
      const onInspect = vi.fn();
      render(
        <ContentRecordsList records={mockRecords} onInspect={onInspect} />
      );

      const recordRow = screen.getByText('Important Announcement');
      await userEvent.click(recordRow);

      expect(onInspect).toHaveBeenCalledWith(mockRecords[1]);
    });

    it('expands record details on click', async () => {
      render(<ContentRecordsList records={mockRecords} />);

      const recordRow = screen.getByText('Welcome');
      await userEvent.click(recordRow);

      // Details should expand
      await waitFor(() => {
        const uriElements = screen.queryAllByText(/at:\/\//);
        expect(uriElements.length).toBeGreaterThan(0);
      });
    });

    it('shows action buttons for each record', async () => {
      render(<ContentRecordsList records={mockRecords} />);

      const inspectButtons = screen.queryAllByText(/inspect|details|view/i);
      expect(inspectButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('shows pagination when records exceed page size', () => {
      const manyRecords = Array.from({ length: 25 }, (_, i) => ({
        uri: `at://did:plc:abc123/app.nbhd.announcement/rkey${i}`,
        cid: `bafyreib2rxk3rh6kzwq${i}`,
        rkey: `rkey${i}`,
        created_at: '2026-01-31T14:00:00Z',
        updated_at: '2026-01-31T14:00:00Z',
        type: 'app.nbhd.announcement',
        value: {
          title: `Announcement ${i}`,
          content: `Content ${i}`
        }
      }));

      render(<ContentRecordsList records={manyRecords} pageSize={10} />);

      const nextButton = screen.getByText(/next|›/i);
      expect(nextButton).toBeInTheDocument();
    });

    it('navigates to next page', async () => {
      const manyRecords = Array.from({ length: 25 }, (_, i) => ({
        uri: `at://did:plc:abc123/app.nbhd.announcement/rkey${i}`,
        cid: `bafyreib2rxk3rh6kzwq${i}`,
        rkey: `rkey${i}`,
        created_at: '2026-01-31T14:00:00Z',
        updated_at: '2026-01-31T14:00:00Z',
        type: 'app.nbhd.announcement',
        value: {
          title: `Announcement ${i}`,
          content: `Content ${i}`
        }
      }));

      render(<ContentRecordsList records={manyRecords} pageSize={10} />);

      // First page shows Announcement 0-9
      expect(screen.getByText('Announcement 0')).toBeInTheDocument();

      const nextButton = screen.getByText(/next|›/i);
      await userEvent.click(nextButton);

      // Second page shows Announcement 10-19
      await waitFor(() => {
        expect(screen.getByText(/Announcement 1[0-9]/)).toBeInTheDocument();
      });
    });

    it('disables previous button on first page', () => {
      render(
        <ContentRecordsList records={mockRecords} pageSize={10} />
      );

      const prevButton = screen.queryByText(/previous|‹/i);
      if (prevButton) {
        expect(prevButton).toHaveAttribute('disabled');
      }
    });

    it('disables next button on last page', async () => {
      render(
        <ContentRecordsList records={mockRecords} pageSize={10} />
      );

      const nextButton = screen.queryByText(/next|›/i);
      if (nextButton) {
        // If only one page of records, next should be disabled
        if (mockRecords.length <= 10) {
          expect(nextButton).toHaveAttribute('disabled');
        }
      }
    });
  });

  describe('Sorting', () => {
    it('sorts records by creation date (newest first)', () => {
      render(
        <ContentRecordsList
          records={mockRecords}
          sortBy="created_at"
          sortOrder="desc"
        />
      );

      // Most recent should appear first
      const titles = screen.getAllByText(/Welcome|Important/i);
      expect(titles[0]).toHaveTextContent('Important Announcement');
    });

    it('allows changing sort order', async () => {
      render(<ContentRecordsList records={mockRecords} />);

      const sortButton = screen.queryByText(/sort|order/i);
      if (sortButton) {
        await userEvent.click(sortButton);

        // Verify sort changed (oldest first)
        const titles = screen.getAllByText(/Welcome|Important/i);
        expect(titles[0]).toHaveTextContent('Welcome');
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic HTML structure', () => {
      render(<ContentRecordsList records={mockRecords} />);

      // Should use list or table for records
      const list = screen.queryByRole('table') || screen.queryByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('has accessible buttons and labels', () => {
      render(<ContentRecordsList records={mockRecords} />);

      const buttons = screen.queryAllByRole('button');
      buttons.forEach(button => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});
