// 导出所有共享类型定义

// 基础类型
export * from './common'

// 业务实体类型
export * from './auth'
export * from './portfolio'

// 生命周期管理类型
export * from './lifecycle'

// 数据库模型类型 - 仅在服务端使用，前端构建时跳过
// export * from './models'

// API 接口类型 - 只导出需要的类型
export type {
  ErrorResponse,
  ValidationErrorResponse
} from './api'

export { HttpStatus, API_ENDPOINTS } from './api'

// 处理冲突的类型 - 优先使用 trading 模块的定义
export type {
  Trade,
  TradeOrder,
  TradeExecution,
  TradeHistory,
  TradeType,
  TradeAction,
  TradeStatus,
  MarketData
} from './trading'

// 从 market 模块导出其他类型
export type {
  Stock,
  Trader
} from './market'

// 验证工具 - 避免冲突，优先使用 validation 模块
export type {
  ValidationResult,
  ValidatorFunction
} from './validation'

// 使用 api 模块的 ValidationError
export type { ValidationError } from './api'

export {
  validateStock,
  validatePortfolio,
  validateTrade,
  validateUser,
  isValidStock,
  isValidPortfolio,
  isValidTrade,
  isValidUser
} from './validation'