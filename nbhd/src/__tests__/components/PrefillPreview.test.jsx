/**
 * Tests for PrefillPreview Component (SSG-014)
 *
 * UI component that shows prefill suggestions with:
 * - Profile data correctly mapped to template fields
 * - Preview showing "field → value" mappings
 * - Users can apply or skip prefilling
 * - Works with BlueSky profile data
 * - Works with previous site data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrefillPreview } from '../../components/SiteBuilder/PrefillPreview';

// Mock axios
vi.mock('axios');
import axios from 'axios';

describe('PrefillPreview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // REQUIREMENT: [ ] Preview UI showing suggested mappings
  describe('Component Rendering', () => {
    it('renders prefill preview component', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/prefill/i)).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Should show loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // REQUIREMENT: [ ] Preview UI showing suggested mappings
  describe('Suggestions Display', () => {
    it('[ ] displays suggestions in table format', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        },
        {
          field: 'about',
          value: 'Software engineer',
          source: 'profile',
          confidence: 0.9
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('author')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });

    it('[ ] shows field names in table', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/template field/i)).toBeInTheDocument();
      });
    });

    it('[ ] shows suggested values in table', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });

    it('[ ] shows source badge for each suggestion', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        },
        {
          field: 'accent_color',
          value: '#007bff',
          source: 'previous_site',
          confidence: 0.8
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/profile/i)).toBeInTheDocument();
        expect(screen.getByText(/previous/i)).toBeInTheDocument();
      });
    });
  });

  // REQUIREMENT: [ ] User can accept or decline prefilling
  describe('User Actions', () => {
    it('[ ] has Apply button', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/apply/i)).toBeInTheDocument();
      });
    });

    it('[ ] has Start Fresh / Cancel button', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/fresh|skip/i)).toBeInTheDocument();
      });
    });

    it('[ ] calls onApply when Apply button clicked', async () => {
      const onApply = vi.fn();
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={onApply}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/apply/i));
      });

      expect(onApply).toHaveBeenCalled();
    });

    it('[ ] passes config object to onApply', async () => {
      const onApply = vi.fn();
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        },
        {
          field: 'about',
          value: 'Engineer',
          source: 'profile',
          confidence: 0.9
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={onApply}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/apply/i));
      });

      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          author: 'Alice',
          about: 'Engineer'
        })
      );
    });

    it('[ ] calls onCancel when Start Fresh clicked', async () => {
      const onCancel = vi.fn();
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={onCancel}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/fresh|skip/i));
      });

      expect(onCancel).toHaveBeenCalled();
    });
  });

  // REQUIREMENT: [ ] Works with BlueSky profile data
  describe('Profile Data Sources', () => {
    it('[ ] displays BlueSky profile suggestions', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'alice.bsky.social',
          source: 'profile',
          confidence: 1.0
        },
        {
          field: 'about',
          value: 'I love building cool things',
          source: 'profile',
          confidence: 0.9
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('alice.bsky.social')).toBeInTheDocument();
      });
    });
  });

  // REQUIREMENT: [ ] Works with previous site data
  describe('Previous Site Data', () => {
    it('[ ] displays previous site suggestions', async () => {
      const mockSuggestions = [
        {
          field: 'accent_color',
          value: '#007bff',
          source: 'previous_site',
          confidence: 0.7
        },
        {
          field: 'footer_text',
          value: '© 2026 Alice',
          source: 'previous_site',
          confidence: 0.7
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#007bff')).toBeInTheDocument();
      });
    });

    it('[ ] distinguishes previous site source from profile', async () => {
      const mockSuggestions = [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        },
        {
          field: 'accent_color',
          value: '#007bff',
          source: 'previous_site',
          confidence: 0.7
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        const profileBadges = screen.getAllByText(/profile/i);
        const siteBadges = screen.getAllByText(/previous/i);
        expect(profileBadges.length).toBeGreaterThan(0);
        expect(siteBadges.length).toBeGreaterThan(0);
      });
    });
  });

  // Edge case: No suggestions available
  describe('Edge Cases', () => {
    it('[ ] handles no suggestions gracefully', async () => {
      axios.get.mockResolvedValue({
        data: {
          suggestions: [],
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no.*suggestions|start fresh/i)).toBeInTheDocument();
      });
    });

    it('[ ] truncates long values in preview', async () => {
      const mockSuggestions = [
        {
          field: 'bio',
          value: 'A'.repeat(100),
          source: 'profile',
          confidence: 1.0
        }
      ];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        const bioCell = screen.getByText(/^A+\.{3}$/);
        expect(bioCell).toBeInTheDocument();
      });
    });

    it('[ ] calls endpoint with correct site ID', async () => {
      const mockSuggestions = [];

      axios.get.mockResolvedValue({
        data: {
          suggestions: mockSuggestions,
          template_id: 'blog',
          template_name: 'Blog Template'
        }
      });

      render(
        <PrefillPreview
          siteId="site-123"
          onApply={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('site-123')
        );
      });
    });
  });
});
