import Joi from 'joi'
import type { Request, Response, NextFunction } from 'express'
import { ValidationError } from './errorHandler'

// Validation detail interface
export interface ValidationDetail {
  field: string
  message: string
  value: any
}

// Request validation error interface
export interface RequestValidationError {
  source: 'params' | 'query' | 'body'
  field: string
  message: string
  value: any
}

// Validation schemas interface
export interface ValidationSchemas {
  params?: Joi.ObjectSchema
  query?: Joi.ObjectSchema
  body?: Joi.ObjectSchema
}

// 通用验证规则
export const commonSchemas = {
  // MongoDB ObjectId
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('Invalid ObjectId format'),

  // 分页参数
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string()
      .valid('name', 'symbol', 'createdAt', 'updatedAt', 'initialCapital')
      .default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // 搜索参数
  search: Joi.object({
    search: Joi.string().max(100).allow(''),
    status: Joi.string().valid('active', 'inactive'),
  }),

  // 股票模板验证
  stockTemplate: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.empty': '股票名称不能为空',
      'string.min': '股票名称至少1个字符',
      'string.max': '股票名称最多100个字符',
      'any.required': '股票名称是必填项',
    }),
    symbol: Joi.string()
      .pattern(/^[A-Z0-9]{1,10}$/)
      .required()
      .messages({
        'string.pattern.base': '股票代码必须是1-10位大写字母和数字组合',
        'any.required': '股票代码是必填项',
      }),
    issuePrice: Joi.number().positive().max(999999.99).precision(2).required().messages({
      'number.positive': '发行价格必须大于0',
      'number.max': '发行价格不能超过999999.99',
      'any.required': '发行价格是必填项',
    }),
    totalShares: Joi.number().integer().min(1).max(1000000000).required().messages({
      'number.integer': '总股本必须是整数',
      'number.min': '总股本至少为1股',
      'number.max': '总股本不能超过10亿股',
      'any.required': '总股本是必填项',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': '描述信息最多500个字符',
    }),
    category: Joi.string().valid('tech', 'finance', 'healthcare', 'energy', 'consumer').messages({
      'any.only': '股票分类必须是预定义的类型之一',
    }),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),

  // AI交易员模板验证
  traderTemplate: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.empty': '模板名称不能为空',
      'string.min': '模板名称至少1个字符',
      'string.max': '模板名称最多100个字符',
      'any.required': '模板名称是必填项',
    }),
    initialCapital: Joi.number().min(1000).max(100000000).precision(2).required().messages({
      'number.min': '初始资金至少1000元',
      'number.max': '初始资金不能超过1亿元',
      'any.required': '初始资金是必填项',
    }),
    riskProfile: Joi.string().valid('conservative', 'moderate', 'aggressive').required().messages({
      'any.only': '风险偏好必须是保守型、稳健型或激进型之一',
      'any.required': '风险偏好是必填项',
    }),
    tradingStyle: Joi.string().valid('day_trading', 'swing_trading', 'position_trading').messages({
      'any.only': '交易风格必须是日内交易、波段交易或长期持有之一',
    }),
    maxPositions: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.integer': '最大持仓数量必须是整数',
      'number.min': '最大持仓数量至少为1',
      'number.max': '最大持仓数量不能超过100',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': '描述信息最多500个字符',
    }),
    parameters: Joi.object().unknown(true),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),

  // 市场环境模板验证
  marketEnvironment: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.empty': '市场环境名称不能为空',
      'string.min': '市场环境名称至少1个字符',
      'string.max': '市场环境名称最多100个字符',
      'any.required': '市场环境名称是必填项',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': '描述信息最多500个字符',
    }),
    traderConfigs: Joi.array()
      .items(
        Joi.object({
          templateId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'AI交易员模板ID格式无效',
              'any.required': 'AI交易员模板ID是必填项',
            }),
          count: Joi.number().integer().min(1).max(1000).required().messages({
            'number.integer': '生成数量必须是整数',
            'number.min': '生成数量至少为1',
            'number.max': '生成数量不能超过1000',
            'any.required': '生成数量是必填项',
          }),
          capitalMultiplier: Joi.number().min(0.1).max(10).default(1).messages({
            'number.min': '资金倍数至少为0.1',
            'number.max': '资金倍数不能超过10',
          }),
          capitalVariation: Joi.number().min(0).max(1).default(0.2).messages({
            'number.min': '资金变动幅度不能小于0',
            'number.max': '资金变动幅度不能超过1',
          }),
        })
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': '至少配置1个AI交易员模板',
        'array.max': '最多配置50个AI交易员模板',
        'any.required': 'AI交易员配置是必填项',
      }),
    stockConfigs: Joi.array()
      .items(
        Joi.object({
          templateId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': '股票模板ID格式无效',
              'any.required': '股票模板ID是必填项',
            }),
        })
      )
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': '至少选择1个股票模板',
        'array.max': '最多选择100个股票模板',
        'any.required': '股票模板配置是必填项',
      }),
    allocationAlgorithm: Joi.string()
      .valid('weighted_random', 'equal_distribution', 'risk_based')
      .default('weighted_random')
      .messages({
        'any.only': '分配算法必须是加权随机、平均分配或风险分配之一',
      }),
    version: Joi.string().max(20).default('1.0.0').messages({
      'string.max': '版本号最多20个字符',
    }),
  }),

  // 批量导出验证
  batchExport: Joi.object({
    ids: Joi.array().items(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': '市场环境ID格式无效',
      })
    ).min(1).max(50).required().messages({
      'array.min': '至少选择1个市场环境',
      'array.max': '最多选择50个市场环境',
      'any.required': '市场环境ID列表是必填项',
    }),
  }),

  // 市场初始化验证
  marketInitialization: Joi.object({
    name: Joi.string().max(100).allow('').messages({
      'string.max': '市场环境名称最多100个字符',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': '描述信息最多500个字符',
    }),
    stockTemplates: Joi.array()
      .items(
        Joi.object({
          templateId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': '股票模板ID格式无效',
              'any.required': '股票模板ID是必填项',
            }),
        })
      )
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': '至少选择1个股票模板',
        'array.max': '最多选择100个股票模板',
        'any.required': '股票模板列表是必填项',
      }),
    traderTemplates: Joi.array()
      .items(
        Joi.object({
          templateId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'AI交易员模板ID格式无效',
              'any.required': 'AI交易员模板ID是必填项',
            }),
          quantity: Joi.number().integer().min(1).max(1000).required().messages({
            'number.integer': '生成数量必须是整数',
            'number.min': '生成数量至少为1',
            'number.max': '生成数量不能超过1000',
            'any.required': '生成数量是必填项',
          }),
        })
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': '至少选择1个AI交易员模板',
        'array.max': '最多选择50个AI交易员模板',
        'any.required': 'AI交易员模板列表是必填项',
      }),
    allocationSeed: Joi.number().integer().messages({
      'number.integer': '随机种子必须是整数',
    }),
    options: Joi.object({
      algorithm: Joi.string()
        .valid('weighted_random', 'proportional', 'round_robin')
        .default('weighted_random'),
      fairnessThreshold: Joi.number().min(0).max(1).default(0.8),
    }),
  }),

  // 批量删除验证
  batchDelete: Joi.object({
    type: Joi.string().valid('stock', 'trader', 'market').required().messages({
      'any.only': '模板类型必须是stock、trader或market',
      'any.required': '模板类型是必填项',
    }),
    ids: Joi.array().items(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': '模板ID格式无效',
      })
    ).min(1).max(100).required().messages({
      'array.min': '至少选择1个模板',
      'array.max': '最多选择100个模板',
      'any.required': '模板ID列表是必填项',
    }),
  }),

  // 批量状态更新验证
  batchStatus: Joi.object({
    type: Joi.string().valid('stock', 'trader', 'market').required().messages({
      'any.only': '模板类型必须是stock、trader或market',
      'any.required': '模板类型是必填项',
    }),
    ids: Joi.array().items(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': '模板ID格式无效',
      })
    ).min(1).max(100).required().messages({
      'array.min': '至少选择1个模板',
      'array.max': '最多选择100个模板',
      'any.required': '模板ID列表是必填项',
    }),
    status: Joi.string().valid('active', 'inactive').required().messages({
      'any.only': '状态必须是active或inactive',
      'any.required': '状态是必填项',
    }),
  }),
}

// 验证中间件工厂
export const validate = (schema: Joi.ObjectSchema, source: keyof Request = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source]

    const { error, value } = schema.validate(data, {
      abortEarly: false, // 返回所有错误
      stripUnknown: true, // 移除未知字段
      convert: true, // 自动类型转换
    })

    if (error) {
      const details: ValidationDetail[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value || null,
      }))

      throw new ValidationError('Validation failed', details)
    }

    // 将验证后的数据替换原始数据
    ;(req as any)[source] = value
    next()
  }
}

// 参数验证中间件
export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params')
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query')
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body')

// 组合验证中间件
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: RequestValidationError[] = []

    // 验证params
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params, { abortEarly: false })
      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            source: 'params' as const,
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value || null,
          }))
        )
      }
    }

    // 验证query
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      })
      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            source: 'query' as const,
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value || null,
          }))
        )
      } else {
        req.query = value
      }
    }

    // 验证body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      })
      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            source: 'body' as const,
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value || null,
          }))
        )
      } else {
        req.body = value
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Request validation failed', errors)
    }

    next()
  }
}

export default {
  commonSchemas,
  validate,
  validateParams,
  validateQuery,
  validateBody,
  validateRequest,
}