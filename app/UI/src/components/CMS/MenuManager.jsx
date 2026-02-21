import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import MenuItemEditor from './MenuItemEditor';
import MenuPreview from './MenuPreview';
import styles from './MenuManager.module.css';

/**
 * MenuManager Component
 * Visual menu builder for managing site navigation and custom menus
 *
 * Supports:
 * - Creating and deleting menu items
 * - Drag-reordering menu items
 * - Nesting menu items (submenus)
 * - Linking to pages or custom URLs
 * - Auto-generating menus from page hierarchy
 * - Live preview of menu structure
 * - Menu settings (depth, home link, position)
 */
const MenuManager = ({
  menuData = [],
  pages = [],
  onSave = () => {},
  settings = { maxDepth: 3, showHomeLink: true, position: 'top' }
}) => {
  const [menu, setMenu] = useState(menuData);
  const [showEditor, setShowEditor] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [menuSettings, setMenuSettings] = useState(settings);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Add new menu item
  const handleAddItem = useCallback((newItem) => {
    const item = {
      ...newItem,
      id: newItem.id || `menu-${Date.now()}`,
      order: menu.length
    };

    setMenu([...menu, item]);
    setShowEditor(false);
    onSave([...menu, item]);
  }, [menu, onSave]);

  // Update menu item
  const handleUpdateItem = useCallback((itemId, updatedItem) => {
    const updatedMenu = menu.map(item =>
      item.id === itemId ? { ...item, ...updatedItem } : item
    );
    setMenu(updatedMenu);
    setEditingItemId(null);
    setShowEditor(false);
    onSave(updatedMenu);
  }, [menu, onSave]);

  // Delete menu item
  const handleDeleteItem = useCallback((itemId) => {
    const updatedMenu = menu.filter(item => item.id !== itemId);
    setMenu(updatedMenu);
    onSave(updatedMenu);
  }, [menu, onSave]);

  // Handle drag start
  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e, itemId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(itemId);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  // Handle drop
  const handleDrop = (e, targetItemId) => {
    e.preventDefault();

    if (draggedItem && draggedItem !== targetItemId) {
      const draggedIndex = menu.findIndex(item => item.id === draggedItem);
      const targetIndex = menu.findIndex(item => item.id === targetItemId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newMenu = [...menu];
        const [removed] = newMenu.splice(draggedIndex, 1);
        newMenu.splice(targetIndex, 0, removed);

        // Update order
        newMenu.forEach((item, index) => {
          item.order = index;
        });

        setMenu(newMenu);
        onSave(newMenu);
      }
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Auto-generate menu from pages
  const handleAutoGenerate = useCallback(() => {
    const generatedMenu = pages.map((page, index) => ({
      id: `menu-${page.id}`,
      label: page.title,
      type: 'link',
      pageId: page.id,
      url: page.slug,
      openInNewTab: false,
      icon: null,
      children: [],
      order: index
    }));

    setMenu(generatedMenu);
    onSave(generatedMenu);
  }, [pages, onSave]);

  // Clear and rebuild
  const handleClearAndRebuild = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const confirmRebuild = useCallback(() => {
    setMenu([]);
    setShowConfirmDialog(false);
    onSave([]);
  }, [onSave]);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings) => {
    setMenuSettings(newSettings);
    // Settings are saved separately
  }, []);

  // Render menu item list with hierarchy
  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => (
      <div key={item.id} className={styles.menuItemContainer}>
        <div
          data-level={level}
          className={styles.menuItemWrapper}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
          style={{
            paddingLeft: `${level * 20}px`,
            borderTop: dragOverItem === item.id ? '2px solid #007bff' : 'none'
          }}
        >
          <span className={styles.dragHandle}>::</span>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>{item.label}</span>
            <span className={styles.itemType}>{item.type}</span>
            {item.url && <span className={styles.itemUrl}>{item.url}</span>}
          </div>
          <div className={styles.itemActions}>
            <button
              className={styles.editBtn}
              onClick={() => {
                setEditingItemId(item.id);
                setShowEditor(true);
              }}
              aria-label={`Edit ${item.label}`}
            >
              Edit
            </button>
            <button
              className={styles.deleteBtn}
              onClick={() => handleDeleteItem(item.id)}
              aria-label={`Delete ${item.label}`}
            >
              Delete
            </button>
          </div>
        </div>
        {item.children && item.children.length > 0 && (
          <div className={styles.nestedItems}>
            {renderMenuItems(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div data-testid="menu-manager" className={styles.menuManager}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2>Menu Manager</h2>
          <p>Manage your site navigation and custom menus</p>
        </div>

        <div className={styles.content}>
          {/* Left Panel - Menu Editor */}
          <div className={styles.editorPanel}>
            <div className={styles.editorHeader}>
              <h3>Menu Structure</h3>
              <div className={styles.editorActions}>
                <button
                  className={styles.primaryBtn}
                  onClick={() => {
                    setEditingItemId(null);
                    setShowEditor(true);
                  }}
                >
                  + Add Menu Item
                </button>
              </div>
            </div>

            {/* Menu Items List */}
            {menu.length > 0 ? (
              <ul className={styles.menuList} role="list">
                {renderMenuItems(menu)}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <p>No menu items yet. Click "Add Menu Item" to start building your menu.</p>
              </div>
            )}

            {/* Menu Presets */}
            <div className={styles.presets}>
              <h4>Menu Presets</h4>
              <div className={styles.presetActions}>
                <button
                  className={styles.secondaryBtn}
                  onClick={handleAutoGenerate}
                >
                  Auto-generate from Pages
                </button>
                {menu.length > 0 && (
                  <button
                    className={styles.dangerBtn}
                    onClick={handleClearAndRebuild}
                  >
                    Clear and Rebuild
                  </button>
                )}
              </div>
            </div>

            {/* Menu Item Editor Modal */}
            {showEditor && (
              <MenuItemEditor
                itemId={editingItemId}
                item={editingItemId ? menu.find(i => i.id === editingItemId) : null}
                pages={pages}
                onSave={editingItemId ? handleUpdateItem : handleAddItem}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingItemId(null);
                }}
              />
            )}

            {/* Settings Section */}
            <div data-testid="menu-settings" className={styles.settings}>
              <h4>Menu Settings</h4>
              <div className={styles.settingsForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="maxDepth">Max Nesting Depth</label>
                  <input
                    id="maxDepth"
                    type="number"
                    min="1"
                    max="5"
                    value={menuSettings.maxDepth}
                    onChange={(e) =>
                      handleSettingsChange({
                        ...menuSettings,
                        maxDepth: parseInt(e.target.value)
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="showHomeLink">
                    <input
                      id="showHomeLink"
                      type="checkbox"
                      checked={menuSettings.showHomeLink}
                      onChange={(e) =>
                        handleSettingsChange({
                          ...menuSettings,
                          showHomeLink: e.target.checked
                        })
                      }
                    />
                    Show Home Link
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="position">Menu Position</label>
                  <select
                    id="position"
                    value={menuSettings.position}
                    onChange={(e) =>
                      handleSettingsChange({
                        ...menuSettings,
                        position: e.target.value
                      })
                    }
                  >
                    <option value="top">Top Navigation</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className={styles.previewPanel}>
            <MenuPreview
              menuData={menu}
              settings={menuSettings}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className={styles.confirmDialog} role="dialog">
          <div className={styles.dialogContent}>
            <h3>Clear and Rebuild Menu?</h3>
            <p>This will delete all current menu items. This action cannot be undone.</p>
            <div className={styles.dialogActions}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button
                className={styles.dangerBtn}
                onClick={confirmRebuild}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MenuManager.propTypes = {
  menuData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['link', 'submenu']).isRequired,
      pageId: PropTypes.string,
      url: PropTypes.string,
      openInNewTab: PropTypes.bool,
      icon: PropTypes.string,
      children: PropTypes.array,
      order: PropTypes.number
    })
  ),
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired
    })
  ),
  onSave: PropTypes.func,
  settings: PropTypes.shape({
    maxDepth: PropTypes.number,
    showHomeLink: PropTypes.bool,
    position: PropTypes.oneOf(['top', 'sidebar', 'both'])
  })
};

export default MenuManager;
