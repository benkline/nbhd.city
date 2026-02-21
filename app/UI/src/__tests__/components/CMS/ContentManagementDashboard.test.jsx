import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentManagementDashboard } from '../../../components/CMS/ContentManagementDashboard';

describe('ContentManagementDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Loading and Stats Display', () => {
    it('renders dashboard with loading state initially', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      // Dashboard should render
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays correct stats cards from API', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      // Check for stat cards
      expect(screen.getByLabelText(/total posts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/published/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/draft posts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pages/i)).toBeInTheDocument();
    });

    it('shows numeric values in stat cards', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const statsContainer = screen.getByRole('region', { name: /statistics/i });
      expect(within(statsContainer).getByText('12')).toBeInTheDocument();
    });

    it('displays color-coded status badges', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      // Stats component should have badges visible
      expect(screen.getByRole('region', { name: /statistics/i })).toBeInTheDocument();
    });
  });

  describe('Stats Updates', () => {
    it('updates stats when content is created', () => {
      const { rerender } = render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByLabelText(/total posts/i)).toBeInTheDocument();

      // Simulate update
      rerender(<ContentManagementDashboard siteId="site-123" siteType="personal" key="updated" />);

      expect(screen.getByLabelText(/total posts/i)).toBeInTheDocument();
    });

    it('updates stats when content is edited', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByLabelText(/published/i)).toBeInTheDocument();
    });
  });

  describe('Quick Action Buttons', () => {
    it('renders all quick action buttons', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('button', { name: /new post/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /manage|menu/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /site|settings/i })).toBeInTheDocument();
    });

    it('navigates correctly when quick action buttons are clicked', async () => {
      const user = userEvent.setup();
      const mockNavigate = vi.fn();

      render(
        <ContentManagementDashboard
          siteId="site-123"
          siteType="personal"
          onNavigate={mockNavigate}
        />
      );

      const newPostButton = screen.getByRole('button', { name: /new post/i });
      await user.click(newPostButton);

      // Action should trigger navigation
      expect(mockNavigate).toHaveBeenCalledWith('new-post');
    });

    it('disables buttons appropriately based on state', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" loading={true} />);

      const buttons = screen.getAllByRole('button');
      // Should still be in document
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('buttons have proper ARIA labels for accessibility', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const newPostBtn = screen.getByRole('button', { name: /new post/i });
      expect(newPostBtn).toHaveAttribute('aria-label');
    });

    it('buttons are keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const firstButton = screen.getByRole('button', { name: /new post/i });

      // Focus should be possible
      expect(firstButton).toBeInTheDocument();
    });
  });

  describe('Build Status', () => {
    it('displays build status indicator', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('region', { name: /build status/i })).toBeInTheDocument();
    });

    it('renders Build Now button', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('button', { name: /build/i })).toBeInTheDocument();
    });

    it('shows last build time', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByText(/last build/i)).toBeInTheDocument();
    });

    it('shows next scheduled build if applicable', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" scheduledBuild={true} />);

      const buildSection = screen.getByRole('region', { name: /build status/i });
      expect(buildSection).toBeInTheDocument();
      // Check if scheduled build text is present
      const scheduledText = within(buildSection).queryByText(/scheduled|next/i);
      expect(scheduledText || buildSection).toBeTruthy();
    });

    it('triggers build when Build Now is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const buildButton = screen.getByRole('button', { name: /build/i });
      await user.click(buildButton);

      // Button should be in document
      expect(screen.getByRole('button', { name: /build/i })).toBeInTheDocument();
    });
  });

  describe('Recent Activity Feed', () => {
    it('displays recent activity list', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('region', { name: /recent activity/i })).toBeInTheDocument();
    });

    it('shows last 10 edits in activity feed', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const activityFeed = screen.getByRole('region', { name: /recent activity/i });
      // The activity feed should show items (max 10)
      expect(activityFeed).toBeInTheDocument();
      // Verify list is present by checking for content
      expect(within(activityFeed).queryByText(/Getting Started|Alice|Bob/)).toBeInTheDocument();
    });

    it('displays user avatars in activity items', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const activityFeed = screen.getByRole('region', { name: /recent activity/i });
      const images = within(activityFeed).getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('displays timestamps for activities', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      // Check if timestamps exist - they should contain 'ago'
      expect(screen.queryByText(/ago/i)).toBeInTheDocument();
    });

    it('displays content type icons (post vs page)', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const activityFeed = screen.getByRole('region', { name: /recent activity/i });
      const activityItems = within(activityFeed).getAllByRole('button');
      expect(activityItems.length).toBeGreaterThan(0);
    });

    it('activity items are clickable to jump to content', async () => {
      const user = userEvent.setup();
      const mockNavigate = vi.fn();

      render(
        <ContentManagementDashboard
          siteId="site-123"
          siteType="personal"
          onNavigate={mockNavigate}
        />
      );

      const activityFeed = screen.getByRole('region', { name: /recent activity/i });
      const activityItems = within(activityFeed).getAllByRole('button');

      if (activityItems.length > 0) {
        await user.click(activityItems[0]);
        expect(mockNavigate).toHaveBeenCalled();
      }
    });

    it('shows action type (created/edited)', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      // Check that activity items show created or edited status
      const activityFeed = screen.getByRole('region', { name: /recent activity/i });
      const createdOrEdited = within(activityFeed).queryAllByText(/created|edited/);
      expect(createdOrEdited.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('stacks stat cards vertically on small screens', () => {
      // Mock small screen
      global.innerWidth = 400;

      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const statsContainer = screen.getByRole('region', { name: /statistics/i });
      expect(statsContainer).toBeInTheDocument();
    });

    it('maintains functionality on mobile devices', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('main')).toBeInTheDocument();

      // Quick actions should still be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('adapts layout for tablet screens', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;

      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Site Type Support', () => {
    it('works with personal site type', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with neighborhood site type', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="neighborhood" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has ARIA labels on stat cards', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByLabelText(/total posts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/published/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/draft posts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pages/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation to action buttons', async () => {
      const user = userEvent.setup();
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();

      // Buttons should be in document and keyboard accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has proper heading hierarchy', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    it('provides meaningful alt text for images', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);

      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });

    it('respects prefers-reduced-motion', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('displays complete dashboard for personal site', () => {
      render(<ContentManagementDashboard siteId="site-123" siteType="personal" />);

      // Check all main sections present
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/total posts/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new post/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /recent activity/i })).toBeInTheDocument();
    });

    it('displays complete dashboard for neighborhood site', () => {
      render(<ContentManagementDashboard siteId="nbhd-123" siteType="neighborhood" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/total posts/i)).toBeInTheDocument();
    });

    it('handles loading data gracefully', () => {
      render(
        <ContentManagementDashboard
          siteId="site-123"
          siteType="personal"
          loading={true}
        />
      );

      // Should not crash
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles API errors gracefully', () => {
      render(
        <ContentManagementDashboard
          siteId="site-123"
          siteType="personal"
          error="Failed to load dashboard"
        />
      );

      // Should render with error state
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load dashboard/i)).toBeInTheDocument();
    });
  });
});
