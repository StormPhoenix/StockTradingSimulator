/**
 * Project Service
 * 
 * @description Business logic for project-related operations
 * including data retrieval, validation, and processing.
 */

import Project from '../models/Project.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Get active project information
 * 
 * @returns {Promise<object>} Active project data
 * @throws {Error} If no active project found
 */
export const getActiveProject = async () => {
  try {
    const project = await Project.getActiveProject();
    
    if (!project) {
      throw createError('No active project found', 404);
    }
    
    return project;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw createError('Failed to retrieve active project', 500);
  }
};

/**
 * Get all projects with pagination
 * 
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {object} options.filter - Filter criteria
 * @returns {Promise<object>} Paginated projects data
 */
export const getAllProjects = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      filter = {}
    } = options;
    
    // Calculate skip value
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { ...filter };
    
    // Execute queries in parallel
    const [projects, totalCount] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      projects,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    throw createError('Failed to retrieve projects', 500);
  }
};

/**
 * Get project by ID
 * 
 * @param {string} projectId - Project ObjectId
 * @returns {Promise<object>} Project data
 * @throws {Error} If project not found
 */
export const getProjectById = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    
    if (!project) {
      throw createError('Project not found', 404);
    }
    
    return project;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.name === 'CastError') {
      throw createError('Invalid project ID format', 400);
    }
    throw createError('Failed to retrieve project', 500);
  }
};

/**
 * Create new project
 * 
 * @param {object} projectData - Project data
 * @returns {Promise<object>} Created project
 * @throws {Error} If validation fails or creation fails
 */
export const createProject = async (projectData) => {
  try {
    // Validate required fields
    const { name, description, version } = projectData;
    
    if (!name || !description || !version) {
      throw createError('Name, description, and version are required', 400);
    }
    
    // Check for duplicate name
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      throw createError(`Project with name '${name}' already exists`, 409);
    }
    
    // Create project
    const project = new Project(projectData);
    await project.save();
    
    return project;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.code === 11000) {
      throw createError('Project name already exists', 409);
    }
    throw createError('Failed to create project', 500);
  }
};

/**
 * Update existing project
 * 
 * @param {string} projectId - Project ObjectId
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} Updated project
 * @throws {Error} If project not found or update fails
 */
export const updateProject = async (projectId, updateData) => {
  try {
    // Remove fields that shouldn't be updated directly
    const { _id, createdAt, updatedAt, ...validUpdateData } = updateData;
    
    const project = await Project.findByIdAndUpdate(
      projectId,
      validUpdateData,
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!project) {
      throw createError('Project not found', 404);
    }
    
    return project;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.name === 'CastError') {
      throw createError('Invalid project ID format', 400);
    }
    if (error.code === 11000) {
      throw createError('Project name already exists', 409);
    }
    throw createError('Failed to update project', 500);
  }
};

/**
 * Delete project
 * 
 * @param {string} projectId - Project ObjectId
 * @returns {Promise<object>} Deleted project
 * @throws {Error} If project not found or deletion fails
 */
export const deleteProject = async (projectId) => {
  try {
    const project = await Project.findByIdAndDelete(projectId);
    
    if (!project) {
      throw createError('Project not found', 404);
    }
    
    return project;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.name === 'CastError') {
      throw createError('Invalid project ID format', 400);
    }
    throw createError('Failed to delete project', 500);
  }
};

/**
 * Activate project (set as active, deactivate others)
 * 
 * @param {string} projectId - Project ObjectId
 * @returns {Promise<object>} Activated project
 * @throws {Error} If project not found or activation fails
 */
export const activateProject = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    
    if (!project) {
      throw createError('Project not found', 404);
    }
    
    // Use the model's activate method
    await project.activate();
    
    return project;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.name === 'CastError') {
      throw createError('Invalid project ID format', 400);
    }
    throw createError('Failed to activate project', 500);
  }
};

/**
 * Get project statistics
 * 
 * @returns {Promise<object>} Project statistics
 */
export const getProjectStats = async () => {
  try {
    const [
      totalProjects,
      activeProjects,
      projectsByStatus
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ isActive: true }),
      Project.aggregate([
        { $unwind: '$features' },
        { $group: { _id: '$features.status', count: { $sum: 1 } } }
      ])
    ]);
    
    return {
      totalProjects,
      activeProjects,
      inactiveProjects: totalProjects - activeProjects,
      featuresByStatus: projectsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  } catch (error) {
    throw createError('Failed to retrieve project statistics', 500);
  }
};

/**
 * Search projects by text
 * 
 * @param {string} searchTerm - Search term
 * @param {object} options - Search options
 * @returns {Promise<Array>} Matching projects
 */
export const searchProjects = async (searchTerm, options = {}) => {
  try {
    const { limit = 10 } = options;
    
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const projects = await Project.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { technologies: { $in: [searchRegex] } }
      ]
    })
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
    
    return projects;
  } catch (error) {
    throw createError('Failed to search projects', 500);
  }
};

export default {
  getActiveProject,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  activateProject,
  getProjectStats,
  searchProjects
};