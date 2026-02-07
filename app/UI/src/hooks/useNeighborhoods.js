/**
 * Custom hook for fetching all nbhds
 */

import { useState, useEffect } from 'react';
import { nbhdService } from '../services/neighborhoodService';

export function useNbhds() {
  const [nbhds, setNbhds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNbhds();
  }, []);

  const fetchNbhds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nbhdService.getAllNbhds();
      setNbhds(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch nbhds');
      console.error('Error fetching nbhds:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchNbhds();

  return { nbhds, loading, error, refresh };
}
