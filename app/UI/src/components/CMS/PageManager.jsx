import React, { useState, useEffect, useCallback } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import PageEditor from './PageEditor';
import PageTreeView from './PageTreeView';
import styles from './PageManager.module.css';

/**
 * PageManager Component
 *
 * Manages creation, editing, deletion, and reordering of static pages.
 * Supports page hierarchy (nested pages) with drag-to-reorder on desktop
 * and move buttons on mobile.
 *
 * Features:
 * - Create new pages with title and slug
 * - Display pages in hierarchical list
 * - Edit existing pages
 * - Delete pages with confirmation (warning if has children)
 * - Drag-to-reorder on desktop
 * - Move up/down buttons on mobile
 * - Generate correct URLs for nested pages
 * - Save to app.nbhd.page collection
 */
const PageManager = ({
  siteId,
  namespace = 'app.nbhd',
  // Allow injecting a data service for testing
  dataService = null
}) => {
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedPageId, setDraggedPageId] = useState(null);
  const [deletingPageId, setDeletingPageId] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null);

  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Initialize Firebase data service
  const [firebaseService, setFirebaseService] = useState(dataService);

  useEffect(() => {
    if (!firebaseService && !dataService) {
      // Only initialize Firebase in production (when no test data service provided)
      const initFirebase = async () => {
        try {
          const { initFirebaseService } = await import('../../services/firebaseService');
          setFirebaseService(initFirebaseService());
        } catch (err) {
          console.error('Error initializing Firebase:', err);
        }
      };
      initFirebase();
    }
  }, [firebaseService, dataService]);

  // Load pages from data service
  useEffect(() => {
    if (!firebaseService) {
      setIsLoading(true);
      return;
    }

    const loadPages = async () => {
      try {
        setIsLoading(true);
        const unsubscribe = firebaseService.subscribeToPagesForSite(
          siteId,
          namespace,
          (loadedPages) => {
            const sorted = sortPages(loadedPages);
            setPages(sorted);
            setError(null);
          },
          (err) => {
            console.error('Error loading pages:', err);
            setError('Failed to load pages');
          }
        );

        setIsLoading(false);
        return unsubscribe;
      } catch (err) {
        console.error('Error setting up page listener:', err);
        setError('Failed to initialize page manager');
        setIsLoading(false);
      }
    };

    let unsubscribe;
    loadPages().then(fn => {
      unsubscribe = fn;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseService, siteId, namespace]);

  /**
   * Sort pages by parent_id and order
   */
  const sortPages = useCallback((pagesToSort) => {
    return pagesToSort.sort((a, b) => {
      // First sort by parent_id (null parents first)
      if (a.parent_id !== b.parent_id) {
        if (a.parent_id === null) return -1;
        if (b.parent_id === null) return 1;
        return (a.parent_id || '').localeCompare(b.parent_id || '');
      }
      // Then sort by order field
      return (a.order || 0) - (b.order || 0);
    });
  }, []);

  /**
   * Get depth of a page (for indentation)
   */
  const getPageDepth = useCallback((pageId) => {
    let depth = 0;
    let currentId = pageId;
    const visitedIds = new Set();

    while (currentId && !visitedIds.has(currentId)) {
      visitedIds.add(currentId);
      const page = pages.find(p => p.id === currentId);
      if (!page || !page.parent_id) break;
      depth++;
      currentId = page.parent_id;
    }

    return depth;
  }, [pages]);

  /**
   * Generate URL for a page based on its hierarchy
   */
  const generatePageUrl = useCallback((pageId) => {
    const pagePath = [];
    let currentId = pageId;
    const visitedIds = new Set();

    while (currentId && !visitedIds.has(currentId)) {
      visitedIds.add(currentId);
      const page = pages.find(p => p.id === currentId);
      if (!page) break;

      pagePath.unshift(page.slug);
      currentId = page.parent_id;
    }

    return '/' + pagePath.join('/');
  }, [pages]);

  /**
   * Get children of a page
   */
  const getPageChildren = useCallback((pageId) => {
    return pages.filter(p => p.parent_id === pageId);
  }, [pages]);

  /**
   * Handle create new page
   */
  const handleCreatePage = useCallback(() => {
    setSelectedPageId(null);
    setIsEditorOpen(true);
  }, []);

  /**
   * Handle edit page
   */
  const handleEditPage = useCallback((pageId) => {
    setSelectedPageId(pageId);
    setIsEditorOpen(true);
  }, []);

  /**
   * Handle close editor
   */
  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setSelectedPageId(null);
  }, []);

  /**
   * Handle page saved in editor
   */
  const handlePageSaved = useCallback(() => {
    handleCloseEditor();
  }, [handleCloseEditor]);

  /**
   * Handle delete page
   */
  const handleDeletePage = useCallback((pageId) => {
    const page = pages.find(p => p.id === pageId);
    const children = getPageChildren(pageId);

    if (children.length > 0) {
      setDeleteWarning({
        pageId,
        pageName: page?.title || 'Unknown Page',
        childCount: children.length,
        children: children.map(c => c.title)
      });
    } else {
      setDeletingPageId(pageId);
    }
  }, [pages, getPageChildren]);

  /**
   * Confirm deletion
   */
  const confirmDelete = useCallback(async () => {
    if (!deletingPageId || !firebaseService) return;

    try {
      await firebaseService.deletePage(deletingPageId, namespace);
      setDeletingPageId(null);
    } catch (err) {
      console.error('Error deleting page:', err);
      setError('Failed to delete page');
    }
  }, [deletingPageId, firebaseService, namespace]);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((e, pageId) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  }, []);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(async (e, targetPageId) => {
    e.preventDefault();

    const draggedId = e.dataTransfer.getData('text/plain') || draggedPageId;
    if (!draggedId || draggedId === targetPageId || !firebaseService) return;

    try {
      const draggedPage = pages.find(p => p.id === draggedId);
      const targetPage = pages.find(p => p.id === targetPageId);

      if (!draggedPage || !targetPage) return;

      if (draggedPage.parent_id === targetPage.parent_id) {
        // Reorder
        await firebaseService.reorderPages(
          draggedId,
          targetPageId,
          draggedPage,
          targetPage,
          namespace
        );
      } else {
        // Change parent
        const childrenOfTarget = getPageChildren(targetPageId);
        const newOrder = childrenOfTarget.length;

        await firebaseService.updatePageParent(
          draggedId,
          targetPageId,
          newOrder,
          namespace
        );
      }
    } catch (err) {
      console.error('Error reordering pages:', err);
      setError('Failed to reorder pages');
    }

    setDraggedPageId(null);
  }, [pages, draggedPageId, getPageChildren, firebaseService, namespace]);

  /**
   * Handle move page on mobile
   */
  const handleMovePageMobile = useCallback(async (pageId, direction) => {
    if (!firebaseService) return;

    try {
      const page = pages.find(p => p.id === pageId);
      if (!page) return;

      const siblings = pages.filter(
        p => p.parent_id === page.parent_id && p.id !== pageId
      );

      siblings.sort((a, b) => (a.order || 0) - (b.order || 0));
      const currentIndex = siblings.findIndex(s => s.order === page.order);

      if (direction === 'up' && currentIndex > 0) {
        const sibling = siblings[currentIndex - 1];
        await firebaseService.reorderPages(
          pageId,
          sibling.id,
          page,
          sibling,
          namespace
        );
      } else if (direction === 'down' && currentIndex < siblings.length - 1) {
        const sibling = siblings[currentIndex + 1];
        await firebaseService.reorderPages(
          pageId,
          sibling.id,
          page,
          sibling,
          namespace
        );
      }
    } catch (err) {
      console.error('Error moving page:', err);
      setError('Failed to move page');
    }
  }, [pages, firebaseService, namespace]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pages...</div>
      </div>
    );
  }

  if (error && !pages.length) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Pages</h2>
        <button
          className={styles.createButton}
          onClick={handleCreatePage}
          aria-label="Create new page"
        >
          + New Page
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {pages.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No pages yet. Create one to get started!</p>
          <button
            className={styles.createButton}
            onClick={handleCreatePage}
          >
            Create First Page
          </button>
        </div>
      ) : (
        <div className={styles.pageList}>
          {!isMobile ? (
            <PageTreeView
              pages={pages}
              onEditPage={handleEditPage}
              onDeletePage={handleDeletePage}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              getPageDepth={getPageDepth}
              generatePageUrl={generatePageUrl}
              getPageChildren={getPageChildren}
              namespace={namespace}
            />
          ) : (
            <div className={styles.mobileList}>
              {pages.map(page => (
                <div
                  key={page.id}
                  className={styles.mobilePageItem}
                  data-page-id={page.id}
                  data-parent-id={page.parent_id}
                  data-depth={getPageDepth(page.id)}
                  data-url={generatePageUrl(page.id)}
                  style={{ paddingLeft: `${(getPageDepth(page.id) || 0) * 16}px` }}
                >
                  <div className={styles.mobilePageContent}>
                    <div>
                      <h3>{page.title}</h3>
                      <p className={styles.pageSlug}>{generatePageUrl(page.id)}</p>
                    </div>
                    <div className={styles.mobilePageActions}>
                      {getPageDepth(page.id) > 0 && (
                        <button
                          onClick={() => handleMovePageMobile(page.id, 'up')}
                          title="Move up"
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {pages.some(p => p.parent_id === page.parent_id && (p.order || 0) > (page.order || 0)) && (
                        <button
                          onClick={() => handleMovePageMobile(page.id, 'down')}
                          title="Move down"
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        onClick={() => handleEditPage(page.id)}
                        title="Edit page"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        title="Delete page"
                        className={styles.deleteButton}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isEditorOpen && (
        <PageEditor
          siteId={siteId}
          pageId={selectedPageId}
          pages={pages}
          onClose={handleCloseEditor}
          onSave={handlePageSaved}
          namespace={namespace}
          dataService={firebaseService}
        />
      )}

      {deleteWarning && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Cannot Delete</h3>
            <p>
              The page "{deleteWarning.pageName}" has {deleteWarning.childCount} child page(s):
            </p>
            <ul>
              {deleteWarning.children.map(child => (
                <li key={child}>{child}</li>
              ))}
            </ul>
            <p>Please delete or move the child pages first.</p>
            <button
              onClick={() => setDeleteWarning(null)}
              className={styles.primaryButton}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {deletingPageId && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Delete Page?</h3>
            <p>
              Are you sure you want to delete "{pages.find(p => p.id === deletingPageId)?.title}"?
            </p>
            <p className={styles.warning}>This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setDeletingPageId(null)}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className={styles.dangerButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManager;
