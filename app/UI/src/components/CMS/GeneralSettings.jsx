import { FormField } from '../common/FormField';
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

      <FormField
        label="Site Title"
        id="title"
        type="text"
        value={settings.title || ''}
        onChange={(val) => handleInputChange('title', val)}
        placeholder="Enter your site title"
        maxLength={100}
        helperText={`${(settings.title || '').length} / 100 characters`}
        required
      />

      <FormField
        label="Site Description"
        id="description"
        type="textarea"
        value={settings.description || ''}
        onChange={(val) => handleInputChange('description', val)}
        placeholder="Brief description of your site"
        maxLength={500}
        rows={4}
        helperText={`${(settings.description || '').length} / 500 characters`}
      />

      <FormField
        label="Author Name"
        id="author"
        type="text"
        value={settings.author || ''}
        onChange={(val) => handleInputChange('author', val)}
        placeholder="Your name"
      />

      <FormField
        label="Site URL"
        id="siteUrl"
        type="text"
        value={settings.siteUrl || ''}
        disabled
        helperText="Generated from your site's subdomain (read-only)"
      />

      <div>
        <FormField
          label="Logo URL"
          id="logo"
          type="url"
          value={settings.logo || ''}
          onChange={(val) => handleInputChange('logo', val)}
          placeholder="https://example.com/logo.png"
          helperText="Full URL to your site's logo image"
        />
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

      <FormField
        label="Favicon URL"
        id="favicon"
        type="url"
        value={settings.favicon || ''}
        onChange={(val) => handleInputChange('favicon', val)}
        placeholder="https://example.com/favicon.ico"
        helperText="Full URL to your site's favicon (16x16 or 32x32 PNG/ICO)"
      />
    </div>
  );
}
