import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { neighborhoodService } from '../services/neighborhoodService';
import styles from '../styles/NeighborhoodDetail.module.css';

export default function NeighborhoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [neighborhood, setNeighborhood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchNeighborhood();
  }, [id]);

  const fetchNeighborhood = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await neighborhoodService.getNeighborhood(id);
      setNeighborhood(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load neighborhood');
      console.error('Error fetching neighborhood:', err);
    } finally {
      setLoading(false);
    }
  };

  const isMember = () => {
    if (!neighborhood || !user) return false;
    return neighborhood.members?.some((m) => m.user_id === user.user_id);
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await neighborhoodService.joinNeighborhood(id);
      await fetchNeighborhood();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to join neighborhood';
      alert(errorMsg);
      console.error('Error joining neighborhood:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this neighborhood?')) {
      return;
    }

    setActionLoading(true);
    try {
      await neighborhoodService.leaveNeighborhood(id);
      await fetchNeighborhood();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to leave neighborhood';
      alert(errorMsg);
      console.error('Error leaving neighborhood:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !neighborhood) {
    return (
      <div className={styles.container}>
        <button onClick={() => navigate('/neighborhoods')} className={styles.backButton}>
          ← Back to Neighborhoods
        </button>
        <div className={styles.error}>
          <h2>Neighborhood not found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/neighborhoods')} className={styles.backButton}>
        ← Back to Neighborhoods
      </button>

      <div className={styles.headerSection}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{neighborhood.name}</h1>
          <p className={styles.memberCount}>
            <span className={styles.icon}>👥</span>
            {neighborhood.member_count} {neighborhood.member_count === 1 ? 'member' : 'members'}
          </p>
        </div>

        {isAuthenticated && (
          <div className={styles.actionArea}>
            {isMember() ? (
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className={styles.leaveButton}
              >
                {actionLoading ? 'Leaving...' : 'Leave Neighborhood'}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className={styles.joinButton}
              >
                {actionLoading ? 'Joining...' : 'Join Neighborhood'}
              </button>
            )}
          </div>
        )}
      </div>

      {neighborhood.description && (
        <div className={styles.descriptionSection}>
          <h2>About</h2>
          <p>{neighborhood.description}</p>
        </div>
      )}

      <div className={styles.metaSection}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Created</span>
          <span className={styles.metaValue}>{formatDate(neighborhood.created_at)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Created by</span>
          <span className={styles.metaValue}>{neighborhood.created_by}</span>
        </div>
      </div>

      <div className={styles.membersSection}>
        <h2>Members ({neighborhood.members?.length || 0})</h2>
        {neighborhood.members && neighborhood.members.length > 0 ? (
          <div className={styles.membersList}>
            {neighborhood.members.map((member) => (
              <div key={member.id} className={styles.memberItem}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberIcon}>👤</span>
                  <div className={styles.memberDetails}>
                    <span className={styles.memberId}>{member.user_id}</span>
                    <span className={styles.memberJoinedDate}>
                      Joined {formatDate(member.joined_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noMembers}>No members yet</p>
        )}
      </div>
    </div>
  );
}
