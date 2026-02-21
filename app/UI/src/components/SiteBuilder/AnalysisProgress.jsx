import { useState, useEffect } from 'react';
import styles from './AnalysisProgress.module.css';

/**
 * AnalysisProgress Component
 *
 * Modal showing detailed progress of template analysis
 * Displays:
 * - Current analysis stage
 * - Estimated time remaining
 * - Retry button if failed
 * - Animated harmonic circles in background
 */
export function AnalysisProgress({ isOpen, templateId, status, error, onClose, onRetry }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing');
  const [estimatedTime, setEstimatedTime] = useState('~1 minute');

  // Poll for progress updates
  useEffect(() => {
    if (!isOpen || !templateId || status !== 'analyzing') {
      return;
    }

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/templates/custom/${templateId}/progress`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress || 0);
          setStage(data.stage || 'Processing');
          setEstimatedTime(data.estimated_time || '~1 minute');
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    };

    const interval = setInterval(pollProgress, 1000);
    return () => clearInterval(interval);
  }, [isOpen, templateId, status]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Animated Background Circles */}
        <div className={styles.backgroundCircles}>
          <div className={styles.circle1} />
          <div className={styles.circle2} />
          <div className={styles.circle3} />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <h2>Analyzing Template</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
            disabled={status === 'analyzing'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {status === 'analyzing' && (
            <>
              {/* Progress Display */}
              <div className={styles.progressSection}>
                <div className={styles.stage}>{stage}</div>

                {/* Progress Bar */}
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>

                <div className={styles.progressInfo}>
                  <span className={styles.percentage}>{progress}%</span>
                  <span className={styles.timeEstimate}>{estimatedTime}</span>
                </div>
              </div>

              {/* Animated Circles */}
              <div className={styles.pulseCircles}>
                <div className={styles.pulseCircle1} />
                <div className={styles.pulseCircle2} />
                <div className={styles.pulseCircle3} />
              </div>

              <p className={styles.message}>
                We're analyzing your template repository to extract its structure and schema.
                This typically takes 30-60 seconds.
              </p>
            </>
          )}

          {status === 'ready' && (
            <div className={styles.successContent}>
              <div className={styles.successIcon}>✓</div>
              <h3>Template Ready!</h3>
              <p>Your custom template has been successfully analyzed and is ready to use.</p>
              <button onClick={onClose} className={styles.doneButton}>
                Done
              </button>
            </div>
          )}

          {status === 'failed' && (
            <div className={styles.failedContent}>
              <div className={styles.errorIcon}>!</div>
              <h3>Analysis Failed</h3>
              <p className={styles.errorMessage}>{error || 'Failed to analyze template'}</p>
              <div className={styles.buttonGroup}>
                <button onClick={onRetry} className={styles.retryButton}>
                  Try Again
                </button>
                <button onClick={onClose} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
