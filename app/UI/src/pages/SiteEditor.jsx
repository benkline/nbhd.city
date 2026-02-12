import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api';
import { TemplateGallery } from '../components/SiteBuilder/TemplateGallery';
import { SiteConfigForm } from '../components/SiteBuilder/SiteConfigForm';
import { BackToDashboardButton } from '../components/BackToDashboardButton';
import styles from '../styles/SiteEditor.module.css';

/**
 * SiteEditor - Create or edit a site
 * - If no template ID in URL: show template gallery
 * - If template ID in URL: show site config form
 * - After creation: show success message and offer to edit
 */
export default function SiteEditor() {
  const { templateId, siteId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(templateId ? 'config' : 'template');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [createdSite, setCreatedSite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get('/api/templates');
        setTemplates(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  // Update step and select template when templateId changes
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setStep('config');
      }
    }
  }, [templateId, templates]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setStep('config');
  };

  const handleSiteCreate = async (siteData) => {
    try {
      setLoading(true);
      setError(null);

      // Create the site via API
      const response = await apiClient.post('/api/sites', {
        title: siteData.title,
        template: selectedTemplate.id,
        config: siteData,
        site_type: 'personal',
      });

      setCreatedSite(response.data.data);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create site');
      console.error('Site creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPersonalSites = () => {
    navigate('/personal-sites');
  };

  const handleEditSite = () => {
    if (createdSite) {
      navigate(`/personal-sites?edit=${createdSite.site_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <BackToDashboardButton />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {step === 'template' && (
        <div className={styles.content}>
          <h1>Create Your Site</h1>
          <p className={styles.subtitle}>Choose a template to get started</p>
          <TemplateGallery onSelectTemplate={handleTemplateSelect} />
        </div>
      )}

      {step === 'config' && selectedTemplate && (
        <div className={styles.content}>
          <h1>Configure {selectedTemplate.name}</h1>
          <SiteConfigForm
            template={selectedTemplate}
            onSubmit={handleSiteCreate}
            loading={loading}
          />
        </div>
      )}

      {step === 'success' && createdSite && (
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>🎉</div>
          <h1>Site Created!</h1>
          <p className={styles.successMessage}>
            Your site "{createdSite.title}" has been created successfully.
          </p>
          <div className={styles.successActions}>
            <button
              className={styles.primaryButton}
              onClick={handleEditSite}
            >
              Edit Site Content
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleBackToPersonalSites}
            >
              Back to Personal Sites
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
