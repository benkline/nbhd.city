import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { nbhdContentService } from '../services/nbhdContentService';
import { nbhdService } from '../services/neighborhoodService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DefaultWelcomeInstructions from '../components/DefaultWelcomeInstructions';
import styles from '../styles/WelcomePage.module.css';

/**
 * WelcomePage - Public-facing welcome page for neighborhoods
 * Displays custom welcome content or default instructions if no content exists
 *
 * Acceptance Criteria:
 * - [ ] Unauthenticated users can view welcome page
 * - [ ] With no content, shows setup instructions
 * - [ ] With content, shows rendered markdown
 * - [ ] Markdown renders correctly (headers, links, code blocks)
 * - [ ] Mobile layout works
 * - [ ] Loading state displays while fetching
 */
export default function WelcomePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nbhd, setNbhd] = useState(null);
  const [welcomeContent, setWelcomeContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch neighborhood details (to verify it exists)
      const nbhdData = await nbhdService.getNbhd(id);
      setNbhd(nbhdData);

      // Fetch welcome content (might not exist)
      try {
        const content = await nbhdContentService.getWelcomeContent(id);
        setWelcomeContent(content.data);
      } catch (contentErr) {
        // Welcome content doesn't exist - that's okay
        if (contentErr.response?.status === 404 || contentErr.response?.data?.data === null) {
          setWelcomeContent(null);
        } else {
          throw contentErr;
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load welcome page');
      console.error('Error fetching welcome page:', err);
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
          <button onClick={() => navigate('/nbhds')} className={styles.button}>
            Back to Neighborhoods
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to={`/nbhds/${id}`} className={styles.backLink}>
          ← Back to {nbhd?.name || 'Neighborhood'}
        </Link>
        <h1>{nbhd?.name}</h1>
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
        <Link to={`/nbhds/${id}`} className={styles.button}>
          View Neighborhood Details
        </Link>
      </footer>
    </div>
  );
}
