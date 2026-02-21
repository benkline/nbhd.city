import styles from './SiteSettingsManager.module.css';

/**
 * SEOSettings - SEO settings tab
 * Meta title, description, keywords, OG image, social links, robots.txt, sitemap
 */
export function SEOSettings({ settings, onChange }) {
  const handleInputChange = (field, value) => {
    onChange({
      [field]: value
    });
  };

  const handleSocialLinkChange = (platform, value) => {
    const socialLinks = settings.socialLinks || {};
    onChange({
      socialLinks: {
        ...socialLinks,
        [platform]: value
      }
    });
  };

  return (
    <div className={styles.settingsForm}>
      <h2>SEO Settings</h2>

      {/* Meta Title */}
      <div className={styles.formGroup}>
        <label htmlFor="metaTitle" className={styles.label}>
          Meta Title
        </label>
        <input
          id="metaTitle"
          type="text"
          value={settings.metaTitle || ''}
          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
          placeholder="Homepage title for search engines"
          maxLength={60}
          className={styles.input}
        />
        <small className={styles.hint}>
          {(settings.metaTitle || '').length} / 60 characters (recommended)
        </small>
      </div>

      {/* Meta Description */}
      <div className={styles.formGroup}>
        <label htmlFor="metaDescription" className={styles.label}>
          Meta Description
        </label>
        <textarea
          id="metaDescription"
          value={settings.metaDescription || ''}
          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
          placeholder="Homepage description for search engines"
          maxLength={160}
          rows={3}
          className={styles.textarea}
        />
        <small className={styles.hint}>
          {(settings.metaDescription || '').length} / 160 characters (recommended)
        </small>
      </div>

      {/* Keywords */}
      <div className={styles.formGroup}>
        <label htmlFor="keywords" className={styles.label}>
          Keywords
        </label>
        <input
          id="keywords"
          type="text"
          value={settings.keywords || ''}
          onChange={(e) => handleInputChange('keywords', e.target.value)}
          placeholder="keyword1, keyword2, keyword3"
          className={styles.input}
        />
        <small className={styles.hint}>
          Comma-separated list of SEO keywords
        </small>
      </div>

      {/* OG Image */}
      <div className={styles.formGroup}>
        <label htmlFor="ogImage" className={styles.label}>
          OG Image (Social Sharing)
        </label>
        <input
          id="ogImage"
          type="url"
          value={settings.ogImage || ''}
          onChange={(e) => handleInputChange('ogImage', e.target.value)}
          placeholder="https://example.com/og-image.png"
          className={styles.input}
        />
        <small className={styles.hint}>
          Image displayed when sharing on social media (1200x630px recommended)
        </small>
        {settings.ogImage && (
          <div className={styles.preview}>
            <img
              src={settings.ogImage}
              alt="OG image preview"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              style={{ maxWidth: '200px', maxHeight: '200px' }}
            />
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className={styles.section}>
        <h3>Social Media Links</h3>

        {/* Twitter */}
        <div className={styles.formGroup}>
          <label htmlFor="twitter" className={styles.label}>
            Twitter / X
          </label>
          <input
            id="twitter"
            type="url"
            value={settings.socialLinks?.twitter || ''}
            onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
            placeholder="https://twitter.com/yourhandle"
            className={styles.input}
          />
        </div>

        {/* LinkedIn */}
        <div className={styles.formGroup}>
          <label htmlFor="linkedin" className={styles.label}>
            LinkedIn
          </label>
          <input
            id="linkedin"
            type="url"
            value={settings.socialLinks?.linkedin || ''}
            onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className={styles.input}
          />
        </div>

        {/* GitHub */}
        <div className={styles.formGroup}>
          <label htmlFor="github" className={styles.label}>
            GitHub
          </label>
          <input
            id="github"
            type="url"
            value={settings.socialLinks?.github || ''}
            onChange={(e) => handleSocialLinkChange('github', e.target.value)}
            placeholder="https://github.com/yourprofile"
            className={styles.input}
          />
        </div>
      </div>

      {/* Robots.txt */}
      <div className={styles.formGroup}>
        <label htmlFor="robotsTxt" className={styles.label}>
          Robots.txt
        </label>
        <textarea
          id="robotsTxt"
          value={settings.robotsTxt || ''}
          onChange={(e) => handleInputChange('robotsTxt', e.target.value)}
          placeholder="User-agent: *&#10;Disallow: /admin"
          rows={4}
          className={styles.textarea}
        />
        <small className={styles.hint}>
          Controls how search engines crawl your site
        </small>
      </div>

      {/* Sitemap */}
      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.sitemapEnabled || false}
            onChange={(e) => handleInputChange('sitemapEnabled', e.target.checked)}
          />
          Enable automatic sitemap generation
        </label>
        <small className={styles.hint}>
          Automatically generate sitemap.xml for search engines
        </small>
      </div>
    </div>
  );
}
