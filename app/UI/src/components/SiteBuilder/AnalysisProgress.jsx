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
  const [currentStatus, setCurrentStatus] = useState(status);

  // Debug logging
  console.log('[AnalysisProgress] Component mounted/updated:', {
    isOpen,
    templateId,
    status,
    currentStatus
  });

  // Poll for status updates
  useEffect(() => {
    console.log('[AnalysisProgress] useEffect triggered with:', { isOpen, templateId, currentStatus });

    if (!isOpen || !templateId) {
      console.log('[AnalysisProgress] Exiting - isOpen:', isOpen, 'templateId:', templateId);
      return;
    }

    // Don't poll if already ready or failed
    if (currentStatus === 'ready' || currentStatus === 'failed') {
      console.log('[AnalysisProgress] Exiting - already done. currentStatus:', currentStatus);
      return;
    }

    console.log('[AnalysisProgress] Starting polling for templateId:', templateId);

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/templates/custom/${templateId}/status`);
        if (response.ok) {
          const data = await response.json();
          const statusData = data.data;

          // Update progress if available (during analyzing state)
          if (statusData.progress !== undefined) {
            const progressValue = typeof statusData.progress === 'number'
              ? statusData.progress * 100
              : 0;
            setProgress(Math.min(progressValue, 99)); // Cap at 99% until complete
          }

          // Update message if available
          if (statusData.message) {
            setStage(statusData.message);
          }

          // Update current status - this is the critical update
          const newStatus = statusData.status;
          if (newStatus === 'ready') {
            setProgress(100);
            setCurrentStatus('ready');
            setStage('Analysis Complete!');
            console.log('Analysis complete, closing modal in 1.5s');
            // Auto-close after showing success
            setTimeout(() => {
              console.log('Closing modal now');
              if (onClose) onClose();
            }, 1500);
          } else if (newStatus === 'failed') {
            setCurrentStatus('failed');
            setStage('Analysis Failed');
            console.error('Analysis failed:', statusData.error);
          } else if (newStatus === 'analyzing') {
            // Stay in analyzing state, update progress/message
            setCurrentStatus('analyzing');
          }
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };

    // Poll immediately first
    pollStatus();

    // Then poll every 1 second
    const interval = setInterval(pollStatus, 1000);
    return () => clearInterval(interval);
  }, [isOpen, templateId, currentStatus, onClose]);

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
            disabled={currentStatus === 'analyzing'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {currentStatus === 'analyzing' && (
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

          {currentStatus === 'ready' && (
            <div className={styles.successContent}>
              <div className={styles.successIcon}>✓</div>
              <h3>Template Ready!</h3>
              <p>Your custom template has been successfully analyzed and is ready to use.</p>
              <button onClick={onClose} className={styles.doneButton}>
                Done
              </button>
            </div>
          )}

          {currentStatus === 'failed' && (
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
