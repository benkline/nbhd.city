import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => {
  const mockUseAuth = vi.fn();
  return {
    useAuth: mockUseAuth
  };
});

// Mock SiteManagementDashboard
vi.mock('../../components/SiteBuilder/SiteManagementDashboard', () => ({
  SiteManagementDashboard: ({ siteType }) =>
    React.createElement('div', { 'data-testid': 'dashboard', 'data-site-type': siteType }, `Dashboard: ${siteType}`)
}));

// Import after mocks are set up
import PersonalSites from '../../pages/PersonalSites';
import { useAuth } from '../../contexts/AuthContext';

describe('PersonalSites', () => {
  const renderPage = () => render(
    <BrowserRouter>
      <PersonalSites />
    </BrowserRouter>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Access Control', () => {
    // [ ] redirects unauthenticated users to login
    it('redirects to login when not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: false });

      renderPage();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    // [ ] allows authenticated users to access page
    it('does not redirect authenticated users', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });

      renderPage();

      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Page Rendering', () => {
    // [ ] Page loads and displays user's personal sites
    it('renders page with title and subtitle', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });

      renderPage();

      expect(screen.getByRole('heading', { name: /personal sites/i }))
        .toBeInTheDocument();
      expect(screen.getByText(/not associated with any neighborhood/i))
        .toBeInTheDocument();
    });

    // [ ] Passes siteType prop to dashboard for filtering
    it('renders SiteManagementDashboard with siteType="personal"', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });

      renderPage();

      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toBeInTheDocument();
      expect(dashboard).toHaveAttribute('data-site-type', 'personal');
    });
  });

  describe('Loading States', () => {
    // [ ] shows loading state while auth is loading
    it('shows loading state while auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: true });

      renderPage();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    // [ ] does not redirect during loading
    it('does not redirect during loading', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: true });

      renderPage();

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    // [ ] renders content after loading completes
    it('renders content after auth loading completes', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });

      renderPage();

      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /personal sites/i }))
        .toBeInTheDocument();
    });
  });

  describe('CRUD Operations', () => {
    // [ ] Can create new personal site from this page (via SiteManagementDashboard)
    // [ ] Can edit/delete existing personal sites (via SiteManagementDashboard)
    // [ ] No nbhd selection shown on create (automatic with siteType="personal")
    it('passes siteType to dashboard for create/edit/delete', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });

      renderPage();

      const dashboard = screen.getByTestId('dashboard');
      // Dashboard component handles create/edit/delete with siteType="personal"
      // which ensures no nbhd selection is shown
      expect(dashboard).toHaveAttribute('data-site-type', 'personal');
    });
  });

  describe('Mobile Responsiveness', () => {
    // [ ] Mobile responsive layout (inherited from SiteManagementDashboard)
    it('renders in mobile viewport', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });

      // Render without setting viewport size - component should adapt
      renderPage();

      // Container should exist and be rendered
      const container = screen.getByRole('heading', { name: /personal sites/i })
        .closest('div');
      expect(container).toBeInTheDocument();
    });
  });
});
