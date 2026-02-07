import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  SiteManagementDashboard: ({ siteType, nbhdId }) =>
    React.createElement('div', {
      'data-testid': 'dashboard',
      'data-site-type': siteType,
      'data-nbhd-id': nbhdId || 'none'
    }, `Dashboard: ${siteType}, Nbhd: ${nbhdId || 'all'}`)
}));

// Mock ProjectSiteSelector
vi.mock('../../components/ProjectSiteSelector', () => ({
  ProjectSiteSelector: ({ selectedNbhdId, onNbhdChange }) =>
    React.createElement('div', { 'data-testid': 'selector' },
      React.createElement('select', {
        'data-testid': 'nbhd-filter',
        value: selectedNbhdId,
        onChange: (e) => onNbhdChange(e.target.value)
      },
        React.createElement('option', { value: 'all' }, 'All'),
        React.createElement('option', { value: 'nbhd-1' }, 'Nbhd 1')
      )
    )
}));

import ProjectSites from '../../pages/ProjectSites';
import { useAuth } from '../../contexts/AuthContext';

describe('ProjectSites', () => {
  const renderPage = () => render(
    <BrowserRouter>
      <ProjectSites />
    </BrowserRouter>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Access Control', () => {
    it('redirects to login when not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: false });
      renderPage();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('does not redirect authenticated users', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
      renderPage();
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Page Rendering', () => {
    it('renders page with title and subtitle', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
      renderPage();
      expect(screen.getByRole('heading', { name: /project sites/i })).toBeInTheDocument();
      expect(screen.getByText(/neighborhood owners can edit/i)).toBeInTheDocument();
    });

    it('renders SiteManagementDashboard with siteType="project"', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
      renderPage();
      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toBeInTheDocument();
      expect(dashboard).toHaveAttribute('data-site-type', 'project');
    });

    it('renders ProjectSiteSelector component', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
      renderPage();
      expect(screen.getByTestId('selector')).toBeInTheDocument();
    });
  });

  describe('Neighborhood Filtering', () => {
    it('starts with "all" neighborhoods selected', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
      renderPage();
      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toHaveAttribute('data-nbhd-id', 'none');
    });

    it('filters sites when neighborhood is selected', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
      renderPage();
      const select = screen.getByTestId('nbhd-filter');
      fireEvent.change(select, { target: { value: 'nbhd-1' } });
      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toHaveAttribute('data-nbhd-id', 'nbhd-1');
    });
  });

  describe('Loading States', () => {
    it('shows loading state while auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: true });
      renderPage();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('does not redirect during loading', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: true });
      renderPage();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders in mobile viewport', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
      renderPage();
      const container = screen.getByRole('heading', { name: /project sites/i }).closest('div');
      expect(container).toBeInTheDocument();
    });
  });
});
