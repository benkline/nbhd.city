/**
 * TemplateURLInput Component - SSG-019
 *
 * Allows users to input a GitHub URL for 11ty template analysis
 * Validates URL, triggers analysis, and displays real-time progress
 */

import { useState, useRef } from 'react';
import styles from './TemplateURLInput.module.css';

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;

export function TemplateURLInput({ onAnalysisStarted, onAnalysisComplete, onError }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const [error, setError] = useState(null);
  const progressIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const isValidGitHubUrl = (urlString) => {
    return GITHUB_URL_REGEX.test(urlString.trim());
  };

  const startProgressSimulation = () => {
    // Simulate progress over time (0-90% while analyzing)
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 90) progress = 90;
      setAnalysisProgress(progress);
    }, 1000);
  };

  const stopProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const pollAnalysisStatus = async (id) => {
    try {
      const response = await fetch(`/api/templates/${id}/analysis-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analysis status: ${response.statusText}`);
      }

      const data = await response.json();
      const status = data.data?.status || 'analyzing';

      setAnalysisStatus(status);

      // Update progress based on status
      if (status === 'analyzing') {
        setAnalysisProgress(Math.min(analysisProgress + 5, 90));
      } else if (status === 'ready') {
        setAnalysisProgress(100);
        stopProgressSimulation();
        clearInterval(pollIntervalRef.current);

        // Call completion callback
        if (onAnalysisComplete) {
          onAnalysisComplete({
            templateId: id,
            status,
            contentTypes: data.data?.content_types || {},
            schema: data.data?.schema
          });
        }
      } else if (status === 'failed') {
        setAnalysisProgress(0);
        stopProgressSimulation();
        clearInterval(pollIntervalRef.current);
        setError(data.data?.error || 'Analysis failed');

        if (onError) {
          onError(data.data?.error || 'Template analysis failed');
        }
      }
    } catch (err) {
      console.error('Failed to poll analysis status:', err);
      setError(err.message);
      stopProgressSimulation();

      if (onError) {
        onError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset state
    setError(null);
    setAnalysisProgress(0);
    setAnalysisStatus('analyzing');

    // Validate URL
    if (!url.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    if (!isValidGitHubUrl(url)) {
      setError('Invalid GitHub URL. Use format: https://github.com/username/repo-name');
      return;
    }

    setIsLoading(true);
    startProgressSimulation();

    try {
      // Call API to start analysis
      const response = await fetch('/api/templates/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ github_url: url.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to start analysis: ${response.statusText}`);
      }

      const data = await response.json();
      const newTemplateId = data.data?.template_id;

      if (!newTemplateId) {
        throw new Error('No template ID returned from server');
      }

      setTemplateId(newTemplateId);
      setAnalysisProgress(10);

      // Call started callback
      if (onAnalysisStarted) {
        onAnalysisStarted({ templateId: newTemplateId });
      }

      // Start polling for status
      pollAnalysisStatus(newTemplateId);
      pollIntervalRef.current = setInterval(() => {
        pollAnalysisStatus(newTemplateId);
      }, 3000); // Poll every 3 seconds

    } catch (err) {
      console.error('Failed to start analysis:', err);
      setError(err.message);
      setIsLoading(false);
      stopProgressSimulation();

      if (onError) {
        onError(err.message);
      }
    }
  };

  const handleReset = () => {
    setUrl('');
    setError(null);
    setAnalysisProgress(0);
    setAnalysisStatus(null);
    setTemplateId(null);
    setIsLoading(false);
    stopProgressSimulation();
    clearInterval(pollIntervalRef.current);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Import 11ty Template</h2>
        <p className={styles.description}>
          Enter a GitHub repository URL containing an 11ty static site template.
          We'll analyze it and infer the schema for your content.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="github-url" className={styles.label}>
              GitHub Repository URL
            </label>
            <input
              id="github-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/username/repo-name"
              disabled={isLoading}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              aria-label="GitHub repository URL"
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className={`${styles.button} ${styles.submitButton} ${isLoading ? styles.loading : ''}`}
              aria-label="Analyze template"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Template'}
            </button>
            {isLoading && (
              <button
                type="button"
                onClick={handleReset}
                className={`${styles.button} ${styles.secondaryButton}`}
                aria-label="Cancel analysis"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Progress Section */}
        {isLoading && (
          <div className={styles.progressSection}>
            <div className={styles.statusBadge}>
              <span className={styles.statusIcon}>⚙️</span>
              <span className={styles.statusText}>
                {analysisStatus === 'analyzing' ? 'Analyzing Template...' : 'Processing...'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressContainer}>
              <div className={styles.progressLabel}>
                <span>Analysis Progress</span>
                <span className={styles.percentage}>{Math.round(analysisProgress)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${analysisProgress}%` }}
                  aria-valuenow={Math.round(analysisProgress)}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  role="progressbar"
                />
              </div>
            </div>

            {/* Progress Messages */}
            <div className={styles.progressMessages}>
              <p className={styles.message}>
                ✓ Cloning repository
              </p>
              <p className={analysisProgress >= 30 ? styles.message : `${styles.message} ${styles.inactive}`}>
                {analysisProgress >= 30 ? '✓' : '○'} Validating 11ty configuration
              </p>
              <p className={analysisProgress >= 60 ? styles.message : `${styles.message} ${styles.inactive}`}>
                {analysisProgress >= 60 ? '✓' : '○'} Analyzing content structure
              </p>
              <p className={analysisProgress >= 90 ? styles.message : `${styles.message} ${styles.inactive}`}>
                {analysisProgress >= 90 ? '✓' : '○'} Inferring schema
              </p>
            </div>

            <p className={styles.hint}>
              This typically takes 30-90 seconds depending on template size
            </p>
          </div>
        )}

        {/* Help Text */}
        {!isLoading && (
          <div className={styles.helpSection}>
            <h3 className={styles.helpTitle}>What happens next?</h3>
            <ol className={styles.helpList}>
              <li>We clone your repository from GitHub</li>
              <li>Validate it's a valid 11ty project</li>
              <li>Scan all markdown files for content structure</li>
              <li>Infer the schema from frontmatter samples</li>
              <li>Create a dynamic CMS with schema-based forms</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplateURLInput;
