/**
 * Frontmatter Form Component
 *
 * Dynamic form based on template schema
 * - Renders fields based on schema types
 * - Handles required field validation
 * - Auto-generates slug from title
 * - Defaults date to today
 */

import React, { useEffect } from 'react';
import styles from './EnhancedContentEditor.module.css';

export function FrontmatterForm({
  schema,
  values,
  onChange,
  errors = {}
}) {
  if (!schema || !schema.properties) {
    return <div className={styles.formEmpty}>No schema defined</div>;
  }

  const requiredFields = schema.required || [];

  // Auto-generate slug from title
  useEffect(() => {
    if (values.title && !values.slug) {
      const slug = values.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (slug && slug !== values.slug) {
        onChange({ ...values, slug });
      }
    }
  }, [values.title, values.slug, onChange]);

  // Set default date to today
  useEffect(() => {
    if (!values.date && schema.properties.date) {
      const today = new Date().toISOString().split('T')[0];
      onChange({ ...values, date: today });
    }
  }, [values.date, schema.properties.date, onChange]);

  const handleFieldChange = (fieldName, value) => {
    onChange({
      ...values,
      [fieldName]: value
    });
  };

  const renderField = (fieldName, fieldSchema) => {
    const isRequired = requiredFields.includes(fieldName);
    const value = values[fieldName] || '';
    const error = errors[fieldName];

    const fieldProps = {
      id: `field-${fieldName}`,
      value,
      onChange: (e) => handleFieldChange(fieldName, e.target.value),
      ...(isRequired && { required: true })
    };

    // Determine field type based on schema
    if (fieldSchema.type === 'array') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {fieldSchema.description || fieldName}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <textarea
            {...fieldProps}
            placeholder={`Enter ${fieldName} separated by commas`}
            className={`${styles.input} ${styles.textarea} ${error ? styles.error : ''}`}
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
              handleFieldChange(fieldName, tags);
            }}
          />
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldSchema.type === 'string') {
      if (fieldSchema.format === 'date') {
        return (
          <div key={fieldName} className={styles.formField}>
            <label htmlFor={fieldProps.id}>
              {fieldSchema.description || fieldName}
              {isRequired && <span className={styles.required}>*</span>}
            </label>
            <input
              {...fieldProps}
              type="date"
              className={`${styles.input} ${error ? styles.error : ''}`}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
          </div>
        );
      }

      if (fieldSchema.format === 'email') {
        return (
          <div key={fieldName} className={styles.formField}>
            <label htmlFor={fieldProps.id}>
              {fieldSchema.description || fieldName}
              {isRequired && <span className={styles.required}>*</span>}
            </label>
            <input
              {...fieldProps}
              type="email"
              className={`${styles.input} ${error ? styles.error : ''}`}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
          </div>
        );
      }

      if (fieldSchema.format === 'url') {
        return (
          <div key={fieldName} className={styles.formField}>
            <label htmlFor={fieldProps.id}>
              {fieldSchema.description || fieldName}
              {isRequired && <span className={styles.required}>*</span>}
            </label>
            <input
              {...fieldProps}
              type="url"
              className={`${styles.input} ${error ? styles.error : ''}`}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
          </div>
        );
      }

      // Default: text input
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {fieldSchema.description || fieldName}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <input
            {...fieldProps}
            type="text"
            placeholder={fieldSchema.description || fieldName}
            className={`${styles.input} ${error ? styles.error : ''}`}
          />
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {fieldSchema.description || fieldName}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <input
            {...fieldProps}
            type="number"
            className={`${styles.input} ${error ? styles.error : ''}`}
          />
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldSchema.type === 'boolean') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id} className={styles.checkboxLabel}>
            <input
              {...fieldProps}
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              className={styles.checkbox}
            />
            {fieldSchema.description || fieldName}
          </label>
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    // Default: text input
    return (
      <div key={fieldName} className={styles.formField}>
        <label htmlFor={fieldProps.id}>
          {fieldSchema.description || fieldName}
          {isRequired && <span className={styles.required}>*</span>}
        </label>
        <input
          {...fieldProps}
          type="text"
          className={`${styles.input} ${error ? styles.error : ''}`}
        />
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  };

  return (
    <form className={styles.form}>
      {Object.entries(schema.properties).map(([fieldName, fieldSchema]) =>
        renderField(fieldName, fieldSchema)
      )}
    </form>
  );
}

export default FrontmatterForm;
