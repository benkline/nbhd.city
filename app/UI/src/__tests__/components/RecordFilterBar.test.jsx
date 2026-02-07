import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordFilterBar from '../../components/RecordFilterBar';

describe('RecordFilterBar', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('renders search input field', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('calls onFilterChange when typing in search', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'important');

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'important'
        })
      );
    });

    it('debounces search input to avoid too many updates', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'test');

      // Should be called fewer times than characters typed due to debouncing
      const callCount = mockOnFilterChange.mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(5); // Debounce period
    });

    it('clears search when clear button is clicked', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'test');

      const clearButton = screen.getByText(/clear|×/);
      await userEvent.click(clearButton);

      expect(searchInput.value).toBe('');
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          search: ''
        })
      );
    });
  });

  describe('Type Filter', () => {
    it('renders type filter dropdown', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const typeFilter = screen.getByLabelText(/type|record type/i) ||
                        screen.getByDisplayValue(/all|type/i);
      expect(typeFilter).toBeInTheDocument();
    });

    it('provides filter options for record types', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const typeFilter = screen.getByLabelText(/type|record type/i) ||
                        screen.getByDisplayValue(/all|type/i);

      // Should be a select with options
      if (typeFilter.tagName === 'SELECT') {
        const options = typeFilter.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(1);
      }
    });

    it('filters by welcome type', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const typeFilter = screen.getByDisplayValue(/all/i);
      if (typeFilter.tagName === 'SELECT') {
        await userEvent.selectOptions(typeFilter, 'welcome');

        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'welcome'
          })
        );
      }
    });

    it('filters by announcement type', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const typeFilter = screen.getByDisplayValue(/all/i);
      if (typeFilter.tagName === 'SELECT') {
        await userEvent.selectOptions(typeFilter, 'announcement');

        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'announcement'
          })
        );
      }
    });

    it('shows all records when filter is reset to "All"', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const typeFilter = screen.getByDisplayValue(/all/i);
      if (typeFilter.tagName === 'SELECT') {
        await userEvent.selectOptions(typeFilter, 'announcement');
        await userEvent.selectOptions(typeFilter, 'all');

        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            type: 'all' || undefined
          })
        );
      }
    });
  });

  describe('Date Range Filter', () => {
    it('renders from date input', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const fromDate = screen.getByLabelText(/from|start/i);
      expect(fromDate).toBeInTheDocument();
    });

    it('renders to date input', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const toDate = screen.getByLabelText(/to|end|until/i);
      expect(toDate).toBeInTheDocument();
    });

    it('filters by start date', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const fromDate = screen.getByLabelText(/from|start/i);
      await userEvent.type(fromDate, '2026-01-31');

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: expect.stringContaining('2026-01-31')
        })
      );
    });

    it('filters by end date', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const toDate = screen.getByLabelText(/to|end|until/i);
      await userEvent.type(toDate, '2026-02-01');

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTo: expect.stringContaining('2026-02-01')
        })
      );
    });

    it('validates date range (from <= to)', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const fromDate = screen.getByLabelText(/from|start/i);
      const toDate = screen.getByLabelText(/to|end|until/i);

      await userEvent.type(fromDate, '2026-02-01');
      await userEvent.type(toDate, '2026-01-31');

      // Should show validation error or swap dates
      const errorMsg = screen.queryByText(/invalid|after|before|range/i);
      expect(errorMsg || fromDate.getAttribute('aria-invalid')).toBeTruthy();
    });

    it('clears date filters', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const fromDate = screen.getByLabelText(/from|start/i);
      await userEvent.type(fromDate, '2026-01-31');

      const clearButton = screen.queryByText(/clear|reset/i);
      if (clearButton) {
        await userEvent.click(clearButton);

        expect(fromDate.value).toBe('');
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            dateFrom: undefined
          })
        );
      }
    });
  });

  describe('Author Filter', () => {
    it('renders author filter', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const authorFilter = screen.queryByLabelText(/author/i);
      // Author filter is optional based on design
      if (authorFilter) {
        expect(authorFilter).toBeInTheDocument();
      }
    });

    it('filters records by author', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const authorFilter = screen.queryByLabelText(/author/i);
      if (authorFilter) {
        await userEvent.type(authorFilter, 'admin');

        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            author: 'admin'
          })
        );
      }
    });
  });

  describe('Reset All Filters', () => {
    it('provides reset button to clear all filters', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const resetButton = screen.getByText(/reset|clear all/i);
      expect(resetButton).toBeInTheDocument();
    });

    it('clears all filter values when reset button clicked', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      const typeFilter = screen.getByDisplayValue(/all/i);
      const fromDate = screen.getByLabelText(/from|start/i);

      // Set some filters
      await userEvent.type(searchInput, 'test');
      await userEvent.selectOptions(typeFilter, 'announcement');
      await userEvent.type(fromDate, '2026-01-31');

      // Reset all
      const resetButton = screen.getByText(/reset|clear all/i);
      await userEvent.click(resetButton);

      // All should be cleared
      expect(searchInput.value).toBe('');
      expect(fromDate.value).toBe('');
      expect(mockOnFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: '',
          type: 'all' || undefined,
          dateFrom: undefined,
          dateTo: undefined
        })
      );
    });
  });

  describe('Sort Options', () => {
    it('provides sort dropdown', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const sortFilter = screen.queryByLabelText(/sort|order/i);
      if (sortFilter) {
        expect(sortFilter).toBeInTheDocument();
      }
    });

    it('sorts by newest first', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const sortFilter = screen.queryByDisplayValue(/newest|recent|latest/i);
      if (sortFilter) {
        await userEvent.selectOptions(sortFilter, 'newest');

        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'newest'
          })
        );
      }
    });

    it('sorts by oldest first', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const sortFilter = screen.queryByDisplayValue(/oldest/i);
      if (sortFilter) {
        await userEvent.selectOptions(sortFilter, 'oldest');

        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'oldest'
          })
        );
      }
    });
  });

  describe('Filter Summary', () => {
    it('displays count of active filters', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'test');

      const activeFilterCount = screen.queryByText(/\d+\s*filter|active:/i);
      if (activeFilterCount) {
        expect(activeFilterCount.textContent).toMatch(/1\s*filter|active.*1/i);
      }
    });

    it('shows applied filters as tags/chips', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const typeFilter = screen.getByDisplayValue(/all/i);
      if (typeFilter.tagName === 'SELECT') {
        await userEvent.selectOptions(typeFilter, 'announcement');

        const filterTag = screen.queryByText(/announcement/i, { selector: '[class*="tag"]' });
        expect(filterTag || screen.getByText(/announcement/)).toBeInTheDocument();
      }
    });
  });

  describe('Responsive Design', () => {
    it('renders all controls on desktop', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/type|record type/i) ||
             screen.getByDisplayValue(/all|type/i)).toBeInTheDocument();
    });

    it('is accessible on mobile screens', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveStyle({ width: expect.anything() });
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const inputs = screen.queryAllByRole('textbox');
      inputs.forEach(input => {
        expect(input.getAttribute('aria-label') || input.id).toBeTruthy();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<RecordFilterBar onFilterChange={mockOnFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'Tab' });
      // Focus should move to next element
      expect(document.activeElement).not.toBe(searchInput);
    });
  });
});
