import { useNavigate } from 'react-router-dom';
import styles from './BackToDashboardButton.module.css';

export function BackToDashboardButton() {
  const navigate = useNavigate();

  return (
    <button
      className={styles.backButton}
      onClick={() => navigate('/dashboard')}
    >
      ← Back to Dashboard
    </button>
  );
}
