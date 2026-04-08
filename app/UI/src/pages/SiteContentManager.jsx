import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import siteContentService from '../services/siteContentService';
import apiClient from '../lib/api';
import { ContentManagementDashboard } from '../components/CMS/ContentManagementDashboard';
import ContentBrowser from '../components/CMS/ContentBrowser';
import EnhancedContentEditor from '../components/CMS/EnhancedContentEditor';
import PageManager from '../components/CMS/PageManager';
import MenuManager from '../components/CMS/MenuManager';
import { SiteSettingsPage } from '../components/CMS/SiteSettingsPage';
import styles from '../styles/SiteContentManager.module.css';

/**
 * SiteContentManager - Main CMS hub for managing site content
 * Routes at /sites/:siteId/cms
 * Loads site config, template schema, and renders appropriate CMS component per section
 */
export default function SiteContentManager() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [site, setSite] = useState(null);
  const [contentTypes, setContentTypes] = useState(null);
  const [templateSchema, setTemplateSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingContent, setEditingContent] = useState(null);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load site config and template schema on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get site config
        const siteResponse = await apiClient.get(`/api/sites/${siteId}`);
        const siteData = siteResponse.data;
        setSite(siteData);

        // Get template content types and schema
        if (siteData.template) {
          const contentTypesResponse = await siteContentService.getTemplateContentTypes(siteData.template);
          setContentTypes(contentTypesResponse);

          const schemaResponse = await siteContentService.getTemplateSchema(siteData.template);
          setTemplateSchema(schemaResponse);
        }
      } catch (err) {
        console.error('Failed to load site CMS data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && siteId) {
      loadData();
    }
  }, [siteId, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading CMS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading CMS</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/personal-sites')}>Back to Sites</button>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Site Not Found</h2>
          <button onClick={() => navigate('/personal-sites')}>Back to Sites</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/personal-sites')}>
          ← Back
        </button>
        <h1>{site.title} — Content Manager</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'posts' ? styles.active : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              📝 Posts
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'pages' ? styles.active : ''}`}
              onClick={() => setActiveTab('pages')}
            >
              📄 Pages
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'menus' ? styles.active : ''}`}
              onClick={() => setActiveTab('menus')}
            >
              🔗 Menus
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>

        <div className={styles.main}>
          {activeTab === 'dashboard' && (
            <ContentManagementDashboard
              siteId={siteId}
              siteType={site.site_type}
              onNavigate={(section) => setActiveTab(section)}
            />
          )}

          {activeTab === 'posts' && (
            <div className={styles.section}>
              <h2>Posts</h2>
              {editingContent ? (
                <div className={styles.editorContainer}>
                  <button
                    className={styles.backToListButton}
                    onClick={() => setEditingContent(null)}
                  >
                    ← Back to Posts
                  </button>
                  <EnhancedContentEditor
                    siteId={siteId}
                    templateSchema={templateSchema}
                    initialContent={editingContent.value || ''}
                    initialFrontmatter={editingContent.frontmatter || {}}
                    onPublish={(content, frontmatter) => {
                      setEditingContent(null);
                      setActiveTab('dashboard');
                    }}
                    onSaveDraft={() => {
                      setEditingContent(null);
                    }}
                  />
                </div>
              ) : (
                <ContentBrowser
                  siteId={siteId}
                  contentType="post"
                  onEdit={(content) => setEditingContent(content)}
                  onNew={() => {
                    setEditingContent({
                      content_type: 'post',
                      value: '',
                      frontmatter: {}
                    });
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'pages' && (
            <div className={styles.section}>
              <h2>Pages</h2>
              <PageManager siteId={siteId} />
            </div>
          )}

          {activeTab === 'menus' && (
            <div className={styles.section}>
              <h2>Menus</h2>
              <MenuManager siteId={siteId} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.section}>
              <SiteSettingsPage siteId={siteId} site={site} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
