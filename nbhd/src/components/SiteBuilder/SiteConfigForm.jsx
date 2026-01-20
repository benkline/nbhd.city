import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './SiteConfigForm.module.css';

/**
 * Renders a form field based on schema widget type
 */
function FormField({ schema, name, value, onChange, error }) {
  const fieldSchema = schema.properties[name];
  const widget = fieldSchema.widget || 'text';
  const label = fieldSchema.label || name;
  const required = fieldSchema.required ? '*' : '';
  const labelText = required ? `${label} ${required}` : label;

  const handleChange = (e) => {
    let newValue = e.target.value;

    // Apply maxLength constraint
    if (fieldSchema.maxLength && newValue.length > fieldSchema.maxLength) {
      newValue = newValue.slice(0, fieldSchema.maxLength);
    }

    onChange(name, newValue);
  };

  switch (widget) {
    case 'textarea':
      return (
        <div className={styles.formGroup}>
          <label htmlFor={name} className={styles.label}>
            {labelText}
          </label>
          <textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={handleChange}
            className={styles.textarea}
            maxLength={fieldSchema.maxLength}
          />
          {fieldSchema.maxLength && (
            <small className={styles.hint}>
              {(value || '').length} / {fieldSchema.maxLength}
            </small>
          )}
          {error && <span className={styles.error}>{error}</span>}
        </div>
      );

    case 'color':
      return (
        <div className={styles.formGroup}>
          <label htmlFor={name} className={styles.label}>
            {labelText}
          </label>
          <input
            id={name}
            type="color"
            name={name}
            value={value || fieldSchema.default || '#000000'}
            onChange={handleChange}
            className={styles.colorInput}
          />
          {error && <span className={styles.error}>{error}</span>}
        </div>
      );

    case 'text':
    default:
      return (
        <div className={styles.formGroup}>
          <label htmlFor={name} className={styles.label}>
            {labelText}
          </label>
          <input
            id={name}
            type="text"
            name={name}
            value={value || ''}
            onChange={handleChange}
            className={styles.input}
            maxLength={fieldSchema.maxLength}
          />
          {fieldSchema.maxLength && (
            <small className={styles.hint}>
              {(value || '').length} / {fieldSchema.maxLength}
            </small>
          )}
          {error && <span className={styles.error}>{error}</span>}
        </div>
      );
  }
}

/**
 * Validates form config against schema
 */
function validateConfig(schema, config) {
  const errors = {};

  Object.entries(schema.properties).forEach(([key, fieldSchema]) => {
    const value = config[key];

    // Check required
    if (fieldSchema.required && (!value || value.trim() === '')) {
      errors[key] = `${fieldSchema.label || key} is required`;
    }

    // Check maxLength
    if (value && fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors[key] = `${fieldSchema.label || key} cannot exceed ${fieldSchema.maxLength} characters`;
    }
  });

  return errors;
}

/**
 * SiteConfigForm - Dynamic form generator based on template schema
 */
export function SiteConfigForm({
  template,
  siteId = 'new-site',
  onPreviewUpdate,
  onPreview,
  onDeploy,
  onSave
}) {
  const [config, setConfig] = useState({});
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  // Initialize from localStorage
  useEffect(() => {
    const storageKey = `site-draft-${siteId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved config:', err);
      }
    }
  }, [siteId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isDirty) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const storageKey = `site-draft-${siteId}`;
      localStorage.setItem(storageKey, JSON.stringify(config));
      setIsDirty(false);

      if (onSave) {
        onSave(config);
      }
    }, 30000);

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [config, isDirty, siteId, onSave]);

  const handleFieldChange = useCallback((name, value) => {
    setConfig((prev) => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Trigger real-time preview
    if (onPreviewUpdate) {
      onPreviewUpdate({
        ...config,
        [name]: value
      });
    }
  }, [config, errors, onPreviewUpdate]);

  const handlePreview = useCallback(() => {
    const newErrors = validateConfig(template.schema, config);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onPreview) {
      onPreview(config);
    }
  }, [config, template.schema, onPreview]);

  const handleDeploy = useCallback(() => {
    const newErrors = validateConfig(template.schema, config);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onDeploy) {
      setIsSubmitting(true);
      onDeploy(config).finally(() => {
        setIsSubmitting(false);
      });
    }
  }, [config, template.schema, onDeploy]);

  if (!template || !template.schema) {
    return <div className={styles.container}>No template schema available</div>;
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} data-testid="config-form" onSubmit={(e) => e.preventDefault()}>
        <h1 className={styles.title}>Configure {template.name}</h1>
        <p className={styles.description}>
          Customize your site by filling in the fields below
        </p>

        <div className={styles.fields}>
          {Object.keys(template.schema.properties).map((fieldName) => (
            <FormField
              key={fieldName}
              schema={template.schema}
              name={fieldName}
              value={config[fieldName]}
              onChange={handleFieldChange}
              error={errors[fieldName]}
            />
          ))}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className={styles.errorSummary}>
            <p>Please correct the following errors:</p>
            <ul>
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.previewButton}
            onClick={handlePreview}
            disabled={isSubmitting}
          >
            Preview
          </button>
          <button
            type="button"
            className={styles.deployButton}
            onClick={handleDeploy}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deploying...' : 'Deploy'}
          </button>
        </div>

        {isDirty && (
          <div className={styles.draftIndicator}>
            💾 Draft (auto-saving...)
          </div>
        )}
      </form>
    </div>
  );
}
