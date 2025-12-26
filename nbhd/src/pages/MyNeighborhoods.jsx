import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyNbhds } from '../hooks/useMyNeighborhoods';
import NbhdCard from '../components/NeighborhoodCard';
import styles from '../styles/MyNbhds.module.css';

export default function MyNbhds() {
  const navigate = useNavigate();
  const { nbhds, loading, error } = useMyNbhds();

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>My Nbhds</h1>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>My Nbhds</h1>
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>My Nbhds</h1>

      {nbhds.length > 0 ? (
        <>
          <p className={styles.subtitle}>
            You are a member of {nbhds.length} nbhd
            {nbhds.length !== 1 ? 's' : ''}
          </p>
          <div className={styles.grid}>
            {nbhds.map((nbhd) => (
              <NbhdCard
                key={nbhd.id}
                nbhd={nbhd}
              />
            ))}
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🌍</div>
          <h2>You haven't joined any nbhds yet</h2>
          <p>Start connecting with your community!</p>
          <button
            onClick={() => navigate('/nbhds')}
            className={styles.browseButton}
          >
            Browse Nbhds
          </button>
        </div>
      )}
    </div>
  );
}
