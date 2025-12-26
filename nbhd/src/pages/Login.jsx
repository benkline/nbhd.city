import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Login.module.css';

export default function Login() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    // Redirect to API login endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/login`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Welcome to nbhd.city</h1>
        <p>Connect with your neighborhood community</p>

        <button onClick={handleLogin} className={styles.loginButton}>
          Login with BlueSky
        </button>

        <div className={styles.info}>
          <p>
            We use BlueSky authentication to keep your account secure.
            No separate passwords to remember.
          </p>
        </div>
      </div>
    </div>
  );
}
