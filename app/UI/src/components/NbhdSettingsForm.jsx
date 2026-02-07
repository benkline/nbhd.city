import React, { useState, useEffect } from 'react';
import { nbhdService } from '../services/neighborhoodService';
import styles from './NbhdSettingsForm.module.css';

export function NbhdSettingsForm({ nbhdId, onUnsavedChanges }) {
  const [nbhd, setNbhd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNbhd = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await nbhdService.getNbhd(nbhdId);
        setNbhd(data);
      } catch (err) {
        setError(err.message || 'Failed to load neighborhood settings');
        console.error('Error fetching neighborhood:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNbhd();
  }, [nbhdId]);

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!nbhd) {
    return <div className={styles.error}>Neighborhood not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.infoCard}>
        <h3>Neighborhood Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoGroup}>
            <label>Name</label>
            <p className={styles.infoValue}>{nbhd.name}</p>
          </div>

          {nbhd.nbhd_did && (
            <div className={styles.infoGroup}>
              <label>DID</label>
              <p className={styles.infoValue} title={nbhd.nbhd_did}>
                {nbhd.nbhd_did.substring(0, 20)}...
              </p>
            </div>
          )}

          <div className={styles.infoGroup}>
            <label>Members</label>
            <p className={styles.infoValue}>{nbhd.members?.length || 0}</p>
          </div>

          <div className={styles.infoGroup}>
            <label>Created</label>
            <p className={styles.infoValue}>
              {new Date(nbhd.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.comingSoon}>
        <h3>Additional Settings</h3>
        <p>
          Settings for neighborhood metadata (description, avatar, banner) coming soon.
          These will be available after backend endpoints are implemented.
        </p>
      </div>
    </div>
  );
}
