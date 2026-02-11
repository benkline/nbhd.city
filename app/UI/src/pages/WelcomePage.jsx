import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nbhdService } from '../services/neighborhoodService';
import WelcomePageContent from '../components/WelcomePageContent';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNbhd();
  }, [id]);

  const fetchNbhd = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch neighborhood details (to verify it exists)
      const nbhdData = await nbhdService.getNbhd(id);
      setNbhd(nbhdData);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load neighborhood');
      console.error('Error fetching neighborhood:', err);
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

  return nbhd ? <WelcomePageContent nbhd={nbhd} showBackLink={true} /> : null;
}
