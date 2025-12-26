/**
 * Custom hook for fetching user's neighborhood memberships
 */

import { useState, useEffect } from 'react';
import { neighborhoodService } from '../services/neighborhoodService';
import { useAuth } from '../contexts/AuthContext';

export function useMyNeighborhoods() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchMyNeighborhoods();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
      setNeighborhoods([]);
    }
  }, [isAuthenticated, authLoading]);

  const fetchMyNeighborhoods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await neighborhoodService.getMyNeighborhoods();
      setNeighborhoods(data.neighborhoods || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch your neighborhoods');
      console.error('Error fetching user neighborhoods:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchMyNeighborhoods();

  return { neighborhoods, loading, error, refresh };
}
