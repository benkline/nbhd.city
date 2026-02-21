import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ContentBrowser.module.css';

/**
 * ContentTableRow Component
 * Individual table row for content items with hover states and quick actions
 */
const ContentTableRow = ({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onRowClick,
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  /**
   * Handle row key press for keyboard navigation
   */
  const handleRowKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEdit();
    } else if (e.key === 'Delete') {
      onDelete();
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get status badge class
   */
  const getStatusClass = (status) => {
    switch (status) {
      case 'published':
        return styles.badgePublished;
      case 'draft':
        return styles.badgeDraft;
      case 'scheduled':
        return styles.badgeScheduled;
      default:
        return '';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  };

  /**
   * Handle preview click
   */
  const handlePreview = (e) => {
    e.stopPropagation();
    if (item.status === 'published') {
      window.open(`/preview/${item.id}`, '_blank');
    }
  };

  return (
    <tr
      className={`${styles.tableRow} ${isSelected ? styles.selected : ''}`}
      onClick={onRowClick}
      onKeyDown={handleRowKeyDown}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      tabIndex={0}
      role="row"
    >
      {/* Checkbox */}
      <td className={styles.checkboxColumn}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${item.title}`}
        />
      </td>

      {/* Title */}
      <td className={styles.titleColumn}>
        <div className={styles.titleCell}>
          <span className={styles.title}>{item.title}</span>
          {item.excerpt && <span className={styles.excerpt}>{item.excerpt}</span>}
        </div>
      </td>

      {/* Type */}
      <td className={styles.typeColumn}>
        <span className={styles.type}>
          {item.type === 'post' ? '📝 Post' : '📄 Page'}
        </span>
      </td>

      {/* Author */}
      <td className={styles.authorColumn}>
        <span className={styles.author}>{item.author}</span>
      </td>

      {/* Date */}
      <td className={styles.dateColumn}>
        <div className={styles.dateCell}>
          <span className={styles.date}>{formatDate(item.dateModified || item.date)}</span>
          {item.dateModified && (
            <span className={styles.hint}>Modified</span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className={styles.statusColumn}>
        <span
          className={`${styles.badge} ${getStatusClass(item.status)}`}
          title={`Status: ${getStatusLabel(item.status)}`}
        >
          {getStatusLabel(item.status)}
        </span>
      </td>

      {/* Actions */}
      <td className={styles.actionsColumn}>
        <div className={`${styles.actions} ${showActions ? styles.visible : ''}`}>
          <button
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit this content"
            aria-label={`Edit ${item.title}`}
          >
            Edit
          </button>

          {item.status === 'published' && (
            <button
              className={`${styles.actionButton} ${styles.preview}`}
              onClick={handlePreview}
              title="Preview this content"
              aria-label={`Preview ${item.title}`}
            >
              Preview
            </button>
          )}

          <button
            className={`${styles.actionButton} ${styles.delete}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete this content"
            aria-label={`Delete ${item.title}`}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ContentTableRow;
