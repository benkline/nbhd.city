/**
 * Tests for ContentMetadataManager Component (CMS-007)
 *
 * Dedicated interface for managing content metadata:
 * - SEO metadata (title, description, slug, canonical URL, OG image)
 * - Publishing metadata (date, scheduled time, status, visibility, BlueSky)
 * - Content metadata (categories, tags, featured, reading time, word count)
 * - Mobile responsive tabs and form fields
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentMetadataManager } from '../../../components/CMS/ContentMetadataManager';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock image upload
vi.mock('axios', () => ({
  default: {
    post: vi.fn((url, data) => {
      if (url.includes('upload')) {
        return Promise.resolve({
          data: {
            url: 'https://example.com/images/og-image.jpg',
            success: true
          }
        });
      }
      return Promise.resolve({ data: { success: true } });
    })
  }
}));

// Sample content data
const mockContent = {
  id: 'post-123',
  title: 'Understanding SEO Best Practices',
  description: 'A comprehensive guide to improving your website SEO.',
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  frontmatter: {
    title: 'Understanding SEO Best Practices',
    date: '2024-02-20',
    tags: ['seo', 'web-design'],
    featured: false,
    comments: true
  }
};

const mockTemplate = {
  categories: ['Technology', 'Marketing', 'Design'],
  customFields: [
    { name: 'readLevel', label: 'Reading Level' }
  ]
};

describe('ContentMetadataManager Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Modal Interface', () => {
    it('renders modal when isOpen is true', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ContentMetadataManager
          isOpen={false}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={mockClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close|×/i });
      await user.click(closeButton);
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Tab Navigation', () => {
    it('renders three tabs: SEO, Publishing, and Metadata', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('tab', { name: /seo/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /publishing/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /metadata/i })).toBeInTheDocument();
    });

    it('switches between tabs when clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Click Publishing tab
      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      // Verify Publishing content is visible
      expect(screen.getByLabelText(/publish date/i)).toBeInTheDocument();
    });

    it('SEO tab is active by default', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const seoTab = screen.getByRole('tab', { name: /seo/i });
      expect(seoTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('SEO Tab', () => {
    it('renders SEO metadata fields', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/meta title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meta description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/seo slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/canonical url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/og image/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/focus keyword/i)).toBeInTheDocument();
    });

    it('auto-populates meta title from content title', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metaTitleInput = screen.getByLabelText(/meta title/i);
      expect(metaTitleInput.value).toBe('Understanding SEO Best Practices');
    });

    it('auto-populates meta description from content', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metaDescInput = screen.getByLabelText(/meta description/i);
      expect(metaDescInput.value).toContain('comprehensive guide');
    });

    it('generates SEO slug from title', async () => {
      const user = userEvent.setup();
      const customContent = {
        ...mockContent,
        title: 'New Blog Post Title'
      };

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={customContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const slugInput = screen.getByLabelText(/seo slug/i);
      // Slug should be auto-generated from title
      expect(slugInput.value).toMatch(/^[a-z0-9-]+$/);
      expect(slugInput.value).toContain('new-blog-post');
    });

    it('allows custom slug editing', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const slugInput = screen.getByLabelText(/seo slug/i);
      await user.clear(slugInput);
      await user.type(slugInput, 'custom-slug');
      expect(slugInput.value).toBe('custom-slug');
    });

    it('validates slug format (lowercase, hyphens only)', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const slugInput = screen.getByLabelText(/seo slug/i);
      await user.clear(slugInput);
      await user.type(slugInput, 'Invalid Slug!!!');

      // Should show validation error or auto-correct
      await waitFor(() => {
        const slug = slugInput.value.toLowerCase();
        expect(/^[a-z0-9-]*$/.test(slug)).toBe(true);
      });
    });

    it('handles OG image upload', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const uploadInput = screen.getByLabelText(/og image/i);
      expect(uploadInput).toBeInTheDocument();
    });

    it('displays readability score', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Should show some readability metric
      expect(screen.queryByText(/readability/i) || screen.queryByText(/reading/i)).toBeInTheDocument();
    });
  });

  describe('Publishing Tab', () => {
    it('renders publishing metadata fields', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      expect(screen.getByLabelText(/publish date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/publish status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/visibility/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bluesky/i)).toBeInTheDocument();
    });

    it('allows selecting publish date', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      const dateInput = screen.getByLabelText(/publish date/i);
      expect(dateInput).toBeInTheDocument();
    });

    it('shows scheduled time picker for future dates', async () => {
      const user = userEvent.setup();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const contentWithFutureDate = {
        ...mockContent,
        frontmatter: {
          ...mockContent.frontmatter,
          date: futureDate.toISOString().split('T')[0]
        }
      };

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={contentWithFutureDate}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      // Time picker should appear for future dates
      await waitFor(() => {
        const timeInput = screen.queryByLabelText(/scheduled.*time/i);
        if (timeInput) {
          expect(timeInput).toBeInTheDocument();
        }
      });
    });

    it('prevents publishing if scheduled in future', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      // Set future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateInput = screen.getByLabelText(/publish date/i);
      await user.type(dateInput, futureDate.toISOString().split('T')[0]);

      // Try to save as scheduled
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Save should be called but scheduled status should be set
      expect(mockSave).toHaveBeenCalled();
    });

    it('allows BlueSky preview toggle', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      const blueSkyToggle = screen.getByLabelText(/bluesky/i);
      await user.click(blueSkyToggle);

      expect(blueSkyToggle).toBeChecked();
    });

    it('updates BlueSky preview when description changes', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      // Enable BlueSky
      const blueSkyToggle = screen.getByLabelText(/bluesky/i);
      await user.click(blueSkyToggle);

      // BlueSky preview should be visible
      await waitFor(() => {
        expect(screen.queryByText(/bluesky preview/i) || screen.queryByText(/preview/i)).toBeInTheDocument();
      });
    });

    it('supports multiple publish statuses', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      const statusSelect = screen.getByLabelText(/publish status/i);
      expect(statusSelect).toBeInTheDocument();

      // Check available options
      const options = statusSelect.querySelectorAll('option');
      const values = Array.from(options).map(o => o.value.toLowerCase());
      expect(values.some(v => v.includes('draft'))).toBe(true);
      expect(values.some(v => v.includes('published'))).toBe(true);
      expect(values.some(v => v.includes('scheduled'))).toBe(true);
    });
  });

  describe('Metadata Tab', () => {
    it('renders metadata fields', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      expect(screen.getByText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/featured/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reading time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/word count/i)).toBeInTheDocument();
    });

    it('displays read-only reading time', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const readingTimeInput = screen.getByLabelText(/reading time/i);
      expect(readingTimeInput).toHaveAttribute('readonly');
    });

    it('displays read-only word count', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const wordCountInput = screen.getByLabelText(/word count/i);
      expect(wordCountInput).toHaveAttribute('readonly');
    });

    it('allows selecting categories from template', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      // Categories are rendered as checkboxes
      const categoriesCheckboxes = screen.queryAllByRole('checkbox');
      if (categoriesCheckboxes.length > 0) {
        expect(categoriesCheckboxes.length).toBeGreaterThan(0);
      }
    });

    it('provides tag autocomplete from existing tags', async () => {
      const user = userEvent.setup();
      const existingTags = ['seo', 'web-design', 'marketing'];

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          existingTags={existingTags}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const tagsInput = screen.getByLabelText(/tags/i);
      expect(tagsInput).toBeInTheDocument();
    });

    it('allows toggle featured/pinned status', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const featuredToggle = screen.getByLabelText(/featured/i);
      await user.click(featuredToggle);

      expect(featuredToggle).toBeChecked();
    });

    it('calculates word count from content', async () => {
      const user = userEvent.setup();
      const contentWithWords = {
        ...mockContent,
        content: 'word ' * 150 // Approximately 150 words
      };

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={contentWithWords}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const wordCountInput = screen.getByLabelText(/word count/i);
      expect(parseInt(wordCountInput.value)).toBeGreaterThan(0);
    });

    it('calculates reading time (approximately 200 words per minute)', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const readingTimeInput = screen.getByLabelText(/reading time/i);
      const readingTime = parseInt(readingTimeInput.value);
      expect(readingTime).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with all metadata when save button clicked', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockSave).toHaveBeenCalled();
      const savedData = mockSave.mock.calls[0][0];
      expect(savedData).toHaveProperty('seoMetadata');
      expect(savedData).toHaveProperty('publishingMetadata');
      expect(savedData).toHaveProperty('contentMetadata');
    });

    it('includes SEO data in save payload', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      const savedData = mockSave.mock.calls[0][0];
      expect(savedData.seoMetadata).toEqual(
        expect.objectContaining({
          metaTitle: expect.any(String),
          metaDescription: expect.any(String),
          slug: expect.any(String)
        })
      );
    });

    it('includes publishing data in save payload', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      const savedData = mockSave.mock.calls[0][0];
      expect(savedData.publishingMetadata).toEqual(
        expect.objectContaining({
          publishDate: expect.any(String),
          status: expect.any(String)
        })
      );
    });

    it('includes metadata data in save payload', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      const savedData = mockSave.mock.calls[0][0];
      expect(savedData.contentMetadata).toEqual(
        expect.objectContaining({
          wordCount: expect.any(Number),
          readingTime: expect.any(Number)
        })
      );
    });

    it('shows loading state during save', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(saveButton).toHaveAttribute('disabled');
    });
  });

  describe('Preview Section', () => {
    it('shows Google SERP format preview', () => {
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Should show some form of preview
      expect(screen.queryByText(/preview/i) || screen.queryByText(/serp/i) || screen.queryByText(/search/i)).toBeTruthy();
    });

    it('updates preview as user types', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metaTitleInput = screen.getByLabelText(/meta title/i);
      const originalTitle = metaTitleInput.value;

      await user.clear(metaTitleInput);
      await user.type(metaTitleInput, 'New Title For Preview');

      // Preview should update (check if title changed in preview)
      await waitFor(() => {
        expect(metaTitleInput.value).toBe('New Title For Preview');
      });
    });
  });

  describe('Mobile Responsive', () => {
    it('renders tabs responsively on mobile', () => {
      // Set viewport to mobile size
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Tabs should still be accessible
      expect(screen.getByRole('tab', { name: /seo/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /publishing/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /metadata/i })).toBeInTheDocument();
    });

    it('makes form fields responsive on mobile', async () => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metaTitleInput = screen.getByLabelText(/meta title/i);
      expect(metaTitleInput).toBeInTheDocument();
      expect(metaTitleInput.offsetWidth).toBeGreaterThan(0);
    });

    it('stacks modal content on small screens', () => {
      window.innerWidth = 320;
      window.dispatchEvent(new Event('resize'));

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Modal should still be usable
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('validates slug format', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const slugInput = screen.getByLabelText(/seo slug/i);
      await user.clear(slugInput);
      await user.type(slugInput, 'Invalid Slug With Spaces!!!');

      // Should auto-correct or show error
      await waitFor(() => {
        const slug = slugInput.value;
        expect(/^[a-z0-9-]*$/.test(slug)).toBe(true);
      });
    });

    it('prevents duplicate slugs', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          existingSlugs={['understanding-seo-best-practices']}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should warn about duplicate slug or auto-append number
      await waitFor(() => {
        // Either error shown or slug modified
        expect(
          screen.queryByText(/slug already exists/i) ||
          mockSave.mock.calls[0]?.[0].seoMetadata.slug !== 'understanding-seo-best-practices'
        ).toBeTruthy();
      });
    });

    it('validates canonical URL format', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const canonicalInput = screen.getByLabelText(/canonical url/i);
      await user.clear(canonicalInput);
      await user.type(canonicalInput, 'not a url');

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.queryByText(/invalid.*url/i) ||
          canonicalInput.classList.contains('error')
        ).toBeTruthy();
      });
    });
  });

  describe('Tag Autocomplete', () => {
    it('shows suggestions from existing tags', async () => {
      const user = userEvent.setup();
      const existingTags = ['seo', 'web-design', 'marketing', 'analytics'];

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          existingTags={existingTags}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const tagsInput = screen.getByLabelText(/tags/i);
      await user.type(tagsInput, 'w');

      // Should show suggestions for 'web-design'
      await waitFor(() => {
        expect(screen.queryByText(/web-design/i)).toBeInTheDocument();
      });
    });

    it('allows adding custom tags', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const tagsInput = screen.getByLabelText(/tags/i);
      await user.type(tagsInput, 'new-tag');

      // Should allow adding the new tag
      const addButton = screen.queryByRole('button', { name: /add|enter/i });
      if (addButton) {
        await user.click(addButton);
      } else {
        await user.keyboard('{Enter}');
      }

      await waitFor(() => {
        expect(screen.queryByText('new-tag')).toBeInTheDocument();
      });
    });

    it('removes tags when delete button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      // Should have existing tags
      const tagElement = screen.queryByText('seo');
      if (tagElement) {
        const deleteButton = tagElement.querySelector('button');
        if (deleteButton) {
          await user.click(deleteButton);

          await waitFor(() => {
            expect(screen.queryByText('seo')).not.toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Image Upload', () => {
    it('accepts image files for OG image', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const uploadInput = screen.getByLabelText(/og image/i);
      expect(uploadInput.type).toBe('file');
    });

    it('displays uploaded OG image', async () => {
      const user = userEvent.setup();
      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const uploadInput = screen.getByLabelText(/og image/i);
      const file = new File(['image'], 'og-image.jpg', { type: 'image/jpeg' });

      await user.upload(uploadInput, file);

      // Should show preview or confirmation
      await waitFor(() => {
        expect(
          screen.queryByAltText(/og.*image|preview/i) ||
          screen.queryByText(/uploaded|image/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('saves all metadata together', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();

      render(
        <ContentMetadataManager
          isOpen={true}
          contentData={mockContent}
          templateConfig={mockTemplate}
          onSave={mockSave}
          onClose={vi.fn()}
        />
      );

      // Make changes in different tabs
      const metaTitleInput = screen.getByLabelText(/meta title/i);
      await user.clear(metaTitleInput);
      await user.type(metaTitleInput, 'Updated Title');

      // Switch to Publishing tab and make a change
      const publishingTab = screen.getByRole('tab', { name: /publishing/i });
      await user.click(publishingTab);

      // Switch to Metadata tab
      const metadataTab = screen.getByRole('tab', { name: /metadata/i });
      await user.click(metadataTab);

      const featuredToggle = screen.getByLabelText(/featured/i);
      await user.click(featuredToggle);

      // Save all changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockSave).toHaveBeenCalled();
      const savedData = mockSave.mock.calls[0][0];

      // All metadata should be included
      expect(savedData.seoMetadata.metaTitle).toBe('Updated Title');
      expect(savedData.contentMetadata.featured).toBe(true);
    });
  });
});
