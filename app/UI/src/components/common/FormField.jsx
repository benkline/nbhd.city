/**
 * FormField Component
 * Reusable form field with label, input, helper text, and error display
 *
 * Supports multiple input types:
 * - text, email, password, number, date, datetime-local, time, tel, url
 * - textarea
 * - select
 * - checkbox
 * - radio
 *
 * Usage:
 * <FormField
 *   label="Meta Title"
 *   id="meta-title"
 *   type="text"
 *   value={data.metaTitle}
 *   onChange={(val) => onChange('metaTitle', val)}
 *   maxLength={60}
 *   helperText={`${data.metaTitle?.length || 0}/60 characters`}
 *   error={errors.metaTitle}
 * />
 */

import React from 'react';
import styles from './FormField.module.css';

export function FormField({
  label,
  id,
  type = 'text',
  value = '',
  onChange = () => {},
  placeholder = '',
  maxLength = null,
  helperText = '',
  error = null,
  disabled = false,
  required = false,
  options = [],
  rows = 4,
  className = ''
}) {
  const handleChange = (e) => {
    const newValue = type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(newValue);
  };

  // Text-like inputs
  if (['text', 'email', 'password', 'number', 'date', 'datetime-local', 'time', 'tel', 'url'].includes(type)) {
    return (
      <div className={`${styles.formGroup} ${error ? styles.error : ''} ${className}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error && (
          <div id={`${id}-error`} className={styles.errorMessage}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <small className={styles.helperText}>{helperText}</small>
        )}
      </div>
    );
  }

  // Textarea
  if (type === 'textarea') {
    return (
      <div className={`${styles.formGroup} ${error ? styles.error : ''} ${className}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          rows={rows}
          className={styles.textarea}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error && (
          <div id={`${id}-error`} className={styles.errorMessage}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <small className={styles.helperText}>{helperText}</small>
        )}
      </div>
    );
  }

  // Select
  if (type === 'select') {
    return (
      <div className={`${styles.formGroup} ${error ? styles.error : ''} ${className}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={styles.select}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value="">Select {label?.toLowerCase() || 'an option'}...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <div id={`${id}-error`} className={styles.errorMessage}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <small className={styles.helperText}>{helperText}</small>
        )}
      </div>
    );
  }

  // Checkbox
  if (type === 'checkbox') {
    return (
      <div className={`${styles.formGroup} ${styles.checkboxGroup} ${error ? styles.error : ''} ${className}`}>
        <label htmlFor={id} className={styles.checkboxLabel}>
          <input
            id={id}
            type="checkbox"
            checked={value}
            onChange={handleChange}
            disabled={disabled}
            className={styles.checkbox}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <span>{label}</span>
          {required && <span className={styles.required}>*</span>}
        </label>
        {error && (
          <div id={`${id}-error`} className={styles.errorMessage}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <small className={styles.helperText}>{helperText}</small>
        )}
      </div>
    );
  }

  // Radio (treats value as selected option)
  if (type === 'radio') {
    return (
      <div className={`${styles.formGroup} ${styles.radioGroup} ${error ? styles.error : ''} ${className}`}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.radioOptions}>
          {options.map(option => (
            <label key={option.value} className={styles.radioLabel}>
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                onChange={handleChange}
                disabled={disabled}
                className={styles.radio}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {error && (
          <div id={`${id}-error`} className={styles.errorMessage}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <small className={styles.helperText}>{helperText}</small>
        )}
      </div>
    );
  }

  return null;
}

export default FormField;
