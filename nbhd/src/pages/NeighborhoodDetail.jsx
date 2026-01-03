import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { nbhdService } from '../services/neighborhoodService';
import { userService } from '../services/userService';
import MemberCard from '../components/MemberCard';
import styles from '../styles/NbhdDetail.module.css';

export default function NbhdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [nbhd, setNbhd] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchNbhd();
  }, [id]);

  const fetchNbhd = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nbhdService.getNbhd(id);
      setNbhd(data);

      // Fetch member profiles if there are members
      if (data.members && data.members.length > 0) {
        const userIds = data.members.map(m => m.user_id);
        try {
          const profilesResponse = await userService.batchGetUsers(userIds);
          setMemberProfiles(profilesResponse.data);
        } catch (err) {
          console.error('Error fetching member profiles:', err);
          // Continue without profiles - will show fallback
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load nbhd');
      console.error('Error fetching nbhd:', err);
    } finally {
      setLoading(false);
    }
  };

  const isMember = () => {
    if (!nbhd || !user) return false;
    return nbhd.members?.some((m) => m.user_id === user.user_id);
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await nbhdService.joinNbhd(id);
      await fetchNbhd();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to join nbhd';
      alert(errorMsg);
      console.error('Error joining nbhd:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this nbhd?')) {
      return;
    }

    setActionLoading(true);
    try {
      await nbhdService.leaveNbhd(id);
      await fetchNbhd();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to leave nbhd';
      alert(errorMsg);
      console.error('Error leaving nbhd:', err);
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

  if (error || !nbhd) {
    return (
      <div className={styles.container}>
        <button onClick={() => navigate('/nbhds')} className={styles.backButton}>
          ← Back to Nbhds
        </button>
        <div className={styles.error}>
          <h2>Nbhd not found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/nbhds')} className={styles.backButton}>
        ← Back to Nbhds
      </button>

      <div className={styles.headerSection}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{nbhd.name}</h1>
          <p className={styles.memberCount}>
            <span className={styles.icon}>👥</span>
            {nbhd.member_count} {nbhd.member_count === 1 ? 'member' : 'members'}
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
                {actionLoading ? 'Leaving...' : 'Leave Nbhd'}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className={styles.joinButton}
              >
                {actionLoading ? 'Joining...' : 'Join Nbhd'}
              </button>
            )}
          </div>
        )}
      </div>

      {nbhd.description && (
        <div className={styles.descriptionSection}>
          <h2>About</h2>
          <p>{nbhd.description}</p>
        </div>
      )}

      <div className={styles.metaSection}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Created</span>
          <span className={styles.metaValue}>{formatDate(nbhd.created_at)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Created by</span>
          <span className={styles.metaValue}>{nbhd.created_by}</span>
        </div>
      </div>

      <div className={styles.membersSection}>
        <h2>Members ({nbhd.members?.length || 0})</h2>
        {nbhd.members && nbhd.members.length > 0 ? (
          <div className={styles.membersList}>
            {nbhd.members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                profile={memberProfiles[member.user_id]}
              />
            ))}
          </div>
        ) : (
          <p className={styles.noMembers}>No members yet</p>
        )}
      </div>
    </div>
  );
}
