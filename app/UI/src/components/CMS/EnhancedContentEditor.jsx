/**
 * Enhanced Content Editor Component (CMS-003)
 *
 * Three-column layout editor with:
 * - Markdown editor with toolbar and keyboard shortcuts
 * - Syntax highlighting
 * - Frontmatter form based on template schema
 * - Publishing controls sidebar
 * - BlueSky toggle
 * - Auto-save with recovery
 * - Unsaved changes warning
 * - Character count and reading time
 * - Live preview
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import styles from './EnhancedContentEditor.module.css';
import MarkdownEditorToolbar from './MarkdownEditorToolbar';
import FrontmatterForm from './FrontmatterForm';
import PublishingControls from './PublishingControls';
import MarkdownPreview from './MarkdownPreview';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export function EnhancedContentEditor({
  siteId,
  templateSchema,
  initialContent = '',
  initialFrontmatter = {},
  onPublish = () => {},
  onSaveDraft = () => {}
}) {
  const [content, setContent] = useState(initialContent);
  const [frontmatter, setFrontmatter] = useState(initialFrontmatter);
  const [previewHtml, setPreviewHtml] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [publishStatus, setPublishStatus] = useState('draft');
  const [publishToBluesky, setPublishToBluesky] = useState(false);
  const [autoRebuild, setAutoRebuild] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [previewVisible, setPreviewVisible] = useState(true);
  const editorRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`draft-${siteId}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setContent(draft.content || initialContent);
        setFrontmatter(draft.frontmatter || initialFrontmatter);
      } catch (e) {
        console.warn('Failed to load draft:', e);
      }
    }
  }, [siteId, initialContent, initialFrontmatter]);

  // Update preview when content changes
  useEffect(() => {
    const updatePreview = async () => {
      try {
        const html = await marked(content);
        const sanitized = DOMPurify.sanitize(html);
        setPreviewHtml(sanitized);
      } catch (e) {
        console.error('Failed to parse markdown:', e);
      }
    };

    updatePreview();
  }, [content]);

  // Auto-save draft
  useEffect(() => {
    if (unsavedChanges) {
      setIsSaving(true);

      autosaveTimerRef.current = setTimeout(() => {
        const draft = {
          content,
          frontmatter,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem(`draft-${siteId}`, JSON.stringify(draft));
        setLastSaved(new Date());
        setIsSaving(false);
      }, AUTOSAVE_INTERVAL);
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [content, frontmatter, unsavedChanges, siteId]);

  // Warn on unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setUnsavedChanges(true);
  };

  const handleFrontmatterChange = (newFrontmatter) => {
    setFrontmatter(newFrontmatter);
    setUnsavedChanges(true);
  };

  const handleToolbarAction = useCallback((action, options = {}) => {
    const editor = editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = content.substring(start, end);
    let insertText = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        insertText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? insertText.length : 2;
        break;
      case 'italic':
        insertText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? insertText.length : 1;
        break;
      case 'code':
        insertText = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? insertText.length : 1;
        break;
      case 'link':
        insertText = `[${selectedText || 'link text'}](${options.url || 'https://example.com'})`;
        cursorOffset = insertText.length;
        break;
      case 'list':
        insertText = `- ${selectedText || 'list item'}`;
        cursorOffset = insertText.length;
        break;
      case 'quote':
        insertText = `> ${selectedText || 'quote text'}`;
        cursorOffset = insertText.length;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + insertText + content.substring(end);
    setContent(newContent);
    setUnsavedChanges(true);

    // Restore cursor position
    setTimeout(() => {
      if (editor) {
        editor.focus();
        editor.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
    }, 0);
  }, [content]);

  const handleKeyDown = (e) => {
    // Cmd+B for bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      handleToolbarAction('bold');
    }
    // Cmd+I for italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      handleToolbarAction('italic');
    }
    // Cmd+K for link
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      handleToolbarAction('link');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!templateSchema || !templateSchema.required) {
      return errors;
    }

    templateSchema.required.forEach((field) => {
      if (!frontmatter[field]) {
        errors[field] = `${field} is required`;
      }
    });

    setValidationErrors(errors);
    return errors;
  };

  const handlePublish = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const payload = {
        content,
        frontmatter,
        status: publishStatus,
        publishToBluesky,
        autoRebuild
      };

      if (publishStatus === 'scheduled' && scheduledDate) {
        payload.scheduledDate = scheduledDate;
      }

      await onPublish(payload);

      // Clear draft on successful publish
      localStorage.removeItem(`draft-${siteId}`);
      setUnsavedChanges(false);
    } catch (e) {
      console.error('Failed to publish:', e);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draft = {
        content,
        frontmatter,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(`draft-${siteId}`, JSON.stringify(draft));
      setLastSaved(new Date());
      setUnsavedChanges(false);

      await onSaveDraft(draft);
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  };

  const charCount = content.length;
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.stats}>
          <span className={styles.stat}>{charCount} characters</span>
          <span className={styles.stat}>{wordCount} words</span>
          <span className={styles.stat}>~{readingTime} min read</span>
        </div>
        <div className={styles.saveStatus}>
          {isSaving && <span className={styles.saving}>Saving...</span>}
          {lastSaved && !isSaving && (
            <span className={styles.saved}>Saved at {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        {previewVisible && (
          <button
            className={styles.previewToggle}
            onClick={() => setPreviewVisible(false)}
            aria-label="Hide preview"
          >
            Hide Preview
          </button>
        )}
        {!previewVisible && (
          <button
            className={styles.previewToggle}
            onClick={() => setPreviewVisible(true)}
            aria-label="Show preview"
          >
            Show Preview
          </button>
        )}
      </div>

      <div className={styles.layout}>
        <div className={styles.editorSection}>
          <MarkdownEditorToolbar onAction={handleToolbarAction} />

          <textarea
            ref={editorRef}
            className={styles.editor}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Write your content in Markdown..."
            aria-label="Markdown editor"
          />
        </div>

        <div className={styles.frontmatterSection}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <FrontmatterForm
            schema={templateSchema}
            values={frontmatter}
            onChange={handleFrontmatterChange}
            errors={validationErrors}
          />
        </div>

        {previewVisible && (
          <div className={styles.previewSection}>
            <h3 className={styles.sectionTitle}>Preview</h3>
            <MarkdownPreview
              html={previewHtml}
              frontmatter={frontmatter}
              schema={templateSchema}
            />
          </div>
        )}
      </div>

      <PublishingControls
        status={publishStatus}
        onStatusChange={setPublishStatus}
        publishToBluesky={publishToBluesky}
        onBlueskyToggle={setPublishToBluesky}
        autoRebuild={autoRebuild}
        onAutoRebuildToggle={setAutoRebuild}
        scheduledDate={scheduledDate}
        onScheduledDateChange={setScheduledDate}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
        hasUnsavedChanges={unsavedChanges}
      />
    </div>
  );
}

export default EnhancedContentEditor;
