import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyNeighborhoods } from '../hooks/useMyNeighborhoods';
import NeighborhoodCard from '../components/NeighborhoodCard';
import styles from '../styles/MyNeighborhoods.module.css';

export default function MyNeighborhoods() {
  const navigate = useNavigate();
  const { neighborhoods, loading, error } = useMyNeighborhoods();

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>My Neighborhoods</h1>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>My Neighborhoods</h1>
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>My Neighborhoods</h1>

      {neighborhoods.length > 0 ? (
        <>
          <p className={styles.subtitle}>
            You are a member of {neighborhoods.length} neighborhood
            {neighborhoods.length !== 1 ? 's' : ''}
          </p>
          <div className={styles.grid}>
            {neighborhoods.map((neighborhood) => (
              <NeighborhoodCard
                key={neighborhood.id}
                neighborhood={neighborhood}
              />
            ))}
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🌍</div>
          <h2>You haven't joined any neighborhoods yet</h2>
          <p>Start connecting with your community!</p>
          <button
            onClick={() => navigate('/neighborhoods')}
            className={styles.browseButton}
          >
            Browse Neighborhoods
          </button>
        </div>
      )}
    </div>
  );
}
