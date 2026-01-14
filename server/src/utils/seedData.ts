/**
 * Database Seed Script
 * 
 * @description Script to populate the database with initial project data
 * for development and testing purposes.
 */

import mongoose from 'mongoose'
import Project from '../models/Project.js'
import { connectDatabase, disconnectDatabase } from '../config/database.js'

// Feature interface
interface Feature {
  name: string
  description: string
  status: 'completed' | 'in-progress' | 'planned'
}

// Project interface
interface ProjectData {
  name: string
  description: string
  version: string
  technologies: string[]
  features: Feature[]
  repository: string
  isActive: boolean
}

// Statistics interface
interface SeedStats {
  totalProjects: number
  activeProjects: number
  totalFeatures: number
  completedFeatures: number
  inProgressFeatures: number
  plannedFeatures: number
}

/**
 * Sample project data
 */
const sampleProjects: ProjectData[] = [
  {
    name: 'Stock Trading Simulator',
    description: 'A comprehensive web-based stock trading simulator designed for learning and practicing trading strategies. Features real-time market simulation, portfolio management, and educational tools for understanding financial markets. Perfect for beginners and experienced traders looking to test strategies without financial risk.',
    version: '1.0.0',
    technologies: [
      'Vue.js 3',
      'Vite',
      'Express.js',
      'MongoDB',
      'Node.js',
      'JavaScript ES6+',
      'Mongoose',
      'Axios',
      'Helmet',
      'CORS'
    ],
    features: [
      {
        name: 'Project Information Display',
        description: 'Frontend page displaying basic project information and technology stack with responsive design',
        status: 'completed'
      },
      {
        name: 'Frontend-Backend Communication',
        description: 'REST API integration between Vue.js frontend and Express.js backend with error handling',
        status: 'completed'
      },
      {
        name: 'Development Environment',
        description: 'Complete development setup with debugging support, build scripts, and VSCode integration',
        status: 'completed'
      },
      {
        name: 'Database Integration',
        description: 'MongoDB integration with Mongoose ODM for data persistence and validation',
        status: 'completed'
      },
      {
        name: 'Security Middleware',
        description: 'Comprehensive security setup with Helmet, CORS, rate limiting, and input sanitization',
        status: 'completed'
      },
      {
        name: 'Real-time Trading Simulation',
        description: 'Live market data simulation with real-time price updates and trading operations',
        status: 'planned'
      },
      {
        name: 'Portfolio Management',
        description: 'User portfolio tracking with buy/sell operations, performance analytics, and reporting',
        status: 'planned'
      },
      {
        name: 'User Authentication',
        description: 'Secure user registration, login, and session management with JWT tokens',
        status: 'planned'
      },
      {
        name: 'Market Data Integration',
        description: 'Integration with external market data providers for real-time stock prices and news',
        status: 'planned'
      },
      {
        name: 'Trading Analytics',
        description: 'Advanced analytics dashboard with charts, performance metrics, and trading insights',
        status: 'planned'
      }
    ],
    repository: 'https://github.com/your-org/stock-trading-simulator',
    isActive: true
  },
  {
    name: 'E-Commerce Platform',
    description: 'Modern e-commerce platform with advanced features for online retail businesses. Includes product management, order processing, payment integration, and customer management.',
    version: '2.1.0',
    technologies: [
      'React',
      'Next.js',
      'TypeScript',
      'PostgreSQL',
      'Prisma',
      'Stripe',
      'Redis',
      'Docker'
    ],
    features: [
      {
        name: 'Product Catalog',
        description: 'Comprehensive product management with categories, variants, and inventory tracking',
        status: 'completed'
      },
      {
        name: 'Shopping Cart',
        description: 'Advanced shopping cart with save for later, quantity management, and price calculations',
        status: 'completed'
      },
      {
        name: 'Payment Processing',
        description: 'Secure payment processing with multiple payment methods and fraud detection',
        status: 'in-progress'
      },
      {
        name: 'Order Management',
        description: 'Complete order lifecycle management from placement to fulfillment',
        status: 'in-progress'
      },
      {
        name: 'Customer Dashboard',
        description: 'User-friendly customer portal for order history, tracking, and account management',
        status: 'planned'
      }
    ],
    repository: 'https://github.com/your-org/ecommerce-platform',
    isActive: false
  },
  {
    name: 'Task Management System',
    description: 'Collaborative task management system for teams with project tracking, time management, and reporting capabilities. Designed for agile development teams and project managers.',
    version: '1.5.2',
    technologies: [
      'Angular',
      'NestJS',
      'TypeScript',
      'MySQL',
      'TypeORM',
      'Socket.io',
      'JWT',
      'Docker'
    ],
    features: [
      {
        name: 'Project Management',
        description: 'Create and manage projects with team assignments and milestone tracking',
        status: 'completed'
      },
      {
        name: 'Task Tracking',
        description: 'Comprehensive task management with priorities, due dates, and progress tracking',
        status: 'completed'
      },
      {
        name: 'Team Collaboration',
        description: 'Real-time collaboration features with comments, file sharing, and notifications',
        status: 'completed'
      },
      {
        name: 'Time Tracking',
        description: 'Built-in time tracking with reporting and productivity analytics',
        status: 'in-progress'
      },
      {
        name: 'Advanced Reporting',
        description: 'Detailed reports and analytics for project performance and team productivity',
        status: 'planned'
      }
    ],
    repository: 'https://github.com/your-org/task-management',
    isActive: false
  }
]

