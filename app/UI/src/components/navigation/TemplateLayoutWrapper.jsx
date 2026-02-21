import React, { useState, useEffect } from 'react';
import SideNavigation from './SideNavigation';
import TopTabBar from './TopTabBar';
import styles from '../../styles/TemplateLayoutWrapper.module.css';

/**
 * TemplateLayoutWrapper Component
 *
 * Combines sidebar + main content + tabs
 * - Manages active section state (Templates, Build History, Sites, Settings)
 * - Manages active tab state (Browse, My Custom, Featured, Trending)
 * - Handles mobile responsive behavior
 * - Supports nested routes within tabs
 * - Maintains scroll history per tab
 */
const TemplateLayoutWrapper = ({
  children,
  activeSection = 'templates',
  activeTab = 'browse',
  onSectionChange = () => {},
  onTabChange = () => {},
  defaultSection = 'templates',
  defaultTab = 'browse',
  showSidebar = true,
  showTabBar = true,
  tabs = [
    { id: 'browse', label: 'Browse' },
    { id: 'my-custom', label: 'My Custom' },
    { id: 'featured', label: 'Featured' },
    { id: 'trending', label: 'Trending' }
  ]
}) => {
  const [sectionState, setSectionState] = useState(activeSection || defaultSection);
  const [tabState, setTabState] = useState(activeTab || defaultTab);
  const currentSection = activeSection || sectionState;
  const currentTab = activeTab || tabState;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrollPositions, setScrollPositions] = useState({});
  const mainContentRef = React.useRef(null);

  // Handle section change
  const handleSectionChange = (sectionId) => {
    // Store current scroll position before changing
    if (mainContentRef.current) {
      setScrollPositions(prev => ({
        ...prev,
        [`${currentSection}-${currentTab}`]: mainContentRef.current.scrollTop
      }));
    }

    setSectionState(sectionId);
    onSectionChange(sectionId);

    // Reset scroll position for new section
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = scrollPositions[`${sectionId}-${currentTab}`] || 0;
    }
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    // Store current scroll position before changing
    if (mainContentRef.current) {
      setScrollPositions(prev => ({
        ...prev,
        [`${currentSection}-${currentTab}`]: mainContentRef.current.scrollTop
      }));
    }

    setTabState(tabId);
    onTabChange(tabId);

    // Reset scroll position for new tab
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = scrollPositions[`${currentSection}-${tabId}`] || 0;
    }
  };

  // Restore scroll position when content changes
  useEffect(() => {
    if (mainContentRef.current) {
      const scrollKey = `${currentSection}-${currentTab}`;
      const savedScroll = scrollPositions[scrollKey];
      if (savedScroll !== undefined) {
        mainContentRef.current.scrollTop = savedScroll;
      }
    }
  }, [currentSection, currentTab, scrollPositions]);

  // Detect if sidebar should collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 512) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.templateLayoutWrapper}>
      {/* Sidebar Navigation */}
      {showSidebar && (
        <SideNavigation
          activeSection={currentSection}
          onSectionChange={handleSectionChange}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Top Tab Bar */}
        {showTabBar && (
          <TopTabBar
            activeTab={currentTab}
            onTabChange={handleTabChange}
            tabs={tabs}
          />
        )}

        {/* Content Area */}
        <div
          ref={mainContentRef}
          className={styles.contentArea}
          role="main"
          aria-label={`${currentSection} content`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default TemplateLayoutWrapper;
