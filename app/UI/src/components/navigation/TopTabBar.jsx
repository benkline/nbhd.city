import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/TopTabBar.module.css';

/**
 * TopTabBar Component
 *
 * Horizontal tabs across viewport top
 * - Responsive: hide on mobile, show on tablet+
 * - Active tab underline with smooth animation (200ms)
 * - Tab switching with fade transition (300ms)
 * - Manages active tab state
 */
const TopTabBar = ({
  activeTab = 'browse',
  onTabChange = () => {},
  tabs = [
    { id: 'browse', label: 'Browse' },
    { id: 'my-custom', label: 'My Custom' },
    { id: 'featured', label: 'Featured' },
    { id: 'trending', label: 'Trending' }
  ]
}) => {
  const [underlineStyle, setUnderlineStyle] = useState({});
  const tabRefs = useRef({});

  // Update underline position when active tab changes or window resizes
  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setUnderlineStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`
      });
    }
  }, [activeTab]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;
        setUnderlineStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
  };

  return (
    <div className={styles.topTabBar} role="tablist" aria-label="Template categories">
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Animated underline */}
      <div
        className={styles.underline}
        style={underlineStyle}
      />
    </div>
  );
};

export default TopTabBar;
