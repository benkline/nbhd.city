import React, { useState, useEffect } from 'react';
import { ContentEditor } from './SiteBuilder/ContentEditor';
import { nbhdContentService } from '../services/nbhdContentService';
import styles from './WelcomeContentEditor.module.css';

export function WelcomeContentEditor({ nbhdId, onUnsavedChanges }) {
  const [welcomeContent, setWelcomeContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch welcome content on mount
  useEffect(() => {
    const fetchWelcome = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await nbhdContentService.getWelcome(nbhdId);
        setWelcomeContent(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load welcome content');
        console.error('Error fetching welcome content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWelcome();
  }, [nbhdId]);

  const handlePublish = async (content) => {
    try {
      setError(null);
      await nbhdContentService.createOrUpdateWelcome(nbhdId, {
        title: content.title || 'Welcome',
        content: content.content || ''
      });

      // Update local state
      setWelcomeContent({
        title: content.title,
        content: content.content,
        updated_at: new Date().toISOString()
      });

      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to save welcome content');
      console.error('Error saving welcome content:', err);
    }
  };

  const handleError = (message) => {
    setError(message);
  };

  if (loading) {
    return <div className={styles.loading}>Loading welcome content...</div>;
  }

  if (error && !welcomeContent) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorAlert}>{error}</div>
      )}
      <ContentEditor
        siteId={null}
        templateSchema={{
          title: { type: 'string', required: true, maxLength: 200 },
          content: { type: 'string', required: true, maxLength: 10000 }
        }}
        onPublish={handlePublish}
        onError={handleError}
        initialContent={welcomeContent}
      />
    </div>
  );
}
