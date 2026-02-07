import React from 'react';
import { useNbhds } from '../hooks/useNeighborhoods';
import NbhdCard from '../components/NeighborhoodCard';
import styles from '../styles/Nbhds.module.css';

export default function Nbhds() {
  const { nbhds, loading, error, refresh } = useNbhds();

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
        </div>
      )}
    </div>
  );
}
