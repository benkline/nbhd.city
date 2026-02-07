import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SiteManagementDashboard } from '../components/SiteBuilder/SiteManagementDashboard';
import styles from '../styles/PersonalSites.module.css';

/**
 * PersonalSites - Page for viewing and managing personal sites
 * [x] Create PersonalSites.jsx page
 * [x] Fetch GET /api/sites?site_type=personal
 * [x] Reuse SiteManagementDashboard with site_type="personal" filter
 * [x] Add create button with site type pre-selected
 * [x] Show helpful text explaining personal sites
 */
export default function PersonalSites() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Auth redirect
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <h1>Personal Sites</h1>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Main content
  return (
    <div className={styles.container}>
      <h1>Personal Sites</h1>
      <p className={styles.subtitle}>
        Personal sites are your own space and are not associated with any neighborhood.
      </p>

      <SiteManagementDashboard siteType="personal" />
    </div>
  );
}
