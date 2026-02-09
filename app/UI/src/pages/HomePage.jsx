import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { nbhdService } from '../services/neighborhoodService';
import WelcomePageContent from '../components/WelcomePageContent';
import Login from './Login';
import styles from '../styles/HomePage.module.css';

/**
 * HomePage - Smart home page router
 *
 * Routing Logic:
 * 1. If user is authenticated → redirect to /dashboard
 * 2. If home neighborhood exists → show welcome page
 * 3. Otherwise → show login page
 *
 * Acceptance Criteria:
 * - [x] Unauthenticated users see home page (nbhd welcome or login)
 * - [x] Authenticated users redirected to dashboard
 * - [x] No error if no nbhd designated as home page
 * - [x] Loading state displays while checking
 * - [x] Navigation handles both logged-in and logged-out states
 * - [x] Home page context switches work without full reload
 */
export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [homeNbhd, setHomeNbhd] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect 1: Fetch home neighborhood on mount
  useEffect(() => {
    checkHomePage();
  }, []);

  // Effect 2: Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const checkHomePage = async () => {
    try {
      setLoading(true);
      const nbhd = await nbhdService.getHomeNbhd();
      setHomeNbhd(nbhd);
    } catch (err) {
      console.error('Error fetching home page neighborhood:', err);
      // If error fetching home page, just continue to show login
      setHomeNbhd(null);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth and home page
  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // If authenticated, they will be redirected by the useEffect
  // This component only renders for unauthenticated users

  // Show welcome page if home neighborhood is configured
  if (homeNbhd) {
    return <WelcomePageContent nbhd={homeNbhd} showBackLink={false} />;
  }

  // Fall back to login page if no home neighborhood
  return <Login />;
}
