/**
 * Project Service API Client
 * 
 * @description Frontend service for project-related API calls
 * including project information retrieval and health checks.
 */

import api, { healthCheck } from './api.js';

/**
 * Project service with API methods
 */
export const projectService = {
  /**
   * Get active project information
   * 
   * @returns {Promise<object>} Project information response
   * @throws {Error} API or network error
   */
  async getProjectInfo() {
    try {
      const response = await api.get('/api/v1/projects/info');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project info:', error);
      
      // Transform error for consistent handling
      const errorMessage = error.message || 'Unable to load project information';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get all projects with pagination
   * 
   * @param {object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {boolean} options.isActive - Filter by active status
   * @returns {Promise<object>} Projects list response
   */
  async getAllProjects(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.search) params.append('search', options.search);
      if (options.isActive !== undefined) params.append('isActive', options.isActive);
      
      const queryString = params.toString();
      const url = `/api/v1/projects${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw new Error(error.message || 'Unable to load projects');
    }
  },

  /**
   * Get project by ID
   * 
   * @param {string} projectId - Project ID
   * @returns {Promise<object>} Project response
   */
  async getProjectById(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      const response = await api.get(`/api/v1/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project by ID:', error);
      throw new Error(error.message || 'Unable to load project');
    }
  },

  /**
   * Create new project
   * 
   * @param {object} projectData - Project data
   * @returns {Promise<object>} Created project response
   */
  async createProject(projectData) {
    try {
      if (!projectData || typeof projectData !== 'object') {
        throw new Error('Valid project data is required');
      }
      
      const response = await api.post('/api/v1/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error(error.message || 'Unable to create project');
    }
  },

  /**
   * Update existing project
   * 
   * @param {string} projectId - Project ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated project response
   */
  async updateProject(projectId, updateData) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Valid update data is required');
      }
      
      const response = await api.put(`/api/v1/projects/${projectId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw new Error(error.message || 'Unable to update project');
    }
  },

  /**
   * Delete project
   * 
   * @param {string} projectId - Project ID
   * @returns {Promise<object>} Deletion response
   */
  async deleteProject(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      const response = await api.delete(`/api/v1/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error(error.message || 'Unable to delete project');
    }
  },

  /**
   * Activate project
   * 
   * @param {string} projectId - Project ID
   * @returns {Promise<object>} Activation response
   */
  async activateProject(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      const response = await api.patch(`/api/v1/projects/${projectId}/activate`);
      return response.data;
    } catch (error) {
      console.error('Failed to activate project:', error);
      throw new Error(error.message || 'Unable to activate project');
    }
  },

  /**
   * Get project statistics
   * 
   * @returns {Promise<object>} Project statistics response
   */
  async getProjectStats() {
    try {
      const response = await api.get('/api/v1/projects/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project stats:', error);
      throw new Error(error.message || 'Unable to load project statistics');
    }
  },

  /**
   * Search projects
   * 
   * @param {string} searchTerm - Search term
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results response
   */
  async searchProjects(searchTerm, options = {}) {
    try {
      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Valid search term is required');
      }
      
      const searchOptions = {
        search: searchTerm.trim(),
        ...options
      };
      
      return await this.getAllProjects(searchOptions);
    } catch (error) {
      console.error('Failed to search projects:', error);
      throw new Error(error.message || 'Unable to search projects');
    }
  },

  /**
   * Backend health check
   * 
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    try {
      return await healthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message || 'Backend health check failed',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Detailed health check
   * 
   * @returns {Promise<object>} Detailed health status
   */
  async detailedHealthCheck() {
    try {
      const response = await api.get('/health/detailed');
      return {
        status: 'healthy',
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Detailed health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message || 'Detailed health check failed',
        timestamp: new Date().toISOString()
      };
    }
  }
};

/**
 * Project data validation utilities
 */
export const projectValidation = {
  /**
   * Validate project data before submission
   * 
   * @param {object} projectData - Project data to validate
   * @returns {object} Validation result
   */
  validateProject(projectData) {
    const errors = [];
    
    if (!projectData) {
      errors.push('Project data is required');
      return { isValid: false, errors };
    }
    
    // Required fields
    if (!projectData.name || typeof projectData.name !== 'string' || !projectData.name.trim()) {
      errors.push('Project name is required');
    } else if (projectData.name.length > 100) {
      errors.push('Project name must be 100 characters or less');
    }
    
    if (!projectData.description || typeof projectData.description !== 'string' || !projectData.description.trim()) {
      errors.push('Project description is required');
    } else if (projectData.description.length > 1000) {
      errors.push('Project description must be 1000 characters or less');
    }
    
    if (!projectData.version || typeof projectData.version !== 'string') {
      errors.push('Project version is required');
    } else if (!/^\d+\.\d+\.\d+$/.test(projectData.version)) {
      errors.push('Project version must be in semver format (x.y.z)');
    }
    
    // Optional fields validation
    if (projectData.technologies && !Array.isArray(projectData.technologies)) {
      errors.push('Technologies must be an array');
    }
    
    if (projectData.features && !Array.isArray(projectData.features)) {
      errors.push('Features must be an array');
    }
    
    if (projectData.repository && typeof projectData.repository === 'string') {
      try {
        new URL(projectData.repository);
      } catch {
        errors.push('Repository must be a valid URL');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate feature data
   * 
   * @param {object} featureData - Feature data to validate
   * @returns {object} Validation result
   */
  validateFeature(featureData) {
    const errors = [];
    
    if (!featureData) {
      errors.push('Feature data is required');
      return { isValid: false, errors };
    }
    
    if (!featureData.name || typeof featureData.name !== 'string' || !featureData.name.trim()) {
      errors.push('Feature name is required');
    }
    
    if (!featureData.description || typeof featureData.description !== 'string' || !featureData.description.trim()) {
      errors.push('Feature description is required');
    }
    
    if (featureData.status && !['planned', 'in-progress', 'completed'].includes(featureData.status)) {
      errors.push('Feature status must be planned, in-progress, or completed');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Project utility functions
 */
export const projectUtils = {
  /**
   * Format project data for display
   * 
   * @param {object} project - Raw project data
   * @returns {object} Formatted project data
   */
  formatProject(project) {
    if (!project) return null;
    
    return {
      ...project,
      formattedCreatedAt: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A',
      formattedUpdatedAt: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A',
      featureCount: project.features ? project.features.length : 0,
      technologyCount: project.technologies ? project.technologies.length : 0
    };
  },

  /**
   * Group features by status
   * 
   * @param {Array} features - Features array
   * @returns {object} Features grouped by status
   */
  groupFeaturesByStatus(features) {
    if (!Array.isArray(features)) return {};
    
    return features.reduce((groups, feature) => {
      const status = feature.status || 'planned';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(feature);
      return groups;
    }, {});
  },

  /**
   * Calculate project completion percentage
   * 
   * @param {Array} features - Features array
   * @returns {number} Completion percentage (0-100)
   */
  calculateCompletion(features) {
    if (!Array.isArray(features) || features.length === 0) return 0;
    
    const completedFeatures = features.filter(feature => feature.status === 'completed').length;
    return Math.round((completedFeatures / features.length) * 100);
  }
};

export default projectService;