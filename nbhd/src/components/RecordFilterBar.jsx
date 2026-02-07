import React, { useState, useEffect, useRef } from 'react';
import styles from './RecordFilterBar.module.css';

export default function RecordFilterBar({ onFilterChange = null }) {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    sort: 'newest'
  });

  const debounceTimerRef = useRef(null);

  const notifyChange = (newFilters) => {
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters(prev => ({ ...prev, search }));

    // Debounce search
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      notifyChange({ ...filters, search });
    }, 300);
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    notifyChange(newFilters);
  };

  const handleDateFromChange = (e) => {
    const dateFrom = e.target.value;
    const newFilters = { ...filters, dateFrom };
    setFilters(newFilters);
    notifyChange(newFilters);
  };

  const handleDateToChange = (e) => {
    const dateTo = e.target.value;
    const newFilters = { ...filters, dateTo };
    setFilters(newFilters);
    notifyChange(newFilters);
  };

  const handleSortChange = (e) => {
    const sort = e.target.value;
    const newFilters = { ...filters, sort };
    setFilters(newFilters);
    notifyChange(newFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      type: 'all',
      dateFrom: '',
      dateTo: '',
      sort: 'newest'
    };
    setFilters(resetFilters);
    notifyChange(resetFilters);
  };

  const handleClearSearch = () => {
    const newFilters = { ...filters, search: '' };
    setFilters(newFilters);
    notifyChange(newFilters);
  };

  const activeFilterCount = [
    filters.search && 1,
    filters.type !== 'all' && 1,
    filters.dateFrom && 1,
    filters.dateTo && 1
  ].filter(Boolean).length;

  return (
    <div className={styles.filterBar}>
      <div className={styles.header}>
        <h3>Filters</h3>
        {activeFilterCount > 0 && (
          <span className={styles.filterCount}>{activeFilterCount} active</span>
        )}
      </div>

      <div className={styles.filters}>
        {/* Search */}
        <div className={styles.filterGroup}>
          <label htmlFor="search-input">Search</label>
          <div className={styles.inputWrapper}>
            <input
              id="search-input"
              type="text"
              placeholder="Search by title or content..."
              value={filters.search}
              onChange={handleSearchChange}
              className={styles.input}
              aria-label="Search records by title or content"
            />
            {filters.search && (
              <button
                className={styles.clearButton}
                onClick={handleClearSearch}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="type-filter">Record Type</label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={handleTypeChange}
            className={styles.select}
            aria-label="Filter by record type"
          >
            <option value="all">All Types</option>
            <option value="welcome">Welcome</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>

        {/* Date Range */}
        <div className={styles.dateRange}>
          <div className={styles.filterGroup}>
            <label htmlFor="date-from">From</label>
            <input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              onChange={handleDateFromChange}
              className={styles.dateInput}
              aria-label="Filter from date"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="date-to">To</label>
            <input
              id="date-to"
              type="date"
              value={filters.dateTo}
              onChange={handleDateToChange}
              className={styles.dateInput}
              aria-label="Filter to date"
            />
          </div>
        </div>

        {/* Sort */}
        <div className={styles.filterGroup}>
          <label htmlFor="sort-filter">Sort</label>
          <select
            id="sort-filter"
            value={filters.sort}
            onChange={handleSortChange}
            className={styles.select}
            aria-label="Sort records"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.resetButton}
          onClick={handleResetFilters}
          disabled={activeFilterCount === 0}
          aria-label="Reset all filters"
        >
          Reset All
        </button>
      </div>
    </div>
  );
}
