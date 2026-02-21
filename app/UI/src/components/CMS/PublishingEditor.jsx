/**
 * PublishingEditor Component
 * Unified publishing metadata editor supporting multiple layouts
 *
 * Consolidates publishing fields from EnhancedContentEditor and ContentMetadataManager
 * Supports two render variants: 'tabs' and 'sidebar'
 *
 * Features:
 * - Status selector (Draft, Scheduled, Published)
 * - Date and time pickers (conditional on scheduled status)
 * - BlueSky publish toggle with preview
 * - Visibility selector
 * - Author selector
 * - Auto-rebuild toggle (sidebar only)
 * - Publish/Save buttons (sidebar only)
 *
 * Usage (Tab variant):
 * <PublishingEditor
 *   variant="tabs"
 *   status={data.status}
 *   onStatusChange={(val) => onChange('status', val)}
 *   publishDate={data.publishDate}
 *   onPublishDateChange={(val) => onChange('publishDate', val)}
 *   scheduledTime={data.scheduledTime}
 *   onScheduledTimeChange={(val) => onChange('scheduledTime', val)}
 *   publishToBluesky={data.publishToBluesky}
 *   onBlueskyToggle={(val) => onChange('publishToBluesky', val)}
 *   blueskyPreview={seoMetadata.metaDescription}
 * />
 *
 * Usage (Sidebar variant):
 * <PublishingEditor
 *   variant="sidebar"
 *   status={publishStatus}
 *   onStatusChange={setPublishStatus}
 *   scheduledDate={scheduledDate}
 *   onScheduledDateChange={setScheduledDate}
 *   publishToBluesky={publishToBluesky}
 *   onBlueskyToggle={setPublishToBluesky}
 *   autoRebuild={autoRebuild}
 *   onAutoRebuildToggle={setAutoRebuild}
 *   onPublish={handlePublish}
 *   onSaveDraft={handleSaveDraft}
 *   hasUnsavedChanges={unsavedChanges}
 * />
 */

import { useState, useEffect } from 'react';
import styles from './PublishingEditor.module.css';

