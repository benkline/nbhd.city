import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/NbhdCard.module.css';

export default function NbhdCard({ nbhd, showJoinButton = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/nbhds/${nbhd.id}`);
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
        <h3 className={styles.title}>{nbhd.name}</h3>
        <span className={styles.memberCount}>
          <span className={styles.icon}>👥</span>
          {nbhd.member_count} {nbhd.member_count === 1 ? 'member' : 'members'}
        </span>
      </div>

      {nbhd.description && (
        <p className={styles.description}>{nbhd.description}</p>
      )}

      <div className={styles.footer}>
        <span className={styles.date}>Created {formatDate(nbhd.created_at)}</span>
      </div>
    </div>
  );
}
