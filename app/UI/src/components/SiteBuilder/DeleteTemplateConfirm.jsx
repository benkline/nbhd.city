import styles from './DeleteTemplateConfirm.module.css';

/**
 * DeleteTemplateConfirm Component
 *
 * Confirmation modal for template deletion.
 * Prevents accidental deletion by requiring explicit confirmation.
 *
 * Requirement: [ ] Asks for confirmation before deleting
 * Requirement: [ ] Shows warning about losing saved configurations
 * Requirement: [ ] Delete button styled with red circle accent
 */

export function DeleteTemplateConfirm({
  isOpen,
  templateName,
  isDeleting,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className={styles.iconContainer}>
          <div className={styles.warningIcon}>⚠</div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>Delete Template?</h2>

          <p className={styles.message}>
            Are you sure you want to delete <strong>{templateName}</strong>?
          </p>

          <div className={styles.warning}>
            <span className={styles.warningTitle}>⚠ This action cannot be undone</span>
            <p className={styles.warningText}>
              Any sites using this template will no longer have access to it. You may lose
              saved configurations and site customizations if this template is deleted.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.button + ' ' + styles.buttonCancel}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Keep Template
          </button>

          <button
            className={styles.button + ' ' + styles.buttonDelete}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
