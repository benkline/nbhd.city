/**
 * PublishingMetadata Component
 *
 * Publishing tab for ContentMetadataManager with fields:
 * - Publish date picker
 * - Scheduled time
 * - Status selector
 * - Visibility
 * - BlueSky toggle and preview
 * - Author selector
 */

import { useState, useEffect } from 'react';
import styles from './ContentMetadataManager.module.css';

export function PublishingMetadata({
  data = {},
  onChange = () => {},
  seoMetadata = {},
  disabled = false
}) {
  const [isScheduled, setIsScheduled] = useState(false);
  const [blueSkyPreview, setBlueSkyPreview] = useState('');

  // Determine if date is in future
  useEffect(() => {
    if (data.publishDate) {
      const publishDate = new Date(data.publishDate);
      const now = new Date();
      setIsScheduled(publishDate > now);
    }
  }, [data.publishDate]);

  // Update BlueSky preview when description changes
  useEffect(() => {
    if (data.publishToBluesky && seoMetadata.metaDescription) {
      // BlueSky has 300 character limit
      const preview = seoMetadata.metaDescription.substring(0, 280);
      setBlueSkyPreview(preview);
    }
  }, [data.publishToBluesky, seoMetadata.metaDescription]);

  return (
    <div id="publishing-panel" className={styles.tabPanel} role="tabpanel">
      <div className={styles.formSection}>
        <h3>Publishing Settings</h3>

        {/* Publish Date */}
        <div className={styles.formGroup}>
          <label htmlFor="publish-date">Publish Date</label>
          <input
            id="publish-date"
            type="date"
            value={data.publishDate || ''}
            onChange={(e) => onChange('publishDate', e.target.value)}
            disabled={disabled}
            className={styles.input}
          />
        </div>

        {/* Scheduled Time (show if future date) */}
        {isScheduled && (
          <div className={styles.formGroup}>
            <label htmlFor="scheduled-time">Scheduled Time</label>
            <input
              id="scheduled-time"
              type="time"
              value={data.scheduledTime || '09:00'}
              onChange={(e) => onChange('scheduledTime', e.target.value)}
              disabled={disabled}
              className={styles.input}
            />
            <small className={styles.helperText}>
              Content will be published at this time on the scheduled date
            </small>
          </div>
        )}

        {/* Publish Status */}
        <div className={styles.formGroup}>
          <label htmlFor="publish-status">Publish Status</label>
          <select
            id="publish-status"
            value={data.status || 'draft'}
            onChange={(e) => onChange('status', e.target.value)}
            disabled={disabled}
            className={styles.select}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
          <small className={styles.helperText}>
            {isScheduled ? 'Future date selected - will be Scheduled' : 'Current status of this content'}
          </small>
        </div>

        {/* Visibility */}
        <div className={styles.formGroup}>
          <label htmlFor="visibility">Visibility</label>
          <select
            id="visibility"
            value={data.visibility || 'public'}
            onChange={(e) => onChange('visibility', e.target.value)}
            disabled={disabled}
            className={styles.select}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="password">Password Protected</option>
          </select>
        </div>

        {/* BlueSky Publishing */}
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={data.publishToBluesky || false}
              onChange={(e) => onChange('publishToBluesky', e.target.checked)}
              disabled={disabled}
              aria-label="Publish to BlueSky"
            />
            <span>Publish to BlueSky</span>
          </label>
          <small className={styles.helperText}>
            Post a preview of this content to your BlueSky account
          </small>
        </div>

        {/* Author Selector */}
        <div className={styles.formGroup}>
          <label htmlFor="author">Author</label>
          <input
            id="author"
            type="text"
            value={data.author || ''}
            onChange={(e) => onChange('author', e.target.value)}
            placeholder="Your name or handle"
            disabled={disabled}
            className={styles.input}
          />
        </div>
      </div>

      {/* BlueSky Preview */}
      {data.publishToBluesky && (
        <div className={styles.previewSection}>
          <h3>BlueSky Preview</h3>
          <div className={styles.blueSkyPreview}>
            <div className={styles.previewHeader}>Post Preview</div>
            <div className={styles.previewContent}>
              <p>{blueSkyPreview || 'Your BlueSky preview will appear here'}</p>
            </div>
            <div className={styles.previewFooter}>
              Character count: {blueSkyPreview.length}/300
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublishingMetadata;
