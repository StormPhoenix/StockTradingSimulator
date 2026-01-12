/**
 * Project Routes
 * 
 * @description Express routes for project-related API endpoints
 * including project information retrieval and management.
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import projectController from '../controllers/projectController.js';

const router = express.Router();

/**
 * Validation middleware to handle express-validator results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * GET /api/v1/projects/info
 * 
 * Get active project information for frontend display
 */
router.get('/info', projectController.getActiveProjectInfo);

/**
 * GET /api/v1/projects
 * 
 * Get paginated list of all projects
 */
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ],
  projectController.getAllProjects
);

/**
 * GET /api/v1/projects/:id
 * 
 * Get specific project by ID
 */
router.get('/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid project ID format'),
    handleValidationErrors
  ],
  projectController.getProjectById
);

/**
 * POST /api/v1/projects
 * 
 * Create new project (future implementation)
 */
router.post('/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters'),
    body('version')
      .matches(/^\d+\.\d+\.\d+$/)
      .withMessage('Version must be in semver format (x.y.z)'),
    body('technologies')
      .optional()
      .isArray()
      .withMessage('Technologies must be an array'),
    body('technologies.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each technology must be between 1 and 50 characters'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    body('features.*.name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Feature name must be between 1 and 100 characters'),
    body('features.*.description')
      .optional()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Feature description must be between 1 and 500 characters'),
    body('features.*.status')
      .optional()
      .isIn(['planned', 'in-progress', 'completed'])
      .withMessage('Feature status must be planned, in-progress, or completed'),
    body('repository')
      .optional()
      .isURL({ protocols: ['http', 'https'] })
      .withMessage('Repository must be a valid HTTP/HTTPS URL'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    handleValidationErrors
  ],
  projectController.createProject
);

/**
 * PUT /api/v1/projects/:id
 * 
 * Update existing project (future implementation)
 */
router.put('/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid project ID format'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters'),
    body('version')
      .optional()
      .matches(/^\d+\.\d+\.\d+$/)
      .withMessage('Version must be in semver format (x.y.z)'),
    body('technologies')
      .optional()
      .isArray()
      .withMessage('Technologies must be an array'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    body('repository')
      .optional()
      .isURL({ protocols: ['http', 'https'] })
      .withMessage('Repository must be a valid HTTP/HTTPS URL'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    handleValidationErrors
  ],
  projectController.updateProject
);

/**
 * DELETE /api/v1/projects/:id
 * 
 * Delete project (future implementation)
 */
router.delete('/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid project ID format'),
    handleValidationErrors
  ],
  projectController.deleteProject
);

/**
 * PATCH /api/v1/projects/:id/activate
 * 
 * Activate specific project (future implementation)
 */
router.patch('/:id/activate',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid project ID format'),
    handleValidationErrors
  ],
  projectController.activateProject
);

export default router;