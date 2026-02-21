import styles from './EmptyTemplateState.module.css';

/**
 * EmptyTemplateState Component
 *
 * Displays when no custom templates are registered.
 * Shows a large harmonic circle pattern and a call-to-action message.
 */
export function EmptyTemplateState({ onAddTemplate }) {
  return (
    <div className={styles.container} role="region" aria-label="No custom templates">
      {/* Animated Circle Background */}
      <div className={styles.circleBackground}>
        <div className={styles.circleOuter} />
        <div className={styles.circleMiddle} />
        <div className={styles.circleInner} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h2 className={styles.title}>No Custom Templates Yet</h2>
        <p className={styles.description}>
          Create and manage your own templates by connecting a GitHub repository.
          Your custom templates will appear here.
        </p>

        <button
          onClick={onAddTemplate}
          className={styles.addButton}
          aria-label="Add a new custom template"
        >
          <span className={styles.plus}>+</span>
          <span>Add Custom Template</span>
        </button>
      </div>
    </div>
  );
}
