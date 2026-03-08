import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api';
import { CustomTemplateModal } from './CustomTemplateModal';
import { TemplateDetailsModal } from './TemplateDetailsModal';
import { TemplateCard } from './TemplateCard';
import { EmptyTemplateState } from './EmptyTemplateState';
import { AnalysisProgress } from './AnalysisProgress';
import styles from './TemplateGallery.module.css';

export function TemplateGallery({ onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
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

    const fetchCustomTemplates = async () => {
      try {
        const response = await apiClient.get('/api/templates/custom/user/list');
        setCustomTemplates(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch custom templates:', err);
        // Don't fail the entire page if custom templates fail to load
      }
    };

    fetchTemplates();
    fetchCustomTemplates();
  }, []);

  // Poll for custom template status updates
  useEffect(() => {
    if (customTemplates.length === 0) {
      return;
    }

    // Check if any template is still analyzing
    const hasAnalyzing = customTemplates.some(t => t.status === 'analyzing');
    if (!hasAnalyzing) {
      return; // Stop polling when all are done
    }

    const pollCustomTemplateStatus = async () => {
      try {
        // Poll each analyzing template
        const updates = await Promise.all(
          customTemplates
            .filter(t => t.status === 'analyzing')
            .map(t =>
              fetch(`/api/templates/custom/${t.id}/status`)
                .then(res => res.ok ? res.json() : null)
                .then(data => ({
                  id: t.id,
                  status: data?.data?.status || t.status,
                  error: data?.data?.error,
                  content_types: data?.data?.content_types,
                  schema: data?.data?.schema
                }))
                .catch(() => ({ id: t.id, status: t.status }))
            )
        );

        // Update templates that have changed status
        setCustomTemplates(prev =>
          prev.map(t => {
            const update = updates.find(u => u.id === t.id);
            if (update && update.status !== t.status) {
              console.log(`[TemplateGallery] Template ${t.id} status updated: ${t.status} → ${update.status}`);
              return { ...t, ...update };
            }
            return t;
          })
        );
      } catch (err) {
        console.error('[TemplateGallery] Error polling template status:', err);
      }
    };

    const interval = setInterval(pollCustomTemplateStatus, 2000);
    return () => clearInterval(interval);
  }, [customTemplates]);

  const handleViewDetails = (template) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleTemplateCardSelect = (template) => {
    // Don't allow selection while analyzing
    if (template.is_custom && template.status === 'analyzing') {
      setSelectedTemplate(template);
      setShowProgressModal(true);
      return;
    }

    // For custom templates, show details modal
    // For built-in templates, proceed with selection
    if (template.is_custom) {
      setSelectedTemplate(template);
      setShowDetailsModal(true);
    } else {
      handleSelectTemplate(template);
    }
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

  const handleRenameTemplate = async (templateId, newName) => {
    try {
      await apiClient.patch(`/api/templates/custom/${templateId}`, {
        name: newName
      });
      // Update the template in the list
      setCustomTemplates(customTemplates.map(t =>
        t.id === templateId ? { ...t, name: newName } : t
      ));
      setToast({
        type: 'success',
        message: 'Template renamed successfully'
      });
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to rename template'
      });
    }
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

      {/* Custom Templates Section */}
      {customTemplates.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>My Custom Templates</h2>
          <div className={styles.gallery} data-testid="custom-templates-gallery">
            {customTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={{ ...template, is_custom: true }}
                onSelect={handleTemplateCardSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Custom Templates */}
      {customTemplates.length === 0 && (
        <EmptyTemplateState onAddTemplate={() => setShowCustomModal(true)} />
      )}


      <CustomTemplateModal
        isOpen={showCustomModal}
        onClose={handleCloseModal}
        onAdd={handleCustomTemplateAdded}
      />

      <TemplateDetailsModal
        isOpen={showDetailsModal}
        template={selectedTemplate}
        onClose={() => setShowDetailsModal(false)}
        onSelect={handleSelectTemplate}
        onDelete={handleDeleteTemplate}
        onReanalyze={handleReanalyzeTemplate}
        onShare={handleShareTemplate}
        onRename={handleRenameTemplate}
      />

      {selectedTemplate && (
        <AnalysisProgress
          isOpen={showProgressModal}
          templateId={selectedTemplate.id}
          status={selectedTemplate.status}
          error={selectedTemplate.error}
          onClose={() => {
            setShowProgressModal(false);
            setSelectedTemplate(null);
          }}
          onRetry={() => handleReanalyzeTemplate(selectedTemplate.id)}
        />
      )}
    </div>
  );
}
