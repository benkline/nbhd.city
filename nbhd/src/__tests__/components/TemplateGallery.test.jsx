import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TemplateGallery } from '../../components/SiteBuilder/TemplateGallery';

// [x] Fetch templates from API
describe('TemplateGallery', () => {
  it('fetches and displays templates from API', async () => {
    render(
      <BrowserRouter>
        <TemplateGallery />
      </BrowserRouter>
    );

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
    });
  });

  // [x] Display template cards with preview images, name, description
  it('displays template cards with preview images, name, and description', async () => {
    render(
      <BrowserRouter>
        <TemplateGallery />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check for template names
      expect(screen.getByText('Blog')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Newsletter')).toBeInTheDocument();

      // Check for descriptions
      expect(screen.getByText('Personal blog with posts and tags')).toBeInTheDocument();
      expect(screen.getByText('Team project showcase with gallery')).toBeInTheDocument();
      expect(screen.getByText('Email newsletter archive')).toBeInTheDocument();

      // Check for preview images
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
      expect(images[0].src).toMatch(/preview/);
    });
  });

  // [x] Show template tags
  it('displays template tags', async () => {
    render(
      <BrowserRouter>
        <TemplateGallery />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('blog')).toBeInTheDocument();
      expect(screen.getByText('content')).toBeInTheDocument();
      expect(screen.getByText('project')).toBeInTheDocument();
      expect(screen.getByText('portfolio')).toBeInTheDocument();
      expect(screen.getByText('newsletter')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
    });
  });

  // [x] "Select template" button to start site configuration
  it('renders select template buttons', async () => {
    render(
      <BrowserRouter>
        <TemplateGallery />
      </BrowserRouter>
    );

    await waitFor(() => {
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      expect(selectButtons.length).toBeGreaterThan(0);
    });
  });

  // [x] Clicking "Select" navigates to config form
  it('navigates to config form when select button clicked', async () => {
    const mockOnSelect = vi.fn();
    render(
      <BrowserRouter>
        <TemplateGallery onSelect={mockOnSelect} />
      </BrowserRouter>
    );

    await waitFor(() => {
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      expect(selectButtons.length).toBeGreaterThan(0);
    });

    const firstSelectButton = screen.getAllByRole('button', { name: /select/i })[0];
    fireEvent.click(firstSelectButton);

    expect(mockOnSelect).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String)
      })
    );
  });

  // [x] Mobile-responsive grid layout
  it('renders responsive grid layout', async () => {
    render(
      <BrowserRouter>
        <TemplateGallery />
      </BrowserRouter>
    );

    await waitFor(() => {
      const gallery = screen.getByTestId('template-gallery');
      expect(gallery).toBeInTheDocument();
      // Gallery should have CSS class for responsive grid
      expect(gallery.className).toMatch(/gallery|grid/i);
    });
  });

  // [x] Error handling for API failures
  it('displays error message when API fails', async () => {
    // Mock fetch to return error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrowserRouter>
        <TemplateGallery />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should show error message
      expect(screen.queryByText(/error|failed/i)).toBeTruthy();
    });
  });

  it('shows loading state while fetching templates', () => {
    render(
      <BrowserRouter>
        <TemplateGallery />
      </BrowserRouter>
    );

    // Initially should show loading indicator
    expect(screen.getByTestId('template-loading') || screen.queryByText(/loading/i)).toBeTruthy();
  });
});
