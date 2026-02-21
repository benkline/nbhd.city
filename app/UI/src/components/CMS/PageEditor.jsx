import React, { useState, useEffect, useCallback } from 'react';
import styles from './PageManager.module.css';

/**
 * PageEditor Component
 *
 * Modal editor for creating and editing pages.
 * Provides fields for title, slug, parent page selection, and content.
 */
const PageEditor = ({
  siteId,
  pageId,
  pages,
  onClose,
  onSave,
  namespace = 'app.nbhd',
  dataService = null
}) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    parent_id: null,
    content: '',
    status: 'published'
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing page data if editing
  useEffect(() => {
    if (pageId) {
      const page = pages.find(p => p.id === pageId);
      if (page) {
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          parent_id: page.parent_id || null,
          content: page.content || '',
          status: page.status || 'published'
        });
      }
    }
  }, [pageId, pages]);

  /**
   * Validate form data
   */
  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9\-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Auto-generate slug from title
   */
  const generateSlugFromTitle = useCallback((title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/\-+/g, '-')
      .replace(/^\-+|\-+$/g, '');
  }, []);

  /**
   * Handle title change
   */
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      // Auto-generate slug only if slug is empty
      slug: !prev.slug ? generateSlugFromTitle(newTitle) : prev.slug
    }));
  }, [generateSlugFromTitle]);

  /**
   * Handle slug change
   */
  const handleSlugChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      slug: e.target.value
    }));
    // Clear slug error when user types
    if (errors.slug) {
      setErrors(prev => ({
        ...prev,
        slug: ''
      }));
    }
  }, [errors.slug]);

  /**
   * Handle parent page selection
   */
  const handleParentChange = useCallback((e) => {
    const value = e.target.value || null;
    setFormData(prev => ({
      ...prev,
      parent_id: value
    }));
  }, []);

  /**
   * Handle content change
   */
  const handleContentChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      content: e.target.value
    }));
  }, []);

  /**
   * Handle status change
   */
  const handleStatusChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);

      const pageData = {
        site_id: siteId,
        title: formData.title,
        slug: formData.slug,
        parent_id: formData.parent_id,
        content: formData.content,
        status: formData.status,
        collection_name: `${namespace}.page`,
        updated_at: new Date()
      };

      let saveFunction = dataService;

      // If no data service provided, try to use Firebase
      if (!saveFunction) {
        try {
          const { initFirebaseService } = await import('../../services/firebaseService');
          saveFunction = initFirebaseService();
        } catch (err) {
          console.error('Error initializing Firebase:', err);
          throw new Error('No data service available');
        }
      }

      if (pageId) {
        // Update existing page
        await saveFunction.updatePage(pageId, pageData, namespace);
      } else {
        // Create new page
        pageData.created_at = new Date();
        pageData.order = pages.length;
        await saveFunction.savePage(pageData, namespace);
      }

      onSave?.();
    } catch (err) {
      console.error('Error saving page:', err);
      setErrors({ submit: 'Failed to save page: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  }, [pageId, formData, pages, namespace, siteId, validate, onSave]);

  // Get pages that can be parents (exclude self and descendants)
  const parentOptions = pages.filter(p => {
    if (p.id === pageId) return false; // Exclude self
    // TODO: Exclude descendants to prevent circular hierarchy
    return true;
  });

  return (
    <div className={styles.editorModal}>
      <div className={styles.editorOverlay} onClick={onClose} />
      <div className={styles.editorContent}>
        <div className={styles.editorHeader}>
          <h2>{pageId ? 'Edit Page' : 'New Page'}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close editor"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.editorForm}>
          {errors.submit && (
            <div className={styles.formError}>
              {errors.submit}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="page-title">Title *</label>
            <input
              id="page-title"
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              onBlur={() => {
                // Auto-generate slug if empty
                if (!formData.slug) {
                  setFormData(prev => ({
                    ...prev,
                    slug: generateSlugFromTitle(prev.title)
                  }));
                }
              }}
              placeholder="Page title"
              className={errors.title ? styles.inputError : ''}
              aria-label="Page title"
            />
            {errors.title && (
              <span className={styles.fieldError}>{errors.title}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="page-slug">Slug *</label>
            <input
              id="page-slug"
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="page-slug"
              className={errors.slug ? styles.inputError : ''}
              aria-label="Page slug"
            />
            {errors.slug && (
              <span className={styles.fieldError}>{errors.slug}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="page-parent">Parent Page</label>
            <select
              id="page-parent"
              value={formData.parent_id || ''}
              onChange={handleParentChange}
              aria-label="Parent page"
            >
              <option value="">None (top-level)</option>
              {parentOptions.map(page => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="page-status">Status</label>
            <select
              id="page-status"
              value={formData.status}
              onChange={handleStatusChange}
              aria-label="Page status"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="page-content">Content</label>
            <textarea
              id="page-content"
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Page content (markdown)"
              rows={8}
              aria-label="Page content"
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondaryButton}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageEditor;
