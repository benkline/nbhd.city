import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api';
import styles from '../styles/Profile.module.css';

export default function Profile() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch user profile from API
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchProfile();
    }
  }, [isAuthenticated, isLoading]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      setError(null);
      const response = await apiClient.get('/api/users/profile');
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading || profileLoading) {
    return (
      <div className={styles.container}>
        <nav className={styles.navbar}>
          <h1>nbhd.city</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </nav>
        <div className={styles.main}>
          <div className={styles.card}>
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1>nbhd.city</h1>
        <div className={styles.navButtons}>
          <button
            onClick={() => navigate('/dashboard')}
            className={styles.navButton}
          >
            Dashboard
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={fetchProfile} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {profile && (
          <div className={styles.card}>
            {/* Header with banner and avatar */}
            {profile.banner && (
              <div
                className={styles.banner}
                style={{ backgroundImage: `url(${profile.banner})` }}
              />
            )}

            <div className={styles.profileHeader}>
              {profile.avatar && (
                <img
                  src={profile.avatar}
                  alt={profile.displayName || profile.handle}
                  className={styles.avatar}
                />
              )}
              <div className={styles.headerInfo}>
                <h1 className={styles.displayName}>
                  {profile.displayName || profile.handle}
                </h1>
                <p className={styles.handle}>@{profile.handle}</p>
                {profile.description && (
                  <p className={styles.description}>{profile.description}</p>
                )}
              </div>
            </div>

            {/* Stats section */}
            <div className={styles.statsSection}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{profile.postsCount}</div>
                <div className={styles.statLabel}>Posts</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{profile.followersCount}</div>
                <div className={styles.statLabel}>Followers</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{profile.followsCount}</div>
                <div className={styles.statLabel}>Following</div>
              </div>
            </div>

            {/* DID section */}
            <div className={styles.didSection}>
              <h3>Bluesky Identifier</h3>
              <code className={styles.did}>{profile.did}</code>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
