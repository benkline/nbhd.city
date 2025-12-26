import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/AuthSuccess.module.css';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

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
      // No token provided, redirect to login
      console.error('No token received from auth callback');
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Authenticating...</h2>
        <p>Please wait while we complete your login.</p>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );
}
