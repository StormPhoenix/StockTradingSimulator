/**
 * Project Controller
 * 
 * @description HTTP request handlers for project-related endpoints
 * including request validation, service calls, and response formatting.
 */

import { Request, Response } from 'express'
import * as projectService from '../services/projectService'
import { asyncHandler } from '../middleware/errorHandler'
import type { ID } from '@shared/common'

// 查询参数接口
interface ProjectQueryParams {
  page?: string
  limit?: string
  search?: string
  isActive?: string
}

// 项目创建请求体
interface CreateProjectRequest {
  name: string
  description?: string
  version?: string
  isActive?: boolean
  [key: string]: any
}

// 项目更新请求体
interface UpdateProjectRequest {
  name?: string
  description?: string
  version?: string
  isActive?: boolean
  [key: string]: any
}

/**
 * Get active project information
 * 
 * @route GET /api/v1/projects/info
 * @access Public
 */
export const getActiveProjectInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const project = await projectService.getActiveProject()
  
  res.status(200).json({
    success: true,
    message: 'Project information retrieved successfully',
    data: project,
    timestamp: new Date().toISOString()
  })
})

/**
 * Get all projects with pagination
 * 
 * @route GET /api/v1/projects
 * @access Public
 */
export const getAllProjects = asyncHandler(async (req: Request<{}, {}, {}, ProjectQueryParams>, res: Response): Promise<void> => {
  const {
    page = '1',
    limit = '10',
    search,
    isActive
  } = req.query
  
  // Build filter
  const filter: any = {}
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true'
  }
  
  // Handle search
  if (search) {
    const searchResults = await projectService.searchProjects(search, { limit: parseInt(limit, 10) })
    res.status(200).json({
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
    })
    return
  }
  
  const result = await projectService.getAllProjects({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    filter
  })
  
  res.status(200).json({
    success: true,
    message: 'Projects retrieved successfully',
    data: result,
    timestamp: new Date().toISOString()
  })
})

/**
 * Get project by ID
 * 
 * @route GET /api/v1/projects/:id
 * @access Public
 */
export const getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string }
  
  const project = await projectService.getProjectById(id)
  
  res.status(200).json({
    success: true,
    message: 'Project retrieved successfully',
    data: project,
    timestamp: new Date().toISOString()
  })
})

/**
 * Create new project
 * 
 * @route POST /api/v1/projects
 * @access Public (will be protected in future)
 */
export const createProject = asyncHandler(async (req: Request<{}, {}, CreateProjectRequest>, res: Response): Promise<void> => {
  const projectData = {
    ...req.body,
    description: req.body.description || '',
    version: req.body.version || '1.0.0'
  }
  
  const project = await projectService.createProject(projectData)
  
  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: project,
    timestamp: new Date().toISOString()
  })
})

/**
 * Update existing project
 * 
 * @route PUT /api/v1/projects/:id
 * @access Public (will be protected in future)
 */
export const updateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string }
  const updateData = req.body as UpdateProjectRequest
  
  const project = await projectService.updateProject(id, updateData)
  
  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: project,
    timestamp: new Date().toISOString()
  })
})

/**
 * Delete project
 * 
 * @route DELETE /api/v1/projects/:id
 * @access Public (will be protected in future)
 */
export const deleteProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string }
  
  const project = await projectService.deleteProject(id)
  
  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: project,
    timestamp: new Date().toISOString()
  })
})

/**
 * Activate project
 * 
 * @route PATCH /api/v1/projects/:id/activate
 * @access Public (will be protected in future)
 */
export const activateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string }
  
  const project = await projectService.activateProject(id)
  
  res.status(200).json({
    success: true,
    message: 'Project activated successfully',
    data: project,
    timestamp: new Date().toISOString()
  })
})

/**
 * Get project statistics
 * 
 * @route GET /api/v1/projects/stats
 * @access Public
 */
export const getProjectStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await projectService.getProjectStats()
  
  res.status(200).json({
    success: true,
    message: 'Project statistics retrieved successfully',
    data: stats,
    timestamp: new Date().toISOString()
  })
})

export default {
  getActiveProjectInfo,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  activateProject,
  getProjectStats
}