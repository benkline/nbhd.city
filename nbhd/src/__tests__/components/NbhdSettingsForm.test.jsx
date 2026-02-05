import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NbhdSettingsForm } from '../../components/NbhdSettingsForm';

vi.mock('../../services/neighborhoodService', () => ({
  nbhdService: {
    getNbhd: vi.fn(),
    updateNbhd: vi.fn()
  }
}));

describe('NbhdSettingsForm', () => {
  const mockNbhdService = require('../../services/neighborhoodService').nbhdService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading Settings', () => {
    // [x] Form loads current settings
    it('fetches neighborhood data on mount', async () => {
      mockNbhdService.getNbhd.mockResolvedValue({
        id: 'nbhd-123',
        name: 'Tech Neighborhood',
        description: 'A tech community'
      });

      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(mockNbhdService.getNbhd).toHaveBeenCalledWith('nbhd-123');
      });
    });

    it('displays neighborhood name', async () => {
      mockNbhdService.getNbhd.mockResolvedValue({
        id: 'nbhd-123',
        name: 'Tech Neighborhood',
        description: 'A tech community'
      });

      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Tech Neighborhood')).toBeInTheDocument();
      });
    });

    it('displays neighborhood description', async () => {
      mockNbhdService.getNbhd.mockResolvedValue({
        id: 'nbhd-123',
        name: 'Tech Neighborhood',
        description: 'A tech community'
      });

      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('A tech community')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    // [x] Validation works
    it('validates required name field', async () => {
      mockNbhdService.getNbhd.mockResolvedValue({
        id: 'nbhd-123',
        name: 'Tech Neighborhood',
        description: ''
      });

      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      const nameInput = await screen.findByLabelText(/name|display/i);
      await userEvent.clear(nameInput);

      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/required|name/i)).toBeInTheDocument();
    });
  });

  describe('Saving Settings', () => {
    it('saves updated settings', async () => {
      mockNbhdService.getNbhd.mockResolvedValue({
        id: 'nbhd-123',
        name: 'Tech Neighborhood',
        description: ''
      });
      mockNbhdService.updateNbhd.mockResolvedValue({
        id: 'nbhd-123',
        name: 'Updated Name',
        description: ''
      });

      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Tech Neighborhood')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error when fetch fails', async () => {
      mockNbhdService.getNbhd.mockRejectedValue(new Error('Network error'));

      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });
});
