/**
 * Markdown Preview Component
 *
 * Displays live preview of markdown content with:
 * - Rendered HTML from markdown
 * - Frontmatter display
 * - Reading time estimate
 *
 * NOTE: HTML passed to this component is already sanitized by DOMPurify
 * in the parent EnhancedContentEditor component before being set in state.
 */

import React from 'react';
import styles from './EnhancedContentEditor.module.css';

export function MarkdownPreview({ html, frontmatter = {}, schema = null }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTags = (tags) => {
    if (!Array.isArray(tags)) return '';
    return tags.join(', ');
  };

  return (
    <div className={styles.preview} role="region" aria-label="Preview pane">
      <div className={styles.previewContent}>
        {/* Frontmatter display */}
        {Object.keys(frontmatter).length > 0 && (
          <div className={styles.frontmatterDisplay}>
            {frontmatter.title && (
              <h1 className={styles.previewTitle}>{frontmatter.title}</h1>
            )}

            {(frontmatter.date || frontmatter.author) && (
              <div className={styles.previewMeta}>
                {frontmatter.date && (
                  <span className={styles.metaItem}>
                    {formatDate(frontmatter.date)}
                  </span>
                )}
                {frontmatter.author && (
                  <span className={styles.metaItem}>
                    by {frontmatter.author}
                  </span>
                )}
              </div>
            )}

            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className={styles.previewTags}>
                {(Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags]).map(
                  (tag, idx) => (
                    <span key={idx} className={styles.tag}>
                      #{tag}
                    </span>
                  )
                )}
              </div>
            )}

            {frontmatter.excerpt && (
              <p className={styles.excerpt}>{frontmatter.excerpt}</p>
            )}
          </div>
        )}

        {/* Markdown content - already sanitized by DOMPurify in parent */}
        <div
          className={styles.markdownBody}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

export default MarkdownPreview;
