import { useState } from 'react';
import styles from './TemplateCard.module.css';
import { TemplateStatusBadge } from './TemplateStatusBadge';

/**
 * TemplateCard Component
 *
 * Displays a template card with:
 * - Template name, description, tags
 * - Template type badge (Built-in vs Custom)
 * - Status indicator for custom templates
 * - Hover animations with harmonic circle effects
 * - Click handling for template selection
 */
export function TemplateCard({ template, onSelect, isAnalyzing = false }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    // Don't allow selection while analyzing
    if (template.is_custom && template.status === 'analyzing') {
      // Could open progress modal here
      return;
    }

    if (onSelect) {
      onSelect(template);
    }
  };

  const isDisabled = template.is_custom && template.status === 'analyzing';
  const isFailed = template.is_custom && template.status === 'failed';

  return (
    <div
      className={`${styles.card} ${isHovered ? styles.cardHovered : ''} ${
        isDisabled ? styles.cardDisabled : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="article"
      aria-label={`Template: ${template.name}`}
      data-testid={`template-card-${template.id}`}
    >
      {/* Animated background circles (subtle) */}
      <div className={styles.circleBackground}>
        <div className={styles.circle1} />
        <div className={styles.circle2} />
        <div className={styles.circle3} />
      </div>

      {/* Image Container */}
      <div className={styles.imageContainer}>
        <div className={styles.placeholderImage}>
          📄 {template.name}
        </div>

        {/* Overlay on hover */}
        {isHovered && !isDisabled && (
          <div className={styles.imageOverlay}>
            <span className={styles.overlayText}>
              {template.is_custom && template.status === 'failed' ? 'Failed' : 'Select'}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Header with type badge */}
        <div className={styles.header}>
          <h2 className={styles.name}>{template.name}</h2>
          <span className={`${styles.typeBadge} ${
            template.is_custom ? styles.customBadge : styles.builtInBadge
          }`}>
            {template.is_custom ? 'Custom' : 'Built-in'}
          </span>
        </div>

        {/* Description */}
        <p className={styles.description}>{template.description}</p>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className={styles.tags}>
            {template.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Status Badge for Custom Templates */}
        {template.is_custom && (
          <div className={styles.statusContainer}>
            <TemplateStatusBadge status={template.status} error={template.error} />
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleClick}
          className={`${styles.selectButton} ${
            isDisabled ? styles.selectButtonDisabled : ''
          } ${isFailed ? styles.selectButtonFailed : ''}`}
          disabled={isDisabled}
          aria-label={`Select ${template.name} template`}
        >
          {template.is_custom && template.status === 'analyzing' && 'Analyzing...'}
          {template.is_custom && template.status === 'failed' && 'Re-analyze'}
          {template.is_custom && template.status === 'ready' && 'Select Template'}
          {!template.is_custom && 'Select Template'}
        </button>
      </div>
    </div>
  );
}
