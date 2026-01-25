import { useState, useEffect, useRef } from 'react';
import styles from './CustomTemplateModal.module.css';

/**
 * Custom Template Modal Component
 *
 * Requirement: [ ] Modal with GitHub URL input
 * Requirement: [ ] Template validation and analysis progress
 * Requirement: [ ] Show analysis status (analyzing, ready, failed)
 * Requirement: [ ] Error messages for failed analysis
 */

export function CustomTemplateModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const pollTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  if (!isOpen) return null;

  const validateUrl = (url) => {
    if (!url) return 'GitHub URL is required';
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const allowedDomains = ['github.com', 'gitlab.com', 'bitbucket.org'];

      if (!allowedDomains.includes(domain)) {
        return 'URL must be from GitHub, GitLab, or Bitbucket';
      }

      if (urlObj.protocol !== 'https:') {
        return 'URL must use HTTPS';
      }

      return null;
    } catch {
      return 'Invalid URL format';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    const urlError = validateUrl(githubUrl);
    if (urlError) {
      setError(urlError);
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setStatus('analyzing');

    try {
      // Call API to register template
      const response = await fetch('/api/templates/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          github_url: githubUrl.trim(),
          is_public: isPublic
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.detail || 'Failed to register template');
      }

      const data = await response.json();
      const respData = data.data || data;

      setTemplateId(respData.template_id);
      setStatus('analyzing');

      // Polling starts automatically via useEffect when templateId changes

      // Call onAdd callback
      if (onAdd) {
        onAdd({
          template_id: respData.template_id,
          name: name.trim(),
          github_url: githubUrl.trim(),
          status: 'analyzing'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to register template');
      setStatus('failed');
      setIsAnalyzing(false);
    }
  };

  // Setup polling when templateId changes
  useEffect(() => {
    if (!templateId) return;

    let attempts = 0;
    const maxAttempts = 60;
    let mounted = true;

    const poll = async () => {
      if (!mounted || attempts >= maxAttempts) {
        if (attempts >= maxAttempts && mounted) {
          setError('Template analysis timed out');
          setStatus('failed');
          setIsAnalyzing(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/templates/custom/${templateId}/status`);
        if (!response.ok) {
          if (mounted) {
            throw new Error('Failed to fetch template status');
          }
          return;
        }

        const data = await response.json();
        const statusData = data.data || data;

        if (!mounted) return;

        setStatus(statusData.status);

        if (statusData.status === 'ready') {
          setIsAnalyzing(false);
          // Auto-close after showing success
          closeTimeoutRef.current = setTimeout(() => {
            if (mounted) {
              handleClose();
            }
          }, 2000);
        } else if (statusData.status === 'failed') {
          setError(statusData.error || 'Template analysis failed');
          setIsAnalyzing(false);
        } else {
          // Still analyzing, poll again
          attempts++;
          pollTimeoutRef.current = setTimeout(poll, 1000);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to check template status');
          setStatus('failed');
          setIsAnalyzing(false);
        }
      }
    };

    // Start polling
    poll();

    return () => {
      mounted = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [templateId]);

  const handleClose = () => {
    // Clear any pending timeouts
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    // Reset form
    setName('');
    setGithubUrl('');
    setIsPublic(false);
    setError(null);
    setStatus(null);
    setTemplateId(null);
    setIsAnalyzing(false);
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Add Custom Template</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
            disabled={isAnalyzing}
          >
            ✕
          </button>
        </div>

        {!isAnalyzing && status !== 'ready' && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="template-name">Template Name</label>
              <input
                id="template-name"
                type="text"
                placeholder="Template name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="github-url">GitHub URL</label>
              <input
                id="github-url"
                type="text"
                placeholder="GitHub repository URL"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={isAnalyzing}
              />
              <small>Enter the GitHub URL of your 11ty template repository</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="is-public">
                <input
                  id="is-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isAnalyzing}
                />
                Make template public (shareable with others)
              </label>
            </div>

            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Adding...' : 'Add Template'}
            </button>
          </form>
        )}

        {isAnalyzing && (
          <div className={styles.analyzing} data-testid="analysis-progress">
            <div className={styles.spinner} />
            <p>Analyzing template...</p>
            <p className={styles.progress}>This may take a minute</p>
          </div>
        )}

        {status === 'ready' && (
          <div className={styles.success}>
            <div className={styles.checkmark}>✓</div>
            <p>Template added successfully!</p>
            <p className={styles.note}>Closing in a moment...</p>
          </div>
        )}

        {status === 'failed' && !isAnalyzing && (
          <div className={styles.failed}>
            <p className={styles.failedMessage}>{error || 'Failed to analyze template'}</p>
            <button
              onClick={handleClose}
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <button
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
