import React, { useRef, useEffect } from 'react';
import styles from './ContentBrowser.module.css';

/**
 * ContentSearch Component
 * Real-time search input with debounced API query
 */
const ContentSearch = ({ onSearch, value, placeholder }) => {
  const inputRef = useRef(null);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const query = e.target.value;
    onSearch(query);
  };

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    onSearch('');
    inputRef.current?.focus();
  };

  /**
   * Focus on mount
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || 'Search content...'}
          value={value}
          onChange={handleChange}
          className={styles.searchInput}
          aria-label="Search content"
        />
        {value && (
          <button
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {value && (
        <div className={styles.searchHint}>
          Searching by title and content...
        </div>
      )}
    </div>
  );
};

export default ContentSearch;
