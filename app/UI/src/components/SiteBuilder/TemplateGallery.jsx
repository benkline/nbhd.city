import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TemplateGallery.module.css';

export function TemplateGallery({ onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/templates');

        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        setTemplates(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template) => {
    if (onSelect) {
      onSelect(template);
    } else {
      // Navigate to config form if no callback provided
      navigate(`/site-editor/${template.id}`);
    }
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
      <h1>Choose a Template</h1>
      <p>Select from our collection of beautiful 11ty templates</p>

      <div className={styles.gallery} data-testid="template-gallery">
        {templates.map((template) => (
          <div key={template.id} className={styles.card}>
            <div className={styles.imageContainer}>
              <img
                src={template.preview}
                alt={template.name}
                className={styles.image}
              />
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
    </div>
  );
}
