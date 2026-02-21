/**
 * SEOMetadata Component
 *
 * SEO tab for ContentMetadataManager with fields:
 * - Meta title
 * - Meta description
 * - SEO slug
 * - Canonical URL
 * - OG image
 * - Focus keyword
 * - Readability score
 *
 * Refactored to use FormField component for standard inputs
 */

import { useState } from 'react';
import FormField from '../common/FormField';
import styles from './ContentMetadataManager.module.css';

export function SEOMetadata({
  data = {},
  onChange = () => {},
  contentData = {},
  disabled = false
}) {
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // In a real app, upload to CDN/S3
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange('ogImageUrl', event.target.result);
      };
      reader.readAsDataURL(file);
      onChange('ogImage', file);
    } finally {
      setUploadingImage(false);
    }
  };

  // Generate Google SERP preview
  const generateSerpPreview = () => {
    const title = data.metaTitle || contentData.title || '';
    const description = data.metaDescription || '';
    const url = contentData.url || 'example.com/blog';

    return { title, description, url };
  };

  const serpPreview = generateSerpPreview();

  return (
    <div id="seo-panel" className={styles.tabPanel} role="tabpanel">
      <div className={styles.formSection}>
        <h3>SEO Metadata</h3>

        {/* Meta Title using FormField */}
        <FormField
          label="Meta Title"
          id="meta-title"
          type="text"
          value={data.metaTitle || ''}
          onChange={(val) => onChange('metaTitle', val)}
          placeholder="Title that appears in search results"
          maxLength={60}
          helperText={`${data.metaTitle?.length || 0}/60 characters`}
          disabled={disabled}
        />

        {/* Meta Description using FormField */}
        <FormField
          label="Meta Description"
          id="meta-description"
          type="textarea"
          value={data.metaDescription || ''}
          onChange={(val) => onChange('metaDescription', val)}
          placeholder="Description shown in search results"
          maxLength={160}
          helperText={`${data.metaDescription?.length || 0}/160 characters`}
          disabled={disabled}
          rows={3}
        />

        {/* SEO Slug using FormField */}
        <FormField
          label="SEO Slug"
          id="seo-slug"
          type="text"
          value={data.slug || ''}
          onChange={(val) => {
            let slug = val.toLowerCase();
            slug = slug.replace(/[^\w\s-]/g, '');
            slug = slug.replace(/\s+/g, '-');
            slug = slug.replace(/-+/g, '-');
            onChange('slug', slug);
          }}
          placeholder="url-friendly-slug"
          helperText={`Used in the URL: /blog/${data.slug || 'your-slug'}`}
          disabled={disabled}
        />

        {/* Canonical URL using FormField */}
        <FormField
          label="Canonical URL (Optional)"
          id="canonical-url"
          type="url"
          value={data.canonicalUrl || ''}
          onChange={(val) => onChange('canonicalUrl', val)}
          placeholder="https://example.com/original-article"
          helperText="Link to original if this is republished content"
          disabled={disabled}
        />

        {/* OG Image */}
        <div className={styles.formGroup}>
          <label htmlFor="og-image">OG Image (Social Media Preview)</label>
          <div className={styles.imageUpload}>
            <input
              id="og-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={disabled || uploadingImage}
              className={styles.fileInput}
            />
            {data.ogImageUrl && (
              <div className={styles.imagePreview}>
                <img src={data.ogImageUrl} alt="OG Image Preview" />
              </div>
            )}
          </div>
          <small className={styles.helperText}>
            Recommended: 1200x630px (Facebook/LinkedIn)
          </small>
        </div>

        {/* Focus Keyword using FormField */}
        <FormField
          label="Focus Keyword (Optional)"
          id="focus-keyword"
          type="text"
          value={data.focusKeyword || ''}
          onChange={(val) => onChange('focusKeyword', val)}
          placeholder="Main keyword for this content"
          helperText="Primary keyword for SEO tracking"
          disabled={disabled}
        />

        {/* Readability Score using FormField */}
        <FormField
          label="Readability Score"
          id="readability"
          type="number"
          value={data.readability || 0}
          disabled={true}
          helperText="Auto-calculated from content"
        />
      </div>

      {/* Google SERP Preview */}
      <div className={styles.previewSection}>
        <h3>Google Search Preview</h3>
        <div className={styles.serpPreview}>
          <div className={styles.serpUrl}>{serpPreview.url}</div>
          <div className={styles.serpTitle}>{serpPreview.title || 'Your page title here'}</div>
          <div className={styles.serpDescription}>
            {serpPreview.description || 'Your meta description appears here...'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SEOMetadata;
