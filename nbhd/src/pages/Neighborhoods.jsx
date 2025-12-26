import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNbhds } from '../hooks/useNeighborhoods';
import NbhdCard from '../components/NeighborhoodCard';
import CreateNbhdModal from '../components/CreateNeighborhoodModal';
import styles from '../styles/Nbhds.module.css';

export default function Nbhds() {
  const { isAuthenticated } = useAuth();
  const { nbhds, loading, error, refresh } = useNbhds();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateSuccess = () => {
    refresh();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading nbhds...</div>
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
          <h1>Nbhds</h1>
          <p className={styles.subtitle}>
            {nbhds.length} nbhd{nbhds.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setModalOpen(true)}
            className={styles.createButton}
          >
            <span className={styles.icon}>+</span> Create Nbhd
          </button>
        )}
      </div>

      {nbhds.length > 0 ? (
        <div className={styles.grid}>
          {nbhds.map((nbhd) => (
            <NbhdCard
              key={nbhd.id}
              nbhd={nbhd}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏘️</div>
          <h2>No nbhds yet</h2>
          <p>Be the first to create a community!</p>
          {isAuthenticated && (
            <button
              onClick={() => setModalOpen(true)}
              className={styles.createButton}
            >
              Create First Nbhd
            </button>
          )}
        </div>
      )}

      <CreateNbhdModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
