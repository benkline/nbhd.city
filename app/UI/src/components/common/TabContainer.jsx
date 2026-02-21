/**
 * TabContainer Component
 * Reusable tabbed interface for organizing content
 *
 * Usage:
 * <TabContainer
 *   tabs={[
 *     { id: 'seo', label: 'SEO', panel: <SEOMetadata /> },
 *     { id: 'publishing', label: 'Publishing', panel: <PublishingMetadata /> }
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 */

import React from 'react';
import styles from './TabContainer.module.css';

export function TabContainer({
  tabs = [],
  activeTab = '',
  onChange = () => {},
  disabled = false,
  aria = {}
}) {
  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            onClick={() => onChange(tab.id)}
            disabled={disabled}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            id={`${tab.id}-panel`}
            role="tabpanel"
            aria-labelledby={tab.id}
            className={styles.tabPanel}
            hidden={activeTab !== tab.id}
          >
            {activeTab === tab.id && tab.panel}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TabContainer;
