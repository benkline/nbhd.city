/**
 * ContentMetadata Component
 *
 * Metadata tab for ContentMetadataManager with fields:
 * - Categories
 * - Tags with autocomplete
 * - Featured toggle
 * - Reading time (read-only)
 * - Word count (read-only)
 * - Comments toggle
 */

import { useState, useRef, useEffect } from 'react';
import styles from './ContentMetadataManager.module.css';

export function ContentMetadata({
  data = {},
  onChange = () => {},
  templateConfig = {},
  existingTags = [],
  disabled = false
}) {
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const tagsInputRef = useRef(null);

  const categories = templateConfig.categories || [];

  // Filter tags based on input
  useEffect(() => {
    if (tagInput && tagInput.length > 0) {
      const filtered = existingTags.filter(tag =>
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !data.tags?.includes(tag)
      );
      setFilteredTags(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  }, [tagInput, existingTags, data.tags]);

  // Handle tag input
  const handleTagInput = (value) => {
    setTagInput(value);
  };

  // Add tag
  const addTag = (tag) => {
    const newTag = tag || tagInput.trim();
    if (newTag && !data.tags?.includes(newTag)) {
      onChange('tags', [...(data.tags || []), newTag]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    onChange('tags', (data.tags || []).filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Handle category toggle
  const toggleCategory = (category) => {
    const currentCategories = data.categories || [];
    if (currentCategories.includes(category)) {
      onChange('categories', currentCategories.filter(c => c !== category));
    } else {
      onChange('categories', [...currentCategories, category]);
    }
  };

  return (
    <div id="metadata-panel" className={styles.tabPanel} role="tabpanel">
      <div className={styles.formSection}>
        <h3>Content Metadata</h3>

        {/* Categories */}
        {categories.length > 0 && (
          <div className={styles.formGroup}>
            <label>Categories</label>
            <div className={styles.checkboxGroup}>
              {categories.map(category => (
                <label key={category} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={(data.categories || []).includes(category)}
                    onChange={() => toggleCategory(category)}
                    disabled={disabled}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tags with Autocomplete */}
        <div className={styles.formGroup}>
          <label htmlFor="tags-input">Tags</label>
          <div className={styles.tagsInput}>
            <div className={styles.tagsContainer}>
              {(data.tags || []).map(tag => (
                <div key={tag} className={styles.tag}>
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={disabled}
                    className={styles.tagRemove}
                    aria-label={`Remove tag: ${tag}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                ref={tagsInputRef}
                id="tags-input"
                type="text"
                value={tagInput}
                onChange={(e) => handleTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                onFocus={() => tagInput && setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                placeholder="Add tag..."
                disabled={disabled}
                className={styles.tagInput}
              />
            </div>

            {/* Tag Suggestions */}
            {showTagSuggestions && filteredTags.length > 0 && (
              <ul className={styles.suggestions}>
                {filteredTags.map(tag => (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => addTag(tag)}
                      disabled={disabled}
                    >
                      {tag}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <small className={styles.helperText}>
            Press Enter to add a new tag or select from suggestions
          </small>
        </div>

        {/* Featured Toggle */}
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={data.featured || false}
              onChange={(e) => onChange('featured', e.target.checked)}
              disabled={disabled}
              aria-label="Mark as featured"
            />
            <span>Mark as Featured</span>
          </label>
          <small className={styles.helperText}>
            Featured content appears in special sections
          </small>
        </div>

        {/* Comments Toggle */}
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={data.comments !== false}
              onChange={(e) => onChange('comments', e.target.checked)}
              disabled={disabled}
              aria-label="Allow comments"
            />
            <span>Allow Comments</span>
          </label>
        </div>

        {/* Reading Time (Read-only) */}
        <div className={styles.formGroup}>
          <label htmlFor="reading-time">Reading Time (minutes)</label>
          <input
            id="reading-time"
            type="number"
            value={data.readingTime || 0}
            disabled={true}
            readOnly={true}
            className={styles.input}
          />
          <small className={styles.helperText}>
            Auto-calculated (approximately 200 words per minute)
          </small>
        </div>

        {/* Word Count (Read-only) */}
        <div className={styles.formGroup}>
          <label htmlFor="word-count">Word Count</label>
          <input
            id="word-count"
            type="number"
            value={data.wordCount || 0}
            disabled={true}
            readOnly={true}
            className={styles.input}
          />
          <small className={styles.helperText}>
            Total words in your content
          </small>
        </div>
      </div>
    </div>
  );
}

export default ContentMetadata;
