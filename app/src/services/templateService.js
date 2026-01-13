/**
 * 模板管理API服务
 * 提供前端与后端模板API的交互接口
 */

import apiService from './api.js';

class TemplateService {
  constructor() {
    this.baseURL = '/api/templates';
  }

  // ==================== 股票模板服务 ====================

  /**
   * 获取股票模板列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.status - 状态筛选
   * @param {string} params.category - 分类筛选
   * @param {string} params.search - 搜索关键词
   * @returns {Promise<Object>} API响应
   */
  async getStockTemplates(params = {}) {
    try {
      const response = await apiService.get(`${this.baseURL}/stocks`, { params });
      return response.data;
    } catch (error) {
      console.error('获取股票模板列表失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 根据ID获取股票模板
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} 股票模板数据
   */
  async getStockTemplateById(id) {
    try {
      const response = await apiService.get(`${this.baseURL}/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取股票模板详情失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 创建股票模板
   * @param {Object} templateData - 股票模板数据
   * @returns {Promise<Object>} 创建结果
   */
  async createStockTemplate(templateData) {
    try {
      const response = await apiService.post(`${this.baseURL}/stocks`, templateData);
      return response.data;
    } catch (error) {
      console.error('创建股票模板失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 更新股票模板
   * @param {string} id - 模板ID
   * @param {Object} templateData - 更新的模板数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateStockTemplate(id, templateData) {
    try {
      const response = await apiService.put(`${this.baseURL}/stocks/${id}`, templateData);
      return response.data;
    } catch (error) {
      console.error('更新股票模板失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 删除股票模板
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteStockTemplate(id) {
    try {
      const response = await apiService.delete(`${this.baseURL}/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除股票模板失败:', error);
      throw this._handleError(error);
    }
  }

  // ==================== AI交易员模板服务 ====================

  /**
   * 获取AI交易员模板列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.status - 状态筛选
   * @param {string} params.riskProfile - 风险偏好筛选
   * @param {string} params.search - 搜索关键词
   * @returns {Promise<Object>} API响应
   */
  async getTraderTemplates(params = {}) {
    try {
      const response = await apiService.get(`${this.baseURL}/traders`, { params });
      return response.data;
    } catch (error) {
      console.error('获取AI交易员模板列表失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 根据ID获取AI交易员模板
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} AI交易员模板数据
   */
  async getTraderTemplateById(id) {
    try {
      const response = await apiService.get(`${this.baseURL}/traders/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取AI交易员模板详情失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 创建AI交易员模板
   * @param {Object} templateData - AI交易员模板数据
   * @returns {Promise<Object>} 创建结果
   */
  async createTraderTemplate(templateData) {
    try {
      const response = await apiService.post(`${this.baseURL}/traders`, templateData);
      return response.data;
    } catch (error) {
      console.error('创建AI交易员模板失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 更新AI交易员模板
   * @param {string} id - 模板ID
   * @param {Object} templateData - 更新的模板数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateTraderTemplate(id, templateData) {
    try {
      const response = await apiService.put(`${this.baseURL}/traders/${id}`, templateData);
      return response.data;
    } catch (error) {
      console.error('更新AI交易员模板失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 删除AI交易员模板
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteTraderTemplate(id) {
    try {
      const response = await apiService.delete(`${this.baseURL}/traders/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除AI交易员模板失败:', error);
      throw this._handleError(error);
    }
  }

  // ==================== 批量操作服务 ====================

  /**
   * 批量删除模板
   * @param {string} type - 模板类型 (stock/trader)
   * @param {string[]} ids - 模板ID数组
   * @returns {Promise<Object>} 批量删除结果
   */
  async batchDeleteTemplates(type, ids) {
    try {
      const response = await apiService.post(`${this.baseURL}/batch/delete`, {
        type,
        ids
      });
      return response.data;
    } catch (error) {
      console.error('批量删除模板失败:', error);
      throw this._handleError(error);
    }
  }

  /**
   * 批量更新模板状态
   * @param {string} type - 模板类型 (stock/trader)
   * @param {string[]} ids - 模板ID数组
   * @param {string} status - 新状态 (active/inactive)
   * @returns {Promise<Object>} 批量更新结果
   */
  async batchUpdateTemplateStatus(type, ids, status) {
    try {
      const response = await apiService.post(`${this.baseURL}/batch/status`, {
        type,
        ids,
        status
      });
      return response.data;
    } catch (error) {
      console.error('批量更新模板状态失败:', error);
      throw this._handleError(error);
    }
  }

  // ==================== 统计信息服务 ====================

  /**
   * 获取模板统计信息
   * @returns {Promise<Object>} 统计数据
   */
  async getTemplateStats() {
    try {
      const response = await apiService.get(`${this.baseURL}/stats`);
      return response.data;
    } catch (error) {
      console.error('获取模板统计信息失败:', error);
      throw this._handleError(error);
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 验证股票模板数据
   * @param {Object} templateData - 股票模板数据
   * @returns {Object} 验证结果
   */
  validateStockTemplate(templateData) {
    const errors = [];

    // 必填字段验证
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('股票名称不能为空');
    }
    if (!templateData.symbol || templateData.symbol.trim().length === 0) {
      errors.push('股票代码不能为空');
    }
    if (!templateData.issuePrice || templateData.issuePrice <= 0) {
      errors.push('发行价格必须大于0');
    }
    if (!templateData.totalShares || templateData.totalShares <= 0) {
      errors.push('总股本必须大于0');
    }

    // 格式验证
    if (templateData.symbol && !/^[A-Z0-9]{1,10}$/.test(templateData.symbol)) {
      errors.push('股票代码格式不正确（1-10位大写字母或数字）');
    }
    if (templateData.name && templateData.name.length > 100) {
      errors.push('股票名称不能超过100个字符');
    }
    if (templateData.description && templateData.description.length > 500) {
      errors.push('描述信息不能超过500个字符');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证AI交易员模板数据
   * @param {Object} templateData - AI交易员模板数据
   * @returns {Object} 验证结果
   */
  validateTraderTemplate(templateData) {
    const errors = [];

    // 必填字段验证
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('模板名称不能为空');
    }
    if (!templateData.initialCapital || templateData.initialCapital < 1000) {
      errors.push('初始资金不能少于1000');
    }
    if (!templateData.riskProfile) {
      errors.push('风险偏好不能为空');
    }

    // 格式验证
    if (templateData.name && templateData.name.length > 100) {
      errors.push('模板名称不能超过100个字符');
    }
    if (templateData.initialCapital && templateData.initialCapital > 100000000) {
      errors.push('初始资金不能超过1亿');
    }
    if (templateData.maxPositions && (templateData.maxPositions < 1 || templateData.maxPositions > 100)) {
      errors.push('最大持仓数量必须在1-100之间');
    }
    if (templateData.description && templateData.description.length > 500) {
      errors.push('描述信息不能超过500个字符');
    }

    // 枚举值验证
    const validRiskProfiles = ['conservative', 'moderate', 'aggressive'];
    if (templateData.riskProfile && !validRiskProfiles.includes(templateData.riskProfile)) {
      errors.push('无效的风险偏好');
    }

    const validTradingStyles = ['day_trading', 'swing_trading', 'position_trading'];
    if (templateData.tradingStyle && !validTradingStyles.includes(templateData.tradingStyle)) {
      errors.push('无效的交易风格');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 处理API错误
   * @param {Error} error - 原始错误
   * @returns {Error} 处理后的错误
   */
  _handleError(error) {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      const message = data?.message || `请求失败 (${status})`;
      const apiError = new Error(message);
      apiError.status = status;
      apiError.data = data;
      return apiError;
    } else if (error.request) {
      // 网络错误
      return new Error('网络连接失败，请检查网络设置');
    } else {
      // 其他错误
      return new Error(error.message || '未知错误');
    }
  }

  // ==================== 常量定义 ====================

  /**
   * 股票分类选项
   */
  static get STOCK_CATEGORIES() {
    return [
      { value: 'tech', label: '科技' },
      { value: 'finance', label: '金融' },
      { value: 'healthcare', label: '医疗' },
      { value: 'energy', label: '能源' },
      { value: 'consumer', label: '消费' }
    ];
  }

  /**
   * 风险偏好选项
   */
  static get RISK_PROFILES() {
    return [
      { value: 'conservative', label: '保守型' },
      { value: 'moderate', label: '稳健型' },
      { value: 'aggressive', label: '激进型' }
    ];
  }

  /**
   * 交易风格选项
   */
  static get TRADING_STYLES() {
    return [
      { value: 'day_trading', label: '日内交易' },
      { value: 'swing_trading', label: '波段交易' },
      { value: 'position_trading', label: '趋势交易' }
    ];
  }

  /**
   * 状态选项
   */
  static get STATUS_OPTIONS() {
    return [
      { value: 'active', label: '启用' },
      { value: 'inactive', label: '禁用' }
    ];
  }
}

export default new TemplateService();