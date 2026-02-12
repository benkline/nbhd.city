import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SiteManagementDashboard } from '../components/SiteBuilder/SiteManagementDashboard';
import { ProjectSiteSelector } from '../components/ProjectSiteSelector';
import { BackToDashboardButton } from '../components/BackToDashboardButton';
import styles from '../styles/ProjectSites.module.css';

export default function ProjectSites() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedNbhdId, setSelectedNbhdId] = useState('all');

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
        <h1>Project Sites</h1>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Main content
  return (
    <div className={styles.container}>
      <BackToDashboardButton />
      <h1>Project Sites</h1>
      <p className={styles.subtitle}>
        Project sites represent your neighborhood. Only neighborhood owners can edit them.
      </p>

      <ProjectSiteSelector
        selectedNbhdId={selectedNbhdId}
        onNbhdChange={setSelectedNbhdId}
      />

      <SiteManagementDashboard
        siteType="project"
        nbhdId={selectedNbhdId === 'all' ? undefined : selectedNbhdId}
      />
    </div>
  );
}
