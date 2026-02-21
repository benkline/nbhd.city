import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './MenuManager.module.css';

/**
 * MenuPreview Component
 * Live preview of menu structure showing both desktop and mobile hamburger views
 */
const MenuPreview = ({ menuData = [], settings = {} }) => {
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'mobile'

  // Render menu items recursively
  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => (
      <li key={item.id} className={styles.previewMenuItem}>
        <div className={styles.previewMenuItemContent}>
          {item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
          <span className={styles.menuLabel}>{item.label}</span>
          {item.children && item.children.length > 0 && (
            <button
              className={styles.expandButton}
              onClick={() =>
                setExpandedSubmenu(
                  expandedSubmenu === item.id ? null : item.id
                )
              }
              aria-label={`${expandedSubmenu === item.id ? 'Collapse' : 'Expand'} ${item.label}`}
            >
              {expandedSubmenu === item.id ? '▼' : '▶'}
            </button>
          )}
        </div>

        {/* Nested items */}
        {item.children && item.children.length > 0 && (
          <ul
            className={styles.previewSubmenu}
            style={{
              display: expandedSubmenu === item.id ? 'block' : 'none'
            }}
          >
            {renderMenuItems(item.children, level + 1)}
          </ul>
        )}
      </li>
    ));
  };

  // Desktop view
  const renderDesktopPreview = () => (
    <div className={styles.desktopPreview}>
      <div className={styles.previewHeader}>Desktop View</div>
      <nav className={styles.previewNav}>
        {settings.showHomeLink && (
          <a href="/" className={styles.homeLink}>
            Home
          </a>
        )}
        <ul className={styles.previewMenuList} role="list">
          {menuData.length > 0 ? (
            renderMenuItems(menuData)
          ) : (
            <li className={styles.emptyMessage}>No menu items</li>
          )}
        </ul>
      </nav>
    </div>
  );

  // Mobile view with hamburger menu
  const renderMobilePreview = () => (
    <div className={styles.mobilePreview}>
      <div className={styles.previewHeader}>Mobile View (Hamburger)</div>
      <div className={styles.mobileNavBar}>
        <button
          data-testid="hamburger-menu"
          className={styles.hamburgerButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburgerIcon}>☰</span>
        </button>
        <span className={styles.siteTitle}>Menu</span>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenuDrawer}>
          <nav className={styles.mobileNav}>
            {settings.showHomeLink && (
              <a
                href="/"
                className={styles.mobileLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
            )}
            <ul className={styles.previewMenuList} role="list">
              {menuData.length > 0 ? (
                renderMenuItems(menuData)
              ) : (
                <li className={styles.emptyMessage}>No menu items</li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );

  return (
    <div data-testid="menu-preview" className={styles.menuPreview}>
      <div className={styles.previewContainer}>
        {/* View mode tabs */}
        <div className={styles.previewTabs}>
          <button
            className={
              viewMode === 'desktop'
                ? `${styles.previewTab} ${styles.active}`
                : styles.previewTab
            }
            onClick={() => setViewMode('desktop')}
          >
            Desktop
          </button>
          <button
            className={
              viewMode === 'mobile'
                ? `${styles.previewTab} ${styles.active}`
                : styles.previewTab
            }
            onClick={() => setViewMode('mobile')}
          >
            Mobile
          </button>
        </div>

        {/* Preview Content */}
        <div className={styles.previewContent}>
          {viewMode === 'desktop' ? renderDesktopPreview() : renderMobilePreview()}
        </div>

        {/* Settings Display */}
        <div className={styles.previewInfo}>
          <h4>Menu Settings</h4>
          <ul className={styles.settingsList}>
            <li>Max Depth: {settings.maxDepth || '3'}</li>
            <li>Home Link: {settings.showHomeLink ? 'Shown' : 'Hidden'}</li>
            <li>Position: {settings.position || 'Top'}</li>
            <li>Items: {menuData.length}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

MenuPreview.propTypes = {
  menuData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['link', 'submenu']).isRequired,
      icon: PropTypes.string,
      url: PropTypes.string,
      children: PropTypes.array
    })
  ),
  settings: PropTypes.shape({
    maxDepth: PropTypes.number,
    showHomeLink: PropTypes.bool,
    position: PropTypes.oneOf(['top', 'sidebar', 'both'])
  })
};

export default MenuPreview;
