/**
 * Frontmatter Form Component
 *
 * Dynamic form based on template schema
 * - Renders fields based on schema types
 * - Handles required field validation
 * - Auto-generates slug from title
 * - Defaults date to today
 * - Uses dynamicSchemaService for field type mapping
 * - Displays help text and constraints
 * - Shows field descriptions
 */

import React, { useEffect } from 'react';
import { getFieldType } from '../../services/dynamicSchemaService';
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
    const fieldType = getFieldType(fieldSchema);
    const label = fieldSchema.title || fieldName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    const helpText = fieldSchema.description || '';

    const fieldProps = {
      id: `field-${fieldName}`,
      value,
      onChange: (e) => handleFieldChange(fieldName, e.target.value),
      ...(isRequired && { required: true })
    };

    // Get constraint info for display
    const constraints = [];
    if (fieldSchema.minLength) constraints.push(`min ${fieldSchema.minLength} chars`);
    if (fieldSchema.maxLength) constraints.push(`max ${fieldSchema.maxLength} chars`);
    if (fieldSchema.minimum) constraints.push(`min ${fieldSchema.minimum}`);
    if (fieldSchema.maximum) constraints.push(`max ${fieldSchema.maximum}`);

    const constraintText = constraints.length > 0 ? ` (${constraints.join(', ')})` : '';

    // Render based on field type from dynamicSchemaService
    if (fieldType === 'select' && fieldSchema.enum) {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          {helpText && <p className={styles.helpText}>{helpText}</p>}
          <select
            {...fieldProps}
            className={`${styles.input} ${error ? styles.error : ''}`}
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {fieldSchema.enum.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldType === 'date') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          {helpText && <p className={styles.helpText}>{helpText}</p>}
          <input
            {...fieldProps}
            type="date"
            className={`${styles.input} ${error ? styles.error : ''}`}
          />
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldType === 'datetime') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          {helpText && <p className={styles.helpText}>{helpText}</p>}
          <input
            {...fieldProps}
            type="datetime-local"
            className={`${styles.input} ${error ? styles.error : ''}`}
          />
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldType === 'url') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          {helpText && <p className={styles.helpText}>{helpText}</p>}
          <input
            {...fieldProps}
            type="url"
            placeholder="https://example.com"
            className={`${styles.input} ${error ? styles.error : ''}`}
          />
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldType === 'number') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
            {constraintText && <span className={styles.constraint}>{constraintText}</span>}
          </label>
          {helpText && <p className={styles.helpText}>{helpText}</p>}
          <input
            {...fieldProps}
            type="number"
            {...(fieldSchema.minimum && { min: fieldSchema.minimum })}
            {...(fieldSchema.maximum && { max: fieldSchema.maximum })}
            className={`${styles.input} ${error ? styles.error : ''}`}
          />
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldType === 'checkbox') {
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
            {label}
          </label>
          {helpText && <p className={styles.helpText}>{helpText}</p>}
          {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
      );
    }

    if (fieldType === 'tags') {
      return (
        <div key={fieldName} className={styles.formField}>
          <label htmlFor={fieldProps.id}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
            {fieldSchema.maxItems && <span className={styles.constraint}>(max {fieldSchema.maxItems} items)</span>}
          </label>
          {helpText && <p className={styles.helpText}>{helpText}</p>}
          <textarea
            {...fieldProps}
            placeholder={`Enter ${label.toLowerCase()} separated by commas`}
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

    // Default: text input
    return (
      <div key={fieldName} className={styles.formField}>
        <label htmlFor={fieldProps.id}>
          {label}
          {isRequired && <span className={styles.required}>*</span>}
          {constraintText && <span className={styles.constraint}>{constraintText}</span>}
        </label>
        {helpText && <p className={styles.helpText}>{helpText}</p>}
        <input
          {...fieldProps}
          type="text"
          placeholder={helpText || label}
          {...(fieldSchema.minLength && { minLength: fieldSchema.minLength })}
          {...(fieldSchema.maxLength && { maxLength: fieldSchema.maxLength })}
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
