import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './MenuManager.module.css';

/**
 * MenuItemEditor Component
 * Form for creating and editing menu items
 */
const MenuItemEditor = ({ itemId, item, pages = [], onSave, onCancel }) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('link');
  const [pageId, setPageId] = useState('');
  const [url, setUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [icon, setIcon] = useState('');
  const [errors, setErrors] = useState({});

  // Initialize form with existing item data
  useEffect(() => {
    if (item) {
      setLabel(item.label || '');
      setType(item.type || 'link');
      setPageId(item.pageId || '');
      setUrl(item.url || '');
      setOpenInNewTab(item.openInNewTab || false);
      setIcon(item.icon || '');
    }
  }, [item]);

  // Validate URL format
  const isValidUrl = (urlString) => {
    if (!urlString) return false;
    try {
      // For relative URLs, just check basic format
      if (urlString.startsWith('/')) return true;
      // For absolute URLs
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (type === 'custom-url') {
      if (!url.trim()) {
        newErrors.url = 'URL is required';
      } else if (!isValidUrl(url)) {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (type === 'link-to-page') {
      if (!pageId) {
        newErrors.pageId = 'Please select a page';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = {
      label: label.trim(),
      type: type === 'link-to-page' ? 'link' : type,
      pageId: type === 'link-to-page' ? pageId : null,
      url: type === 'custom-url' ? url : null,
      openInNewTab,
      icon: icon || null,
      children: item?.children || []
    };

    if (itemId) {
      onSave(itemId, formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <div data-testid="menu-item-editor" className={styles.editorModal}>
      <div className={styles.editorModalContent}>
        <h3>{itemId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>

        <form onSubmit={handleSubmit} className={styles.editorForm}>
          {/* Label Field */}
          <div className={styles.formGroup}>
            <label htmlFor="label">Label *</label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Home, About, Contact"
              className={errors.label ? styles.errorInput : ''}
            />
            {errors.label && (
              <span className={styles.errorMessage}>{errors.label}</span>
            )}
          </div>

          {/* Type Selector */}
          <div className={styles.formGroup}>
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Select type...</option>
              <option value="link-to-page">Link to Page</option>
              <option value="custom-url">Custom URL</option>
              <option value="submenu">Submenu</option>
            </select>
          </div>

          {/* Conditional: Link to Page */}
          {type === 'link-to-page' && (
            <div className={styles.formGroup}>
              <label htmlFor="pageId">Page *</label>
              <select
                id="pageId"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className={errors.pageId ? styles.errorInput : ''}
              >
                <option value="">Select a page...</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
              {errors.pageId && (
                <span className={styles.errorMessage}>{errors.pageId}</span>
              )}
            </div>
          )}

          {/* Conditional: Custom URL */}
          {type === 'custom-url' && (
            <div className={styles.formGroup}>
              <label htmlFor="url">URL *</label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., /page or https://example.com"
                className={errors.url ? styles.errorInput : ''}
              />
              {errors.url && (
                <span className={styles.errorMessage}>{errors.url}</span>
              )}
            </div>
          )}

          {/* Open in New Tab */}
          {(type === 'custom-url' || type === 'link-to-page') && (
            <div className={styles.formGroup}>
              <label htmlFor="openInNewTab">
                <input
                  id="openInNewTab"
                  type="checkbox"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                />
                Open in New Tab
              </label>
            </div>
          )}

          {/* Icon Picker (Optional) */}
          <div className={styles.formGroup}>
            <label htmlFor="icon">Icon (Optional)</label>
            <select
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            >
              <option value="">No Icon</option>
              <option value="home">Home</option>
              <option value="folder">Folder</option>
              <option value="file">File</option>
              <option value="settings">Settings</option>
              <option value="user">User</option>
              <option value="search">Search</option>
              <option value="mail">Mail</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className={styles.editorActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
            >
              {itemId ? 'Update' : 'Add'} Menu Item
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      <div
        className={styles.editorBackdrop}
        onClick={onCancel}
      />
    </div>
  );
};

MenuItemEditor.propTypes = {
  itemId: PropTypes.string,
  item: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    type: PropTypes.string,
    pageId: PropTypes.string,
    url: PropTypes.string,
    openInNewTab: PropTypes.bool,
    icon: PropTypes.string,
    children: PropTypes.array
  }),
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired
    })
  ),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default MenuItemEditor;
