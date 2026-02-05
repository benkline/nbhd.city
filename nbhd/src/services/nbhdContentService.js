/**
 * Neighborhood Content Service
 * Handles API calls for neighborhood welcome content, announcements, and CMS data
 */

import api from '../lib/api';

export const nbhdContentService = {
  /**
   * Get welcome content for a neighborhood
   * @param {string} nbhdId - Neighborhood ID
   * @returns {Promise} Welcome content response
   */
  async getWelcome(nbhdId) {
    const response = await api.get(`/api/nbhds/${nbhdId}/content/welcome`);
    return response.data;
  },

  /**
   * Create or update welcome content for a neighborhood
   * @param {string} nbhdId - Neighborhood ID
   * @param {object} data - Welcome content data { title, content }
   * @returns {Promise} Response with created/updated record
   */
  async createOrUpdateWelcome(nbhdId, data) {
    const response = await api.post(`/api/nbhds/${nbhdId}/content/welcome`, data);
    return response.data;
  },

  /**
   * Get announcements for a neighborhood with pagination
   * @param {string} nbhdId - Neighborhood ID
   * @param {number} limit - Number of results per page (default 10)
   * @param {number} offset - Pagination offset (default 0)
   * @returns {Promise} Announcements response with pagination
   */
  async getAnnouncements(nbhdId, limit = 10, offset = 0) {
    const response = await api.get(`/api/nbhds/${nbhdId}/content/announcements`, {
      params: { limit, offset }
    });
    return response.data;
  },

  /**
   * Create a new announcement
   * @param {string} nbhdId - Neighborhood ID
   * @param {object} data - Announcement data { title, content, priority?, pinned? }
   * @returns {Promise} Response with created announcement
   */
  async createAnnouncement(nbhdId, data) {
    const response = await api.post(`/api/nbhds/${nbhdId}/content/announcements`, data);
    return response.data;
  },

  /**
   * Delete an announcement
   * @param {string} nbhdId - Neighborhood ID
   * @param {string} rkey - Record key of announcement to delete
   * @returns {Promise}
   */
  async deleteAnnouncement(nbhdId, rkey) {
    await api.delete(`/api/nbhds/${nbhdId}/content/announcements/${rkey}`);
  },

  /**
   * Get CMS view with all neighborhood content
   * @param {string} nbhdId - Neighborhood ID
   * @returns {Promise} CMS view with welcome, announcements, sites, metadata
   */
  async getCMSView(nbhdId) {
    const response = await api.get(`/api/nbhds/${nbhdId}/content/cms`);
    return response.data;
  }
};

export default nbhdContentService;