export function PublishingEditor({
  // Data
  status = 'draft',
  publishDate = '',
  scheduledTime = '',
  publishToBluesky = false,
  blueskyPreview = '',
  visibility = 'public',
  author = '',
  autoRebuild = true,

  // Handlers
  onStatusChange = () => {},
  onPublishDateChange = () => {},
  onScheduledTimeChange = () => {},
  onBlueskyToggle = () => {},
  onVisibilityChange = () => {},
  onAuthorChange = () => {},
  onAutoRebuildToggle = () => {},

  // Sidebar only
  onPublish = null,
  onSaveDraft = null,
  hasUnsavedChanges = false,

  // Config
  variant = 'tabs', // 'tabs' | 'sidebar'
  disabled = false,
  authors = []
}) {
  const [isScheduled, setIsScheduled] = useState(false);
  const [blueSkyPreviewText, setBlueSkyPreviewText] = useState('');

  // Determine if date is in future for scheduled state
  useEffect(() => {
    if (publishDate) {
      const pubDate = new Date(publishDate);
      const now = new Date();
      setIsScheduled(pubDate > now);
    } else {
      setIsScheduled(status === 'scheduled');
    }
  }, [publishDate, status]);

  // Update BlueSky preview
  useEffect(() => {
    if (publishToBluesky && blueskyPreview) {
      // BlueSky has 300 character limit
      const preview = blueskyPreview.substring(0, 280);
      setBlueSkyPreviewText(preview);
    }
  }, [publishToBluesky, blueskyPreview]);

  // Tabs variant (for ContentMetadataManager)
  if (variant === 'tabs') {
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
              value={publishDate}
              onChange={(e) => onPublishDateChange(e.target.value)}
              disabled={disabled}
              className={styles.input}
            />
          </div>

          {/* Scheduled Time (show if future date or scheduled status) */}
          {(isScheduled || status === 'scheduled') && (
            <div className={styles.formGroup}>
              <label htmlFor="scheduled-time">Scheduled Time</label>
              <input
                id="scheduled-time"
                type="time"
                value={scheduledTime || '09:00'}
                onChange={(e) => onScheduledTimeChange(e.target.value)}
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
            <label htmlFor="publish-status">Status</label>
            <select
              id="publish-status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={disabled}
              className={styles.select}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Visibility */}
          <div className={styles.formGroup}>
            <label htmlFor="visibility">Visibility</label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => onVisibilityChange(e.target.value)}
              disabled={disabled}
              className={styles.select}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="password">Password Protected</option>
            </select>
          </div>

          {/* Author */}
          {authors.length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="author">Author</label>
              <select
                id="author"
                value={author}
                onChange={(e) => onAuthorChange(e.target.value)}
                disabled={disabled}
                className={styles.select}
              >
                <option value="">Select author...</option>
                {authors.map(auth => (
                  <option key={auth.id} value={auth.id}>
                    {auth.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BlueSky Toggle */}
          <div className={styles.formGroup}>
            <label htmlFor="bluesky-toggle" className={styles.checkboxLabel}>
              <input
                id="bluesky-toggle"
                type="checkbox"
                checked={publishToBluesky}
                onChange={(e) => onBlueskyToggle(e.target.checked)}
                disabled={disabled}
                className={styles.checkbox}
              />
              Publish to BlueSky
            </label>
          </div>

          {/* BlueSky Preview */}
          {publishToBluesky && blueSkyPreviewText && (
            <div className={styles.blueSkyPreview}>
              <h4>BlueSky Preview</h4>
              <div className={styles.previewContent}>
                {blueSkyPreviewText}
              </div>
              <small className={styles.charCount}>
                {blueSkyPreviewText.length}/280 characters
              </small>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sidebar variant (for EnhancedContentEditor)
  if (variant === 'sidebar') {
    return (
      <aside className={styles.sidebar}>
        <h3 className={styles.sectionTitle}>Publishing</h3>

        {/* Status */}
        <div className={styles.sidebarSection}>
          <label htmlFor="publish-status" className={styles.label}>
            Status
          </label>
          <select
            id="publish-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={styles.select}
            aria-label="Publish status"
            disabled={disabled}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Scheduled Date/Time */}
        {status === 'scheduled' && (
          <div className={styles.sidebarSection}>
            <label htmlFor="scheduled-date" className={styles.label}>
              Scheduled Date
            </label>
            <input
              id="scheduled-date"
              type="datetime-local"
              value={publishDate}
              onChange={(e) => onPublishDateChange(e.target.value)}
              className={styles.input}
              aria-label="Scheduled publish date"
              disabled={disabled}
            />
          </div>
        )}

        {/* BlueSky Toggle */}
        <div className={styles.sidebarSection}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={publishToBluesky}
              onChange={(e) => onBlueskyToggle(e.target.checked)}
              className={styles.checkbox}
              aria-label="Publish to BlueSky"
              disabled={disabled}
            />
            Publish to BlueSky
          </label>
        </div>

        {/* Auto-rebuild Toggle */}
        <div className={styles.sidebarSection}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={autoRebuild}
              onChange={(e) => onAutoRebuildToggle(e.target.checked)}
              className={styles.checkbox}
              aria-label="Auto-rebuild on publish"
              disabled={disabled}
            />
            Auto-rebuild Site
          </label>
        </div>

        {/* Action Buttons */}
        {onPublish || onSaveDraft ? (
          <div className={styles.sidebarActions}>
            {onSaveDraft && (
              <button
                onClick={onSaveDraft}
                className={styles.saveDraftButton}
                disabled={disabled}
              >
                Save Draft
              </button>
            )}
            {onPublish && (
              <button
                onClick={onPublish}
                className={styles.publishButton}
                disabled={disabled}
              >
                Publish
              </button>
            )}
          </div>
        ) : null}

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <div className={styles.unsavedIndicator}>
            ⚠️ Unsaved changes
          </div>
        )}
      </aside>
    );
  }

  return null;
}

export default PublishingEditor;
