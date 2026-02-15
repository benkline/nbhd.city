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
    if (templateId) {
      const fetchTemplate = async () => {
        try {
          const response = await apiClient.get(`/api/templates/${templateId}`);
          setSelectedTemplate(response.data.data);
          setStep('config');
        } catch (err) {
          setError(`Failed to load template: ${err.message}`);
        }
      };
      fetchTemplate();
    }
  }, [templateId]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setStep('config');
  };

  const handleSiteCreate = async (siteData) => {
    try {
      setLoading(true);
      setError(null);

      // Extract title from config (templates use site_title field)
      const title = siteData.site_title || siteData.title || 'Untitled Site';

      // Separate site_type and nbhd_id from config, rest goes to config
      const { site_type, nbhd_id, ...configData } = siteData;

      console.log('Creating site with data:', { title, template: selectedTemplate.id, configData });

      // Create the site via API
      const response = await apiClient.post('/api/sites', {
        title,
        template: selectedTemplate.id,
        config: configData,
        site_type: site_type || 'personal',
        nbhd_id: nbhd_id || undefined,
      });

      console.log('Site created successfully:', response.data);
      setCreatedSite(response.data.data);
      setStep('success');
    } catch (err) {
      // Handle Pydantic validation errors (422)
      let errorMessage = 'Failed to create site';
      const responseData = err.response?.data;

      console.error('Site creation error response:', responseData, err);

      if (responseData?.detail) {
        if (Array.isArray(responseData.detail)) {
          // Pydantic validation error array
          errorMessage = responseData.detail
            .map(e => e.msg || JSON.stringify(e))
            .join('; ');
        } else {
          // String error message
          errorMessage = responseData.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setStep('config'); // Stay on config form to allow correction
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
            onDeploy={handleSiteCreate}
            loading={loading}
          />
        </div>
      )}

      {step === 'success' && (
        <div className={styles.successContainer}>
          {createdSite ? (
            <>
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
            </>
          ) : (
            <>
              <div className={styles.successIcon}>⏳</div>
              <h1>Creating your site...</h1>
              <p className={styles.successMessage}>Please wait while we set up your site.</p>
            </>
          )}
        </div>
      )}

      {!step && (
        <div className={styles.content}>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
}
