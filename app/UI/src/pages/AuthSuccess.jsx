import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/AuthSuccess.module.css';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Store the token and update auth state
      login(token);

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else {
      // No token provided, show error
      console.error('No token received from auth callback');
      setError('Login failed — BlueSky authentication did not return a token. Please try again.');
    }
  }, [searchParams, login, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {error ? (
          <>
            <h2>Authentication Failed</h2>
            <p style={{ color: '#d32f2f', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => navigate('/login')}
              className={styles.loginButton}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#1185fe',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <h2>Authenticating...</h2>
            <p>Please wait while we verify your BlueSky credentials.</p>
            <div className={styles.spinner}></div>
          </>
        )}
      </div>
    </div>
  );
}
