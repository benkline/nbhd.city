/**
 * Nbhd API service
 * Handles all API calls related to nbhds and memberships
 */

import apiClient from '../lib/api';

export const nbhdService = {
  /**
   * Get all nbhds with pagination
   * @returns {Promise<Array>} List of nbhds
   */
  async getAllNbhds(skip = 0, limit = 100) {
    const response = await apiClient.get('/api/nbhds', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get a specific nbhd with members
   * @param {number} id - Nbhd ID
   * @returns {Promise<Object>} Nbhd details
   */
  async getNbhd(id) {
    const response = await apiClient.get(`/api/nbhds/${id}`);
    return response.data;
  },

  /**
   * Create a new nbhd
   * @param {Object} data - Nbhd data (name, description)
   * @returns {Promise<Object>} Created nbhd
   */
  async createNbhd(data) {
    const response = await apiClient.post('/api/nbhds', data);
    return response.data;
  },

  /**
   * Get current user's nbhd memberships
   * @returns {Promise<Object>} User's nbhds
   */
  async getMyNbhds() {
    const response = await apiClient.get('/api/users/me/nbhds');
    return response.data;
  },

  /**
   * Join a nbhd
   * @param {number} id - Nbhd ID
   * @returns {Promise<Object>} Join response
   */
  async joinNbhd(id) {
    const response = await apiClient.post(`/api/nbhds/${id}/join`);
    return response.data;
  },

  /**
   * Leave a nbhd
   * @param {number} id - Nbhd ID
   * @returns {Promise<void>}
   */
  async leaveNbhd(id) {
    await apiClient.delete(`/api/nbhds/${id}/leave`);
  },
};
