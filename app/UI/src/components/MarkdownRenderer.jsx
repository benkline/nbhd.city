import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import PropTypes from 'prop-types';
import styles from './MarkdownRenderer.module.css';

/**
 * MarkdownRenderer - Safely renders markdown content as HTML
 * Uses marked for parsing and DOMPurify for sanitization
 *
 * @param {string} markdown - Markdown content to render
 */
export default function MarkdownRenderer({ markdown }) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        const rawHtml = await marked(markdown);
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        setHtml(cleanHtml);
        setError(null);
      } catch (err) {
        console.error('Error rendering markdown:', err);
        setError('Error rendering content');
      }
    };

    if (markdown) {
      renderMarkdown();
    } else {
      setHtml('');
    }
  }, [markdown]);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div
      className={styles.markdownContent}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

MarkdownRenderer.propTypes = {
  markdown: PropTypes.string.isRequired,
};
