import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import styles from '../styles/UserProfile.module.css';

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    email: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing profile if available
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await userService.getMyProfile();
        setFormData({
          display_name: response.data.display_name || '',
          bio: response.data.bio || '',
          location: response.data.location || '',
          email: response.data.email || '',
          avatar: response.data.avatar || ''
        });
        setIsEditing(true);
      } catch (err) {
        // Profile doesn't exist yet - this is onboarding
        setIsEditing(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isEditing) {
        await userService.updateProfile(formData);
      } else {
        await userService.createProfile(formData);
      }
      setSuccess(true);

      // Redirect to neighborhoods after a brief delay
      setTimeout(() => {
        navigate('/nbhds');
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to save profile';
      setError(errorMessage);
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/nbhds');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{isEditing ? 'Edit Your Profile' : 'Welcome! Complete Your Profile'}</h1>
          <p className={styles.subtitle}>
            {isEditing
              ? 'Update your profile information'
              : 'Tell your neighbors a bit about yourself'}
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Profile saved successfully!</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Avatar Preview */}
          {formData.avatar && (
            <div className={styles.avatarPreview}>
              <img src={formData.avatar} alt="Profile" className={styles.avatar} />
            </div>
          )}

          {/* Display Name */}
          <div className={styles.formGroup}>
            <label htmlFor="display_name">Display Name</label>
            <input
              id="display_name"
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Your name"
              disabled={loading}
            />
          </div>

          {/* Bio */}
          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell your neighbors about yourself..."
              maxLength={500}
              rows={4}
              disabled={loading}
            />
            <span className={styles.charCount}>
              {formData.bio.length} / 500
            </span>
          </div>

          {/* Location */}
          <div className={styles.formGroup}>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Portland, OR"
              maxLength={100}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          {/* Avatar URL */}
          <div className={styles.formGroup}>
            <label htmlFor="avatar">Avatar URL (optional)</label>
            <input
              id="avatar"
              type="url"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              disabled={loading}
            />
            <span className={styles.hint}>
              Or use an avatar from <a href="https://api.dicebear.com/7.x/avataaars/svg" target="_blank" rel="noopener noreferrer">DiceBear</a>
            </span>
          </div>

          {/* Buttons */}
          <div className={styles.actions}>
            {!isEditing && (
              <button
                type="button"
                onClick={handleSkip}
                className={styles.skipButton}
                disabled={loading}
              >
                Skip for now
              </button>
            )}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Profile' : 'Create Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
