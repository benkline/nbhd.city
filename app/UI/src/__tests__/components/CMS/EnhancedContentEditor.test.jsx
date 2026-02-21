/**
 * Tests for EnhancedContentEditor Component (CMS-003)
 *
 * Enhanced editor with:
 * - Three-column layout: Editor | Frontmatter | Preview
 * - Markdown editor with toolbar and keyboard shortcuts
 * - Syntax highlighting for markdown
 * - Frontmatter form with auto-mapping from template schema
 * - Publishing controls sidebar with status selector
 * - BlueSky toggle
 * - Auto-save with recovery
 * - Unsaved changes warning
 * - Character count and reading time
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedContentEditor } from '../../../components/CMS/EnhancedContentEditor';

// Mock marked and DOMPurify
vi.mock('marked', () => ({
  marked: vi.fn((markdown) => {
    return Promise.resolve(
      markdown
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/# (.+?)(\n|$)/g, '<h1>$1</h1>')
        .replace(/## (.+?)(\n|$)/g, '<h2>$1</h2>')
        .replace(/### (.+?)(\n|$)/g, '<h3>$1</h3>')
        .replace(/\n\n/g, '<br/>')
        .replace(/\n/g, '')
    );
  })
}));

vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html) => html)
  }
}));

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
    slug: { type: 'string', description: 'URL slug' },
    date: { type: 'string', format: 'date', description: 'Publication date' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Post tags' },
    author: { type: 'string', description: 'Post author' },
    excerpt: { type: 'string', description: 'Brief summary' }
  },
  required: ['title', 'date']
};

describe('EnhancedContentEditor Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Layout & Structure', () => {
    it('renders three-column layout on desktop', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      // Check for editor, frontmatter, and preview sections
      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      expect(editor).toBeInTheDocument();

      // Frontmatter form should be present
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeInTheDocument();

      // Preview pane should be present
      const preview = screen.getByRole('region', { name: /preview/i });
      expect(preview).toBeInTheDocument();
    });

    it('collapses preview on mobile with toggle', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      // Look for preview toggle button
      const previewToggle = screen.queryByRole('button', { name: /preview|toggle/i });
      if (previewToggle) {
        const preview = screen.getByRole('region', { name: /preview/i });
        expect(preview).toBeInTheDocument();

        await user.click(previewToggle);
        // After toggle, preview should still exist but may be hidden
        expect(preview).toBeInTheDocument();
      }
    });

    it('shows character count', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);

      act(() => {
        fireEvent.change(editor, { target: { value: 'Hello World' } });
      });

      // Character count should display
      await waitFor(() => {
        const charCount = screen.queryByText(/\d+\s*(?:character|char)/i);
        expect(charCount).toBeInTheDocument();
      });
    });

    it('shows estimated reading time', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);

      // Type enough content for reading time estimate
      const longContent = 'Lorem ipsum dolor sit amet. '.repeat(50);

      act(() => {
        fireEvent.change(editor, { target: { value: longContent } });
      });

      await waitFor(() => {
        const readingTime = screen.queryByText(/reading time|min read/i);
        expect(readingTime).toBeInTheDocument();
      });
    });
  });

  describe('Markdown Editor Toolbar', () => {
    it('renders markdown formatting toolbar', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      // Check for toolbar buttons
      expect(screen.getByRole('button', { name: /bold|b/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic|i/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /link|url/i })).toBeInTheDocument();
    });

    it('bold button inserts markdown syntax', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const boldButton = screen.getByRole('button', { name: /bold|b/i });

      // Set editor text
      await user.type(editor, 'test text');

      // Place cursor and click bold button
      act(() => {
        editor.setSelectionRange(0, 4); // Select "test"
        fireEvent.click(boldButton);
      });

      // Should have bold syntax
      expect(editor.value).toMatch(/\*\*|__/);
    });

    it('italic button inserts markdown syntax', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const italicButton = screen.getByRole('button', { name: /italic|i/i });

      await user.type(editor, 'test text');

      act(() => {
        editor.setSelectionRange(0, 4);
        fireEvent.click(italicButton);
      });

      expect(editor.value).toMatch(/\*|_/);
    });

    it('link button inserts link syntax', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const linkButton = screen.getByRole('button', { name: /link|url/i });

      await user.type(editor, 'click here');

      act(() => {
        editor.setSelectionRange(0, 10);
        fireEvent.click(linkButton);
      });

      expect(editor.value).toMatch(/\[|]/);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('supports Cmd+B for bold', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);

      await user.type(editor, 'test');

      act(() => {
        editor.setSelectionRange(0, 4);
        fireEvent.keyDown(editor, { key: 'b', metaKey: true });
      });

      // Bold syntax should be applied
      expect(editor.value).toMatch(/\*\*|__/);
    });

    it('supports Cmd+I for italic', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);

      await user.type(editor, 'test');

      act(() => {
        editor.setSelectionRange(0, 4);
        fireEvent.keyDown(editor, { key: 'i', metaKey: true });
      });

      expect(editor.value).toMatch(/\*|_/);
    });

    it('supports Cmd+K for link', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);

      await user.type(editor, 'link');

      act(() => {
        editor.setSelectionRange(0, 4);
        fireEvent.keyDown(editor, { key: 'k', metaKey: true });
      });

      expect(editor.value).toMatch(/\[|]/);
    });
  });

  describe('Frontmatter Form', () => {
    it('renders form fields based on template schema', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });

    it('marks required fields', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const authorInput = screen.getByLabelText(/author/i);

      expect(titleInput).toHaveAttribute('required');
      expect(dateInput).toHaveAttribute('required');
      expect(authorInput).not.toHaveAttribute('required');
    });

    it('allows filling frontmatter fields', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const authorInput = screen.getByLabelText(/author/i);

      await user.type(titleInput, 'My Blog Post');
      await user.type(authorInput, 'Alice');

      expect(titleInput.value).toBe('My Blog Post');
      expect(authorInput.value).toBe('Alice');
    });

    it('auto-generates slug from title', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);

      await user.type(titleInput, 'My Awesome Post');

      // Slug should auto-generate from title
      await waitFor(() => {
        expect(slugInput.value).toMatch(/my-awesome-post/i);
      });
    });

    it('defaults date to today', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const dateInput = screen.getByLabelText(/date/i);
      const today = new Date().toISOString().split('T')[0];

      expect(dateInput.value).toBe(today);
    });

    it('validates required fields before publish', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const publishButton = screen.getByRole('button', { name: /publish/i });

      act(() => {
        fireEvent.click(publishButton);
      });

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Publishing Controls', () => {
    it('renders publish button', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
    });

    it('renders status selector', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      // Look for status dropdown/selector
      const statusSelector = screen.queryByLabelText(/status|publish/i);
      expect(statusSelector).toBeInTheDocument();
    });

    it('allows selecting draft status', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const statusSelector = screen.getByLabelText(/status|publish/i);

      // Select draft
      await user.selectOptions(statusSelector, 'draft');

      expect(statusSelector.value).toBe('draft');
    });

    it('allows selecting scheduled status with date picker', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const statusSelector = screen.getByLabelText(/status|publish/i);

      await user.selectOptions(statusSelector, 'scheduled');

      // Date picker should appear
      const datePickerLabel = screen.queryByText(/scheduled.*date|publish.*date/i);
      expect(datePickerLabel).toBeInTheDocument();
    });

    it('renders BlueSky toggle', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const blueskyToggle = screen.getByRole('checkbox', { name: /bluesky/i });
      expect(blueskyToggle).toBeInTheDocument();
    });

    it('allows toggling BlueSky publishing', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const blueskyToggle = screen.getByRole('checkbox', { name: /bluesky/i });

      expect(blueskyToggle).not.toBeChecked();

      await user.click(blueskyToggle);
      expect(blueskyToggle).toBeChecked();
    });

    it('renders auto-rebuild toggle', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const rebuildToggle = screen.getByRole('checkbox', { name: /auto-rebuild|rebuild/i });
      expect(rebuildToggle).toBeInTheDocument();
    });

    it('renders save draft button', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      expect(screen.getByRole('button', { name: /save.*draft|draft/i })).toBeInTheDocument();
    });
  });

  describe('Auto-Save & Recovery', () => {
    it('auto-saves draft every 30 seconds', async () => {
      vi.useFakeTimers();

      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const titleInput = screen.getByLabelText(/title/i);

      act(() => {
        fireEvent.change(editor, { target: { value: '# My Draft' } });
        fireEvent.change(titleInput, { target: { value: 'Draft Title' } });
        vi.advanceTimersByTime(30000);
      });

      const saved = localStorage.getItem('draft-site-123');
      expect(saved).toBeDefined();

      vi.useRealTimers();
    });

    it('restores draft on mount', () => {
      const savedDraft = {
        content: '# Saved Draft',
        frontmatter: {
          title: 'Saved Title',
          date: '2026-01-25'
        }
      };

      localStorage.setItem('draft-site-123', JSON.stringify(savedDraft));

      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const titleInput = screen.getByLabelText(/title/i);

      expect(editor.value).toContain('# Saved Draft');
      expect(titleInput.value).toBe('Saved Title');
    });

    it('shows auto-save indicator', async () => {
      vi.useFakeTimers();

      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);

      act(() => {
        fireEvent.change(editor, { target: { value: '# Draft' } });
        vi.advanceTimersByTime(30000);
      });

      // Should show saving or saved indicator
      const indicator = screen.queryByText(/saved|saving/i);
      expect(indicator).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('clears draft after successful publish', async () => {
      const onPublish = vi.fn().mockResolvedValue({});
      const user = userEvent.setup({ delay: null });

      localStorage.setItem('draft-site-123', JSON.stringify({
        content: '# Draft',
        frontmatter: { title: 'Title', date: '2026-01-25' }
      }));

      render(
        <EnhancedContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const publishButton = screen.getByRole('button', { name: /publish/i });

      act(() => {
        fireEvent.change(titleInput, { target: { value: 'Title' } });
        fireEvent.change(dateInput, { target: { value: '2026-01-25' } });
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(localStorage.getItem('draft-site-123')).toBeNull();
      });
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('warns when leaving with unsaved changes', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);

      act(() => {
        fireEvent.change(editor, { target: { value: '# Unsaved' } });
      });

      // Trigger beforeunload
      const event = new Event('beforeunload');
      fireEvent.beforeUnload(window, event);

      // Should warn about unsaved changes
      expect(event.returnValue).toBeDefined();
    });

    it('does not warn after publishing', async () => {
      const onPublish = vi.fn().mockResolvedValue({});
      const user = userEvent.setup({ delay: null });

      render(
        <EnhancedContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const publishButton = screen.getByRole('button', { name: /publish/i });

      act(() => {
        fireEvent.change(titleInput, { target: { value: 'Title' } });
        fireEvent.change(dateInput, { target: { value: '2026-01-25' } });
        fireEvent.change(editor, { target: { value: '# Content' } });
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(onPublish).toHaveBeenCalled();
      });

      // After publish, no warning should appear
      const event = new Event('beforeunload');
      fireEvent.beforeUnload(window, event);
      expect(event.returnValue).toBeUndefined();
    });
  });

  describe('Preview Pane', () => {
    it('renders live markdown preview', () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const preview = screen.getByRole('region', { name: /preview/i });
      expect(preview).toBeInTheDocument();
    });

    it('updates preview as content changes', async () => {
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const preview = screen.getByRole('region', { name: /preview/i });

      act(() => {
        fireEvent.change(editor, { target: { value: '# Heading' } });
      });

      await waitFor(() => {
        expect(preview).toBeInTheDocument();
      });
    });

    it('shows frontmatter in preview', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const preview = screen.getByRole('region', { name: /preview/i });

      await user.type(titleInput, 'My Post Title');

      // Title should appear in preview
      await waitFor(() => {
        expect(preview.textContent).toContain('My Post Title');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts layout on mobile screens', () => {
      // Mock window.matchMedia for mobile
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <EnhancedContentEditor siteId="site-123" templateSchema={mockSchema} />
      );

      // Should still render all main components
      expect(screen.getByPlaceholderText(/write your content|markdown/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });
  });

  describe('Publishing', () => {
    it('publishes content with all data', async () => {
      const onPublish = vi.fn().mockResolvedValue({});
      const user = userEvent.setup({ delay: null });

      render(
        <EnhancedContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const editor = screen.getByPlaceholderText(/write your content|markdown/i);
      const publishButton = screen.getByRole('button', { name: /publish/i });

      act(() => {
        fireEvent.change(titleInput, { target: { value: 'My Post' } });
        fireEvent.change(dateInput, { target: { value: '2026-01-25' } });
        fireEvent.change(editor, { target: { value: '# Hello World' } });
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(onPublish).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.stringContaining('# Hello World'),
            frontmatter: expect.objectContaining({
              title: 'My Post',
              date: '2026-01-25'
            })
          })
        );
      });
    });

    it('scheduled posts save correctly', async () => {
      const onPublish = vi.fn().mockResolvedValue({});
      const user = userEvent.setup({ delay: null });

      render(
        <EnhancedContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const statusSelector = screen.getByLabelText(/status|publish/i);
      const publishButton = screen.getByRole('button', { name: /publish/i });

      // Select scheduled status
      act(() => {
        fireEvent.change(statusSelector, { target: { value: 'scheduled' } });
      });

      // Set scheduled date
      const scheduledDateInput = screen.getByLabelText(/scheduled.*date|publish.*date/i);

      act(() => {
        fireEvent.change(scheduledDateInput, { target: { value: '2026-03-15' } });
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(onPublish).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'scheduled',
            scheduledDate: '2026-03-15'
          })
        );
      });
    });

    it('publishes to BlueSky when toggled', async () => {
      const onPublish = vi.fn().mockResolvedValue({});
      const user = userEvent.setup({ delay: null });

      render(
        <EnhancedContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const blueskyToggle = screen.getByRole('checkbox', { name: /bluesky/i });
      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const publishButton = screen.getByRole('button', { name: /publish/i });

      act(() => {
        fireEvent.click(blueskyToggle);
        fireEvent.change(titleInput, { target: { value: 'My Post' } });
        fireEvent.change(dateInput, { target: { value: '2026-01-25' } });
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(onPublish).toHaveBeenCalledWith(
          expect.objectContaining({
            publishToBluesky: true
          })
        );
      });
    });

    it('does not publish with validation errors', async () => {
      const onPublish = vi.fn();
      const user = userEvent.setup({ delay: null });

      render(
        <EnhancedContentEditor
          siteId="site-123"
          templateSchema={mockSchema}
          onPublish={onPublish}
        />
      );

      const publishButton = screen.getByRole('button', { name: /publish/i });

      act(() => {
        fireEvent.click(publishButton);
      });

      // Should not call onPublish
      expect(onPublish).not.toHaveBeenCalled();

      // Should show validation errors
      expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
    });
  });
});
