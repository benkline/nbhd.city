import React, { useState, useEffect } from 'react';
import { nbhdContentService } from '../services/nbhdContentService';
import styles from './AnnouncementManager.module.css';

export function AnnouncementManager({ nbhdId, onUnsavedChanges }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ offset: 0, limit: 10, total: 0 });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    pinned: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load announcements
  useEffect(() => {
    fetchAnnouncements();
  }, [nbhdId]);

  const fetchAnnouncements = async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await nbhdContentService.getAnnouncements(nbhdId, 10, offset);
      setAnnouncements(response.data);
      setPagination(response.meta.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load announcements');
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (formData.title.length > 200) {
      errors.title = 'Title must be 200 characters or less';
    }
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    if (formData.content.length > 5000) {
      errors.content = 'Content must be 5000 characters or less';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setFormErrors({});

      await nbhdContentService.createAnnouncement(nbhdId, {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        pinned: formData.pinned
      });

      // Clear form and refresh
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        pinned: false
      });
      await fetchAnnouncements(0);

      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to create announcement');
      console.error('Error creating announcement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rkey) => {
    if (!window.confirm('Delete this announcement?')) {
      return;
    }

    try {
      setError(null);
      await nbhdContentService.deleteAnnouncement(nbhdId, rkey);
      await fetchAnnouncements(pagination.offset);

      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete announcement');
      console.error('Error deleting announcement:', err);
    }
  };

  const handleLoadMore = () => {
    fetchAnnouncements(pagination.offset + pagination.limit);
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorAlert}>{error}</div>
      )}

      {/* Create Form */}
      <div className={styles.formSection}>
        <h3>Create Announcement</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              placeholder="Announcement title"
              maxLength="200"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className={formErrors.title ? styles.inputError : ''}
            />
            {formErrors.title && (
              <div className={styles.fieldError}>{formErrors.title}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              placeholder="Announcement content"
              maxLength="5000"
              rows="5"
              value={formData.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              className={formErrors.content ? styles.inputError : ''}
            />
            {formErrors.content && (
              <div className={styles.fieldError}>{formErrors.content}</div>
            )}
            <small className={styles.charCount}>
              {formData.content.length}/5000 characters
            </small>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="pinned" className={styles.checkboxLabel}>
                <input
                  id="pinned"
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => handleFieldChange('pinned', e.target.checked)}
                />
                Pin to top
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Creating...' : 'Create Announcement'}
          </button>
        </form>
      </div>

      {/* Announcements List */}
      <div className={styles.listSection}>
        <h3>Announcements</h3>
        {loading ? (
          <div className={styles.loading}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className={styles.empty}>No announcements yet</div>
        ) : (
          <>
            <div className={styles.list}>
              {announcements.map((announcement) => (
                <div key={announcement.rkey} className={styles.announcementCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.titleSection}>
                      <h4 className={styles.announcementTitle}>{announcement.title}</h4>
                      <div className={styles.badges}>
                        <span className={`${styles.badge} ${styles[`priority-${announcement.priority || 'normal'}`]}`}>
                          {announcement.priority || 'normal'}
                        </span>
                        {announcement.pinned && (
                          <span className={`${styles.badge} ${styles.pinned}`}>Pinned</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(announcement.rkey)}
                      className={styles.deleteButton}
                      title="Delete announcement"
                    >
                      ✕
                    </button>
                  </div>
                  <p className={styles.content}>{announcement.content}</p>
                  <div className={styles.meta}>
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            {pagination.total > pagination.offset + pagination.limit && (
              <button
                onClick={handleLoadMore}
                className={styles.loadMoreButton}
              >
                Load More ({pagination.offset + pagination.limit} of {pagination.total})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
