import { useState, useEffect } from 'react';
import styles from './TemplateDetailsModal.module.css';
import { DeleteTemplateConfirm } from './DeleteTemplateConfirm';

/**
 * TemplateDetailsModal Component
 *
 * Displays detailed information about a selected template including:
 * - Template name, description, and metadata
 * - Author and repository information
 * - Inferred content types and schema fields
 * - Action buttons for selection, deletion, re-analysis, and sharing
 * - Harmonic circle background pattern
 *
 * Requirement: [ ] Modal shows all template details
 * Requirement: [ ] Beautiful harmonic circle background
 * Requirement: [ ] Action buttons with proper styling
 * Requirement: [ ] Deletion confirmation modal
 * Requirement: [ ] Rename template (SSG-028)
 */

export function TemplateDetailsModal({
  isOpen,
  template,
  onClose,
  onSelect,
  onDelete,
  onReanalyze,
  onShare,
  onRename
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameForm, setShowRenameForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  if (!isOpen || !template) return null;

  const handleDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(template.id);
        setShowDeleteConfirm(false);
        onClose();
      } catch (error) {
        console.error('Error deleting template:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleReanalyze = async () => {
    if (onReanalyze) {
      setIsReanalyzing(true);
      try {
        await onReanalyze(template.id);
        // Keep modal open to show updated status
      } catch (error) {
        console.error('Error re-analyzing template:', error);
      } finally {
        setIsReanalyzing(false);
      }
    }
  };

  const handleRenameSubmit = async () => {
    if (!newName.trim()) {
      return;
    }

    if (onRename) {
      setIsRenaming(true);
      try {
        await onRename(template.id, newName.trim());
        setShowRenameForm(false);
        setNewName('');
      } catch (error) {
        console.error('Error renaming template:', error);
      } finally {
        setIsRenaming(false);
      }
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(template);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(template);
    }
  };

  // Determine if template is custom (has owner info)
  const isCustom = template.author || template.isCustom;

  // Get analysis state
  const analysisState = template.status || (isCustom ? 'unknown' : 'ready');

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Harmonic circles background */}
          <div className={styles.backgroundPattern}>
            <svg
              className={styles.svgBackground}
              viewBox="0 0 400 600"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="circle1" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#4361EE" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4361EE" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="circle2" cx="70%" cy="40%">
                  <stop offset="0%" stopColor="#3A0CA3" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3A0CA3" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="circle3" cx="50%" cy="80%">
                  <stop offset="0%" stopColor="#56CCF2" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#56CCF2" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="400" cy="100" r="200" fill="url(#circle1)" filter="url(#glow)" />
              <circle cx="0" cy="300" r="180" fill="url(#circle2)" filter="url(#glow)" />
              <circle cx="200" cy="550" r="150" fill="url(#circle3)" filter="url(#glow)" />
            </svg>
          </div>

          {/* Close button */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>

          {/* Modal content */}
          <div className={styles.content}>
            {/* Header section */}
            <div className={styles.header}>
              <div className={styles.titleSection}>
                <h2 className={styles.title}>{template.name}</h2>
                {!isCustom && (
                  <span className={styles.badge + ' ' + styles.badgeBuiltin}>
                    Built-in
                  </span>
                )}
                {isCustom && (
                  <span className={styles.badge + ' ' + styles.badgeCustom}>
                    Custom
                  </span>
                )}
              </div>

              {template.description && (
                <p className={styles.description}>{template.description}</p>
              )}
            </div>

            {/* Details section */}
            <div className={styles.detailsSection}>
              {template.author && (
                <div className={styles.detailItem}>
                  <span className={styles.label}>Author:</span>
                  <span className={styles.value}>{template.author}</span>
                </div>
              )}

              {template.repository && (
                <div className={styles.detailItem}>
                  <span className={styles.label}>Repository:</span>
                  <a
                    href={template.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {template.repository}
                  </a>
                </div>
              )}

              {template.analysisTimestamp && (
                <div className={styles.detailItem}>
                  <span className={styles.label}>Analyzed:</span>
                  <span className={styles.value}>
                    {new Date(template.analysisTimestamp).toLocaleDateString()}
                  </span>
                </div>
              )}

              {template.commitSha && (
                <div className={styles.detailItem}>
                  <span className={styles.label}>Commit:</span>
                  <code className={styles.code}>
                    {template.commitSha.substring(0, 7)}
                  </code>
                </div>
              )}
            </div>

            {/* Content types section */}
            {template.inferredContentTypes && template.inferredContentTypes.length > 0 && (
              <div className={styles.contentTypesSection}>
                <h3 className={styles.sectionTitle}>Content Types</h3>
                <div className={styles.contentTypesList}>
                  {template.inferredContentTypes.map((type) => (
                    <span key={type} className={styles.contentType}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Schema fields section */}
            {template.schema && template.schema.length > 0 && (
              <div className={styles.schemaSection}>
                <h3 className={styles.sectionTitle}>Schema Fields</h3>
                <div className={styles.schemaList}>
                  {template.schema.map((field, index) => (
                    <div key={index} className={styles.schemaField}>
                      <div className={styles.fieldHeader}>
                        <span className={styles.fieldName}>{field.name}</span>
                        <span className={styles.fieldType}>{field.type}</span>
                      </div>
                      {field.description && (
                        <p className={styles.fieldDescription}>
                          {field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags section */}
            {template.tags && template.tags.length > 0 && (
              <div className={styles.tagsSection}>
                <h3 className={styles.sectionTitle}>Tags</h3>
                <div className={styles.tagsList}>
                  {template.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status section for custom templates */}
            {isCustom && (
              <div className={styles.statusSection}>
                <h3 className={styles.sectionTitle}>Status</h3>
                <div className={`${styles.statusBadge} ${styles['status-' + analysisState]}`}>
                  {analysisState === 'analyzing' && '⏳ Analyzing...'}
                  {analysisState === 'ready' && '✓ Ready'}
                  {analysisState === 'failed' && '✗ Analysis Failed'}
                  {analysisState === 'unknown' && '❓ Unknown'}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            <button
              className={styles.button + ' ' + styles.buttonPrimary}
              onClick={handleSelect}
              disabled={analysisState === 'analyzing' || analysisState === 'failed'}
            >
              Select Template
            </button>

            {isCustom && (
              <>
                <button
                  className={styles.button + ' ' + styles.buttonSecondary}
                  onClick={() => {
                    setNewName(template.name);
                    setShowRenameForm(true);
                  }}
                  disabled={isRenaming || showRenameForm}
                >
                  {isRenaming ? 'Renaming...' : 'Rename'}
                </button>

                <button
                  className={styles.button + ' ' + styles.buttonTertiary}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>

                {analysisState === 'failed' && (
                  <button
                    className={styles.button + ' ' + styles.buttonSecondary}
                    onClick={handleReanalyze}
                    disabled={isReanalyzing}
                  >
                    {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
                  </button>
                )}
              </>
            )}

            {!isCustom && (
              <button
                className={styles.button + ' ' + styles.buttonLink}
                onClick={handleShare}
              >
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteTemplateConfirm
        isOpen={showDeleteConfirm}
        templateName={template.name}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Rename form modal */}
      {showRenameForm && (
        <div className={styles.backdrop} onClick={() => !isRenaming && setShowRenameForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h2>Rename Template</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowRenameForm(false)}
                aria-label="Close"
                disabled={isRenaming}
              >
                ✕
              </button>
            </div>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="template-name">Template Name</label>
                <input
                  id="template-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isRenaming}
                  placeholder="Enter new template name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newName.trim()) {
                      handleRenameSubmit();
                    }
                  }}
                />
              </div>
              <div className={styles.formActions}>
                <button
                  className={styles.button + ' ' + styles.buttonPrimary}
                  onClick={handleRenameSubmit}
                  disabled={!newName.trim() || isRenaming}
                >
                  {isRenaming ? 'Renaming...' : 'Save'}
                </button>
                <button
                  className={styles.button + ' ' + styles.buttonSecondary}
                  onClick={() => setShowRenameForm(false)}
                  disabled={isRenaming}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
