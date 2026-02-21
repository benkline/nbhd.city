/**
 * ContentMetadataManager Component (CMS-007)
 *
 * Dedicated interface for managing content metadata:
 * - SEO metadata (title, description, slug, canonical URL, OG image)
 * - Publishing metadata (date, scheduled time, status, visibility, BlueSky)
 * - Content metadata (categories, tags, featured, reading time, word count)
 * - Mobile responsive tabs and form fields
 */

import { useState, useEffect, useCallback } from 'react';
import SEOMetadata from './SEOMetadata';
import PublishingMetadata from './PublishingMetadata';
import ContentMetadata from './ContentMetadata';
import styles from './ContentMetadataManager.module.css';

export function ContentMetadataManager({
  isOpen = false,
  contentData = {},
  templateConfig = {},
  existingTags = [],
  existingSlugs = [],
  onSave = () => {},
  onClose = () => {}
}) {
  const [activeTab, setActiveTab] = useState('seo');
  const [isSaving, setIsSaving] = useState(false);

  // SEO Metadata State
  const [seoMetadata, setSeoMetadata] = useState({
    metaTitle: contentData.title || '',
    metaDescription: contentData.description || '',
    slug: '',
    canonicalUrl: '',
    ogImage: null,
    ogImageUrl: '',
    focusKeyword: '',
    readability: 0
  });

  // Publishing Metadata State
  const [publishingMetadata, setPublishingMetadata] = useState({
    publishDate: contentData.frontmatter?.date || new Date().toISOString().split('T')[0],
    scheduledTime: '',
    status: contentData.frontmatter?.status || 'draft',
    visibility: 'public',
    publishToBluesky: false,
    author: ''
  });

  // Content Metadata State
  const [contentMetadata, setContentMetadata] = useState({
    categories: [],
    tags: contentData.frontmatter?.tags || [],
    featured: contentData.frontmatter?.featured || false,
    readingTime: 0,
    wordCount: 0,
    comments: contentData.frontmatter?.comments !== false
  });

  // Calculate reading time and word count on mount
  useEffect(() => {
    if (contentData.content) {
      const wordCount = contentData.content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

      setContentMetadata(prev => ({
        ...prev,
        wordCount,
        readingTime
      }));
    }
  }, [contentData.content]);

  // Auto-generate slug from title
  useEffect(() => {
    if (contentData.title && !seoMetadata.slug) {
      const generatedSlug = generateSlug(contentData.title);
      setSeoMetadata(prev => ({
        ...prev,
        slug: generatedSlug
      }));
    }
  }, [contentData.title]);

  // Auto-populate meta description from content
  useEffect(() => {
    if (contentData.content && !seoMetadata.metaDescription) {
      const description = contentData.content.substring(0, 160).trim();
      setSeoMetadata(prev => ({
        ...prev,
        metaDescription: description
      }));
    }
  }, [contentData.content]);

  // Generate slug from text
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove multiple hyphens
      .trim();
  };

  // Handle SEO metadata changes
  const handleSeoChange = useCallback((field, value) => {
    setSeoMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle Publishing metadata changes
  const handlePublishingChange = useCallback((field, value) => {
    setPublishingMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle Content metadata changes
  const handleMetadataChange = useCallback((field, value) => {
    setContentMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle form submission
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: contentData.id,
        seoMetadata,
        publishingMetadata,
        contentMetadata
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Error saving metadata:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-labelledby="metadata-title">
        <div className={styles.header}>
          <h2 id="metadata-title">Content Metadata Manager</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close metadata manager"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabs} role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'seo'}
              aria-controls="seo-panel"
              onClick={() => setActiveTab('seo')}
              className={`${styles.tab} ${activeTab === 'seo' ? styles.active : ''}`}
              disabled={isSaving}
            >
              SEO
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'publishing'}
              aria-controls="publishing-panel"
              onClick={() => setActiveTab('publishing')}
              className={`${styles.tab} ${activeTab === 'publishing' ? styles.active : ''}`}
              disabled={isSaving}
            >
              Publishing
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'metadata'}
              aria-controls="metadata-panel"
              onClick={() => setActiveTab('metadata')}
              className={`${styles.tab} ${activeTab === 'metadata' ? styles.active : ''}`}
              disabled={isSaving}
            >
              Metadata
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {activeTab === 'seo' && (
            <SEOMetadata
              data={seoMetadata}
              onChange={handleSeoChange}
              contentData={contentData}
              disabled={isSaving}
            />
          )}

          {activeTab === 'publishing' && (
            <PublishingMetadata
              data={publishingMetadata}
              onChange={handlePublishingChange}
              seoMetadata={seoMetadata}
              disabled={isSaving}
            />
          )}

          {activeTab === 'metadata' && (
            <ContentMetadata
              data={contentMetadata}
              onChange={handleMetadataChange}
              templateConfig={templateConfig}
              existingTags={existingTags}
              disabled={isSaving}
            />
          )}
        </div>

        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Metadata'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContentMetadataManager;
