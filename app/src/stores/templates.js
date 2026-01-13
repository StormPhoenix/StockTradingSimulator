/**
 * 模板管理 Pinia Store
 * 管理股票模板和AI交易员模板的状态
 */

import { defineStore } from 'pinia';
import templateService from '../services/templateService.js';

export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    // 股票模板相关状态
    stockTemplates: [],
    stockTemplatesPagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    },
    stockTemplatesLoading: false,
    stockTemplatesFilters: {
      status: '',
      category: '',
      search: ''
    },
    
    // AI交易员模板相关状态
    traderTemplates: [],
    traderTemplatesPagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    },
    traderTemplatesLoading: false,
    traderTemplatesFilters: {
      status: '',
      riskProfile: '',
      search: ''
    },
    
    // 当前编辑的模板
    currentStockTemplate: null,
    currentTraderTemplate: null,
    
    // 选中的模板（用于批量操作）
    selectedStockTemplates: [],
    selectedTraderTemplates: [],
    
    // 统计信息
    templateStats: null,
    
    // 错误状态
    error: null
  }),

  getters: {
    // 股票模板相关getters
    activeStockTemplates: (state) => {
      return state.stockTemplates.filter(template => template.status === 'active');
    },
    
    stockTemplatesByCategory: (state) => {
      const grouped = {};
      state.stockTemplates.forEach(template => {
        const category = template.category || 'other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(template);
      });
      return grouped;
    },
    
    // AI交易员模板相关getters
    activeTraderTemplates: (state) => {
      return state.traderTemplates.filter(template => template.status === 'active');
    },
    
    traderTemplatesByRiskProfile: (state) => {
      const grouped = {};
      state.traderTemplates.forEach(template => {
        const risk = template.riskProfile;
        if (!grouped[risk]) {
          grouped[risk] = [];
        }
        grouped[risk].push(template);
      });
      return grouped;
    },
    
    // 选择状态
    hasSelectedStockTemplates: (state) => {
      return state.selectedStockTemplates.length > 0;
    },
    
    hasSelectedTraderTemplates: (state) => {
      return state.selectedTraderTemplates.length > 0;
    },
    
    // 统计信息
    totalTemplates: (state) => {
      return (state.templateStats?.stockTemplates?.total || 0) + 
             (state.templateStats?.traderTemplates?.total || 0);
    }
  },

  actions: {
    // ==================== 股票模板操作 ====================
    
    /**
     * 获取股票模板列表
     */
    async fetchStockTemplates(params = {}) {
      this.stockTemplatesLoading = true;
      this.error = null;
      
      try {
        const queryParams = {
          page: this.stockTemplatesPagination.page,
          limit: this.stockTemplatesPagination.limit,
          ...this.stockTemplatesFilters,
          ...params
        };
        
        const response = await templateService.getStockTemplates(queryParams);
        
        this.stockTemplates = response.data || [];
        // 确保分页信息存在，如果不存在则保持当前分页状态
        if (response.pagination) {
          this.stockTemplatesPagination = response.pagination;
        }
        
        return response;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.stockTemplatesLoading = false;
      }
    },
    
    /**
     * 获取股票模板详情
     */
    async fetchStockTemplateById(id) {
      try {
        const response = await templateService.getStockTemplateById(id);
        this.currentStockTemplate = response.data;
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 创建股票模板
     */
    async createStockTemplate(templateData) {
      try {
        const response = await templateService.createStockTemplate(templateData);
        
        // 添加到列表中
        this.stockTemplates.unshift(response.data);
        this.stockTemplatesPagination.total++;
        
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 更新股票模板
     */
    async updateStockTemplate(id, templateData) {
      try {
        const response = await templateService.updateStockTemplate(id, templateData);
        
        // 更新列表中的数据
        const index = this.stockTemplates.findIndex(t => t._id === id);
        if (index !== -1) {
          this.stockTemplates[index] = response.data;
        }
        
        // 更新当前模板
        if (this.currentStockTemplate && this.currentStockTemplate._id === id) {
          this.currentStockTemplate = response.data;
        }
        
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 删除股票模板
     */
    async deleteStockTemplate(id) {
      try {
        await templateService.deleteStockTemplate(id);
        
        // 从列表中移除
        this.stockTemplates = this.stockTemplates.filter(t => t._id !== id);
        this.stockTemplatesPagination.total--;
        
        // 清除当前模板
        if (this.currentStockTemplate && this.currentStockTemplate._id === id) {
          this.currentStockTemplate = null;
        }
        
        // 从选中列表中移除
        this.selectedStockTemplates = this.selectedStockTemplates.filter(selectedId => selectedId !== id);
        
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== AI交易员模板操作 ====================
    
    /**
     * 获取AI交易员模板列表
     */
    async fetchTraderTemplates(params = {}) {
      this.traderTemplatesLoading = true;
      this.error = null;
      
      try {
        const queryParams = {
          page: this.traderTemplatesPagination.page,
          limit: this.traderTemplatesPagination.limit,
          ...this.traderTemplatesFilters,
          ...params
        };
        
        const response = await templateService.getTraderTemplates(queryParams);
        
        this.traderTemplates = response.data || [];
        // 确保分页信息存在，如果不存在则保持当前分页状态
        if (response.pagination) {
          this.traderTemplatesPagination = response.pagination;
        }
        
        return response;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.traderTemplatesLoading = false;
      }
    },
    
    /**
     * 获取AI交易员模板详情
     */
    async fetchTraderTemplateById(id) {
      try {
        const response = await templateService.getTraderTemplateById(id);
        this.currentTraderTemplate = response.data;
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 创建AI交易员模板
     */
    async createTraderTemplate(templateData) {
      try {
        const response = await templateService.createTraderTemplate(templateData);
        
        // 添加到列表中
        this.traderTemplates.unshift(response.data);
        this.traderTemplatesPagination.total++;
        
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 更新AI交易员模板
     */
    async updateTraderTemplate(id, templateData) {
      try {
        const response = await templateService.updateTraderTemplate(id, templateData);
        
        // 更新列表中的数据
        const index = this.traderTemplates.findIndex(t => t._id === id);
        if (index !== -1) {
          this.traderTemplates[index] = response.data;
        }
        
        // 更新当前模板
        if (this.currentTraderTemplate && this.currentTraderTemplate._id === id) {
          this.currentTraderTemplate = response.data;
        }
        
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 删除AI交易员模板
     */
    async deleteTraderTemplate(id) {
      try {
        await templateService.deleteTraderTemplate(id);
        
        // 从列表中移除
        this.traderTemplates = this.traderTemplates.filter(t => t._id !== id);
        this.traderTemplatesPagination.total--;
        
        // 清除当前模板
        if (this.currentTraderTemplate && this.currentTraderTemplate._id === id) {
          this.currentTraderTemplate = null;
        }
        
        // 从选中列表中移除
        this.selectedTraderTemplates = this.selectedTraderTemplates.filter(selectedId => selectedId !== id);
        
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== 批量操作 ====================
    
    /**
     * 批量删除模板
     */
    async batchDeleteTemplates(type) {
      try {
        const ids = type === 'stock' ? this.selectedStockTemplates : this.selectedTraderTemplates;
        
        if (ids.length === 0) {
          throw new Error('请选择要删除的模板');
        }
        
        const response = await templateService.batchDeleteTemplates(type, ids);
        
        // 更新本地状态
        if (type === 'stock') {
          this.stockTemplates = this.stockTemplates.filter(t => !ids.includes(t._id));
          this.stockTemplatesPagination.total -= response.data.deletedCount;
          this.selectedStockTemplates = [];
        } else {
          this.traderTemplates = this.traderTemplates.filter(t => !ids.includes(t._id));
          this.traderTemplatesPagination.total -= response.data.deletedCount;
          this.selectedTraderTemplates = [];
        }
        
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 批量更新模板状态
     */
    async batchUpdateTemplateStatus(type, status) {
      try {
        const ids = type === 'stock' ? this.selectedStockTemplates : this.selectedTraderTemplates;
        
        if (ids.length === 0) {
          throw new Error('请选择要更新的模板');
        }
        
        const response = await templateService.batchUpdateTemplateStatus(type, ids, status);
        
        // 更新本地状态
        if (type === 'stock') {
          this.stockTemplates.forEach(template => {
            if (ids.includes(template._id)) {
              template.status = status;
            }
          });
          this.selectedStockTemplates = [];
        } else {
          this.traderTemplates.forEach(template => {
            if (ids.includes(template._id)) {
              template.status = status;
            }
          });
          this.selectedTraderTemplates = [];
        }
        
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== 筛选和分页操作 ====================
    
    /**
     * 设置股票模板筛选条件
     */
    setStockTemplatesFilters(filters) {
      this.stockTemplatesFilters = { ...this.stockTemplatesFilters, ...filters };
      this.stockTemplatesPagination.page = 1; // 重置到第一页
    },
    
    /**
     * 设置AI交易员模板筛选条件
     */
    setTraderTemplatesFilters(filters) {
      this.traderTemplatesFilters = { ...this.traderTemplatesFilters, ...filters };
      this.traderTemplatesPagination.page = 1; // 重置到第一页
    },
    
    /**
     * 设置股票模板分页
     */
    setStockTemplatesPagination(pagination) {
      this.stockTemplatesPagination = { ...this.stockTemplatesPagination, ...pagination };
    },
    
    /**
     * 设置AI交易员模板分页
     */
    setTraderTemplatesPagination(pagination) {
      this.traderTemplatesPagination = { ...this.traderTemplatesPagination, ...pagination };
    },
    
    // ==================== 选择操作 ====================
    
    /**
     * 切换股票模板选择状态
     */
    toggleStockTemplateSelection(id) {
      const index = this.selectedStockTemplates.indexOf(id);
      if (index === -1) {
        this.selectedStockTemplates.push(id);
      } else {
        this.selectedStockTemplates.splice(index, 1);
      }
    },
    
    /**
     * 全选/取消全选股票模板
     */
    toggleAllStockTemplatesSelection() {
      if (this.selectedStockTemplates.length === this.stockTemplates.length) {
        this.selectedStockTemplates = [];
      } else {
        this.selectedStockTemplates = this.stockTemplates.map(t => t._id);
      }
    },
    
    /**
     * 切换AI交易员模板选择状态
     */
    toggleTraderTemplateSelection(id) {
      const index = this.selectedTraderTemplates.indexOf(id);
      if (index === -1) {
        this.selectedTraderTemplates.push(id);
      } else {
        this.selectedTraderTemplates.splice(index, 1);
      }
    },
    
    /**
     * 全选/取消全选AI交易员模板
     */
    toggleAllTraderTemplatesSelection() {
      if (this.selectedTraderTemplates.length === this.traderTemplates.length) {
        this.selectedTraderTemplates = [];
      } else {
        this.selectedTraderTemplates = this.traderTemplates.map(t => t._id);
      }
    },
    
    // ==================== 统计信息 ====================
    
    /**
     * 获取模板统计信息
     */
    async fetchTemplateStats() {
      try {
        const response = await templateService.getTemplateStats();
        this.templateStats = response.data;
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== 工具方法 ====================
    
    /**
     * 清除错误状态
     */
    clearError() {
      this.error = null;
    },
    
    /**
     * 重置股票模板状态
     */
    resetStockTemplatesState() {
      this.stockTemplates = [];
      this.stockTemplatesPagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      };
      this.stockTemplatesFilters = {
        status: '',
        category: '',
        search: ''
      };
      this.selectedStockTemplates = [];
      this.currentStockTemplate = null;
    },
    
    /**
     * 重置AI交易员模板状态
     */
    resetTraderTemplatesState() {
      this.traderTemplates = [];
      this.traderTemplatesPagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      };
      this.traderTemplatesFilters = {
        status: '',
        riskProfile: '',
        search: ''
      };
      this.selectedTraderTemplates = [];
      this.currentTraderTemplate = null;
    },
    
    /**
     * 重置所有状态
     */
    resetAllState() {
      this.resetStockTemplatesState();
      this.resetTraderTemplatesState();
      this.templateStats = null;
      this.error = null;
    }
  }
});