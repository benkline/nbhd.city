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
 */

import { useState } from 'react';
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

        {/* Meta Title */}
        <div className={styles.formGroup}>
          <label htmlFor="meta-title">Meta Title</label>
          <input
            id="meta-title"
            type="text"
            value={data.metaTitle || ''}
            onChange={(e) => onChange('metaTitle', e.target.value)}
            placeholder="Title that appears in search results"
            maxLength={60}
            disabled={disabled}
            className={styles.input}
          />
          <small className={styles.helperText}>
            {data.metaTitle?.length || 0}/60 characters
          </small>
        </div>

        {/* Meta Description */}
        <div className={styles.formGroup}>
          <label htmlFor="meta-description">Meta Description</label>
          <textarea
            id="meta-description"
            value={data.metaDescription || ''}
            onChange={(e) => onChange('metaDescription', e.target.value)}
            placeholder="Description shown in search results"
            maxLength={160}
            rows={3}
            disabled={disabled}
            className={styles.textarea}
          />
          <small className={styles.helperText}>
            {data.metaDescription?.length || 0}/160 characters
          </small>
        </div>

        {/* SEO Slug */}
        <div className={styles.formGroup}>
          <label htmlFor="seo-slug">SEO Slug</label>
          <input
            id="seo-slug"
            type="text"
            value={data.slug || ''}
            onChange={(e) => {
              let slug = e.target.value.toLowerCase();
              slug = slug.replace(/[^\w\s-]/g, '');
              slug = slug.replace(/\s+/g, '-');
              slug = slug.replace(/-+/g, '-');
              onChange('slug', slug);
            }}
            placeholder="url-friendly-slug"
            disabled={disabled}
            className={styles.input}
          />
          <small className={styles.helperText}>
            Used in the URL: /blog/{data.slug || 'your-slug'}
          </small>
        </div>

        {/* Canonical URL */}
        <div className={styles.formGroup}>
          <label htmlFor="canonical-url">Canonical URL (Optional)</label>
          <input
            id="canonical-url"
            type="url"
            value={data.canonicalUrl || ''}
            onChange={(e) => onChange('canonicalUrl', e.target.value)}
            placeholder="https://example.com/original-article"
            disabled={disabled}
            className={styles.input}
          />
          <small className={styles.helperText}>
            Link to original if this is republished content
          </small>
        </div>

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

        {/* Focus Keyword */}
        <div className={styles.formGroup}>
          <label htmlFor="focus-keyword">Focus Keyword (Optional)</label>
          <input
            id="focus-keyword"
            type="text"
            value={data.focusKeyword || ''}
            onChange={(e) => onChange('focusKeyword', e.target.value)}
            placeholder="Main keyword for this content"
            disabled={disabled}
            className={styles.input}
          />
          <small className={styles.helperText}>
            Primary keyword for SEO tracking
          </small>
        </div>

        {/* Readability Score */}
        <div className={styles.formGroup}>
          <label htmlFor="readability">Readability Score</label>
          <input
            id="readability"
            type="number"
            value={data.readability || 0}
            disabled={true}
            className={styles.input}
            readOnly
          />
          <small className={styles.helperText}>
            Auto-calculated from content
          </small>
        </div>
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
