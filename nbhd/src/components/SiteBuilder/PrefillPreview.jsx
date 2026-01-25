/**
 * PrefillPreview Component (SSG-014)
 *
 * Shows prefill suggestions with a preview of how user profile data
 * and previous site content will map to template fields.
 *
 * User can apply prefilled values or start with a fresh form.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PrefillPreview.module.css';

export function PrefillPreview({ siteId, onApply, onCancel }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrefillSuggestions();
  }, [siteId]);

  const fetchPrefillSuggestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sites/${siteId}/prefill`);
      setSuggestions(response.data.suggestions || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load prefill suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // [ ] Users can apply or skip prefilling
    // Build config object from suggestions
    const config = {};
    suggestions.forEach(suggestion => {
      config[suggestion.field] = suggestion.value;
    });

    onApply(config);
  };

  const handleCancel = () => {
    // [ ] Users can apply or skip prefilling
    onCancel();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button onClick={onCancel} className={styles.btnSecondary}>
            Continue anyway
          </button>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>No prefill suggestions available.</p>
          <button onClick={onCancel} className={styles.btnSecondary}>
            Start with empty form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Prefill Content from Your Profile?</h3>
        <p>
          We found {suggestions.length} field{suggestions.length !== 1 ? 's' : ''}{' '}
          we can fill in for you.
        </p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Template Field</th>
              <th>Will be filled with</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map(suggestion => (
              <tr key={suggestion.field}>
                <td className={styles.fieldName}>
                  <code>{suggestion.field}</code>
                </td>
                <td className={styles.valuePreview}>
                  {typeof suggestion.value === 'string' && suggestion.value.length > 50
                    ? suggestion.value.slice(0, 50) + '...'
                    : String(suggestion.value)}
                </td>
                <td className={styles.source}>
                  <span
                    className={`${styles.sourceBadge} ${
                      styles[`source-${suggestion.source}`]
                    }`}
                  >
                    {suggestion.source === 'profile' ? '👤 Profile' : '📄 Previous Site'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleApply}>
          Apply Prefill
        </button>
        <button className={styles.btnSecondary} onClick={handleCancel}>
          Start Fresh
        </button>
      </div>

      <p className={styles.note}>
        You can always edit these values after applying.
      </p>
    </div>
  );
}
