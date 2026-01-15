/**
 * Project Service API Client
 * 
 * @description Frontend service for project-related API calls
 * including project information retrieval and health checks.
 */

import api, { healthCheck } from './api.js'
import { apiEndpoints } from '../config/api.js'
import type { ID } from '@shared/common'

// 项目查询选项接口
interface ProjectQueryOptions {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

// 项目数据接口
interface ProjectData {
  name: string
  description: string
  version: string
  technologies?: string[]
  features?: FeatureData[]
  repository?: string
  isActive?: boolean
}

// 功能数据接口
interface FeatureData {
  name: string
  description: string
  status?: 'planned' | 'in-progress' | 'completed'
}

// 项目统计接口
interface ProjectStats {
  totalProjects: number
  activeProjects: number
  inactiveProjects: number
  featuresByStatus: Record<string, number>
}

// 健康检查结果接口
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  data?: any
  error?: string
  timestamp: string
}

// 验证结果接口
interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// 格式化项目接口
interface FormattedProject extends ProjectData {
  formattedCreatedAt: string
  formattedUpdatedAt: string
  featureCount: number
  technologyCount: number
}

/**
 * Project service with API methods
 */
export const projectService = {
  /**
   * Get active project information
   * 
   * @returns Project information response
   * @throws API or network error
   */
  async getProjectInfo(): Promise<any> {
    try {
      const response = await api.get(apiEndpoints.projects.info())
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch project info:', error)
      
      // Transform error for consistent handling
      const errorMessage = error.message || 'Unable to load project information'
      throw new Error(errorMessage)
    }
  },

  /**
   * Get all projects with pagination
   * 
   * @param options - Query options
   * @returns Projects list response
   */
  async getAllProjects(options: ProjectQueryOptions = {}): Promise<any> {
    try {
      const params = new URLSearchParams()
      
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.search) params.append('search', options.search)
      if (options.isActive !== undefined) params.append('isActive', options.isActive.toString())
      
      const queryString = params.toString()
      const url = `${apiEndpoints.projects.list()}${queryString ? `?${queryString}` : ''}`
      
      const response = await api.get(url)
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch projects:', error)
      throw new Error(error.message || 'Unable to load projects')
    }
  },

  /**
   * Get project by ID
   * 
   * @param projectId - Project ID
   * @returns Project response
   */
  async getProjectById(projectId: ID): Promise<any> {
    try {
      if (!projectId) {
        throw new Error('Project ID is required')
      }
      
      const response = await api.get(apiEndpoints.projects.byId(projectId))
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch project by ID:', error)
      throw new Error(error.message || 'Unable to load project')
    }
  },

  /**
   * Create new project
   * 
   * @param projectData - Project data
   * @returns Created project response
   */
  async createProject(projectData: ProjectData): Promise<any> {
    try {
      if (!projectData || typeof projectData !== 'object') {
        throw new Error('Valid project data is required')
      }
      
      const response = await api.post(apiEndpoints.projects.create(), projectData)
      return response.data
    } catch (error: any) {
      console.error('Failed to create project:', error)
      throw new Error(error.message || 'Unable to create project')
    }
  },

  /**
   * Update existing project
   * 
   * @param projectId - Project ID
   * @param updateData - Data to update
   * @returns Updated project response
   */
  async updateProject(projectId: ID, updateData: Partial<ProjectData>): Promise<any> {
    try {
      if (!projectId) {
        throw new Error('Project ID is required')
      }
      
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Valid update data is required')
      }
      
      const response = await api.put(apiEndpoints.projects.update(projectId), updateData)
      return response.data
    } catch (error: any) {
      console.error('Failed to update project:', error)
      throw new Error(error.message || 'Unable to update project')
    }
  },

  /**
   * Delete project
   * 
   * @param projectId - Project ID
   * @returns Deletion response
   */
  async deleteProject(projectId: ID): Promise<any> {
    try {
      if (!projectId) {
        throw new Error('Project ID is required')
      }
      
      const response = await api.delete(apiEndpoints.projects.delete(projectId))
      return response.data
    } catch (error: any) {
      console.error('Failed to delete project:', error)
      throw new Error(error.message || 'Unable to delete project')
    }
  },

  /**
   * Activate project
   * 
   * @param projectId - Project ID
   * @returns Activation response
   */
  async activateProject(projectId: ID): Promise<any> {
    try {
      if (!projectId) {
        throw new Error('Project ID is required')
      }
      
      const response = await api.patch(apiEndpoints.projects.activate(projectId))
      return response.data
    } catch (error: any) {
      console.error('Failed to activate project:', error)
      throw new Error(error.message || 'Unable to activate project')
    }
  },

  /**
   * Get project statistics
   * 
   * @returns Project statistics response
   */
  async getProjectStats(): Promise<ProjectStats> {
    try {
      const response = await api.get(apiEndpoints.projects.stats())
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch project stats:', error)
      throw new Error(error.message || 'Unable to load project statistics')
    }
  },

  /**
   * Search projects
   * 
   * @param searchTerm - Search term
   * @param options - Search options
   * @returns Search results response
   */
  async searchProjects(searchTerm: string, options: Omit<ProjectQueryOptions, 'search'> = {}): Promise<any> {
    try {
      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Valid search term is required')
      }
      
      const searchOptions: ProjectQueryOptions = {
        search: searchTerm.trim(),
        ...options
      }
      
      return await this.getAllProjects(searchOptions)
    } catch (error: any) {
      console.error('Failed to search projects:', error)
      throw new Error(error.message || 'Unable to search projects')
    }
  },

  /**
   * Backend health check
   * 
   * @returns Health status
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      return await healthCheck()
    } catch (error: any) {
      console.error('Health check failed:', error)
      return {
        status: 'unhealthy',
        error: error.message || 'Backend health check failed',
        timestamp: new Date().toISOString()
      }
    }
  },

  /**
   * Detailed health check
   * 
   * @returns Detailed health status
   */
  async detailedHealthCheck(): Promise<HealthCheckResult> {
    try {
      // 从环境配置获取基础URL，移除/api/v1前缀用于健康检查
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      const response = await api.get(apiEndpoints.health.detailed(), {}, {
        baseURL, // 使用环境变量配置的URL
        timeout: 5000
      })
      return {
        status: 'healthy',
        data: response.data,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Detailed health check failed:', error)
      return {
        status: 'unhealthy',
        error: error.message || 'Detailed health check failed',
        timestamp: new Date().toISOString()
      }
    }
  }
}

