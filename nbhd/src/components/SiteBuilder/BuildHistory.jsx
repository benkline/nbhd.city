import { useState, useEffect } from 'react';
import { BuildStatusPoller } from './BuildStatusPoller';
import styles from './BuildHistory.module.css';

/**
 * Helper: Format seconds to "5m 30s" format
 */
function formatDuration(totalSeconds) {
  if (!totalSeconds) return '-';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Helper: Format date to "Jan 31, 2026" format
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Helper: Truncate text with ellipsis
 */
function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * BuildStatusBadge - Status display with icon and color coding
 */
function BuildStatusBadge({ status }) {
  const config = {
    pending: { label: 'Pending', icon: '⏳', cssClass: styles.statusPending },
    running: { label: 'Running', icon: '⚙️', cssClass: styles.statusRunning },
    completed: { label: 'Completed', icon: '✅', cssClass: styles.statusCompleted },
    failed: { label: 'Failed', icon: '❌', cssClass: styles.statusFailed }
  };

  const { label, icon, cssClass } = config[status] || config.pending;

  return (
    <span className={`${styles.statusBadge} ${cssClass}`}>
      {icon}
    </span>
  );
}

/**
 * BuildRow - Single table row for a build
 */
function BuildRow({ build, onViewLogs }) {
  return (
    <tr className={styles.buildRow}>
      <td className={styles.statusCell}>
        <BuildStatusBadge status={build.status} />
        <span className={styles.statusLabel}>{build.status.charAt(0).toUpperCase() + build.status.slice(1)}</span>
      </td>
      <td className={styles.dateCell}>
        {formatDate(build.started_at)}
      </td>
      <td className={styles.durationCell}>
        {formatDuration(build.duration_seconds)}
      </td>
      <td className={styles.errorCell}>
        {build.error ? (
          <span
            className={styles.errorText}
            title={build.error}
          >
            {truncate(build.error, 50)}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td className={styles.actionsCell}>
        <button
          className={styles.viewLogsButton}
          onClick={() => onViewLogs(build)}
          aria-label={`View logs for build ${build.job_id}`}
        >
          View Logs
        </button>
      </td>
    </tr>
  );
}

/**
 * BuildHistory - Displays paginated table of past builds
 *
 * Props:
 *   siteId: string - Site ID to fetch builds for
 *   onViewLogs: function (optional) - Callback when "View Logs" clicked
 */
export function BuildHistory({ siteId, onViewLogs: onViewLogsCallback }) {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedBuild, setSelectedBuild] = useState(null);

  const BUILDS_PER_PAGE = 50;

  /**
   * Fetch builds from API
   */
  async function fetchBuilds() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sites/${siteId}/builds?limit=100`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Site not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this site');
        } else {
          throw new Error('Failed to load build history');
        }
      }

      const data = await response.json();
      setBuilds(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch builds:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch builds on mount
   */
  useEffect(() => {
    fetchBuilds();
  }, [siteId]);

  /**
   * Handle View Logs click
   */
  const handleViewLogs = (build) => {
    if (onViewLogsCallback) {
      onViewLogsCallback(build);
    } else {
      setSelectedBuild(build);
    }
  };

  /**
   * Calculate pagination
   */
  const paginatedBuilds = builds.slice(
    currentPage * BUILDS_PER_PAGE,
    (currentPage + 1) * BUILDS_PER_PAGE
  );
  const totalPages = Math.ceil(builds.length / BUILDS_PER_PAGE);
  const showPagination = builds.length > BUILDS_PER_PAGE;

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Build History</h3>
        <div className={styles.loadingState}>
          <p>Loading build history...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Build History</h3>
        <div className={styles.errorState} role="alert">
          <p className={styles.errorMessage}>{error}</p>
          <button
            className={styles.retryButton}
            onClick={fetchBuilds}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /**
   * Empty state
   */
  if (builds.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Build History</h3>
        <div className={styles.emptyState}>
          <p>No builds yet</p>
          <p className={styles.emptyDescription}>
            Deploy your site to see build history
          </p>
        </div>
      </div>
    );
  }

  /**
   * Main content with table
   */
  return (
    <>
      <div className={styles.container}>
        <h3 className={styles.title}>Build History</h3>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Error</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBuilds.map((build) => (
              <BuildRow
                key={build.job_id}
                build={build}
                onViewLogs={handleViewLogs}
              />
            ))}
          </tbody>
        </table>

        {showPagination && (
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              ← Previous
            </button>

            <span className={styles.pageInfo}>
              Page {currentPage + 1} of {totalPages}
            </span>

            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {selectedBuild && (
        <div className={styles.modalOverlay}>
          <BuildStatusPoller
            site={{ site_id: siteId, title: 'Build Logs' }}
            jobId={selectedBuild.job_id}
            onBuildComplete={() => setSelectedBuild(null)}
            onClose={() => setSelectedBuild(null)}
          />
        </div>
      )}
    </>
  );
}
