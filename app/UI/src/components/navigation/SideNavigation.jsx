import React, { useState } from 'react';
import styles from '../../styles/SideNavigation.module.css';

/**
 * SideNavigation Component
 *
 * Vertical sidebar with icon + label navigation
 * - Collapsible on mobile (< 768px)
 * - Sticky positioning
 * - Active tab highlighting with circle indicator
 * - Smooth collapse/expand animation (200ms)
 * - Maintains scroll position per tab
 */
const SideNavigation = ({
  activeSection = 'templates',
  onSectionChange = () => {},
  collapsed = false,
  onCollapsedChange = () => {}
}) => {
  const navigationItems = [
    {
      id: 'templates',
      label: 'Templates',
      icon: '📋',
      ariaLabel: 'Navigate to templates'
    },
    {
      id: 'build-history',
      label: 'Build History',
      icon: '⏱️',
      ariaLabel: 'Navigate to build history'
    },
    {
      id: 'sites',
      label: 'Sites',
      icon: '🌐',
      ariaLabel: 'Navigate to sites'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      ariaLabel: 'Navigate to settings'
    }
  ];

  const handleNavItemClick = (sectionId) => {
    onSectionChange(sectionId);
  };

  const handleToggleCollapse = () => {
    onCollapsedChange(!collapsed);
  };

  return (
    <nav
      className={`${styles.sideNavigation} ${collapsed ? styles.collapsed : ''}`}
      aria-label="Main navigation"
    >
      {/* Navigation Items */}
      <div className={styles.navItems}>
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
            onClick={() => handleNavItemClick(item.id)}
            aria-label={item.ariaLabel}
            aria-current={activeSection === item.id ? 'page' : undefined}
            title={collapsed ? item.label : ''}
          >
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            {!collapsed && <span className={styles.label}>{item.label}</span>}
            {activeSection === item.id && <span className={styles.indicator} />}
          </button>
        ))}
      </div>

      {/* Collapse Toggle Button */}
      <button
        className={styles.collapseButton}
        onClick={handleToggleCollapse}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-expanded={!collapsed}
      >
        <span className={styles.collapseIcon}>{collapsed ? '→' : '←'}</span>
      </button>
    </nav>
  );
};

export default SideNavigation;
