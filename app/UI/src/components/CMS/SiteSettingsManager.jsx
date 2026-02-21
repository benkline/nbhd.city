import { useState, useEffect } from 'react';
import { GeneralSettings } from './GeneralSettings';
import { SEOSettings } from './SEOSettings';
import { AdvancedSettings } from './AdvancedSettings';
import styles from './SiteSettingsManager.module.css';

/**
 * Toast notification component
 */
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[`toast-${type}`]}`}>
      {message}
    </div>
  );
}

/**
 * SiteSettingsManager - Tabbed interface for managing site-wide settings
 * Tabs: General, SEO, Advanced
 */
export function SiteSettingsManager({ siteId, onSave }) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [showRebuildNotification, setShowRebuildNotification] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sites/${siteId}/settings`);
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (siteId) {
      loadSettings();
    }
  }, [siteId]);

  const handleSettingsChange = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/sites/${siteId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      setIsDirty(false);
      setShowToast({ message: 'Settings saved successfully!', type: 'success' });
      setShowRebuildNotification(true);

      if (onSave) {
        onSave(result);
      }
    } catch (err) {
      setShowToast({ message: `Error: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading settings...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Site Settings</h1>
        <p>Configure your site's metadata, SEO, and advanced options</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer} data-testid="tabs-container">
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
            onClick={() => setActiveTab('general')}
            role="tab"
            aria-selected={activeTab === 'general'}
          >
            General
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'seo' ? styles.active : ''}`}
            onClick={() => setActiveTab('seo')}
            role="tab"
            aria-selected={activeTab === 'seo'}
          >
            SEO
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'advanced' ? styles.active : ''}`}
            onClick={() => setActiveTab('advanced')}
            role="tab"
            aria-selected={activeTab === 'advanced'}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'general' && (
          <GeneralSettings
            settings={settings}
            onChange={handleSettingsChange}
          />
        )}

        {activeTab === 'seo' && (
          <SEOSettings
            settings={settings}
            onChange={handleSettingsChange}
          />
        )}

        {activeTab === 'advanced' && (
          <AdvancedSettings
            settings={settings}
            onChange={handleSettingsChange}
          />
        )}
      </div>

      {/* Save Button */}
      <div className={styles.footer}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Rebuild Notification */}
      {showRebuildNotification && (
        <div className={styles.rebuildNotification}>
          <p>Site settings have changed. Your site needs to be rebuilt for changes to take effect.</p>
          <button
            onClick={() => setShowRebuildNotification(false)}
            className={styles.closeNotification}
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
}
