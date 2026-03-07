import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api';
import ContentTableRow from './ContentTableRow';
import ContentFilters from './ContentFilters';
import ContentSearch from './ContentSearch';
import ConfirmDialog from '../common/ConfirmDialog';
import Toast from '../common/Toast';
import styles from './ContentBrowser.module.css';

const ITEMS_PER_PAGE = 25;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * ContentBrowser Component
 * Comprehensive list/table view of all posts and pages with filtering, sorting, and search
 * Displays inferred schema fields when available
 */
const ContentBrowser = ({ templateSchema = null, contentTypes = {} }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'allTime',
    author: 'all',
  });
  const [sorting, setSorting] = useState({
    sortBy: 'dateModified',
    sortDirection: 'desc',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [schemaFields, setSchemaFields] = useState([]);

  // Load sort preference from localStorage
  useEffect(() => {
    const savedSort = localStorage.getItem('contentBrowserSort');
    if (savedSort) {
      try {
        const parsed = JSON.parse(savedSort);
        setSorting(parsed);
      } catch (e) {
        console.error('Failed to parse saved sort preference:', e);
      }
    }
  }, []);

  // Load inferred schema fields for display
  useEffect(() => {
    if (templateSchema && templateSchema.properties) {
      const fields = Object.keys(templateSchema.properties).filter(
        f => f !== 'content' && f !== 'slug'
      );
      setSchemaFields(fields);
    } else {
      setSchemaFields([]);
    }
  }, [templateSchema]);

  // Fetch content whenever dependencies change
  useEffect(() => {
    fetchContent();
  }, [activeTab, page, filters, sorting, search]);

  /**
   * Fetch content from API
   */
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        type: activeTab === 'posts' ? 'post' : 'page',
        page,
        pageSize: ITEMS_PER_PAGE,
        ...sorting,
      };

      // Add status filter if not 'all'
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      // Add date range filter if not 'allTime'
      if (filters.dateRange !== 'allTime') {
        params.dateRange = filters.dateRange;
      }

      // Add author filter if not 'all'
      if (filters.author !== 'all') {
        params.author = filters.author;
      }

      // Add search query if provided
      if (search) {
        params.search = search;
      }

      const response = await apiClient.get('/api/content', { params });

      setContent(response.data.items || []);
      setTotalItems(response.data.total || 0);
      setSelectedItems(new Set()); // Clear selections on refresh
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filters, sorting, search]);

  /**
   * Handle search input with debounce
   */
  const handleSearch = useCallback((query) => {
    setSearch(query);
    setPage(1); // Reset to first page on search

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      // Fetch will be triggered by useEffect due to search state change
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  /**
   * Handle tab switch
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedItems(new Set());
    setSearch('');
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  /**
   * Handle sort changes
   */
  const handleSort = (sortBy, sortDirection) => {
    const newSorting = { sortBy, sortDirection };
    setSorting(newSorting);
    localStorage.setItem('contentBrowserSort', JSON.stringify(newSorting));
  };

  /**
   * Toggle item selection
   */
  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  /**
   * Toggle all items selection
   */
  const toggleAllSelection = () => {
    if (selectedItems.size === content.length && content.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(content.map(item => item.id)));
    }
  };

  /**
   * Handle row click to edit
   */
  const handleRowClick = (itemId) => {
    navigate(`/content/${itemId}/edit`, { state: { contentType: activeTab } });
  };

  /**
   * Handle delete action
   */
  const handleDelete = (itemId) => {
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
  };

  /**
   * Confirm delete action
   */
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await apiClient.delete(`/api/content/${itemToDelete}`);
      setToast({ type: 'success', message: 'Content deleted successfully' });
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchContent();
    } catch (err) {
      setToast({ type: 'error', message: `Failed to delete content: ${err.message}` });
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      await apiClient.delete('/api/content/bulk-delete', {
        data: { ids: Array.from(selectedItems) },
      });
      setToast({ type: 'success', message: `Deleted ${selectedItems.size} items` });
      setSelectedItems(new Set());
      fetchContent();
    } catch (err) {
      setToast({ type: 'error', message: `Failed to delete items: ${err.message}` });
    }
  };

  /**
   * Handle bulk status change
   */
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedItems.size === 0) return;

    try {
      await apiClient.put('/api/content/bulk-status', {
        ids: Array.from(selectedItems),
        status: newStatus,
      });
      setToast({ type: 'success', message: `Updated ${selectedItems.size} items` });
      setSelectedItems(new Set());
      fetchContent();
    } catch (err) {
      setToast({ type: 'error', message: `Failed to update items: ${err.message}` });
    }
  };

  /**
   * Calculate total pages
   */
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  /**
   * Handle page change
   */
  const goToPage = (pageNum) => {
    const validPage = Math.max(1, Math.min(pageNum, totalPages));
    setPage(validPage);
  };

  /**
   * Get preview of inferred schema fields from content item
   */
  const getSchemaFieldPreview = (item) => {
    if (!schemaFields.length) return null;
    return schemaFields.slice(0, 2).map(field => {
      const value = item[field] || item.frontmatter?.[field];
      if (!value) return null;
      return `${field}: ${typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 30)}`;
    }).filter(Boolean).join(' • ');
  };

  /**
   * Remove filter chip
   */
  const removeFilter = (filterName) => {
    const newFilters = { ...filters };
    if (filterName === 'status') {
      newFilters.status = 'all';
    } else if (filterName === 'dateRange') {
      newFilters.dateRange = 'allTime';
    } else if (filterName === 'author') {
      newFilters.author = 'all';
    }
    handleFilterChange(newFilters);
  };

  /**
   * Get active filter chips
   */
  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.status !== 'all') {
      chips.push({ name: 'status', label: `Status: ${filters.status}` });
    }
    if (filters.dateRange !== 'allTime') {
      chips.push({ name: 'dateRange', label: `Date: ${filters.dateRange}` });
    }
    if (filters.author !== 'all') {
      chips.push({ name: 'author', label: `Author: ${filters.author}` });
    }
    return chips;
  }, [filters]);

  return (
    <div className={styles.contentBrowser}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Content Management</h1>
        <button className={styles.newButton} onClick={() => navigate('/content/new')}>
          + New {activeTab === 'posts' ? 'Post' : 'Page'}
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
          onClick={() => handleTabChange('posts')}
          role="tab"
        >
          Posts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'pages' ? styles.active : ''}`}
          onClick={() => handleTabChange('pages')}
          role="tab"
        >
          Pages
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.controlsSection}>
        <ContentSearch
          onSearch={handleSearch}
          value={search}
          placeholder={`Search ${activeTab} by title and content...`}
        />
        <ContentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          contentType={activeTab}
        />
      </div>

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className={styles.filterChips}>
          {activeFilterChips.map(chip => (
            <div key={chip.name} className={styles.chip} role="chip">
              <span>{chip.label}</span>
              <button
                className={styles.chipRemove}
                onClick={() => removeFilter(chip.name)}
                aria-label={`Remove ${chip.name} filter`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className={styles.bulkActionsBar}>
          <span>{selectedItems.size} items selected</span>
          <div className={styles.bulkActions}>
            <button
              className={styles.deleteButton}
              onClick={() => handleBulkDelete()}
              aria-label="Delete selected items"
            >
              Delete Selected
            </button>
            <select
              className={styles.statusSelect}
              onChange={(e) => handleBulkStatusChange(e.target.value)}
              defaultValue=""
              aria-label="Change status for selected items"
            >
              <option value="">Change Status...</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchContent}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading content...</p>
        </div>
      )}

      {/* Content Table */}
      {!loading && content.length === 0 && !error && (
        <div className={styles.emptyState}>
          <p>No {activeTab} found</p>
          <button onClick={() => navigate('/content/new')}>
            Create your first {activeTab === 'posts' ? 'post' : 'page'}
          </button>
        </div>
      )}

      {!loading && content.length > 0 && (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.contentTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      checked={selectedItems.size === content.length && content.length > 0}
                      onChange={toggleAllSelection}
                      aria-label="Select all items"
                    />
                  </th>
                  <th
                    className={styles.titleColumn}
                    onClick={() => handleSort('title', sorting.sortDirection === 'asc' ? 'desc' : 'asc')}
                  >
                    Title {sorting.sortBy === 'title' && (
                      <span className={styles.sortIcon}>
                        {sorting.sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th className={styles.typeColumn}>Type</th>
                  <th className={styles.authorColumn}>Author</th>
                  <th
                    className={styles.dateColumn}
                    onClick={() => handleSort('dateModified', sorting.sortDirection === 'asc' ? 'desc' : 'asc')}
                  >
                    Date {sorting.sortBy === 'dateModified' && (
                      <span className={styles.sortIcon}>
                        {sorting.sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th className={styles.statusColumn}>Status</th>
                  <th className={styles.actionsColumn}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {content.map(item => (
                  <ContentTableRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onSelect={() => toggleItemSelection(item.id)}
                    onEdit={() => handleRowClick(item.id)}
                    onDelete={() => handleDelete(item.id)}
                    onRowClick={() => handleRowClick(item.id)}
                    schemaFieldPreview={getSchemaFieldPreview(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              Previous
            </button>

            <div className={styles.pageInfo}>
              <span>
                Page <span className={styles.currentPage}>{page}</span> of{' '}
                <span className={styles.totalPages}>{totalPages}</span>
              </span>
              <span className={styles.totalCount}>Total: {totalItems} items</span>
            </div>

            <input
              type="number"
              min="1"
              max={totalPages}
              value={page}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className={styles.pageInput}
              aria-label="Go to page"
            />

            <button
              className={styles.paginationButton}
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Content"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        isDangerous
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ContentBrowser;
