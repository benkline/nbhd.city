import React, { useMemo } from 'react';
import styles from './PageManager.module.css';

/**
 * PageTreeView Component
 *
 * Displays pages in a hierarchical tree structure with drag-to-reorder support.
 * Used on desktop view only.
 */
const PageTreeView = ({
  pages,
  onEditPage,
  onDeletePage,
  onDragStart,
  onDragOver,
  onDrop,
  getPageDepth,
  generatePageUrl,
  getPageChildren,
  namespace
}) => {
  // Build a tree structure for display
  const pageTree = useMemo(() => {
    const tree = [];
    const processed = new Set();

    const addToTree = (pages, parentId = null) => {
      pages.forEach(page => {
        if (page.parent_id === parentId && !processed.has(page.id)) {
          processed.add(page.id);
          tree.push(page);
          addToTree(pages, page.id);
        }
      });
    };

    addToTree(pages);
    return tree;
  }, [pages]);

  return (
    <div className={styles.treeView}>
      <div className={styles.tableHeader}>
        <div className={styles.dragColumn}>Reorder</div>
        <div className={styles.titleColumn}>Title</div>
        <div className={styles.parentColumn}>Parent Page</div>
        <div className={styles.urlColumn}>URL</div>
        <div className={styles.actionsColumn}>Actions</div>
      </div>

      <div className={styles.tableBody}>
        {pageTree.map(page => {
          const depth = getPageDepth(page.id);
          const children = getPageChildren(page.id);
          const url = generatePageUrl(page.id);
          const parentPage = pages.find(p => p.id === page.parent_id);

          return (
            <div
              key={page.id}
              className={styles.tableRow}
              data-page-id={page.id}
              data-parent-id={page.parent_id}
              data-depth={depth}
              data-url={url}
              draggable
              onDragStart={(e) => onDragStart(e, page.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, page.id)}
              onClick={() => onEditPage(page.id)}
            >
              <div className={styles.dragColumn}>
                <button
                  className={styles.dragHandle}
                  aria-label="Drag handle"
                  onMouseDown={(e) => e.preventDefault()}
                  title="Drag to reorder pages"
                >
                  ⋮⋮
                </button>
              </div>

              <div
                className={styles.titleColumn}
                style={{ paddingLeft: `${depth * 16}px` }}
              >
                <span className={styles.pageTitle}>{page.title}</span>
                {children.length > 0 && (
                  <span className={styles.childBadge}>
                    {children.length} child{children.length !== 1 ? 'ren' : ''}
                  </span>
                )}
              </div>

              <div className={styles.parentColumn}>
                {parentPage ? (
                  <span className={styles.parentName}>{parentPage.title}</span>
                ) : (
                  <span className={styles.noParent}>—</span>
                )}
              </div>

              <div className={styles.urlColumn}>
                <code className={styles.urlCode}>{url}</code>
              </div>

              <div className={styles.actionsColumn}>
                <button
                  className={styles.editButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPage(page.id);
                  }}
                  title="Edit page"
                  aria-label={`Edit ${page.title}`}
                >
                  ✎
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(page.id);
                  }}
                  title="Delete page"
                  aria-label={`Delete ${page.title}`}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PageTreeView;
