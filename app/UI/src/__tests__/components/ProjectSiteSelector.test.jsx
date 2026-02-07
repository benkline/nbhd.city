import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectSiteSelector } from '../../components/ProjectSiteSelector';

// Mock useMyNbhds
vi.mock('../../hooks/useMyNeighborhoods', () => ({
  useMyNbhds: vi.fn()
}));

import { useMyNbhds } from '../../hooks/useMyNeighborhoods';

describe('ProjectSiteSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dropdown with "All Neighborhoods" option', () => {
    vi.mocked(useMyNbhds).mockReturnValue({ nbhds: [], loading: false });
    render(<ProjectSiteSelector selectedNbhdId="all" onNbhdChange={mockOnChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('All Neighborhoods')).toBeInTheDocument();
  });

  it('displays neighborhood options from hook', () => {
    vi.mocked(useMyNbhds).mockReturnValue({
      nbhds: [
        { id: 'nbhd-1', name: 'Tech Neighborhood' },
        { id: 'nbhd-2', name: 'Arts Neighborhood' }
      ],
      loading: false
    });
    render(<ProjectSiteSelector selectedNbhdId="all" onNbhdChange={mockOnChange} />);
    expect(screen.getByText('Tech Neighborhood')).toBeInTheDocument();
    expect(screen.getByText('Arts Neighborhood')).toBeInTheDocument();
  });

  it('calls onNbhdChange when selection changes', () => {
    vi.mocked(useMyNbhds).mockReturnValue({
      nbhds: [{ id: 'nbhd-1', name: 'Tech Neighborhood' }],
      loading: false
    });
    render(<ProjectSiteSelector selectedNbhdId="all" onNbhdChange={mockOnChange} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'nbhd-1' } });
    expect(mockOnChange).toHaveBeenCalledWith('nbhd-1');
  });

  it('disables dropdown while loading', () => {
    vi.mocked(useMyNbhds).mockReturnValue({ nbhds: [], loading: true });
    render(<ProjectSiteSelector selectedNbhdId="all" onNbhdChange={mockOnChange} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows selected neighborhood', () => {
    vi.mocked(useMyNbhds).mockReturnValue({
      nbhds: [{ id: 'nbhd-1', name: 'Tech Neighborhood' }],
      loading: false
    });
    render(<ProjectSiteSelector selectedNbhdId="nbhd-1" onNbhdChange={mockOnChange} />);
    expect(screen.getByRole('combobox')).toHaveValue('nbhd-1');
  });
});