/**
 * Seed the database with sample data
 * 
 * @param clearExisting - Whether to clear existing data first
 * @returns Promise<void>
 */
export const seedDatabase = async (clearExisting: boolean = false): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Clear existing data if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing project data...')
      await Project.deleteMany({})
      console.log('✅ Existing data cleared')
    }
    
    // Check if data already exists
    const existingCount = await Project.countDocuments()
    if (existingCount > 0 && !clearExisting) {
      console.log(`📊 Database already contains ${existingCount} projects. Skipping seed.`)
      console.log('💡 Use --clear flag to clear existing data first')
      return
    }
    
    // Insert sample projects
    console.log('📝 Inserting sample project data...')
    const insertedProjects = await Project.insertMany(sampleProjects)
    
    console.log(`✅ Successfully seeded ${insertedProjects.length} projects:`)
    insertedProjects.forEach((project: any, index: number) => {
      console.log(`   ${index + 1}. ${project.name} (v${project.version}) - ${project.isActive ? 'Active' : 'Inactive'}`)
    })
    
    // Display statistics
    const stats = await getSeededDataStats()
    console.log('\n📈 Seeded Data Statistics:')
    console.log(`   Total Projects: ${stats.totalProjects}`)
    console.log(`   Active Projects: ${stats.activeProjects}`)
    console.log(`   Total Features: ${stats.totalFeatures}`)
    console.log(`   Completed Features: ${stats.completedFeatures}`)
    console.log(`   In Progress Features: ${stats.inProgressFeatures}`)
    console.log(`   Planned Features: ${stats.plannedFeatures}`)
    
    console.log('\n🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', (error as Error).message)
    throw error
  }
}

/**
 * Get statistics about seeded data
 * 
 * @returns Promise<SeedStats> Statistics object
 */
const getSeededDataStats = async (): Promise<SeedStats> => {
  try {
    const projects = await Project.find({}).lean()
    
    const stats: SeedStats = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p: any) => p.isActive).length,
      totalFeatures: 0,
      completedFeatures: 0,
      inProgressFeatures: 0,
      plannedFeatures: 0
    }
    
    projects.forEach((project: any) => {
      if (project.features) {
        stats.totalFeatures += project.features.length
        project.features.forEach((feature: Feature) => {
          switch (feature.status) {
            case 'completed':
              stats.completedFeatures++
              break
            case 'in-progress':
              stats.inProgressFeatures++
              break
            case 'planned':
              stats.plannedFeatures++
              break
          }
        })
      }
    })
    
    return stats
  } catch (error) {
    console.error('Error getting seeded data stats:', error)
    return {
      totalProjects: 0,
      activeProjects: 0,
      totalFeatures: 0,
      completedFeatures: 0,
      inProgressFeatures: 0,
      plannedFeatures: 0
    }
  }
}

/**
 * Clear all project data from database
 * 
 * @returns Promise<void>
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    console.log('🗑️  Clearing all project data...')
    const result = await Project.deleteMany({})
    console.log(`✅ Cleared ${result.deletedCount} projects from database`)
  } catch (error) {
    console.error('❌ Error clearing database:', (error as Error).message)
    throw error
  }
}

/**
 * Update existing project to active status
 * 
 * @param projectName - Name of project to activate
 * @returns Promise<void>
 */
export const activateProject = async (projectName: string): Promise<void> => {
  try {
    console.log(`🔄 Activating project: ${projectName}`)
    
    // Deactivate all projects first
    await Project.updateMany({}, { isActive: false })
    
    // Activate the specified project
    const result = await Project.updateOne(
      { name: projectName },
      { isActive: true }
    )
    
    if (result.matchedCount === 0) {
      throw new Error(`Project '${projectName}' not found`)
    }
    
    console.log(`✅ Project '${projectName}' activated successfully`)
  } catch (error) {
    console.error('❌ Error activating project:', (error as Error).message)
    throw error
  }
}

/**
 * Main function for CLI usage
 */
const main = async (): Promise<void> => {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const clearFlag = args.includes('--clear') || args.includes('-c')
    const activateFlag = args.find(arg => arg.startsWith('--activate='))
    const projectToActivate = activateFlag ? activateFlag.split('=')[1] : null
    
    // Connect to database
    await connectDatabase()
    
    if (args.includes('--clear-only')) {
      await clearDatabase()
    } else if (projectToActivate) {
      await activateProject(projectToActivate)
    } else {
      await seedDatabase(clearFlag)
    }
    
    // Disconnect from database
    await disconnectDatabase()
    
  } catch (error) {
    console.error('❌ Seed script failed:', (error as Error).message)
    process.exit(1)
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default {
  seedDatabase,
  clearDatabase,
  activateProject,
  sampleProjects
}