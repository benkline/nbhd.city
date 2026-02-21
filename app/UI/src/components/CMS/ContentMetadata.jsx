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
 *
 * Refactored to use FormField component for checkboxes
 */

import { useState, useRef, useEffect } from 'react';
import FormField from '../common/FormField';
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

        {/* Featured Toggle using FormField */}
        <FormField
          label="Mark as Featured"
          id="featured"
          type="checkbox"
          value={data.featured || false}
          onChange={(val) => onChange('featured', val)}
          disabled={disabled}
          helperText="Featured content appears in special sections"
        />

        {/* Comments Toggle using FormField */}
        <FormField
          label="Allow Comments"
          id="comments"
          type="checkbox"
          value={data.comments !== false}
          onChange={(val) => onChange('comments', val)}
          disabled={disabled}
        />

        {/* Reading Time (Read-only) using FormField */}
        <FormField
          label="Reading Time (minutes)"
          id="reading-time"
          type="number"
          value={data.readingTime || 0}
          disabled={true}
          helperText="Auto-calculated (approximately 200 words per minute)"
        />

        {/* Word Count (Read-only) using FormField */}
        <FormField
          label="Word Count"
          id="word-count"
          type="number"
          value={data.wordCount || 0}
          disabled={true}
          helperText="Total words in your content"
        />
      </div>
    </div>
  );
}

export default ContentMetadata;
