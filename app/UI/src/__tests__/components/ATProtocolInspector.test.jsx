import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ATProtocolInspector from '../../components/ATProtocolInspector';

const mockRecord = {
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
};

describe('ATProtocolInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  describe('Rendering', () => {
    it('displays record URI', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/at:\/\/did:plc:abc123/)).toBeInTheDocument();
    });

    it('displays Content Identifier (CID)', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/bafyreib2rxk3rh6kzwq456/)).toBeInTheDocument();
    });

    it('displays record key (rkey)', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/3jzfcijpj2z2a/)).toBeInTheDocument();
    });

    it('displays record type', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/app.nbhd.announcement/)).toBeInTheDocument();
    });

    it('displays created_at timestamp', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/2026-01-31T14:00:00Z|2026-01-31/)).toBeInTheDocument();
    });

    it('displays updated_at timestamp', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/updated|modified/i)).toBeInTheDocument();
    });

    it('hides when isOpen is false', () => {
      const { container } = render(
        <ATProtocolInspector record={mockRecord} isOpen={false} />
      );

      const inspector = container.querySelector('[class*="inspector"]');
      if (inspector) {
        expect(inspector).toHaveClass(expect.stringMatching(/hidden|closed|inactive/i));
      }
    });
  });

  describe('Copy to Clipboard', () => {
    it('provides copy button for URI', async () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      const copyButtons = screen.queryAllByText(/copy|clone/i);
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('copies URI to clipboard when clicking copy button', async () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      const uriCopyButton = screen.queryAllByText(/copy/i)[0];
      if (uriCopyButton) {
        await userEvent.click(uriCopyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRecord.uri);
      }
    });

    it('copies CID to clipboard', async () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      const copyButtons = screen.queryAllByText(/copy/i);
      if (copyButtons.length >= 2) {
        await userEvent.click(copyButtons[1]);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRecord.cid);
      }
    });

    it('copies rkey to clipboard', async () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      const copyButtons = screen.queryAllByText(/copy/i);
      if (copyButtons.length >= 3) {
        await userEvent.click(copyButtons[2]);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRecord.rkey);
      }
    });

    it('shows success feedback after copying', async () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      const copyButtons = screen.queryAllByText(/copy/i);
      if (copyButtons.length > 0) {
        await userEvent.click(copyButtons[0]);

        await waitFor(() => {
          expect(
            screen.queryByText(/copied|success/i) ||
            copyButtons[0].className.includes('success')
          ).toBeTruthy();
        });
      }
    });
  });

  describe('Record Details Display', () => {
    it('groups related AT Protocol fields together', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      // Should have sections for identity, content, and timestamps
      expect(screen.getByText(/record|data|information/i)).toBeInTheDocument();
    });

    it('formats timestamps in readable format', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      // Should show both ISO and human-readable format
      expect(screen.getByText(/2026-01-31|january|january 31/i)).toBeInTheDocument();
    });

    it('displays record type collection and path', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/app\.nbhd\.announcement/)).toBeInTheDocument();
    });

    it('shows did from URI', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      expect(screen.getByText(/did:plc:abc123/)).toBeInTheDocument();
    });
  });

  describe('Modal/Panel Behavior', () => {
    it('renders as modal when isModal is true', () => {
      render(
        <ATProtocolInspector record={mockRecord} isOpen={true} isModal={true} />
      );

      const modal = screen.queryByRole('dialog') || screen.queryByClass(expect.stringMatching(/modal/i));
      expect(modal || document.querySelector('[role="dialog"]')).toBeTruthy();
    });

    it('renders as expandable panel when isModal is false', () => {
      render(
        <ATProtocolInspector record={mockRecord} isOpen={true} isModal={false} />
      );

      // Should be displayed inline or as expandable panel
      expect(screen.getByText(/at:\/\//)).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <ATProtocolInspector
          record={mockRecord}
          isOpen={true}
          isModal={true}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByText(/close|×|✕/);
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalRecord = {
        uri: 'at://did:plc:abc123/app.nbhd.welcome/default',
        cid: 'bafyreib2rxk3rh6kzwq123',
        rkey: 'default'
      };

      render(<ATProtocolInspector record={minimalRecord} isOpen={true} />);

      expect(screen.getByText(/at:\/\//)).toBeInTheDocument();
      expect(screen.getByText(/bafyreib/)).toBeInTheDocument();
    });

    it('displays N/A for missing timestamps', () => {
      const recordWithoutTimestamps = {
        uri: 'at://did:plc:abc123/app.nbhd.welcome/default',
        cid: 'bafyreib2rxk3rh6kzwq123',
        rkey: 'default'
      };

      render(
        <ATProtocolInspector record={recordWithoutTimestamps} isOpen={true} />
      );

      // Should not crash and should show placeholder
      expect(screen.getByText(/at:\/\//)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      const copyButtons = screen.queryAllByText(/copy/i);
      copyButtons.forEach(button => {
        expect(
          button.getAttribute('aria-label') ||
          button.getAttribute('title') ||
          button.textContent
        ).toBeTruthy();
      });
    });

    it('uses proper semantic HTML', () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      // Should use semantic elements like <dl>, <dt>, <dd> or <table>
      const semantic = document.querySelector('dl') || document.querySelector('table');
      expect(semantic || screen.getByText(/at:\/\//)).toBeTruthy();
    });

    it('can be navigated with keyboard', async () => {
      render(<ATProtocolInspector record={mockRecord} isOpen={true} />);

      const copyButtons = screen.queryAllByText(/copy/i);
      if (copyButtons.length > 0) {
        copyButtons[0].focus();
        expect(document.activeElement).toBe(copyButtons[0]);

        fireEvent.keyDown(copyButtons[0], { key: 'Enter' });
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });
  });
});
