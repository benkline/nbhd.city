import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateLayoutWrapper from '../components/navigation/TemplateLayoutWrapper';
import siteContentService from '../services/siteContentService';
import apiClient from '../lib/api';
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
  const [builtInTemplates, setBuiltInTemplates] = useState([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analyzedTemplate, setAnalyzedTemplate] = useState(null);
  const [pollingTemplateId, setPollingTemplateId] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(null);

  // Load built-in templates on mount
  useEffect(() => {
    const loadBuiltInTemplates = async () => {
      try {
        const response = await apiClient.get('/api/templates');
        setBuiltInTemplates(response.data.data || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadBuiltInTemplates();
  }, []);

  // Poll template analysis status
  useEffect(() => {
    if (!pollingTemplateId) return;

    const pollStatus = async () => {
      try {
        const status = await siteContentService.pollTemplateStatus(pollingTemplateId);
        setPollingStatus(status);

        if (status.status === 'ready') {
          setAnalyzedTemplate({
            ...status,
            id: pollingTemplateId
          });
          setPollingTemplateId(null);
        } else if (status.status === 'error') {
          setAnalysisError(status.error || 'Template analysis failed');
          setPollingTemplateId(null);
        } else {
          // Continue polling
          setTimeout(pollStatus, 1000);
        }
      } catch (err) {
        console.error('Error polling template status:', err);
        setAnalysisError('Failed to check template status');
        setPollingTemplateId(null);
      }
    };

    pollStatus();
  }, [pollingTemplateId]);

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

  const handleAnalyzeGithubUrl = async () => {
    if (!githubUrl.trim()) {
      setAnalysisError('Please enter a GitHub repository URL');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisError(null);
      setAnalyzedTemplate(null);
      setPollingStatus(null);

      const response = await siteContentService.registerCustomTemplate(githubUrl);
      const templateId = response.template_id || response.id;

      if (response.status === 'ready') {
        setAnalyzedTemplate(response);
      } else {
        setPollingTemplateId(templateId);
        setPollingStatus(response);
      }

      setGithubUrl('');
    } catch (err) {
      console.error('Error analyzing template:', err);
      setAnalysisError(err.response?.data?.detail || err.message || 'Failed to analyze template');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateSite = (templateId) => {
    navigate(`/site-editor?templateId=${templateId}`);
  };

  const handleUseBuiltInTemplate = (template) => {
    navigate(`/site-editor?templateId=${template.id}`);
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
                <div className={styles.browseTab}>
                  <h3>Browse Templates</h3>

                  {/* Custom 11ty Project Loader */}
                  <div className={styles.customProjectSection}>
                    <div className={styles.customProjectCard}>
                      <h4>Load 11ty Project from GitHub</h4>
                      <p>Analyze the frontmatter from your 11ty static site project to create a custom template.</p>
                      <div className={styles.urlInputGroup}>
                        <input
                          type="text"
                          placeholder="https://github.com/username/my-11ty-site"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          disabled={analyzing}
                          className={styles.urlInput}
                        />
                        <button
                          onClick={handleAnalyzeGithubUrl}
                          disabled={analyzing}
                          className={styles.analyzeButton}
                        >
                          {analyzing ? 'Analyzing...' : 'Analyze'}
                        </button>
                      </div>
                      {analysisError && (
                        <div className={styles.error}>
                          {analysisError}
                        </div>
                      )}
                      {pollingStatus && (
                        <div className={styles.analyzing}>
                          <p>Status: {pollingStatus.status}</p>
                          {pollingStatus.status === 'processing' && (
                            <div className={styles.spinner}></div>
                          )}
                        </div>
                      )}
                      {analyzedTemplate && (
                        <div className={styles.analyzedResult}>
                          <h5>✓ Template Analyzed</h5>
                          <p>Content types detected:</p>
                          <ul>
                            {Object.keys(analyzedTemplate.content_types || {}).map(contentType => (
                              <li key={contentType}>{contentType}</li>
                            ))}
                          </ul>
                          <button
                            onClick={() => handleCreateSite(analyzedTemplate.id)}
                            className={styles.createButton}
                          >
                            Create Site from This Template
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Built-in Templates */}
                  <div className={styles.builtInSection}>
                    <h4>Built-in Templates</h4>
                    <div className={styles.templateGrid}>
                      {builtInTemplates.map(template => (
                        <div key={template.id} className={styles.templateCard}>
                          <div className={styles.templateCardHeader}>
                            <h5>{template.name}</h5>
                            <span className={styles.templateBadge}>{template.id}</span>
                          </div>
                          <p>{template.description || 'A ready-to-use template'}</p>
                          <button
                            onClick={() => handleUseBuiltInTemplate(template)}
                            className={styles.useButton}
                          >
                            Use This Template
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
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
