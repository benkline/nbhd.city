import { useState, useEffect, useRef } from 'react';
import styles from './BuildStatusPoller.module.css';

const POLL_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_ERRORS = 3;
const MAX_POLL_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function formatSeconds(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const STATUS_CONFIG = {
  pending: { label: 'PENDING', icon: '\u23F3', cssClass: 'statusPending' },
  running: { label: 'RUNNING', icon: '\u2699\uFE0F', cssClass: 'statusRunning' },
  completed: { label: 'COMPLETED', icon: '\u2705', cssClass: 'statusCompleted' },
  failed: { label: 'FAILED', icon: '\u274C', cssClass: 'statusFailed' }
};

/**
 * BuildStatusPoller - Polls and displays build status and logs
 *
 * Props:
 *   site: { site_id, title }
 *   jobId: string - Job ID from build trigger
 *   onBuildComplete: callback(data) - called when build completes or fails
 *   onClose: callback() - dismiss the poller panel
 */
export function BuildStatusPoller({ site, jobId, onBuildComplete, onClose }) {
  const [status, setStatus] = useState('pending');
  const [logs, setLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const isPollingRef = useRef(true);
  const startTimeRef = useRef(Date.now());

  const isTerminal = status === 'completed' || status === 'failed';

  async function fetchStatus() {
    try {
      const response = await fetch(
        `/api/sites/${site.site_id}/builds/${jobId}`
      );
      const data = await response.json();

      consecutiveErrorsRef.current = 0;
      setNetworkError(null);
      setStatus(data.status);
      setLogs(data.logs || []);

      if (data.error_message) {
        setErrorMessage(data.error_message);
      }

      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
        if (onBuildComplete) {
          onBuildComplete(data);
        }
      }
    } catch (error) {
      consecutiveErrorsRef.current += 1;

      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        setNetworkError('Connection lost. Unable to reach the server.');
        stopPolling();
      }
    }
  }

  function stopPolling() {
    isPollingRef.current = false;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  function handleRefresh() {
    fetchStatus();
  }

  useEffect(() => {
    startTimeRef.current = Date.now();

    // Fetch immediately
    fetchStatus();

    // Start polling
    pollIntervalRef.current = setInterval(() => {
      if (!isPollingRef.current) {
        clearInterval(pollIntervalRef.current);
        return;
      }

      // Safety timeout
      if (Date.now() - startTimeRef.current > MAX_POLL_DURATION_MS) {
        stopPolling();
        setNetworkError('Build timed out after 30 minutes.');
        return;
      }

      fetchStatus();
    }, POLL_INTERVAL_MS);

    // Elapsed time counter
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
      isPollingRef.current = false;
    };
  }, []);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Build Status: {site.title}</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className={styles.statusRow}>
          <span
            className={`${styles.statusBadge} ${styles[config.cssClass]}`}
            data-testid="build-status-badge"
          >
            {config.icon} {config.label}
          </span>
          <span className={styles.elapsed}>
            Elapsed: {formatSeconds(elapsedSeconds)}
          </span>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            aria-label="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.logsSection}>
        <div className={styles.logsHeader}>Build Logs</div>
        <pre className={styles.logsContent}>
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div key={i} className={styles.logLine}>{log}</div>
            ))
          ) : (
            <div className={styles.logLine}>Waiting for logs...</div>
          )}
        </pre>
      </div>

      {status === 'failed' && errorMessage && (
        <div className={styles.errorSection}>
          <strong>Build Failed</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      {status === 'completed' && (
        <div className={styles.successSection}>
          <strong>Build Successful!</strong>
          <p>Your site has been deployed.</p>
        </div>
      )}

      {networkError && (
        <div className={styles.networkError}>
          <strong>{networkError}</strong>
          <button
            className={styles.retryButton}
            onClick={() => {
              consecutiveErrorsRef.current = 0;
              setNetworkError(null);
              isPollingRef.current = true;
              fetchStatus();
              pollIntervalRef.current = setInterval(() => {
                if (!isPollingRef.current) {
                  clearInterval(pollIntervalRef.current);
                  return;
                }
                fetchStatus();
              }, POLL_INTERVAL_MS);
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!isTerminal && !networkError && (
        <div className={styles.pollingIndicator}>
          Polling for updates...
        </div>
      )}
    </div>
  );
}
