/**
 * Project Controller
 * 
 * @description HTTP request handlers for project-related endpoints
 * including request validation, service calls, and response formatting.
 */

import * as projectService from '../services/projectService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get active project information
 * 
 * @route GET /api/v1/projects/info
 * @access Public
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const getActiveProjectInfo = asyncHandler(async (req, res) => {
  const project = await projectService.getActiveProject();
  
  res.status(200).json({
    success: true,
    message: 'Project information retrieved successfully',
    data: project,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get all projects with pagination
 * 
 * @route GET /api/v1/projects
 * @access Public
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive
  } = req.query;
  
  // Build filter
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  // Handle search
  if (search) {
    const searchResults = await projectService.searchProjects(search, { limit: parseInt(limit) });
    return res.status(200).json({
      success: true,
      message: 'Projects search completed successfully',
      data: {
        projects: searchResults,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: searchResults.length,
          itemsPerPage: searchResults.length
        }
      },
      timestamp: new Date().toISOString()
    });
  }
  
  const result = await projectService.getAllProjects({
    page: parseInt(page),
    limit: parseInt(limit),
    filter
  });
  
  res.status(200).json({
    success: true,
    message: 'Projects retrieved successfully',
    data: result,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get project by ID
 * 
 * @route GET /api/v1/projects/:id
 * @access Public
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const project = await projectService.getProjectById(id);
  
  res.status(200).json({
    success: true,
    message: 'Project retrieved successfully',
    data: project,
    timestamp: new Date().toISOString()
  });
});

/**
 * Create new project
 * 
 * @route POST /api/v1/projects
 * @access Public (will be protected in future)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const createProject = asyncHandler(async (req, res) => {
  const projectData = req.body;
  
  const project = await projectService.createProject(projectData);
  
  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: project,
    timestamp: new Date().toISOString()
  });
});

/**
 * Update existing project
 * 
 * @route PUT /api/v1/projects/:id
 * @access Public (will be protected in future)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const project = await projectService.updateProject(id, updateData);
  
  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: project,
    timestamp: new Date().toISOString()
  });
});

/**
 * Delete project
 * 
 * @route DELETE /api/v1/projects/:id
 * @access Public (will be protected in future)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const project = await projectService.deleteProject(id);
  
  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: project,
    timestamp: new Date().toISOString()
  });
});

/**
 * Activate project
 * 
 * @route PATCH /api/v1/projects/:id/activate
 * @access Public (will be protected in future)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const activateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const project = await projectService.activateProject(id);
  
  res.status(200).json({
    success: true,
    message: 'Project activated successfully',
    data: project,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get project statistics
 * 
 * @route GET /api/v1/projects/stats
 * @access Public
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
export const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await projectService.getProjectStats();
  
  res.status(200).json({
    success: true,
    message: 'Project statistics retrieved successfully',
    data: stats,
    timestamp: new Date().toISOString()
  });
});

export default {
  getActiveProjectInfo,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  activateProject,
  getProjectStats
};