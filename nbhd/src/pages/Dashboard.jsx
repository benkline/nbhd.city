import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1>nbhd.city</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2>Dashboard</h2>

          <div className={styles.userInfo}>
            <h3>Your Account</h3>
            <div className={styles.infoItem}>
              <label>User ID:</label>
              <code>{user?.user_id || 'N/A'}</code>
            </div>
            <div className={styles.infoItem}>
              <label>Status:</label>
              <span className={styles.status}>
                {user?.authenticated ? '✓ Authenticated' : '✗ Not Authenticated'}
              </span>
            </div>
          </div>

          <div className={styles.navigation}>
            <h3>Nbhds</h3>
            <div className={styles.navGrid}>
              <button
                onClick={() => navigate('/nbhds')}
                className={styles.navCard}
              >
                <span className={styles.navIcon}>🏘️</span>
                <h4>Browse Nbhds</h4>
                <p>Discover and join nbhds in your area</p>
              </button>

              <button
                onClick={() => navigate('/my-nbhds')}
                className={styles.navCard}
              >
                <span className={styles.navIcon}>👥</span>
                <h4>My Nbhds</h4>
                <p>View nbhds you've joined</p>
              </button>
            </div>
          </div>

          <div className={styles.nextSteps}>
            <h3>Future Features</h3>
            <ul>
              <li>Connect with neighbors</li>
              <li>Create community events</li>
              <li>Share nbhd updates</li>
              <li>Nbhd discussions</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
