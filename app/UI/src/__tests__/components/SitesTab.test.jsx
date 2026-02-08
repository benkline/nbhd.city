import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SitesTab } from '../../components/SitesTab';

// Mock SiteManagementDashboard
vi.mock('../../components/SiteBuilder/SiteManagementDashboard', () => ({
  SiteManagementDashboard: ({ site_type, nbhd_id }) => (
    <div data-testid="site-management-dashboard">
      <p>Site Type: {site_type}</p>
      <p>Neighborhood ID: {nbhd_id}</p>
    </div>
  )
}));

describe('SitesTab', () => {
  describe('Rendering', () => {
    // Renders SiteManagementDashboard with correct props
    it('renders SiteManagementDashboard component', () => {
      render(<SitesTab nbhdId="nbhd-123" />);

      expect(screen.getByTestId('site-management-dashboard')).toBeInTheDocument();
    });

    it('passes site_type="project" prop', () => {
      render(<SitesTab nbhdId="nbhd-123" />);

      expect(screen.getByText('Site Type: project')).toBeInTheDocument();
    });

    it('passes nbhd_id prop', () => {
      render(<SitesTab nbhdId="nbhd-123" />);

      expect(screen.getByText('Neighborhood ID: nbhd-123')).toBeInTheDocument();
    });
  });

  describe('Prop Updates', () => {
    it('updates when nbhd_id changes', () => {
      const { rerender } = render(<SitesTab nbhdId="nbhd-123" />);

      expect(screen.getByText('Neighborhood ID: nbhd-123')).toBeInTheDocument();

      rerender(<SitesTab nbhdId="nbhd-456" />);

      expect(screen.getByText('Neighborhood ID: nbhd-456')).toBeInTheDocument();
    });
  });
});
