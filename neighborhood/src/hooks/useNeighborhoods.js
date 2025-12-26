/**
 * Custom hook for fetching all neighborhoods
 */

import { useState, useEffect } from 'react';
import { neighborhoodService } from '../services/neighborhoodService';

export function useNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await neighborhoodService.getAllNeighborhoods();
      setNeighborhoods(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch neighborhoods');
      console.error('Error fetching neighborhoods:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchNeighborhoods();

  return { neighborhoods, loading, error, refresh };
}
