import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateLayoutWrapper from '../components/navigation/TemplateLayoutWrapper';
import styles from '../styles/Templates.module.css';

/**
 * Templates Page
 *
 * Main page for template browsing and management
 * Uses TemplateLayoutWrapper for navigation structure
 * Manages routes: /templates, /templates/browse, /templates/my-custom, etc.
 */
const Templates = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('templates');
  const [activeTab, setActiveTab] = useState('browse');

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    // Navigate to section-specific route
    navigate(`/templates/${sectionId}`);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Navigate to tab-specific route
    navigate(`/templates/${activeSection}/${tabId}`);
  };

  const tabs = [
    { id: 'browse', label: 'Browse' },
    { id: 'my-custom', label: 'My Custom' },
    { id: 'featured', label: 'Featured' },
    { id: 'trending', label: 'Trending' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'build-history':
        return (
          <div className={styles.contentPanel}>
            <h2>Build History</h2>
            <p>Your build history will appear here.</p>
          </div>
        );
      case 'sites':
        return (
          <div className={styles.contentPanel}>
            <h2>Sites</h2>
            <p>Your created sites will appear here.</p>
          </div>
        );
      case 'settings':
        return (
          <div className={styles.contentPanel}>
            <h2>Settings</h2>
            <p>Configure your preferences here.</p>
          </div>
        );
      case 'templates':
      default:
        return (
          <div className={styles.contentPanel}>
            <div className={styles.templateHeader}>
              <h2>Templates</h2>
              <p>Browse and create custom templates</p>
            </div>

            {/* Tab-specific content */}
            <div className={styles.tabContent}>
              {activeTab === 'browse' && (
                <div>
                  <h3>Browse Templates</h3>
                  <p>Explore all available templates</p>
                </div>
              )}
              {activeTab === 'my-custom' && (
                <div>
                  <h3>My Custom Templates</h3>
                  <p>Your custom templates will appear here</p>
                </div>
              )}
              {activeTab === 'featured' && (
                <div>
                  <h3>Featured Templates</h3>
                  <p>Explore featured templates from our community</p>
                </div>
              )}
              {activeTab === 'trending' && (
                <div>
                  <h3>Trending Templates</h3>
                  <p>Discover trending templates</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <TemplateLayoutWrapper
      activeSection={activeSection}
      activeTab={activeTab}
      onSectionChange={handleSectionChange}
      onTabChange={handleTabChange}
      defaultSection="templates"
      defaultTab="browse"
      tabs={tabs}
    >
      {renderContent()}
    </TemplateLayoutWrapper>
  );
};

export default Templates;
