/**
 * 分类工具函数
 * 提供统一的分类映射和转换功能
 */

// 股票分类映射
export const STOCK_CATEGORY_MAP: Record<string, string> = {
  tech: '科技',
  finance: '金融',
  healthcare: '医疗',
  energy: '能源',
  consumer: '消费'
}

// 风险偏好映射
export const RISK_PROFILE_MAP: Record<string, string> = {
  conservative: '保守型',
  moderate: '稳健型',
  aggressive: '激进型'
}

// 交易风格映射
export const TRADING_STYLE_MAP: Record<string, string> = {
  day_trading: '日内交易',
  swing_trading: '波段交易',
  position_trading: '趋势交易'
}

// 状态映射
export const STATUS_MAP: Record<string, string> = {
  active: '启用',
  inactive: '禁用'
}

/**
 * 获取股票分类的中文标签
 * @param category - 英文分类代码
 * @returns 中文分类名称
 */
export const getCategoryLabel = (category: string): string => {
  return STOCK_CATEGORY_MAP[category] || category
}

/**
 * 获取风险偏好的中文标签
 * @param riskProfile - 英文风险偏好代码
 * @returns 中文风险偏好名称
 */
export const getRiskProfileLabel = (riskProfile: string): string => {
  return RISK_PROFILE_MAP[riskProfile] || riskProfile
}

/**
 * 获取交易风格的中文标签
 * @param tradingStyle - 英文交易风格代码
 * @returns 中文交易风格名称
 */
export const getTradingStyleLabel = (tradingStyle: string): string => {
  return TRADING_STYLE_MAP[tradingStyle] || tradingStyle
}

/**
 * 获取状态的中文标签
 * @param status - 英文状态代码
 * @returns 中文状态名称
 */
export const getStatusLabel = (status: string): string => {
  return STATUS_MAP[status] || status
}

/**
 * 获取风险偏好对应的标签类型（用于Element Plus的tag组件）
 * @param riskProfile - 风险偏好代码
 * @returns Element Plus tag类型
 */
export const getRiskProfileTagType = (riskProfile: string): string => {
  const types: Record<string, string> = {
    conservative: 'success',
    moderate: 'warning',
    aggressive: 'danger'
  }
  return types[riskProfile] || 'info'
}

/**
 * 获取状态对应的标签类型（用于Element Plus的tag组件）
 * @param status - 状态代码
 * @returns Element Plus tag类型
 */
export const getStatusTagType = (status: string): string => {
  return status === 'active' ? 'success' : 'danger'
}

// 选项接口
export interface SelectOption {
  value: string
  label: string
}

/**
 * 获取股票分类选项列表
 * @returns 股票分类选项数组
 */
export const getStockCategoryOptions = (): SelectOption[] => {
  return Object.entries(STOCK_CATEGORY_MAP).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * 获取风险偏好选项列表
 * @returns 风险偏好选项数组
 */
export const getRiskProfileOptions = (): SelectOption[] => {
  return Object.entries(RISK_PROFILE_MAP).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * 获取交易风格选项列表
 * @returns 交易风格选项数组
 */
export const getTradingStyleOptions = (): SelectOption[] => {
  return Object.entries(TRADING_STYLE_MAP).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * 获取状态选项列表
 * @returns 状态选项数组
 */
export const getStatusOptions = (): SelectOption[] => {
  return Object.entries(STATUS_MAP).map(([value, label]) => ({
    value,
    label
  }))
}