/**
 * Project data validation utilities
 */
export const projectValidation = {
  /**
   * Validate project data before submission
   * 
   * @param projectData - Project data to validate
   * @returns Validation result
   */
  validateProject(projectData: ProjectData): ValidationResult {
    const errors: string[] = []
    
    if (!projectData) {
      errors.push('Project data is required')
      return { isValid: false, errors }
    }
    
    // Required fields
    if (!projectData.name || typeof projectData.name !== 'string' || !projectData.name.trim()) {
      errors.push('Project name is required')
    } else if (projectData.name.length > 100) {
      errors.push('Project name must be 100 characters or less')
    }
    
    if (!projectData.description || typeof projectData.description !== 'string' || !projectData.description.trim()) {
      errors.push('Project description is required')
    } else if (projectData.description.length > 1000) {
      errors.push('Project description must be 1000 characters or less')
    }
    
    if (!projectData.version || typeof projectData.version !== 'string') {
      errors.push('Project version is required')
    } else if (!/^\d+\.\d+\.\d+$/.test(projectData.version)) {
      errors.push('Project version must be in semver format (x.y.z)')
    }
    
    // Optional fields validation
    if (projectData.technologies && !Array.isArray(projectData.technologies)) {
      errors.push('Technologies must be an array')
    }
    
    if (projectData.features && !Array.isArray(projectData.features)) {
      errors.push('Features must be an array')
    }
    
    if (projectData.repository && typeof projectData.repository === 'string') {
      try {
        new URL(projectData.repository)
      } catch {
        errors.push('Repository must be a valid URL')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate feature data
   * 
   * @param featureData - Feature data to validate
   * @returns Validation result
   */
  validateFeature(featureData: FeatureData): ValidationResult {
    const errors: string[] = []
    
    if (!featureData) {
      errors.push('Feature data is required')
      return { isValid: false, errors }
    }
    
    if (!featureData.name || typeof featureData.name !== 'string' || !featureData.name.trim()) {
      errors.push('Feature name is required')
    }
    
    if (!featureData.description || typeof featureData.description !== 'string' || !featureData.description.trim()) {
      errors.push('Feature description is required')
    }
    
    if (featureData.status && !['planned', 'in-progress', 'completed'].includes(featureData.status)) {
      errors.push('Feature status must be planned, in-progress, or completed')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Project utility functions
 */
export const projectUtils = {
  /**
   * Format project data for display
   * 
   * @param project - Raw project data
   * @returns Formatted project data
   */
  formatProject(project: any): FormattedProject | null {
    if (!project) return null
    
    return {
      ...project,
      formattedCreatedAt: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A',
      formattedUpdatedAt: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A',
      featureCount: project.features ? project.features.length : 0,
      technologyCount: project.technologies ? project.technologies.length : 0
    }
  },

  /**
   * Group features by status
   * 
   * @param features - Features array
   * @returns Features grouped by status
   */
  groupFeaturesByStatus(features: FeatureData[]): Record<string, FeatureData[]> {
    if (!Array.isArray(features)) return {}
    
    return features.reduce((groups: Record<string, FeatureData[]>, feature) => {
      const status = feature.status || 'planned'
      if (!groups[status]) {
        groups[status] = []
      }
      groups[status].push(feature)
      return groups
    }, {})
  },

  /**
   * Calculate project completion percentage
   * 
   * @param features - Features array
   * @returns Completion percentage (0-100)
   */
  calculateCompletion(features: FeatureData[]): number {
    if (!Array.isArray(features) || features.length === 0) return 0
    
    const completedFeatures = features.filter(feature => feature.status === 'completed').length
    return Math.round((completedFeatures / features.length) * 100)
  }
}

export default projectService