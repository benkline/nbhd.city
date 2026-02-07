import { useState } from 'react';
import styles from './BuildTriggerButton.module.css';

/**
 * BuildTriggerButton - Triggers a site build deployment
 *
 * Props:
 *   site: { site_id, title, status, ... }
 *   onBuildTriggered: callback(job_id) - called when build is successfully triggered
 */
export function BuildTriggerButton({ site, onBuildTriggered }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);

  const isBuilding = site.status === 'building';
  const isDisabled = isLoading || isBuilding;

  const handleTrigger = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sites/${site.site_id}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Build failed with status ${response.status}`);
      }

      const data = await response.json();
      const jobId = data.job_id;

      // Call the callback with job_id
      if (onBuildTriggered) {
        onBuildTriggered(jobId);
      }
    } catch (err) {
      setError(err.message);
      console.error('Build trigger error:', err);
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const handleConfirm = () => {
    handleTrigger();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <button
        className={styles.deployButton}
        onClick={() => setShowConfirm(true)}
        disabled={isDisabled}
        title={isBuilding ? 'Build already in progress' : 'Build and deploy this site'}
      >
        🚀 {isLoading ? 'Deploying...' : 'Deploy Site'}
      </button>

      {showConfirm && (
        <div className={styles.confirmDialog}>
          <div className={styles.confirmContent}>
            <p>Are you sure you want to rebuild and deploy this site?</p>
            <div className={styles.confirmButtons}>
              <button
                className={styles.confirmButton}
                onClick={handleConfirm}
                disabled={isLoading}
              >
                Deploy
              </button>
              <button
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </>
  );
}
