import PropTypes from 'prop-types';
import styles from './ContentDashboard.module.css';

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getContentTypeIcon = (type) => {
  switch (type) {
    case 'post':
      return '📝';
    case 'page':
      return '📄';
    case 'menu':
      return '☰';
    default:
      return '📋';
  }
};

export const RecentActivityFeed = ({
  activities = [],
  onActivityClick = null,
  maxItems = 10,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <section
        className={styles.activityContainer}
        role="region"
        aria-label="Recent Activity"
      >
        <h2 className={styles.activityTitle}>Recent Activity</h2>
        <p className={styles.emptyState}>No recent activity yet</p>
      </section>
    );
  }

  const handleActivityClick = (activity) => {
    if (onActivityClick) {
      onActivityClick(activity);
    }
  };

  return (
    <section
      className={styles.activityContainer}
      role="region"
      aria-label="Recent Activity"
    >
      <h2 className={styles.activityTitle}>Recent Activity</h2>
      <ul className={styles.activityList}>
        {displayActivities.map((activity, index) => (
          <li
            key={activity.id || index}
            className={styles.activityItem}
            onClick={() => handleActivityClick(activity)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleActivityClick(activity);
              }
            }}
          >
            <div className={styles.activityAvatar}>
              {activity.avatar ? (
                <img
                  src={activity.avatar}
                  alt={`${activity.authorName || 'User'} avatar`}
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {(activity.authorName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className={styles.activityContent}>
              <div className={styles.activityHeader}>
                <div className={styles.activityMeta}>
                  <span className={styles.contentTypeIcon}>
                    {getContentTypeIcon(activity.contentType)}
                  </span>
                  <span className={styles.authorName}>
                    {activity.authorName || 'Unknown'}
                  </span>
                  <span className={styles.activityAction}>
                    {activity.action === 'created' ? 'created' : 'edited'}
                  </span>
                </div>
                <span className={styles.timestamp}>
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
              <p className={styles.activityTitle}>{activity.title}</p>
            </div>

            <div className={styles.activityIndicator} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </section>
  );
};

RecentActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      authorName: PropTypes.string,
      avatar: PropTypes.string,
      action: PropTypes.oneOf(['created', 'edited']),
      contentType: PropTypes.oneOf(['post', 'page', 'menu', 'settings']),
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    })
  ),
  onActivityClick: PropTypes.func,
  maxItems: PropTypes.number,
};

RecentActivityFeed.displayName = 'RecentActivityFeed';
