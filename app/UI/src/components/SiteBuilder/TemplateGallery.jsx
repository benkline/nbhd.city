import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api';
import { CustomTemplateModal } from './CustomTemplateModal';
import { TemplateDetailsModal } from './TemplateDetailsModal';
import styles from './TemplateGallery.module.css';

export function TemplateGallery({ onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/templates');
        setTemplates(response.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleViewDetails = (template) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleSelectTemplate = (template) => {
    if (onSelect) {
      onSelect(template);
    } else {
      // Navigate to config form if no callback provided
      navigate(`/site-editor/${template.id}`);
    }
    setShowDetailsModal(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await apiClient.delete(`/api/templates/custom/${templateId}`);
      setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
      setToast({
        type: 'success',
        message: 'Template deleted successfully'
      });
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to delete template'
      });
    }
  };

  const handleReanalyzeTemplate = async (templateId) => {
    try {
      await apiClient.post(`/api/templates/custom/${templateId}/reanalyze`);
      // Update the template status to analyzing
      setCustomTemplates(customTemplates.map(t =>
        t.id === templateId ? { ...t, status: 'analyzing' } : t
      ));
      setToast({
        type: 'success',
        message: 'Re-analysis started'
      });
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to re-analyze template'
      });
    }
  };

  const handleShareTemplate = (template) => {
    // Copy share link to clipboard
    const shareUrl = `${window.location.origin}/templates/${template.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setToast({
        type: 'success',
        message: 'Link copied to clipboard'
      });
      setTimeout(() => {
        setToast(null);
      }, 3000);
    });
  };

  const handleCustomTemplateAdded = (template) => {
    // Add the new custom template to the list
    setCustomTemplates([
      ...customTemplates,
      {
        id: template.template_id,
        name: template.name,
        github_url: template.github_url,
        status: template.status,
        is_custom: true
      }
    ]);

    // Show toast notification
    setToast({
      type: 'success',
      message: 'Template added! Analyzing...'
    });

    // Clear toast after 4 seconds
    setTimeout(() => {
      setToast(null);
    }, 4000);

    // Close modal
    setShowCustomModal(false);
  };

  const handleCloseModal = () => {
    setShowCustomModal(false);
  };

  if (loading) {
    return (
      <div className={styles.container} data-testid="template-loading">
        <p>Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Choose a Template</h1>
          <p>Select from our collection of beautiful 11ty templates</p>
        </div>
        <button
          className={styles.addCustomButton}
          onClick={() => setShowCustomModal(true)}
          title="Add Custom Template"
          aria-label="Add Custom Template"
        >
          <span className={styles.plusIcon}>+</span>
        </button>
      </div>

      {toast && (
        <div className={`${styles.toast} ${styles[`toast-${toast.type}`]}`}>
          {toast.message}
        </div>
      )}

      <div className={styles.gallery} data-testid="template-gallery">
        {customTemplates.map((template) => (
          <div key={template.id} className={`${styles.card} ${styles.customCard}`}>
            <div className={styles.imageContainer}>
              <div className={styles.placeholderImage}>
                ✨ {template.name}
              </div>
            </div>

            <div className={styles.content}>
              <div className={styles.cardBadge}>Custom</div>
              <h2 className={styles.name}>{template.name}</h2>
              <p className={styles.description}>{template.github_url}</p>

              {template.status === 'analyzing' ? (
                <div className={styles.analyzingState}>
                  <div className={styles.spinner} />
                  <button
                    disabled
                    className={styles.selectButton}
                  >
                    Analyzing...
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectTemplate(template)}
                  className={styles.selectButton}
                >
                  Select Template
                </button>
              )}
            </div>
          </div>
        ))}

        {templates.map((template) => (
          <div key={template.id} className={styles.card}>
            <div className={styles.imageContainer}>
              <div className={styles.placeholderImage}>
                📄 {template.name}
              </div>
            </div>

            <div className={styles.content}>
              <h2 className={styles.name}>{template.name}</h2>
              <p className={styles.description}>{template.description}</p>

              {template.tags && template.tags.length > 0 && (
                <div className={styles.tags}>
                  {template.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleSelectTemplate(template)}
                className={styles.selectButton}
              >
                Select Template
              </button>
            </div>
          </div>
        ))}
      </div>

      <CustomTemplateModal
        isOpen={showCustomModal}
        onClose={handleCloseModal}
        onAdd={handleCustomTemplateAdded}
      />
    </div>
  );
}
