/**
 * Site Content Service
 * Handles all API calls for site CMS operations: content CRUD, settings, builds, and template analysis
 */

import api from '../lib/api';

export const siteContentService = {
  /**
   * List content records for a site
   * @param {string} siteId - Site ID
   * @param {object} params - Query params (content_type, limit, offset, etc.)
   * @returns {Promise<Array>} Content records
   */
  async getContent(siteId, params = {}) {
    const response = await api.get(`/api/sites/${siteId}/content`, { params });
    return response.data.data || response.data;
  },

  /**
   * Get a specific content record
   * @param {string} siteId - Site ID
   * @param {string} rkey - Record key
   * @returns {Promise<object>} Content record
   */
  async getContentByRkey(siteId, rkey) {
    const response = await api.get(`/api/sites/${siteId}/content/${rkey}`);
    return response.data;
  },

  /**
   * Create a new content record
   * @param {string} siteId - Site ID
   * @param {object} body - Content data { content_type, frontmatter, value?, ... }
   * @returns {Promise<object>} Created content record
   */
  async createContent(siteId, body) {
    const response = await api.post(`/api/sites/${siteId}/content`, body);
    return response.data;
  },

  /**
   * Update a content record
   * @param {string} siteId - Site ID
   * @param {string} rkey - Record key
   * @param {object} body - Updated content data { frontmatter?, value?, ... }
   * @returns {Promise<object>} Updated record
   */
  async updateContent(siteId, rkey, body) {
    const response = await api.put(`/api/sites/${siteId}/content/${rkey}`, body);
    return response.data;
  },

  /**
   * Delete a content record (soft delete)
   * @param {string} siteId - Site ID
   * @param {string} rkey - Record key
   * @returns {Promise}
   */
  async deleteContent(siteId, rkey) {
    await api.delete(`/api/sites/${siteId}/content/${rkey}`);
  },

  /**
   * Get site settings
   * @param {string} siteId - Site ID
   * @returns {Promise<object>} Settings object
   */
  async getSettings(siteId) {
    try {
      const response = await api.get(`/api/sites/${siteId}/settings`);
      return response.data || {};
    } catch (error) {
      // If endpoint doesn't exist yet, return empty settings
      if (error.response?.status === 404) {
        return {};
      }
      throw error;
    }
  },

  /**
   * Save site settings
   * @param {string} siteId - Site ID
   * @param {object} body - Settings data
   * @returns {Promise<object>} Updated settings
   */
  async saveSettings(siteId, body) {
    const response = await api.put(`/api/sites/${siteId}/settings`, body);
    return response.data;
  },

  /**
   * Trigger a site rebuild
   * @param {string} siteId - Site ID
   * @returns {Promise<object>} Build job { job_id, status, ... }
   */
  async triggerBuild(siteId) {
    const response = await api.post(`/api/sites/${siteId}/build`);
    return response.data;
  },

  /**
   * Get site-specific content types (SSG-033)
   * @param {string} siteId - Site ID
   * @returns {Promise<object>} Content types stored for this site
   */
  async getSiteContentTypes(siteId) {
    try {
      const response = await api.get(`/api/sites/${siteId}/content-types`);
      return response.data?.data || response.data || {};
    } catch (error) {
      // If endpoint doesn't exist or site not found, return empty
      if (error.response?.status === 404 || error.response?.status === 400) {
        return {};
      }
      throw error;
    }
  },

  /**
   * Get template content types and inferred schema
   * @param {string} templateId - Template ID
   * @returns {Promise<object>} Content types schema
   */
  async getTemplateContentTypes(templateId) {
    const response = await api.get(`/api/templates/${templateId}/content-types`);
    return response.data;
  },

  /**
   * Get full template schema
   * @param {string} templateId - Template ID
   * @returns {Promise<object>} JSON Schema object
   */
  async getTemplateSchema(templateId) {
    const response = await api.get(`/api/templates/${templateId}/schema`);
    return response.data;
  },

  /**
   * Register a custom template from GitHub URL
   * @param {string} githubUrl - GitHub repository URL
   * @returns {Promise<object>} Template registration response with template_id
   */
  async registerCustomTemplate(githubUrl) {
    const response = await api.post('/api/templates/custom', { github_url: githubUrl });
    return response.data;
  },

  /**
   * Poll custom template analysis status
   * @param {string} templateId - Custom template ID
   * @returns {Promise<object>} Status { status, error?, content_types?, created_at }
   */
  async pollTemplateStatus(templateId) {
    const response = await api.get(`/api/templates/custom/${templateId}/status`);
    return response.data;
  }
};

export default siteContentService;
