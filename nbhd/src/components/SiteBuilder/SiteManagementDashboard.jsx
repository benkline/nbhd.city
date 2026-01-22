import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SiteManagementDashboard.module.css';

/**
 * Displays site status badge
 */
function StatusBadge({ status }) {
  const statusClass = {
    draft: styles.statusDraft,
    building: styles.statusBuilding,
    published: styles.statusPublished
  }[status] || styles.statusDraft;

  return <span className={`${styles.status} ${statusClass}`}>{status}</span>;
}

/**
 * Displays a single site card
 */
function SiteCard({ site, onEdit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(site.site_id);
    setShowConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{site.title}</h3>
          <StatusBadge status={site.status} />
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.info}>
          <label>Template:</label>
          <span>{site.template}</span>
        </div>
        <div className={styles.info}>
          <label>URL:</label>
          <span className={styles.url}>{site.public_url.replace('https://', '')}</span>
        </div>
        <div className={styles.info}>
          <label>Subdomain:</label>
          <span>{site.subdomain}</span>
        </div>
        <div className={styles.info}>
          <label>Created:</label>
          <span className={styles.date}>
            {new Date(site.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className={styles.cardActions}>
        {site.status === 'published' && (
          <a
            href={site.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewLiveLink}
          >
            View Live
          </a>
        )}
        <button
          className={styles.editButton}
          onClick={() => onEdit(site)}
        >
          Edit
        </button>
        {!showConfirm && (
          <button
            className={styles.deleteButton}
            onClick={handleDeleteClick}
          >
            Delete
          </button>
        )}
        {showConfirm && (
          <div className={styles.confirmDialog}>
            <p>Are you sure you want to delete "{site.title}"?</p>
            <div className={styles.confirmButtons}>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmDelete}
              >
                Confirm
              </button>
              <button
                className={styles.cancelButton}
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SiteManagementDashboard - Displays and manages user's sites
 */
export function SiteManagementDashboard({ onEdit, onDelete: onDeleteCallback }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/sites');

        if (!response.ok) {
          throw new Error('Failed to fetch sites');
        }

        const data = await response.json();
        setSites(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const handleEdit = (site) => {
    if (onEdit) {
      onEdit(site);
    } else {
      navigate(`/site-editor/${site.site_id}`);
    }
  };

  const handleDelete = async (siteId) => {
    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete site');
      }

      // Remove site from local list
      setSites(sites.filter(s => s.site_id !== siteId));

      // Call callback if provided
      if (onDeleteCallback) {
        onDeleteCallback(siteId);
      }
    } catch (err) {
      setError(`Error deleting site: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>My Sites</h1>
        <div className={styles.loadingState}>Loading your sites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>My Sites</h1>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className={styles.container}>
        <h1>My Sites</h1>
        <div className={styles.emptyState}>
          <p>No sites yet</p>
          <p className={styles.emptyDescription}>
            Create your first static site to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>My Sites</h1>
      <p className={styles.subtitle}>Manage your static sites</p>

      <div className={styles.grid}>
        {sites.map(site => (
          <SiteCard
            key={site.site_id}
            site={site}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
