import React from 'react';
import styles from '../styles/MemberCard.module.css';

export default function MemberCard({ member, profile }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Use profile if available, otherwise show user_id
  const displayName = profile?.display_name || profile?.handle || member.user_id;
  const handle = profile?.handle || '';
  const avatar = profile?.avatar || null;
  const location = profile?.location || '';

  return (
    <div className={styles.memberCard}>
      <div className={styles.avatarContainer}>
        {avatar ? (
          <img src={avatar} alt={displayName} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className={styles.memberInfo}>
        <div className={styles.memberName}>
          <span className={styles.displayName}>{displayName}</span>
          {handle && <span className={styles.handle}>@{handle}</span>}
        </div>
        {location && (
          <div className={styles.location}>
            <span className={styles.locationIcon}>📍</span>
            {location}
          </div>
        )}
        <div className={styles.joinedDate}>
          Joined {formatDate(member.joined_at)}
        </div>
      </div>
    </div>
  );
}
