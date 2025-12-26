import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNeighborhoods } from '../hooks/useNeighborhoods';
import NeighborhoodCard from '../components/NeighborhoodCard';
import CreateNeighborhoodModal from '../components/CreateNeighborhoodModal';
import styles from '../styles/Neighborhoods.module.css';

export default function Neighborhoods() {
  const { isAuthenticated } = useAuth();
  const { neighborhoods, loading, error, refresh } = useNeighborhoods();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateSuccess = () => {
    refresh();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading neighborhoods...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={refresh} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Neighborhoods</h1>
          <p className={styles.subtitle}>
            {neighborhoods.length} neighborhood{neighborhoods.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setModalOpen(true)}
            className={styles.createButton}
          >
            <span className={styles.icon}>+</span> Create Neighborhood
          </button>
        )}
      </div>

      {neighborhoods.length > 0 ? (
        <div className={styles.grid}>
          {neighborhoods.map((neighborhood) => (
            <NeighborhoodCard
              key={neighborhood.id}
              neighborhood={neighborhood}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏘️</div>
          <h2>No neighborhoods yet</h2>
          <p>Be the first to create a community!</p>
          {isAuthenticated && (
            <button
              onClick={() => setModalOpen(true)}
              className={styles.createButton}
            >
              Create First Neighborhood
            </button>
          )}
        </div>
      )}

      <CreateNeighborhoodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
