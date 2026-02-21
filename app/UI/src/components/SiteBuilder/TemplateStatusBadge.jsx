import { useState } from 'react';
import styles from './TemplateStatusBadge.module.css';

/**
 * TemplateStatusBadge Component
 *
 * Visual status indicator for custom templates
 * States:
 * - analyzing: 3 pulsing circles (breathe animation)
 * - ready: checkmark with circle highlight
 * - failed: error icon with red circles
 */
export function TemplateStatusBadge({ status = 'analyzing', error = null }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!status) {
    return null;
  }

  const handleMouseEnter = () => {
    if (error) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div
      className={`${styles.badge} ${styles[`badge${capitalize(status)}`]}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="status"
      aria-label={`Template status: ${status}`}
      data-testid={`status-badge-${status}`}
    >
      {status === 'analyzing' && (
        <div className={styles.analyzingContent}>
          <div className={styles.circlesContainer}>
            <div className={styles.circle1} />
            <div className={styles.circle2} />
            <div className={styles.circle3} />
          </div>
          <span className={styles.text}>Analyzing</span>
        </div>
      )}

      {status === 'ready' && (
        <div className={styles.readyContent}>
          <div className={styles.checkmarkContainer}>
            <svg
              className={styles.checkmark}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <div className={styles.checkmarkCircle} />
          </div>
          <span className={styles.text}>Ready</span>
        </div>
      )}

      {status === 'failed' && (
        <div className={styles.failedContent}>
          <div className={styles.errorContainer}>
            <svg
              className={styles.errorIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                !
              </text>
            </svg>
            <div className={styles.errorCircle1} />
            <div className={styles.errorCircle2} />
          </div>
          <span className={styles.text}>Failed</span>
        </div>
      )}

      {/* Tooltip for failed status */}
      {showTooltip && error && (
        <div className={styles.tooltip} role="tooltip">
          {error}
        </div>
      )}
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
