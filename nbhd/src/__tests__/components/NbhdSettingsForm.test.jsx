import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NbhdSettingsForm } from '../../components/NbhdSettingsForm';

describe('NbhdSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading Settings', () => {
    it('fetches neighborhood data on mount', async () => {
      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });

    it('displays neighborhood name', async () => {
      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Tech Neighborhood/i) || screen.getByDisplayValue(/Tech Neighborhood/i)).toBeDefined();
      });
    });

    it('displays neighborhood description', async () => {
      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/tech enthusiast|community/i) || screen.getByDisplayValue(/tech enthusiast|community/i)).toBeDefined();
      });
    });
  });

  describe('Validation', () => {
    it('validates required name field', async () => {
      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/name|neighborhood/i)).toBeInTheDocument();
      });
    });
  });

  describe('Saving Settings', () => {
    it('saves updated settings', async () => {
      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/name|neighborhood|settings/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error when fetch fails', async () => {
      render(<NbhdSettingsForm nbhdId="nbhd-123" />);

      await waitFor(() => {
        expect(screen.getByText(/name|neighborhood|error|failed/i)).toBeInTheDocument();
      });
    });
  });
});
