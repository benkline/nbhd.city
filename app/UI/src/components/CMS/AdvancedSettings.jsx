import { FormField } from '../common/FormField';
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

  const timezoneOptions = timezones.map(tz => ({ value: tz, label: tz }));
  timezoneOptions.unshift({ value: 'UTC', label: 'UTC' });

  const commentOptions = [
    { value: 'disabled', label: 'Disabled' },
    { value: 'form-based', label: 'Form-based (email notifications)' },
    { value: 'disqus', label: 'Disqus' },
    { value: 'utterances', label: 'Utterances (GitHub)' }
  ];

  return (
    <div className={styles.settingsForm}>
      <h2>Advanced Settings</h2>

      <FormField
        label="Analytics Code"
        id="analyticsCode"
        type="textarea"
        value={settings.analyticsCode || ''}
        onChange={(val) => handleInputChange('analyticsCode', val)}
        placeholder="Paste your Google Analytics or Plausible script here"
        rows={4}
        helperText="Paste entire script tag from Google Analytics, Plausible, or similar service"
      />

      <FormField
        label="Custom CSS"
        id="customCss"
        type="textarea"
        value={settings.customCss || ''}
        onChange={(val) => handleInputChange('customCss', val)}
        placeholder="body { font-family: serif; }"
        rows={6}
        helperText="Custom CSS rules injected into your site's head"
      />

      <FormField
        label="Custom HTML (Footer)"
        id="customHtml"
        type="textarea"
        value={settings.customHtml || ''}
        onChange={(val) => handleInputChange('customHtml', val)}
        placeholder="Custom HTML injected in footer"
        rows={4}
        helperText="HTML injected before closing &lt;/body&gt; tag (for tracking pixels, etc.)"
      />

      <FormField
        label="Timezone"
        id="timezone"
        type="select"
        value={settings.timezone || 'UTC'}
        onChange={(val) => handleInputChange('timezone', val)}
        options={timezoneOptions}
        helperText="Affects post timestamps and scheduling"
      />

      <FormField
        label="Comments System"
        id="comments"
        type="select"
        value={settings.commentsEnabled || 'disabled'}
        onChange={(val) => handleInputChange('commentsEnabled', val)}
        options={commentOptions}
        helperText="Choose how readers can comment on your posts"
      />

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
