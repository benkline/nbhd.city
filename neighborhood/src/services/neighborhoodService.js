/**
 * Neighborhood API service
 * Handles all API calls related to neighborhoods and memberships
 */

import apiClient from '../lib/api';

export const neighborhoodService = {
  /**
   * Get all neighborhoods with pagination
   * @returns {Promise<Array>} List of neighborhoods
   */
  async getAllNeighborhoods(skip = 0, limit = 100) {
    const response = await apiClient.get('/api/neighborhoods', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get a specific neighborhood with members
   * @param {number} id - Neighborhood ID
   * @returns {Promise<Object>} Neighborhood details
   */
  async getNeighborhood(id) {
    const response = await apiClient.get(`/api/neighborhoods/${id}`);
    return response.data;
  },

  /**
   * Create a new neighborhood
   * @param {Object} data - Neighborhood data (name, description)
   * @returns {Promise<Object>} Created neighborhood
   */
  async createNeighborhood(data) {
    const response = await apiClient.post('/api/neighborhoods', data);
    return response.data;
  },

  /**
   * Get current user's neighborhood memberships
   * @returns {Promise<Object>} User's neighborhoods
   */
  async getMyNeighborhoods() {
    const response = await apiClient.get('/api/users/me/neighborhoods');
    return response.data;
  },

  /**
   * Join a neighborhood
   * @param {number} id - Neighborhood ID
   * @returns {Promise<Object>} Join response
   */
  async joinNeighborhood(id) {
    const response = await apiClient.post(`/api/neighborhoods/${id}/join`);
    return response.data;
  },

  /**
   * Leave a neighborhood
   * @param {number} id - Neighborhood ID
   * @returns {Promise<void>}
   */
  async leaveNeighborhood(id) {
    await apiClient.delete(`/api/neighborhoods/${id}/leave`);
  },
};
