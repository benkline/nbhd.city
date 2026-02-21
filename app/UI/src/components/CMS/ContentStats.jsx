import PropTypes from 'prop-types';
import styles from './ContentDashboard.module.css';

export const ContentStats = ({
  totalPosts = 0,
  publishedPosts = 0,
  draftPosts = 0,
  scheduledPosts = 0,
  totalPages = 0,
  onStatusFilterChange = null,
}) => {
  const stats = [
    {
      id: 'total',
      label: 'Total Posts',
      value: totalPosts,
      icon: '📝',
      color: 'blue',
      ariaLabel: `Total posts: ${totalPosts}`,
    },
    {
      id: 'published',
      label: 'Published',
      value: publishedPosts,
      icon: '✓',
      badgeColor: 'green',
      status: 'published',
      ariaLabel: `Published posts: ${publishedPosts}`,
    },
    {
      id: 'draft',
      label: 'Draft',
      value: draftPosts,
      icon: '✎',
      badgeColor: 'yellow',
      status: 'draft',
      ariaLabel: `Draft posts: ${draftPosts}`,
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      value: scheduledPosts,
      icon: '🗓️',
      badgeColor: 'blue',
      status: 'scheduled',
      ariaLabel: `Scheduled posts: ${scheduledPosts}`,
    },
    {
      id: 'pages',
      label: 'Pages',
      value: totalPages,
      icon: '📄',
      color: 'purple',
      ariaLabel: `Total pages: ${totalPages}`,
    },
  ];

  const handleStatClick = (stat) => {
    if (stat.status && onStatusFilterChange) {
      onStatusFilterChange(stat.status);
    }
  };

  return (
    <section
      className={styles.statsContainer}
      role="region"
      aria-label="Content Statistics"
    >
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div
            key={stat.id}
            className={`${styles.statCard} ${styles[`stat-${stat.badgeColor || stat.color}`]}`}
            onClick={() => handleStatClick(stat)}
            role="region"
            aria-label={stat.ariaLabel}
            tabIndex={stat.status ? 0 : -1}
            onKeyPress={(e) => {
              if (stat.status && (e.key === 'Enter' || e.key === ' ')) {
                handleStatClick(stat);
              }
            }}
          >
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
            {stat.badgeColor && (
              <div
                className={`${styles.statusBadge} ${styles[`badge-${stat.badgeColor}`]}`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

ContentStats.propTypes = {
  totalPosts: PropTypes.number,
  publishedPosts: PropTypes.number,
  draftPosts: PropTypes.number,
  scheduledPosts: PropTypes.number,
  totalPages: PropTypes.number,
  onStatusFilterChange: PropTypes.func,
};

ContentStats.displayName = 'ContentStats';
