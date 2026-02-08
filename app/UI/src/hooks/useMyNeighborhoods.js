/**
 * Custom hook for fetching user's nbhd memberships
 */

import { useState, useEffect } from 'react';
import { nbhdService } from '../services/neighborhoodService';
import { useAuth } from '../contexts/AuthContext';

export function useMyNbhds() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [nbhds, setNbhds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchMyNbhds();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
      setNbhds([]);
    }
  }, [isAuthenticated, authLoading]);

  const fetchMyNbhds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nbhdService.getMyNbhds();
      setNbhds(data.neighborhoods || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch your nbhds');
      console.error('Error fetching user nbhds:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchMyNbhds();

  return { nbhds, loading, error, refresh };
}
