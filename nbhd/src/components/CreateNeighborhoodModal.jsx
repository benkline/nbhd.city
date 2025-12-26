import React, { useState } from 'react';
import { nbhdService } from '../services/neighborhoodService';
import styles from '../styles/Modal.module.css';

export default function CreateNbhdModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Nbhd name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await nbhdService.createNbhd(formData);
      onSuccess();
      onClose();
      setFormData({ name: '', description: '' });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to create nbhd';
      setError(errorMessage);
      console.error('Error creating nbhd:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Create New Nbhd</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nbhd Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Downtown District, West Side Community"
              maxLength={100}
              disabled={loading}
              required
            />
            <span className={styles.charCount}>
              {formData.name.length} / 100
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your neighborhood community..."
              rows={4}
              maxLength={1000}
              disabled={loading}
            />
            <span className={styles.charCount}>
              {formData.description.length} / 1000
            </span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Nbhd'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
