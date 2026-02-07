/**
 * ContentEditor Component (SSG-012)
 *
 * Rich content editor for creating blog posts and pages with:
 * - Markdown editor with live preview
 * - Frontmatter form (title, date, tags, custom fields)
 * - BlueSky publishing toggle
 * - Auto-rebuild site toggle
 * - Draft auto-save to localStorage
 * - Template schema validation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import styles from './ContentEditor.module.css';

export function ContentEditor({
  siteId,
  templateSchema,
  onPublish,
  onError,
  initialContent = null
}) {
  // Content state
  const [markdown, setMarkdown] = useState('');
  const [frontmatter, setFrontmatter] = useState({});
  const [preview, setPreview] = useState('');

  // UI state
  const [publishToBluesky, setPublishToBluesky] = useState(false);
  const [autoRebuild, setAutoRebuild] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for auto-save timing
  const autoSaveTimeoutRef = useRef(null);
  const draftKeyRef = useRef(`draft-${siteId}`);

  // Initialize from localStorage or props
  useEffect(() => {
    const loadContent = () => {
      if (initialContent) {
        setMarkdown(initialContent.content || '');
        setFrontmatter(initialContent.frontmatter || {});
      } else {
        // Try to load draft from localStorage
        const savedDraft = localStorage.getItem(draftKeyRef.current);
        if (savedDraft) {
          try {
            const { content, frontmatter: savedFrontmatter } = JSON.parse(savedDraft);
            setMarkdown(content || '');
            setFrontmatter(savedFrontmatter || {});
          } catch (err) {
            console.error('Failed to load draft:', err);
          }
        }
      }
    };

    loadContent();
  }, [siteId, initialContent]);

  // Update preview when markdown changes
  useEffect(() => {
    const updatePreview = async () => {
      try {
        const rawHtml = await marked(markdown);
        // Sanitize HTML to prevent XSS
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        setPreview(cleanHtml);
      } catch (err) {
        console.error('Error rendering markdown:', err);
        setPreview('<p>Error rendering preview</p>');
      }
    };

    updatePreview();
  }, [markdown]);

  // Auto-save to localStorage
  useEffect(() => {
    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    setSaveStatus('saving');
    autoSaveTimeoutRef.current = setTimeout(() => {
      const draft = {
        content: markdown,
        frontmatter,
        timestamp: new Date().toISOString()
      };

      try {
        localStorage.setItem(draftKeyRef.current, JSON.stringify(draft));
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save draft:', err);
        setSaveStatus('error');
      }
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [markdown, frontmatter]);

  // Handle frontmatter field changes
  const handleFrontmatterChange = useCallback((field, value) => {
    setFrontmatter(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // Validate against template schema
  const validateFrontmatter = useCallback(() => {
    const newErrors = {};

    if (!templateSchema || !templateSchema.properties) {
      return newErrors;
    }

    const required = templateSchema.required || [];
    const properties = templateSchema.properties;

    // Check required fields
    required.forEach(field => {
      if (!frontmatter[field]) {
        newErrors[field] = `${field} is required`;
      }
    });

    // Validate field types
    Object.entries(properties).forEach(([field, schema]) => {
      if (frontmatter[field]) {
        if (schema.format === 'date' && frontmatter[field]) {
          // Validate date format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(frontmatter[field])) {
            newErrors[field] = `${field} must be in YYYY-MM-DD format`;
          }
        }

        if (schema.type === 'array' && typeof frontmatter[field] === 'string') {
          // Array fields can be comma-separated strings, which is valid
        }
      }
    });

    return newErrors;
  }, [frontmatter, templateSchema]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    const validationErrors = validateFrontmatter();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (onError) {
        onError('Please fill all required fields with valid data');
      }
      return;
    }

    setErrors({});
    setIsPublishing(true);

    try {
      // Prepare content data
      const contentData = {
        content: markdown,
        frontmatter,
        publishToBluesky,
        autoRebuild
      };

      // Call onPublish callback
      if (onPublish) {
        await onPublish(contentData);
      }

      // Clear draft after successful publish
      localStorage.removeItem(draftKeyRef.current);

      setSuccessMessage('Content published successfully!');
      setMarkdown('');
      setFrontmatter({});

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error publishing content:', err);
      if (onError) {
        onError('Failed to publish content: ' + err.message);
      }
    } finally {
      setIsPublishing(false);
    }
  }, [markdown, frontmatter, publishToBluesky, autoRebuild, validateFrontmatter, onPublish, onError]);

  // Render form fields based on schema
  const renderFormFields = () => {
    if (!templateSchema || !templateSchema.properties) {
      return null;
    }

    const properties = templateSchema.properties;
    const required = templateSchema.required || [];

    return Object.entries(properties).map(([field, schema]) => {
      const isRequired = required.includes(field);
      const error = errors[field];

      return (
        <div key={field} className={styles.formField}>
          <label htmlFor={field}>
            {field}
            {isRequired && <span className={styles.required}>*</span>}
          </label>

          {schema.type === 'array' ? (
            <textarea
              id={field}
              value={frontmatter[field] || ''}
              onChange={(e) => handleFrontmatterChange(field, e.target.value)}
              placeholder={`${field} (comma-separated)`}
              className={`${styles.input} ${error ? styles.error : ''}`}
            />
          ) : schema.format === 'date' ? (
            <input
              id={field}
              type="date"
              value={frontmatter[field] || ''}
              onChange={(e) => handleFrontmatterChange(field, e.target.value)}
              className={`${styles.input} ${error ? styles.error : ''}`}
              required={isRequired}
            />
          ) : schema.type === 'string' && schema.description?.toLowerCase().includes('excerpt') ? (
            <textarea
              id={field}
              value={frontmatter[field] || ''}
              onChange={(e) => handleFrontmatterChange(field, e.target.value)}
              placeholder={schema.description}
              className={`${styles.input} ${error ? styles.error : ''}`}
              required={isRequired}
            />
          ) : (
            <input
              id={field}
              type="text"
              value={frontmatter[field] || ''}
              onChange={(e) => handleFrontmatterChange(field, e.target.value)}
              placeholder={schema.description}
              className={`${styles.input} ${error ? styles.error : ''}`}
              required={isRequired}
            />
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      );
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create Content</h2>
        <div className={styles.statusIndicator}>
          {saveStatus === 'saving' && <span className={styles.saving}>Saving...</span>}
          {saveStatus === 'saved' && <span className={styles.saved}>Saved</span>}
          {saveStatus === 'error' && <span className={styles.error}>Save failed</span>}
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}

      <div className={styles.mainContent}>
        <div className={styles.editorSection}>
          <h3>Frontmatter</h3>
          <div className={styles.frontmatterForm}>
            {renderFormFields()}
          </div>

          <h3>Content</h3>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Write your content here in Markdown..."
            className={styles.editorTextarea}
          />
        </div>

        <div className={styles.preview} role="region" aria-label="Preview">
          <h3>Preview</h3>
          <div
            className={styles.previewContent}
            // Using innerHTML after DOMPurify sanitization is safe
            innerHTML={preview}
          />
        </div>
      </div>

      <div className={styles.options}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={publishToBluesky}
            onChange={(e) => setPublishToBluesky(e.target.checked)}
          />
          <span>Publish to BlueSky</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={autoRebuild}
            onChange={(e) => setAutoRebuild(e.target.checked)}
          />
          <span>Auto-rebuild site</span>
        </label>
      </div>

      {publishToBluesky && (
        <div className={styles.blueskyOptions}>
          <h4>BlueSky Summary</h4>
          <p>
            Your content will be shared to BlueSky with an excerpt and link back to your site.
          </p>
        </div>
      )}

      <div className={styles.actions}>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={styles.publishButton}
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
