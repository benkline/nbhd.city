import React, { useState, useEffect } from 'react';
import styles from './ContentBrowser.module.css';

/**
 * ContentFilters Component
 * Filter controls for filtering content by status, date range, and author
 */
const ContentFilters = ({ filters, onFilterChange, contentType }) => {
  const [authors, setAuthors] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  });

  /**
   * Handle status filter change
   */
  const handleStatusChange = (status) => {
    onFilterChange({
      ...filters,
      status: filters.status === status ? 'all' : status,
    });
  };

  /**
   * Handle date range filter change
   */
  const handleDateRangeChange = (range) => {
    onFilterChange({
      ...filters,
      dateRange: filters.dateRange === range ? 'allTime' : range,
    });
    setShowDatePicker(false);
  };

  /**
   * Handle author filter change
   */
  const handleAuthorChange = (author) => {
    onFilterChange({
      ...filters,
      author: filters.author === author ? 'all' : author,
    });
  };

  return (
    <div className={styles.filters}>
      {/* Status Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Status:</label>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${
              filters.status === 'draft' ? styles.active : ''
            }`}
            onClick={() => handleStatusChange('draft')}
            aria-label="Filter by draft status"
          >
            Draft
          </button>
          <button
            className={`${styles.filterButton} ${
              filters.status === 'published' ? styles.active : ''
            }`}
            onClick={() => handleStatusChange('published')}
            aria-label="Filter by published status"
          >
            Published
          </button>
          <button
            className={`${styles.filterButton} ${
              filters.status === 'scheduled' ? styles.active : ''
            }`}
            onClick={() => handleStatusChange('scheduled')}
            aria-label="Filter by scheduled status"
          >
            Scheduled
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Date:</label>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${
              filters.dateRange === 'lastWeek' ? styles.active : ''
            }`}
            onClick={() => handleDateRangeChange('lastWeek')}
            aria-label="Filter by last week"
          >
            Last Week
          </button>
          <button
            className={`${styles.filterButton} ${
              filters.dateRange === 'lastMonth' ? styles.active : ''
            }`}
            onClick={() => handleDateRangeChange('lastMonth')}
            aria-label="Filter by last month"
          >
            Last Month
          </button>
          <button
            className={`${styles.filterButton} ${
              filters.dateRange === 'custom' ? styles.active : ''
            }`}
            onClick={() => setShowDatePicker(!showDatePicker)}
            aria-label="Custom date range filter"
          >
            Custom
          </button>
        </div>

        {/* Custom Date Range Picker */}
        {showDatePicker && (
          <div className={styles.datePickerContainer}>
            <div className={styles.dateInputs}>
              <div className={styles.dateField}>
                <label htmlFor="startDate">From:</label>
                <input
                  id="startDate"
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      start: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.dateField}>
                <label htmlFor="endDate">To:</label>
                <input
                  id="endDate"
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      end: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className={styles.datePickerActions}>
              <button
                className={styles.confirmButton}
                onClick={() => {
                  onFilterChange({
                    ...filters,
                    dateRange: 'custom',
                    customStart: customDateRange.start,
                    customEnd: customDateRange.end,
                  });
                  setShowDatePicker(false);
                }}
              >
                Apply
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDatePicker(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Author Filter (for team/neighborhood sites) */}
      {contentType === 'posts' && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Author:</label>
          <select
            className={styles.filterSelect}
            value={filters.author}
            onChange={(e) => handleAuthorChange(e.target.value)}
            aria-label="Filter by author"
          >
            <option value="all">All Authors</option>
            <option value="me">My Content</option>
            {/* Additional authors would be populated from API */}
          </select>
        </div>
      )}
    </div>
  );
};

export default ContentFilters;
