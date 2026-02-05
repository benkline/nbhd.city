/**
 * Nbhd Content API service
 * Handles API calls for neighborhood welcome content and announcements
 */

import apiClient from '../lib/api';

export const nbhdContentService = {
  /**
   * Get welcome content for a neighborhood (public endpoint)
   * @param {string} nbhdId - Neighborhood ID
   * @returns {Promise<Object>} Welcome content data
   */
  async getWelcomeContent(nbhdId) {
    const response = await apiClient.get(`/api/nbhds/${nbhdId}/content/welcome`);
    return response.data;
  },

  /**
   * Get announcements for a neighborhood (public endpoint)
   * @param {string} nbhdId - Neighborhood ID
   * @param {number} limit - Number of announcements to fetch
   * @param {number} offset - Pagination offset
   * @returns {Promise<Object>} Announcements data with pagination
   */
  async getAnnouncements(nbhdId, limit = 10, offset = 0) {
    const response = await apiClient.get(`/api/nbhds/${nbhdId}/content/announcements`, {
      params: { limit, offset },
    });
    return response.data;
  },
};

export default nbhdContentService;
