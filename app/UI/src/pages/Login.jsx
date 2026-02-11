import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Login.module.css';

export default function Login() {
  const { isAuthenticated, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      // Redirect to profile if onboarding needed, otherwise dashboard
      if (needsOnboarding) {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, needsOnboarding, navigate]);

  const handleBlueskyLogin = () => {
    setIsRedirecting(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    const frontendUrl = window.location.origin;
    window.location.href = `${apiUrl}/auth/login?return_url=${encodeURIComponent(frontendUrl)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>🏘️ nbhd.city</h1>
          <p className={styles.tagline}>Your Neighborhood Space</p>
        </div>

        <p className={styles.description}>
          Organize, collaborate, and manage your neighborhood community
        </p>

        <div className={styles.authSection}>
          <p className={styles.authInfo}>
            nbhd.city uses your BlueSky account for sign-in. No new password required.
          </p>

          <button
            onClick={handleBlueskyLogin}
            className={styles.blueskyButton}
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <span className={styles.spinner}></span>
                Redirecting to BlueSky...
              </>
            ) : (
              <>
                <span className={styles.blueskyIcon}>🦋</span>
                Sign in with BlueSky
              </>
            )}
          </button>
        </div>

        <div className={styles.info}>
          <p>
            Secure authentication powered by BlueSky
          </p>
        </div>
      </div>
    </div>
  );
}
