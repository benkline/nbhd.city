import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ContentStats } from './ContentStats';
import { RecentActivityFeed } from './RecentActivityFeed';
import { BuildTriggerButton } from '../SiteBuilder/BuildTriggerButton';
import { BuildStatusPoller } from '../SiteBuilder/BuildStatusPoller';
import { BuildHistory } from '../SiteBuilder/BuildHistory';
import styles from './ContentDashboard.module.css';

export const ContentManagementDashboard = ({
  siteId = '',
  siteType = 'personal',
  contentTypes = {},
  onNavigate = null,
  onPoll = null,
  loading = false,
  error = null,
  scheduledBuild = false,
}) => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    totalPages: 0,
  });

  const [activities, setActivities] = useState([]);
  const [buildStatus, setBuildStatus] = useState({
    lastBuild: null,
    isBuilding: false,
    lastBuildTime: '2 hours ago',
  });

  const [statusFilter, setStatusFilter] = useState(null);
  const [buildPolling, setBuildPolling] = useState(false);
  const [activeBuildJobId, setActiveBuildJobId] = useState(null);
  const [buildResults, setBuildResults] = useState(null);
  const [showBuildSuccess, setShowBuildSuccess] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, fetch from /api/sites/{siteId}/stats
        // For now, using mock data
        setStats({
          totalPosts: 12,
          publishedPosts: 8,
          draftPosts: 3,
          scheduledPosts: 1,
          totalPages: 5,
        });

        // Fetch recent activity
        setActivities([
          {
            id: '1',
            title: 'Getting Started with 11ty',
            authorName: 'Alice',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            action: 'created',
            contentType: 'post',
            timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
          },
          {
            id: '2',
            title: 'About Me',
            authorName: 'Alice',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            action: 'edited',
            contentType: 'page',
            timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
          },
          {
            id: '3',
            title: 'My First Post',
            authorName: 'Bob',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
            action: 'created',
            contentType: 'post',
            timestamp: new Date(Date.now() - 5 * 60 * 60000), // 5 hours ago
          },
          {
            id: '4',
            title: 'Main Navigation',
            authorName: 'Alice',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            action: 'edited',
            contentType: 'menu',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60000), // 1 day ago
          },
          {
            id: '5',
            title: 'Contact Page',
            authorName: 'Alice',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            action: 'created',
            contentType: 'page',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000), // 2 days ago
          },
        ]);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, [siteId]);

  // Poll build status every 10 seconds when building
  useEffect(() => {
    if (!buildPolling) return;

    const pollInterval = setInterval(() => {
      if (onPoll) {
        onPoll();
      }
      // Check if build is complete (in a real app, fetch from API)
      // For demo purposes, stop after 30 seconds
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [buildPolling, onPoll]);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    // In a real app, filter activities by status
  }, []);

  const handleQuickAction = useCallback(
    (action) => {
      if (onNavigate) {
        onNavigate(action);
      }
      // In a real app, navigate to:
      // - 'new-post' -> /cms/posts/new
      // - 'new-page' -> /cms/pages/new
      // - 'manage-menu' -> /cms/menus
      // - 'site-settings' -> /cms/settings
    },
    [onNavigate]
  );


  const handleActivityClick = useCallback((activity) => {
    if (onNavigate) {
      const path =
        activity.contentType === 'post'
          ? `/cms/posts/${activity.id}`
          : `/cms/pages/${activity.id}`;
      onNavigate('edit-content', { id: activity.id, path });
    }
  }, [onNavigate]);

  const handleBuildTriggered = useCallback((jobId) => {
    setActiveBuildJobId(jobId);
    setBuildStatus(prev => ({
      ...prev,
      isBuilding: true
    }));
  }, []);

  const handleBuildComplete = useCallback((result) => {
    setBuildResults(result);
    setBuildStatus(prev => ({
      ...prev,
      isBuilding: false,
      lastBuildTime: 'just now'
    }));
    setShowBuildSuccess(result.status === 'completed');
    setActiveBuildJobId(null);
  }, []);

  const handleBuildPollerClose = useCallback(() => {
    setActiveBuildJobId(null);
  }, []);

  if (error) {
    return (
      <main className={styles.dashboard} role="main">
        <div className={styles.errorContainer}>
          <p className={styles.error}>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.dashboard} role="main">
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Content Management</h1>
        <p className={styles.subtitle}>
          {siteType === 'neighborhood'
            ? 'Manage your neighborhood content'
            : 'Manage your site content'}
        </p>
      </header>

      {/* Stats Section */}
      <ContentStats
        totalPosts={stats.totalPosts}
        publishedPosts={stats.publishedPosts}
        draftPosts={stats.draftPosts}
        scheduledPosts={stats.scheduledPosts}
        totalPages={stats.totalPages}
        onStatusFilterChange={handleStatusFilter}
      />

      {/* Quick Actions */}
      <section className={styles.quickActionsContainer}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          {/* Dynamic content type buttons (SSG-033) */}
          {Object.entries(contentTypes).map(([typeName, typeInfo]) => {
            const isPrimary = typeInfo.is_primary;
            const icons = {
              'post': '📝',
              'showcase': '🎨',
              'page': '📄',
              'default': '✍️'
            };
            const icon = icons[typeName] || icons['default'];
            const displayName = typeName.charAt(0).toUpperCase() + typeName.slice(1);

            return isPrimary ? (
              <button
                key={`new-${typeName}`}
                className={styles.actionButton}
                onClick={() => handleQuickAction(`new-${typeName}`)}
                aria-label={`Create a new ${typeName}`}
              >
                <span className={styles.buttonIcon}>{icon}</span>
                <span>New {displayName}</span>
              </button>
            ) : null;
          })}

          {/* Fallback buttons if no content types */}
          {Object.keys(contentTypes).length === 0 && (
            <>
              <button
                className={styles.actionButton}
                onClick={() => handleQuickAction('new-post')}
                aria-label="Create a new post"
              >
                <span className={styles.buttonIcon}>📝</span>
                <span>New Post</span>
              </button>
              <button
                className={styles.actionButton}
                onClick={() => handleQuickAction('new-page')}
                aria-label="Create a new page"
              >
                <span className={styles.buttonIcon}>📄</span>
                <span>New Page</span>
              </button>
            </>
          )}

          <button
            className={styles.actionButton}
            onClick={() => handleQuickAction('manage-menu')}
            aria-label="Manage site menu"
          >
            <span className={styles.buttonIcon}>☰</span>
            <span>Manage Menu</span>
          </button>
          <button
            className={styles.actionButton}
            onClick={() => handleQuickAction('site-settings')}
            aria-label="Open site settings"
          >
            <span className={styles.buttonIcon}>⚙️</span>
            <span>Site Settings</span>
          </button>
        </div>
      </section>

      {/* Build Status Section */}
      <section className={styles.buildStatusContainer} role="region" aria-label="Build & Deploy">
        <h2 className={styles.sectionTitle}>Build & Deploy</h2>
        <div className={styles.buildStatus}>
          <div className={styles.buildInfo}>
            <div className={styles.statusIndicator}>
              <span
                className={`${styles.statusDot} ${
                  buildStatus.isBuilding ? styles.building : styles.idle
                }`}
              />
              <span className={styles.statusText}>
                {buildStatus.isBuilding ? 'Building...' : 'Ready to build'}
              </span>
            </div>
            <p className={styles.buildTime}>Last build: {buildStatus.lastBuildTime}</p>
            {scheduledBuild && (
              <p className={styles.scheduledBuild}>Next scheduled build: in 1 hour</p>
            )}
          </div>
          <BuildTriggerButton
            site={{ site_id: siteId, status: buildStatus.isBuilding ? 'building' : 'ready' }}
            onBuildTriggered={handleBuildTriggered}
          />
        </div>

        {/* Build Success Message */}
        {showBuildSuccess && buildResults && (
          <div className={styles.successMessage} role="alert">
            <div className={styles.successContent}>
              <p className={styles.successIcon}>✅</p>
              <div className={styles.successText}>
                <h3>Deployment Successful!</h3>
                <p>Your site is now live.</p>
                {buildResults.deployment_url && (
                  <p className={styles.siteUrl}>
                    Live at:{' '}
                    <a
                      href={buildResults.deployment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.urlLink}
                    >
                      {buildResults.deployment_url}
                    </a>
                  </p>
                )}
              </div>
              <button
                className={styles.closeSuccess}
                onClick={() => setShowBuildSuccess(false)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Build History Section */}
      {siteId && (
        <section className={styles.buildHistoryContainer} role="region" aria-label="Build History">
          <BuildHistory siteId={siteId} />
        </section>
      )}

      {/* Recent Activity Section */}
      <RecentActivityFeed
        activities={activities}
        onActivityClick={handleActivityClick}
        maxItems={10}
      />

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <p>Loading dashboard...</p>
        </div>
      )}

      {/* Active Build Status Modal */}
      {activeBuildJobId && (
        <div className={styles.buildModal}>
          <BuildStatusPoller
            site={{ site_id: siteId, title: siteType === 'neighborhood' ? 'Neighborhood Site' : 'Personal Site' }}
            jobId={activeBuildJobId}
            onBuildComplete={handleBuildComplete}
            onClose={handleBuildPollerClose}
          />
        </div>
      )}
    </main>
  );
};

ContentManagementDashboard.propTypes = {
  siteId: PropTypes.string,
  siteType: PropTypes.oneOf(['personal', 'neighborhood']),
  onNavigate: PropTypes.func,
  onPoll: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  scheduledBuild: PropTypes.bool,
};

ContentManagementDashboard.displayName = 'ContentManagementDashboard';
