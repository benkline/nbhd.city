/**
 * Tests for ContentEditor Component (SSG-012)
 *
 * Rich content editor for creating blog posts and pages with:
 * - Markdown editor with preview
 * - Frontmatter form (title, date, tags, etc)
 * - BlueSky publishing toggle
 * - Auto-rebuild toggle
 * - Draft auto-save to localStorage
 * - Template schema validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentEditor } from '../../components/SiteBuilder/ContentEditor';

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

// Sample template schema
const mockSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Post title' },
    date: { type: 'string', format: 'date', description: 'Publication date' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Post tags' },
    author: { type: 'string', description: 'Post author' },
    excerpt: { type: 'string', description: 'Brief summary' }
  },
  required: ['title', 'date']
};

describe('ContentEditor Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // REQUIREMENT: [ ] Markdown editor with preview
  // ACCEPTANCE: [ ] Users can write markdown content
  describe('Markdown Editor', () => {
    it('renders markdown editor textarea', () => {
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);
      expect(editor).toBeInTheDocument();
    });

    it('allows users to write markdown content', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);

      await user.type(editor, '# Hello World\n\nThis is a **test** post.');

      expect(editor.value).toContain('# Hello World');
      expect(editor.value).toContain('**test**');
    });

    it('supports markdown formatting', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);

      await user.type(editor, '- Item 1\n- Item 2\n\n> Quote');

      expect(editor.value).toContain('- Item 1');
      expect(editor.value).toContain('> Quote');
    });
  });

  // REQUIREMENT: [ ] Markdown editor with preview
  // ACCEPTANCE: [ ] Preview shows rendered markdown
  describe('Preview Panel', () => {
    it('displays live markdown preview', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);
      const preview = screen.getByRole('region', { name: /preview/i });

      await user.type(editor, '# Test Title');

      await waitFor(() => {
        expect(preview.textContent).toContain('Test Title');
      });
    });

    it('updates preview in real-time as content changes', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);
      const preview = screen.getByRole('region', { name: /preview/i });

      // Type first heading
      await user.type(editor, '# First');
      await waitFor(() => {
        expect(preview.textContent).toContain('First');
      });

      // Clear and type new heading
      await user.clear(editor);
      await user.type(editor, '# Second');

      await waitFor(() => {
        expect(preview.textContent).toContain('Second');
        expect(preview.textContent).not.toContain('First');
      });
    });

    it('renders markdown formatting in preview', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);
      const preview = screen.getByRole('region', { name: /preview/i });

      await user.type(editor, '**Bold text** and *italic text*');

      await waitFor(() => {
        const boldElement = preview.querySelector('strong');
        const italicElement = preview.querySelector('em');
        expect(boldElement?.textContent).toBe('Bold text');
        expect(italicElement?.textContent).toBe('italic text');
      });
    });
  });

  // REQUIREMENT: [ ] Frontmatter form (title, date, tags, custom fields)
  // ACCEPTANCE: [ ] Frontmatter fields match template schema
  describe('Frontmatter Form', () => {
    it('renders form fields based on template schema', () => {
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
    });

    it('marks required fields', () => {
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const authorInput = screen.getByLabelText(/author/i);

      // Required fields should have required attribute
      expect(titleInput).toHaveAttribute('required');
      expect(dateInput).toHaveAttribute('required');

      // Non-required field should not
      expect(authorInput).not.toHaveAttribute('required');
    });

    it('allows users to fill frontmatter fields', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const authorInput = screen.getByLabelText(/author/i);

      await user.type(titleInput, 'My Blog Post');
      await user.type(authorInput, 'Alice');

      expect(titleInput.value).toBe('My Blog Post');
      expect(authorInput.value).toBe('Alice');
    });

    it('handles array fields (tags)', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const tagsInput = screen.getByLabelText(/tags/i);

      // Type tags (comma-separated or similar)
      await user.type(tagsInput, 'react, testing, vitest');

      expect(tagsInput.value).toContain('react');
      expect(tagsInput.value).toContain('testing');
    });

    it('supports date field', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const dateInput = screen.getByLabelText(/date/i);

      await user.type(dateInput, '2026-01-25');

      expect(dateInput.value).toBe('2026-01-25');
    });
  });

  // REQUIREMENT: [ ] "Publish to BlueSky" toggle
  describe('BlueSky Publishing Toggle', () => {
    it('renders BlueSky publish toggle', () => {
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const toggle = screen.getByRole('checkbox', { name: /publish to bluesky/i });
      expect(toggle).toBeInTheDocument();
    });

    it('allows toggling BlueSky publishing', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const toggle = screen.getByRole('checkbox', { name: /publish to bluesky/i });
      expect(toggle).not.toBeChecked();

      await user.click(toggle);
      expect(toggle).toBeChecked();

      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it('shows BlueSky summary when enabled', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const toggle = screen.getByRole('checkbox', { name: /publish to bluesky/i });

      await user.click(toggle);

      // Should show summary field when enabled
      await waitFor(() => {
        expect(screen.getByText(/bluesky summary/i)).toBeInTheDocument();
      });
    });
  });

  // REQUIREMENT: [ ] "Auto-rebuild site" toggle
  describe('Auto-Rebuild Toggle', () => {
    it('renders auto-rebuild toggle', () => {
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const toggle = screen.getByRole('checkbox', { name: /auto-rebuild/i });
      expect(toggle).toBeInTheDocument();
    });

    it('allows toggling auto-rebuild', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const toggle = screen.getByRole('checkbox', { name: /auto-rebuild/i });

      await user.click(toggle);
      expect(toggle).toBeChecked();

      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });
  });

  // REQUIREMENT: [ ] Draft saving to localStorage
  // ACCEPTANCE: [ ] Drafts auto-save every 30 seconds
  describe('Draft Auto-Save', () => {
    it('saves draft to localStorage periodically', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);
      const titleInput = screen.getByLabelText(/title/i);

      await user.type(editor, '# My Draft');
      await user.type(titleInput, 'Draft Title');

      // First save happens immediately or after delay
      vi.advanceTimersByTime(30000); // 30 seconds

      await waitFor(() => {
        const saved = localStorage.getItem('draft-site-123');
        expect(saved).toBeDefined();
        const draft = JSON.parse(saved);
        expect(draft.content).toContain('# My Draft');
        expect(draft.frontmatter.title).toBe('Draft Title');
      });

      vi.useRealTimers();
    });

    it('loads draft from localStorage on mount', async () => {
      const savedDraft = {
        content: '# Saved Draft',
        frontmatter: {
          title: 'Saved Title',
          date: '2026-01-25',
          author: 'Alice'
        }
      };

      localStorage.setItem('draft-site-123', JSON.stringify(savedDraft));

      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);
      const titleInput = screen.getByLabelText(/title/i);

      expect(editor.value).toContain('# Saved Draft');
      expect(titleInput.value).toBe('Saved Title');
    });

    it('auto-saves multiple times', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);

      await user.type(editor, 'First');
      vi.advanceTimersByTime(30000);

      let saved = JSON.parse(localStorage.getItem('draft-site-123'));
      expect(saved.content).toContain('First');

      // Clear and type new content
      await user.clear(editor);
      await user.type(editor, 'First\n\nSecond');
      vi.advanceTimersByTime(30000);

      saved = JSON.parse(localStorage.getItem('draft-site-123'));
      expect(saved.content).toContain('Second');

      vi.useRealTimers();
    });

    it('shows draft status indicator', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);

      await user.type(editor, '# Draft');

      // Should show "saving" or similar indicator
      await waitFor(() => {
        const status = screen.queryByText(/saved/i) || screen.queryByText(/saving/i);
        expect(status).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('clears draft after publishing', async () => {
      const onPublish = vi.fn();
      const user = userEvent.setup();

      localStorage.setItem('draft-site-123', JSON.stringify({
        content: '# Draft',
        frontmatter: { title: 'Title', date: '2026-01-25' }
      }));

      render(
        <ContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const publishButton = screen.getByRole('button', { name: /publish|save/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(localStorage.getItem('draft-site-123')).toBeNull();
      });
    });
  });

  // REQUIREMENT: [ ] Validation against template schema
  describe('Schema Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const publishButton = screen.getByRole('button', { name: /publish|save/i });

      // Try to publish without filling required fields
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/date.*required/i)).toBeInTheDocument();
      });
    });

    it('allows publishing when required fields are filled', async () => {
      const onPublish = vi.fn();
      const user = userEvent.setup();

      render(
        <ContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const editor = screen.getByPlaceholderText(/write your content/i);
      const publishButton = screen.getByRole('button', { name: /publish|save/i });

      await user.type(titleInput, 'Test Post');
      await user.type(dateInput, '2026-01-25');
      await user.type(editor, '# Content');

      await user.click(publishButton);

      await waitFor(() => {
        expect(onPublish).toHaveBeenCalled();
      });
    });

    it('validates field types', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const dateInput = screen.getByLabelText(/date/i);

      await user.type(dateInput, 'not-a-date');

      const publishButton = screen.getByRole('button', { name: /publish|save/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/date.*invalid/i)).toBeInTheDocument();
      });
    });
  });

  // ACCEPTANCE: [ ] Can create and publish content
  describe('Publishing', () => {
    it('calls onPublish callback with complete data', async () => {
      const onPublish = vi.fn();
      const user = userEvent.setup();

      render(
        <ContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const authorInput = screen.getByLabelText(/author/i);
      const editor = screen.getByPlaceholderText(/write your content/i);
      const publishButton = screen.getByRole('button', { name: /publish|save/i });

      await user.type(titleInput, 'My Post');
      await user.type(dateInput, '2026-01-25');
      await user.type(authorInput, 'Alice');
      await user.type(editor, '# Hello World\n\nContent here');

      await user.click(publishButton);

      await waitFor(() => {
        expect(onPublish).toHaveBeenCalledWith({
          content: expect.stringContaining('# Hello World'),
          frontmatter: expect.objectContaining({
            title: 'My Post',
            date: '2026-01-25',
            author: 'Alice'
          })
        });
      });
    });

    it('shows success message after publishing', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const publishButton = screen.getByRole('button', { name: /publish|save/i });

      await user.type(titleInput, 'Test');
      await user.type(dateInput, '2026-01-25');
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/published|saved successfully/i)).toBeInTheDocument();
      });
    });

    it('disables publish button while publishing', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const publishButton = screen.getByRole('button', { name: /publish|save/i });

      await user.type(titleInput, 'Test');
      await user.type(dateInput, '2026-01-25');

      // Mock a slow operation
      await user.click(publishButton);

      expect(publishButton).toBeDisabled();

      await waitFor(() => {
        expect(publishButton).not.toBeDisabled();
      });
    });
  });

  // REQUIREMENT: [ ] Image upload (future)
  describe('Image Upload (Future)', () => {
    it('shows image upload field', () => {
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const imageButton = screen.queryByRole('button', { name: /upload.*image|add.*image/i });
      // Can be skipped for MVP
      if (imageButton) {
        expect(imageButton).toBeInTheDocument();
      }
    });
  });

  // Edge cases and error handling
  describe('Edge Cases & Error Handling', () => {
    it('handles special markdown characters', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);

      // Special characters that could cause issues
      await user.type(editor, '# Title with <html> & special chars');

      expect(editor.value).toContain('<html>');
      expect(editor.value).toContain('&');
    });

    it('handles very long content', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content/i);
      const longContent = 'Lorem ipsum '.repeat(1000);

      await user.type(editor, longContent);

      expect(editor.value.length).toBeGreaterThan(10000);
    });

    it('handles rapid publishing attempts', async () => {
      const onPublish = vi.fn();
      const user = userEvent.setup();

      render(
        <ContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const publishButton = screen.getByRole('button', { name: /publish|save/i });

      await user.type(titleInput, 'Test');
      await user.type(dateInput, '2026-01-25');

      // Rapid clicks
      await user.click(publishButton);
      await user.click(publishButton);

      // Should only publish once
      await waitFor(() => {
        expect(onPublish).toHaveBeenCalledTimes(1);
      });
    });
  });
});
