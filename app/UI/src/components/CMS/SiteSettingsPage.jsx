import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../../lib/api';
import styles from './SiteSettings.module.css';

/**
 * SiteSettingsPage - Edit site settings (title, tagline, visibility)
 * Works with PUT /api/sites/{siteId} endpoint (SSG-034)
 */
export const SiteSettingsPage = ({ siteId, site = {} }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    title: site.title || '',
    tagline: site.tagline || '',
    visibility: site.visibility || 'private'
  });

  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState(null);

  useEffect(() => {
    setFormData({
      title: site.title || '',
      tagline: site.tagline || '',
      visibility: site.visibility || 'private'
    });
  }, [site]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    setError(null);
    setSuccess(false);
  };

  const handleVisibilityChange = (newVisibility) => {
    if (newVisibility !== formData.visibility) {
      setPendingVisibility(newVisibility);
      setShowVisibilityConfirm(true);
    }
  };

  const confirmVisibilityChange = () => {
    setFormData(prev => ({ ...prev, visibility: pendingVisibility }));
    setShowVisibilityConfirm(false);
    setPendingVisibility(null);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put(`/api/sites/${siteId}`, {
        title: formData.title,
        tagline: formData.tagline,
        visibility: formData.visibility
      });

      if (response.status === 200) {
        setSuccess(true);
        setIsDirty(false);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: site.title || '',
      tagline: site.tagline || '',
      visibility: site.visibility || 'private'
    });
    setIsDirty(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className={styles.settingsPage}>
      <h2>Site Settings</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>Settings saved successfully</div>}

      {/* Basic Info Section */}
      <section className={styles.section}>
        <h3>Basic Information</h3>
        <div className={styles.formGroup}>
          <label htmlFor="title">Site Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="My Blog"
            maxLength={100}
          />
          <p className={styles.hint}>The name of your website</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tagline">Tagline</label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            value={formData.tagline}
            onChange={handleInputChange}
            placeholder="My thoughts and ideas"
            maxLength={200}
          />
          <p className={styles.hint}>A brief description of your site</p>
        </div>

        {site.slug && (
          <div className={styles.formGroup}>
            <label>Site URL</label>
            <div className={styles.readOnly}>
              <code>https://{site.slug}.nbhd.city</code>
            </div>
            <p className={styles.hint}>Your unique site address (cannot be changed)</p>
          </div>
        )}
      </section>

      {/* Visibility Section */}
      <section className={styles.section}>
        <h3>Visibility & Access</h3>
        <div className={styles.formGroup}>
          <fieldset>
            <legend>Who can see your site?</legend>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={() => handleVisibilityChange('public')}
                />
                <span>Public</span>
                <span className={styles.description}>Everyone can view your site</span>
              </label>
              <label>
                <input
                  type="radio"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={() => handleVisibilityChange('private')}
                />
                <span>Private</span>
                <span className={styles.description}>Only you can view your site</span>
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      {/* Template Info Section */}
      {site.template && (
        <section className={styles.section}>
          <h3>Template Information</h3>
          <div className={styles.infoGroup}>
            <div className={styles.infoPair}>
              <span className={styles.label}>Template:</span>
              <span className={styles.value}>{site.template}</span>
            </div>
            {site.created_at && (
              <div className={styles.infoPair}>
                <span className={styles.label}>Created:</span>
                <span className={styles.value}>
                  {new Date(site.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <p className={styles.hint}>Template information cannot be changed. Create a new site to use a different template.</p>
        </section>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          className={styles.cancelButton}
          onClick={handleCancel}
          disabled={!isDirty}
        >
          Cancel
        </button>
      </div>

      {/* Visibility Confirmation Modal */}
      {showVisibilityConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h4>Change Site Visibility?</h4>
            <p>
              You're changing your site from {formData.visibility} to {pendingVisibility}. Continue?
            </p>
            <div className={styles.modalActions}>
              <button onClick={confirmVisibilityChange} className={styles.confirmButton}>
                Yes, Change
              </button>
              <button onClick={() => setShowVisibilityConfirm(false)} className={styles.cancelButton}>
                Keep {formData.visibility}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SiteSettingsPage.propTypes = {
  siteId: PropTypes.string.isRequired,
  site: PropTypes.shape({
    title: PropTypes.string,
    tagline: PropTypes.string,
    visibility: PropTypes.string,
    template: PropTypes.string,
    slug: PropTypes.string,
    created_at: PropTypes.string
  })
};

export default SiteSettingsPage;
