import styles from './SiteSettingsManager.module.css';

/**
 * AdvancedSettings - Advanced settings tab
 * Analytics code, custom CSS, custom HTML, timezone, comments
 */
export function AdvancedSettings({ settings, onChange }) {
  const handleInputChange = (field, value) => {
    onChange({
      [field]: value
    });
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane'
  ];

  return (
    <div className={styles.settingsForm}>
      <h2>Advanced Settings</h2>

      {/* Analytics Code */}
      <div className={styles.formGroup}>
        <label htmlFor="analyticsCode" className={styles.label}>
          Analytics Code
        </label>
        <textarea
          id="analyticsCode"
          value={settings.analyticsCode || ''}
          onChange={(e) => handleInputChange('analyticsCode', e.target.value)}
          placeholder="Paste your Google Analytics or Plausible script here"
          rows={4}
          className={styles.textarea}
        />
        <small className={styles.hint}>
          Paste entire script tag from Google Analytics, Plausible, or similar service
        </small>
      </div>

      {/* Custom CSS */}
      <div className={styles.formGroup}>
        <label htmlFor="customCss" className={styles.label}>
          Custom CSS
        </label>
        <textarea
          id="customCss"
          value={settings.customCss || ''}
          onChange={(e) => handleInputChange('customCss', e.target.value)}
          placeholder="body { font-family: serif; }"
          rows={6}
          className={styles.textarea}
          spellCheck="false"
        />
        <small className={styles.hint}>
          Custom CSS rules injected into your site's head
        </small>
      </div>

      {/* Custom HTML in Footer */}
      <div className={styles.formGroup}>
        <label htmlFor="customHtml" className={styles.label}>
          Custom HTML (Footer)
        </label>
        <textarea
          id="customHtml"
          value={settings.customHtml || ''}
          onChange={(e) => handleInputChange('customHtml', e.target.value)}
          placeholder="Custom HTML injected in footer"
          rows={4}
          className={styles.textarea}
          spellCheck="false"
        />
        <small className={styles.hint}>
          HTML injected before closing &lt;/body&gt; tag (for tracking pixels, etc.)
        </small>
      </div>

      {/* Timezone */}
      <div className={styles.formGroup}>
        <label htmlFor="timezone" className={styles.label}>
          Timezone
        </label>
        <select
          id="timezone"
          value={settings.timezone || 'UTC'}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
          className={styles.select}
        >
          <option value="UTC">UTC</option>
          {timezones.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <small className={styles.hint}>
          Affects post timestamps and scheduling
        </small>
      </div>

      {/* Comments Setting */}
      <div className={styles.formGroup}>
        <label htmlFor="comments" className={styles.label}>
          Comments System
        </label>
        <select
          id="comments"
          value={settings.commentsEnabled || 'disabled'}
          onChange={(e) => handleInputChange('commentsEnabled', e.target.value)}
          className={styles.select}
        >
          <option value="disabled">Disabled</option>
          <option value="form-based">Form-based (email notifications)</option>
          <option value="disqus">Disqus</option>
          <option value="utterances">Utterances (GitHub)</option>
        </select>
        <small className={styles.hint}>
          Choose how readers can comment on your posts
        </small>
      </div>

      {/* Read-only Info Section */}
      <div className={styles.section}>
        <h3>Site Information (Read-only)</h3>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Site Record Type:</label>
            <value>{settings.recordType || 'app.nbhd.site'}</value>
          </div>

          <div className={styles.infoItem}>
            <label>Build Count:</label>
            <value>{settings.buildCount || 0}</value>
          </div>

          <div className={styles.infoItem}>
            <label>Storage Used:</label>
            <value>{settings.storageUsed ? formatBytes(settings.storageUsed) : 'N/A'}</value>
          </div>

          {settings.lastBuildTime && (
            <div className={styles.infoItem}>
              <label>Last Build:</label>
              <value>{new Date(settings.lastBuildTime).toLocaleString()}</value>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
