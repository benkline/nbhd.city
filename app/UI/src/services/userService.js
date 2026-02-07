import api from '../lib/api';

/**
 * User profile API service
 */
export const userService = {
  /**
   * Get current user's profile
   * @returns {Promise<Object>} User profile
   */
  getMyProfile: () => api.get('/api/users/me'),

  /**
   * Create user profile (onboarding)
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile
   */
  createProfile: (profileData) => api.post('/api/users/me/profile', profileData),

  /**
   * Update current user's profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: (profileData) => api.put('/api/users/me', profileData),

  /**
   * Get any user's profile by ID
   * @param {string} userId - User ID (DID)
   * @returns {Promise<Object>} User profile
   */
  getUserProfile: (userId) => api.get(`/api/users/${userId}`),

  /**
   * Batch get multiple user profiles
   * @param {string[]} userIds - Array of user IDs
   * @returns {Promise<Object>} Dictionary mapping user_id to profile
   */
  batchGetUsers: (userIds) => api.post('/api/users/batch', { user_ids: userIds }),

  /**
   * List all users
   * @param {number} limit - Maximum number of users to return
   * @param {string} lastKey - Pagination key
   * @returns {Promise<Array>} List of users
   */
  listUsers: (limit = 100, lastKey = null) => {
    const params = { limit };
    if (lastKey) params.last_key = lastKey;
    return api.get('/api/users/', { params });
  }
};

export default userService;
