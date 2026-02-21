import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ContentStats } from './ContentStats';
import { RecentActivityFeed } from './RecentActivityFeed';
import styles from './ContentDashboard.module.css';

export const ContentManagementDashboard = ({
  siteId = '',
  siteType = 'personal',
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

  const handleBuildNow = useCallback(() => {
    setBuildPolling(true);
    setBuildStatus((prev) => ({
      ...prev,
      isBuilding: true,
    }));

    // In a real app, trigger build via API
    // POST /api/sites/{siteId}/build

    // Auto-stop polling after 1 minute for demo
    setTimeout(() => {
      setBuildPolling(false);
      setBuildStatus((prev) => ({
        ...prev,
        isBuilding: false,
        lastBuildTime: 'just now',
      }));
    }, 60000);
  }, []);

  const handleActivityClick = useCallback((activity) => {
    if (onNavigate) {
      const path =
        activity.contentType === 'post'
          ? `/cms/posts/${activity.id}`
          : `/cms/pages/${activity.id}`;
      onNavigate('edit-content', { id: activity.id, path });
    }
  }, [onNavigate]);

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
      <section className={styles.buildStatusContainer} role="region" aria-label="Build Status">
        <h2 className={styles.sectionTitle}>Build Status</h2>
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
          <button
            className={`${styles.buildButton} ${buildStatus.isBuilding ? styles.disabled : ''}`}
            onClick={handleBuildNow}
            disabled={buildStatus.isBuilding}
            aria-label="Trigger site build"
          >
            {buildStatus.isBuilding ? 'Building...' : 'Build Now'}
          </button>
        </div>
      </section>

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
