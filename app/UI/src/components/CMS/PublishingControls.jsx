/**
 * Publishing Controls Sidebar Component
 *
 * Controls for:
 * - Status selector (Draft, Scheduled, Published)
 * - BlueSky publishing toggle
 * - Auto-rebuild toggle
 * - Publish and Save Draft buttons
 */

import React from 'react';
import styles from './EnhancedContentEditor.module.css';

export function PublishingControls({
  status = 'draft',
  onStatusChange = () => {},
  publishToBluesky = false,
  onBlueskyToggle = () => {},
  autoRebuild = true,
  onAutoRebuildToggle = () => {},
  scheduledDate = '',
  onScheduledDateChange = () => {},
  onPublish = () => {},
  onSaveDraft = () => {},
  hasUnsavedChanges = false
}) {
  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.sectionTitle}>Publishing</h3>

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
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </div>

      {status === 'scheduled' && (
        <div className={styles.sidebarSection}>
          <label htmlFor="scheduled-date" className={styles.label}>
            Scheduled Date
          </label>
          <input
            id="scheduled-date"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            className={styles.input}
            aria-label="Scheduled publish date"
          />
        </div>
      )}

      <div className={styles.sidebarSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={publishToBluesky}
            onChange={(e) => onBlueskyToggle(e.target.checked)}
            className={styles.checkbox}
            aria-label="Publish to BlueSky"
          />
          Publish to BlueSky
        </label>
      </div>

      <div className={styles.sidebarSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={autoRebuild}
            onChange={(e) => onAutoRebuildToggle(e.target.checked)}
            className={styles.checkbox}
            aria-label="Auto-rebuild site"
          />
          Auto-rebuild site
        </label>
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={onSaveDraft}
          className={styles.buttonSecondary}
          aria-label="Save as draft"
        >
          Save Draft
        </button>
        <button
          onClick={onPublish}
          className={`${styles.buttonPrimary} ${!hasUnsavedChanges ? styles.disabled : ''}`}
          disabled={!hasUnsavedChanges}
          aria-label="Publish content"
        >
          Publish
        </button>
      </div>
    </aside>
  );
}

export default PublishingControls;
