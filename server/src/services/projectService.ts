/**
 * Project Service
 * 
 * @description Business logic for project-related operations
 * including data retrieval, validation, and processing.
 */

import Project from '../models/Project'
import { ValidationError } from '../middleware/errorHandler'
import type { ID } from '@shared/common'

// 项目查询选项接口
interface ProjectQueryOptions {
  page?: number
  limit?: number
  filter?: Record<string, any>
}

// 分页结果接口
interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface ProjectListResult {
  projects: any[]
  pagination: PaginationInfo
}

// 项目创建数据接口
interface CreateProjectData {
  name: string
  description: string
  version: string
  technologies?: string[]
  features?: any[]
  isActive?: boolean
}

// 项目更新数据接口
interface UpdateProjectData {
  name?: string
  description?: string
  version?: string
  technologies?: string[]
  features?: any[]
  isActive?: boolean
  _id?: any
  createdAt?: any
  updatedAt?: any
}

// 项目统计接口
interface ProjectStatistics {
  totalProjects: number
  activeProjects: number
  inactiveProjects: number
  featuresByStatus: Record<string, number>
}

// 搜索选项接口
interface SearchOptions {
  limit?: number
}

/**
 * Get active project information
 * 
 * @returns Active project data
 * @throws If no active project found
 */
export const getActiveProject = async (): Promise<any> => {
  try {
    const project = await Project.findOne({ isActive: true })
    
    if (!project) {
      throw new ValidationError('No active project found')
    }
    
    return project
  } catch (error: any) {
    if (error.status) {
      throw error
    }
    throw new ValidationError('Failed to retrieve active project')
  }
}

/**
 * Get all projects with pagination
 * 
 * @param options - Query options
 * @returns Paginated projects data
 */
export const getAllProjects = async (options: ProjectQueryOptions = {}): Promise<ProjectListResult> => {
  try {
    const {
      page = 1,
      limit = 10,
      filter = {}
    } = options
    
    // Calculate skip value
    const skip = (page - 1) * limit
    
    // Build query
    const query = { ...filter }
    
    // Execute queries in parallel
    const [projects, totalCount] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query)
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    
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
    }
  } catch (error) {
    throw new ValidationError('Failed to retrieve projects')
  }
}

/**
 * Get project by ID
 * 
 * @param projectId - Project ObjectId
 * @returns Project data
 * @throws If project not found
 */
export const getProjectById = async (projectId: ID): Promise<any> => {
  try {
    const project = await Project.findById(projectId)
    
    if (!project) {
      throw new ValidationError('Project not found')
    }
    
    return project
  } catch (error: any) {
    if (error.status) {
      throw error
    }
    if (error.name === 'CastError') {
      throw new ValidationError('Invalid project ID format')
    }
    throw new ValidationError('Failed to retrieve project')
  }
}

/**
 * Create new project
 * 
 * @param projectData - Project data
 * @returns Created project
 * @throws If validation fails or creation fails
 */
export const createProject = async (projectData: CreateProjectData): Promise<any> => {
  try {
    // Validate required fields
    const { name, description, version } = projectData
    
    if (!name || !description || !version) {
      throw new ValidationError('Name, description, and version are required')
    }
    
    // Check for duplicate name
    const existingProject = await Project.findOne({ name })
    if (existingProject) {
      throw new ValidationError(`Project with name '${name}' already exists`)
    }
    
    // Create project
    const project = new Project(projectData)
    await project.save()
    
    return project
  } catch (error: any) {
    if (error.status) {
      throw error
    }
    if (error.code === 11000) {
      throw new ValidationError('Project name already exists')
    }
    throw new ValidationError('Failed to create project')
  }
}

/**
 * Update existing project
 * 
 * @param projectId - Project ObjectId
 * @param updateData - Data to update
 * @returns Updated project
 * @throws If project not found or update fails
 */
export const updateProject = async (projectId: ID, updateData: UpdateProjectData): Promise<any> => {
  try {
    // Remove fields that shouldn't be updated directly
    const { _id, createdAt, updatedAt, ...validUpdateData } = updateData
    
    const project = await Project.findByIdAndUpdate(
      projectId,
      validUpdateData,
      { 
        new: true, 
        runValidators: true 
      }
    )
    
    if (!project) {
      throw new ValidationError('Project not found')
    }
    
    return project
  } catch (error: any) {
    if (error.status) {
      throw error
    }
    if (error.name === 'CastError') {
      throw new ValidationError('Invalid project ID format')
    }
    if (error.code === 11000) {
      throw new ValidationError('Project name already exists')
    }
    throw new ValidationError('Failed to update project')
  }
}

/**
 * Delete project
 * 
 * @param projectId - Project ObjectId
 * @returns Deleted project
 * @throws If project not found or deletion fails
 */
export const deleteProject = async (projectId: ID): Promise<any> => {
  try {
    const project = await Project.findByIdAndDelete(projectId)
    
    if (!project) {
      throw new ValidationError('Project not found')
    }
    
    return project
  } catch (error: any) {
    if (error.status) {
      throw error
    }
    if (error.name === 'CastError') {
      throw new ValidationError('Invalid project ID format')
    }
    throw new ValidationError('Failed to delete project')
  }
}

/**
 * Activate project (set as active, deactivate others)
 * 
 * @param projectId - Project ObjectId
 * @returns Activated project
 * @throws If project not found or activation fails
 */
export const activateProject = async (projectId: ID): Promise<any> => {
  try {
    const project = await Project.findById(projectId)
    
    if (!project) {
      throw new ValidationError('Project not found')
    }
    
    // Activate the project manually
    await Project.updateMany({}, { isActive: false })
    project.isActive = true
    await project.save()
    
    return project
  } catch (error: any) {
    if (error.status) {
      throw error
    }
    if (error.name === 'CastError') {
      throw new ValidationError('Invalid project ID format')
    }
    throw new ValidationError('Failed to activate project')
  }
}

/**
 * Get project statistics
 * 
 * @returns Project statistics
 */
export const getProjectStats = async (): Promise<ProjectStatistics> => {
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
    ])
    
    return {
      totalProjects,
      activeProjects,
      inactiveProjects: totalProjects - activeProjects,
      featuresByStatus: projectsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {})
    }
  } catch (error) {
    throw new ValidationError('Failed to retrieve project statistics')
  }
}

/**
 * Search projects by text
 * 
 * @param searchTerm - Search term
 * @param options - Search options
 * @returns Matching projects
 */
export const searchProjects = async (searchTerm: string, options: SearchOptions = {}): Promise<any[]> => {
  try {
    const { limit = 10 } = options
    
    const searchRegex = new RegExp(searchTerm, 'i')
    
    const projects = await Project.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { technologies: { $in: [searchRegex] } }
      ]
    })
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean()
    
    return projects
  } catch (error) {
    throw new ValidationError('Failed to search projects')
  }
}

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
}