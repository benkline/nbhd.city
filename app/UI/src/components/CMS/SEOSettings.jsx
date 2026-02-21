import { FormField } from '../common/FormField';
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

      <FormField
        label="Meta Title"
        id="metaTitle"
        type="text"
        value={settings.metaTitle || ''}
        onChange={(val) => handleInputChange('metaTitle', val)}
        placeholder="Homepage title for search engines"
        maxLength={60}
        helperText={`${(settings.metaTitle || '').length} / 60 characters (recommended)`}
      />

      <FormField
        label="Meta Description"
        id="metaDescription"
        type="textarea"
        value={settings.metaDescription || ''}
        onChange={(val) => handleInputChange('metaDescription', val)}
        placeholder="Homepage description for search engines"
        maxLength={160}
        rows={3}
        helperText={`${(settings.metaDescription || '').length} / 160 characters (recommended)`}
      />

      <FormField
        label="Keywords"
        id="keywords"
        type="text"
        value={settings.keywords || ''}
        onChange={(val) => handleInputChange('keywords', val)}
        placeholder="keyword1, keyword2, keyword3"
        helperText="Comma-separated list of SEO keywords"
      />

      <div>
        <FormField
          label="OG Image (Social Sharing)"
          id="ogImage"
          type="url"
          value={settings.ogImage || ''}
          onChange={(val) => handleInputChange('ogImage', val)}
          placeholder="https://example.com/og-image.png"
          helperText="Image displayed when sharing on social media (1200x630px recommended)"
        />
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

      <div className={styles.section}>
        <h3>Social Media Links</h3>

        <FormField
          label="Twitter / X"
          id="twitter"
          type="url"
          value={settings.socialLinks?.twitter || ''}
          onChange={(val) => handleSocialLinkChange('twitter', val)}
          placeholder="https://twitter.com/yourhandle"
        />

        <FormField
          label="LinkedIn"
          id="linkedin"
          type="url"
          value={settings.socialLinks?.linkedin || ''}
          onChange={(val) => handleSocialLinkChange('linkedin', val)}
          placeholder="https://linkedin.com/in/yourprofile"
        />

        <FormField
          label="GitHub"
          id="github"
          type="url"
          value={settings.socialLinks?.github || ''}
          onChange={(val) => handleSocialLinkChange('github', val)}
          placeholder="https://github.com/yourprofile"
        />
      </div>

      <FormField
        label="Robots.txt"
        id="robotsTxt"
        type="textarea"
        value={settings.robotsTxt || ''}
        onChange={(val) => handleInputChange('robotsTxt', val)}
        placeholder="User-agent: *&#10;Disallow: /admin"
        rows={4}
        helperText="Controls how search engines crawl your site"
      />

      <FormField
        label="Enable automatic sitemap generation"
        id="sitemapEnabled"
        type="checkbox"
        value={settings.sitemapEnabled || false}
        onChange={(val) => handleInputChange('sitemapEnabled', val)}
        helperText="Automatically generate sitemap.xml for search engines"
      />
    </div>
  );
}
