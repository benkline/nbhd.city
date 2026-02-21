import styles from './SiteSettingsManager.module.css';

/**
 * GeneralSettings - General site settings tab
 * Site title, description, author, URL, logo, favicon
 */
export function GeneralSettings({ settings, onChange }) {
  const handleInputChange = (field, value) => {
    onChange({
      [field]: value
    });
  };

  return (
    <div className={styles.settingsForm}>
      <h2>General Settings</h2>

      {/* Site Title */}
      <div className={styles.formGroup}>
        <label htmlFor="title" className={styles.label}>
          Site Title <span className={styles.required}>*</span>
        </label>
        <input
          id="title"
          type="text"
          value={settings.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter your site title"
          maxLength={100}
          className={styles.input}
          required
        />
        <small className={styles.hint}>
          {(settings.title || '').length} / 100 characters
        </small>
      </div>

      {/* Site Description */}
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Site Description
        </label>
        <textarea
          id="description"
          value={settings.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description of your site"
          maxLength={500}
          rows={4}
          className={styles.textarea}
        />
        <small className={styles.hint}>
          {(settings.description || '').length} / 500 characters
        </small>
      </div>

      {/* Author Name */}
      <div className={styles.formGroup}>
        <label htmlFor="author" className={styles.label}>
          Author Name
        </label>
        <input
          id="author"
          type="text"
          value={settings.author || ''}
          onChange={(e) => handleInputChange('author', e.target.value)}
          placeholder="Your name"
          className={styles.input}
        />
      </div>

      {/* Site URL (read-only) */}
      <div className={styles.formGroup}>
        <label htmlFor="siteUrl" className={styles.label}>
          Site URL
        </label>
        <input
          id="siteUrl"
          type="text"
          value={settings.siteUrl || ''}
          disabled
          className={styles.input}
          title="This URL is generated from your site's subdomain"
        />
        <small className={styles.hint}>
          Generated from your site's subdomain (read-only)
        </small>
      </div>

      {/* Logo URL */}
      <div className={styles.formGroup}>
        <label htmlFor="logo" className={styles.label}>
          Logo URL
        </label>
        <input
          id="logo"
          type="url"
          value={settings.logo || ''}
          onChange={(e) => handleInputChange('logo', e.target.value)}
          placeholder="https://example.com/logo.png"
          className={styles.input}
        />
        <small className={styles.hint}>
          Full URL to your site's logo image
        </small>
        {settings.logo && (
          <div className={styles.preview}>
            <img
              src={settings.logo}
              alt="Logo preview"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              style={{ maxWidth: '100px', maxHeight: '100px' }}
            />
          </div>
        )}
      </div>

      {/* Favicon */}
      <div className={styles.formGroup}>
        <label htmlFor="favicon" className={styles.label}>
          Favicon URL
        </label>
        <input
          id="favicon"
          type="url"
          value={settings.favicon || ''}
          onChange={(e) => handleInputChange('favicon', e.target.value)}
          placeholder="https://example.com/favicon.ico"
          className={styles.input}
        />
        <small className={styles.hint}>
          Full URL to your site's favicon (16x16 or 32x32 PNG/ICO)
        </small>
      </div>
    </div>
  );
}
