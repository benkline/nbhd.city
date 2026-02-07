import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { nbhdService } from '../services/neighborhoodService';
import { WelcomeContentEditor } from '../components/WelcomeContentEditor';
import { AnnouncementManager } from '../components/AnnouncementManager';
import { NbhdSettingsForm } from '../components/NbhdSettingsForm';
import { SitesTab } from '../components/SitesTab';
import CMSView from './CMSView';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [activeTab, setActiveTab] = useState('welcome');
  const [nbhd, setNbhd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch neighborhood and verify ownership
  useEffect(() => {
    const fetchNbhd = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await nbhdService.getNbhd(id);
        setNbhd(data);

        // Check ownership
        if (data.created_by !== user?.user_id) {
          navigate(`/nbhds/${id}`);
          return;
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load neighborhood');
        console.error('Error fetching neighborhood:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && user) {
      fetchNbhd();
    }
  }, [id, user, isAuthenticated, authLoading, navigate]);

  // Handle tab switching with unsaved changes warning
  const handleTabClick = (newTab) => {
    if (hasUnsavedChanges && newTab !== activeTab) {
      setPendingTab(newTab);
      if (window.confirm('You have unsaved changes. Switch tabs anyway?')) {
        setActiveTab(newTab);
        setHasUnsavedChanges(false);
        setPendingTab(null);
      }
    } else {
      setActiveTab(newTab);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading neighborhood...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (!nbhd) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>Neighborhood not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Administering {nbhd.name}</h1>
        <p className={styles.subtitle}>Manage your neighborhood's content and settings</p>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${activeTab === 'welcome' ? styles.tabActive : ''}`}
            onClick={() => handleTabClick('welcome')}
          >
            Welcome
            {activeTab === 'welcome' && hasUnsavedChanges && (
              <span className={styles.unsavedIndicator} title="Unsaved changes" />
            )}
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'announcements' ? styles.tabActive : ''}`}
            onClick={() => handleTabClick('announcements')}
          >
            Announcements
            {activeTab === 'announcements' && hasUnsavedChanges && (
              <span className={styles.unsavedIndicator} title="Unsaved changes" />
            )}
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => handleTabClick('settings')}
          >
            Settings
            {activeTab === 'settings' && hasUnsavedChanges && (
              <span className={styles.unsavedIndicator} title="Unsaved changes" />
            )}
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'sites' ? styles.tabActive : ''}`}
            onClick={() => handleTabClick('sites')}
          >
            Sites
            {activeTab === 'sites' && hasUnsavedChanges && (
              <span className={styles.unsavedIndicator} title="Unsaved changes" />
            )}
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'cms' ? styles.tabActive : ''}`}
            onClick={() => handleTabClick('cms')}
          >
            CMS View
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'welcome' && (
            <div className={styles.tabPane}>
              <h2>Welcome Content</h2>
              <p className={styles.tabDescription}>
                Create a custom welcome message for your neighborhood
              </p>
              <WelcomeContentEditor
                nbhdId={id}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className={styles.tabPane}>
              <h2>Announcements</h2>
              <p className={styles.tabDescription}>
                Create and manage community announcements
              </p>
              <AnnouncementManager
                nbhdId={id}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.tabPane}>
              <h2>Settings</h2>
              <p className={styles.tabDescription}>
                Configure neighborhood metadata and settings
              </p>
              <NbhdSettingsForm
                nbhdId={id}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            </div>
          )}

          {activeTab === 'sites' && (
            <div className={styles.tabPane}>
              <h2>Project Sites</h2>
              <p className={styles.tabDescription}>
                Manage project sites for this neighborhood
              </p>
              <SitesTab nbhdId={id} />
            </div>
          )}

          {activeTab === 'cms' && (
            <div className={styles.tabPane}>
              <h2>CMS View</h2>
              <p className={styles.tabDescription}>
                View all AT Protocol records for this neighborhood
              </p>
              <CMSView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
