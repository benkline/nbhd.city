import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { nbhdContentService } from '../services/nbhdContentService';
import MarkdownRenderer from './MarkdownRenderer';
import DefaultWelcomeInstructions from './DefaultWelcomeInstructions';
import styles from '../styles/WelcomePage.module.css';

/**
 * WelcomePageContent - Reusable component for displaying neighborhood welcome content
 * Can be used by both the standalone WelcomePage and the HomePage
 *
 * Props:
 * - nbhd: Neighborhood object with id and name
 * - showBackLink: (optional) Show back link to neighborhood detail page (default: true)
 */
export default function WelcomePageContent({ nbhd, showBackLink = true }) {
  const [welcomeContent, setWelcomeContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (nbhd && nbhd.id) {
      fetchWelcomeContent();
    }
  }, [nbhd]);

  const fetchWelcomeContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch welcome content
      const content = await nbhdContentService.getWelcomeContent(nbhd.id);
      setWelcomeContent(content.data);
    } catch (contentErr) {
      // Welcome content doesn't exist - that's okay
      if (contentErr.response?.status === 404 || contentErr.response?.data?.data === null) {
        setWelcomeContent(null);
      } else {
        setError(contentErr.response?.data?.detail || contentErr.message || 'Failed to load welcome content');
        console.error('Error fetching welcome content:', contentErr);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {showBackLink && (
          <Link to={`/nbhds/${nbhd.id}`} className={styles.backLink}>
            ← Back to {nbhd.name}
          </Link>
        )}
        <h1>{nbhd.name}</h1>
      </header>

      <div className={styles.content}>
        {welcomeContent ? (
          <div className={styles.welcomeContent}>
            <h2>{welcomeContent.value?.title || 'Welcome'}</h2>
            <MarkdownRenderer markdown={welcomeContent.value?.content || ''} />
            <div className={styles.meta}>
              Last updated:{' '}
              {new Date(welcomeContent.value?.updated_at).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <DefaultWelcomeInstructions />
        )}
      </div>

      <footer className={styles.footer}>
        {showBackLink ? (
          <Link to={`/nbhds/${nbhd.id}`} className={styles.button}>
            View Neighborhood Details
          </Link>
        ) : (
          <Link to="/login" className={styles.button}>
            Sign In
          </Link>
        )}
      </footer>
    </div>
  );
}
