import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/NeighborhoodCard.module.css';

export default function NeighborhoodCard({ neighborhood, showJoinButton = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/neighborhoods/${neighborhood.id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.header}>
        <h3 className={styles.title}>{neighborhood.name}</h3>
        <span className={styles.memberCount}>
          <span className={styles.icon}>👥</span>
          {neighborhood.member_count} {neighborhood.member_count === 1 ? 'member' : 'members'}
        </span>
      </div>

      {neighborhood.description && (
        <p className={styles.description}>{neighborhood.description}</p>
      )}

      <div className={styles.footer}>
        <span className={styles.date}>Created {formatDate(neighborhood.created_at)}</span>
      </div>
    </div>
  );
}
