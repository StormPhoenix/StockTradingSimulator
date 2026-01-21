/**
 * 模板管理 Pinia Store
 * 管理股票模板和AI交易员模板的状态
 */

import { defineStore } from 'pinia';
// @ts-ignore - templateService is still JavaScript
import templateService from '../services/templateService';

// 类型定义
interface StockTemplate {
  _id: string;
  name: string;
  symbol: string;
  category: string;
  issuePrice: number;
  status: 'active' | 'inactive' | 'draft';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface TraderTemplate {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface MarketTemplate {
  _id: string;
  name: string;
  description: string;
  allocationAlgorithm?: string;
  version?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  statistics?: {
    traderCount: number;
    stockCount: number;
  };
  totalCapital?: number;
  totalMarketValue?: number;
  traders?: Array<{
    name: string;
    initialCapital: number;
    riskProfile: string;
    tradingStyle: string;
    holdings?: any[];
    templateId?: { name: string };
  }>;
  stocks?: Array<{
    symbol: string;
    name: string;
    issuePrice: number;
    totalShares: number;
    category: string;
    holders?: any[];
    templateId?: { name: string };
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface StockTemplatesFilters {
  status: string;
  category: string;
  search: string;
}

interface TraderTemplatesFilters {
  status: string;
  search: string;
}

interface MarketTemplatesFilters {
  status: string;
  search: string;
}

interface MarketStatistics {
  totalMarkets: number;
  totalTraders: number;
  totalStocks: number;
  totalCapital: number;
  averageTraders: number;
  averageStocks: number;
}

interface CreateMarketEnvironmentRequest {
  name?: string;
  description?: string;
  allocationAlgorithm: string;
  traderConfigs: Array<{
    templateId: string;
    count: number;
    capitalMultiplier: number;
    capitalVariation: number;
  }>;
  stockTemplateIds: string[];
}

interface SearchOptions {
  page?: number;
  limit?: number;
  [key: string]: any;
}

interface TemplateStats {
  stockTemplates: {
    total: number;
    active: number;
    inactive: number;
    draft: number;
  };
  traderTemplates: {
    total: number;
    active: number;
    inactive: number;
    draft: number;
  };
  marketTemplates: {
    total: number;
    active: number;
    inactive: number;
    draft: number;
  };
}

interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  message?: string;
  success?: boolean;
  filename?: string;
}

interface TemplatesState {
  // 股票模板相关状态
  stockTemplates: StockTemplate[];
  stockTemplatesPagination: Pagination;
  stockTemplatesLoading: boolean;
  stockTemplatesFilters: StockTemplatesFilters;
  
  // AI交易员模板相关状态
  traderTemplates: TraderTemplate[];
  traderTemplatesPagination: Pagination;
  traderTemplatesLoading: boolean;
  traderTemplatesFilters: TraderTemplatesFilters;
  
  // 市场环境模板相关状态
  marketTemplates: MarketTemplate[];
  marketTemplatesPagination: Pagination;
  marketTemplatesLoading: boolean;
  marketTemplatesFilters: MarketTemplatesFilters;
  
  // 当前编辑的模板
  currentStockTemplate: StockTemplate | null;
  currentTraderTemplate: TraderTemplate | null;
  currentMarketTemplate: MarketTemplate | null;
  
  // 选中的模板（用于批量操作）
  selectedStockTemplates: string[];
  selectedTraderTemplates: string[];
  selectedMarketTemplates: string[];
  
  // 统计信息
  templateStats: TemplateStats | null;
  marketStatistics: MarketStatistics | null;
  
  // 错误状态
  error: string | null;
}

export const useTemplatesStore = defineStore('templates', {
  state: (): TemplatesState => ({
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
      search: ''
    },
    
    // 市场环境模板相关状态
    marketTemplates: [],
    marketTemplatesPagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    },
    marketTemplatesLoading: false,
    marketTemplatesFilters: {
      status: '',
      search: ''
    },
    
    // 当前编辑的模板
    currentStockTemplate: null,
    currentTraderTemplate: null,
    currentMarketTemplate: null,
    
    // 选中的模板（用于批量操作）
    selectedStockTemplates: [],
    selectedTraderTemplates: [],
    selectedMarketTemplates: [],
    
    // 统计信息
    templateStats: null,
    marketStatistics: null,
    
    // 错误状态
    error: null
  }),

  getters: {
    // 股票模板相关getters
    activeStockTemplates: (state) => {
      return state.stockTemplates.filter(template => template.status === 'active');
    },
    
    stockTemplatesByCategory: (state) => {
      const grouped: Record<string, typeof state.stockTemplates> = {};
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
    
    // 市场环境模板相关getters
    activeMarketTemplates: (state) => {
      return state.marketTemplates.filter(template => template.name); // 市场模板没有status字段，用name判断有效性
    },
    
    hasMarkets: (state) => {
      return state.marketTemplates.length > 0;
    },
    
    isMarketLoading: (state) => {
      return state.marketTemplatesLoading;
    },
    
    hasMarketError: (state) => {
      return !!state.error;
    },
    
    // 选择状态
    hasSelectedStockTemplates: (state) => {
      return state.selectedStockTemplates.length > 0;
    },
    
    hasSelectedTraderTemplates: (state) => {
      return state.selectedTraderTemplates.length > 0;
    },
    
    hasSelectedMarketTemplates: (state) => {
      return state.selectedMarketTemplates.length > 0;
    },
    
    // 统计信息
    totalTemplates: (state) => {
      return (state.templateStats?.stockTemplates?.total || 0) + 
             (state.templateStats?.traderTemplates?.total || 0) +
             (state.templateStats?.marketTemplates?.total || 0);
    }
  },

  actions: {
    // ==================== 股票模板操作 ====================
    
    /**
     * 获取股票模板列表
     */
    async fetchStockTemplates(params: Record<string, any> = {}): Promise<ApiResponse<StockTemplate[]>> {
      this.stockTemplatesLoading = true;
      this.error = null;
      
      try {
        const queryParams = {
          page: this.stockTemplatesPagination.page,
          limit: this.stockTemplatesPagination.limit,
          ...this.stockTemplatesFilters,
          ...params
        };
        
        const response: ApiResponse<StockTemplate[]> = await templateService.getStockTemplates(queryParams as any);
        
        // 确保 issuePrice 字段是数字类型
        const processedData: StockTemplate[] = (response.data || []).map((template: any) => ({
          ...template,
          issuePrice: typeof template.issuePrice === 'number' 
            ? template.issuePrice 
            : parseFloat(template.issuePrice || 0)
        }));
        
        this.stockTemplates = processedData;
        // 确保分页信息存在，如果不存在则保持当前分页状态
        if (response.pagination) {
          this.stockTemplatesPagination = response.pagination;
        }
        
        return response;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.stockTemplatesLoading = false;
      }
    },
    
    /**
     * 获取股票模板详情
     */
    async fetchStockTemplateById(id: string): Promise<StockTemplate> {
      try {
        const response: ApiResponse<StockTemplate> = await templateService.getStockTemplateById(id);
        this.currentStockTemplate = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 创建股票模板
     */
    async createStockTemplate(templateData: Partial<StockTemplate>): Promise<StockTemplate> {
      try {
        const response: ApiResponse<StockTemplate> = await templateService.createStockTemplate(templateData as any);
        
        // 添加到列表中
        this.stockTemplates.unshift(response.data);
        this.stockTemplatesPagination.total++;
        
        return response.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 更新股票模板
     */
    async updateStockTemplate(id: string, templateData: Partial<StockTemplate>): Promise<StockTemplate> {
      try {
        const response: ApiResponse<StockTemplate> = await templateService.updateStockTemplate(id, templateData as any);
        
        // 更新列表中的数据
        const index = this.stockTemplates.findIndex(t => t._id === id);
        if (index !== -1) {
          // 确保 issuePrice 是数字类型
          const updatedTemplate: StockTemplate = {
            ...response.data,
            issuePrice: typeof response.data.issuePrice === 'number' 
              ? response.data.issuePrice 
              : parseFloat(response.data.issuePrice || 0)
          };
          this.stockTemplates[index] = updatedTemplate;
        }
        
        // 更新当前模板
        if (this.currentStockTemplate && this.currentStockTemplate._id === id) {
          this.currentStockTemplate = response.data;
        }
        
        return response.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 删除股票模板
     */
    async deleteStockTemplate(id: string): Promise<boolean> {
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
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== AI交易员模板操作 ====================
    
    /**
     * 获取AI交易员模板列表
     */
    async fetchTraderTemplates(params: Record<string, any> = {}): Promise<ApiResponse<TraderTemplate[]>> {
      this.traderTemplatesLoading = true;
      this.error = null;
      
      try {
        const queryParams = {
          page: this.traderTemplatesPagination.page,
          limit: this.traderTemplatesPagination.limit,
          ...this.traderTemplatesFilters,
          ...params
        };
        
        const response: ApiResponse<TraderTemplate[]> = await templateService.getTraderTemplates(queryParams as any);
        
        this.traderTemplates = response.data || [];
        // 确保分页信息存在，如果不存在则保持当前分页状态
        if (response.pagination) {
          this.traderTemplatesPagination = response.pagination;
        }
        
        return response;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.traderTemplatesLoading = false;
      }
    },
    
    /**
     * 获取AI交易员模板详情
     */
    async fetchTraderTemplateById(id: string): Promise<TraderTemplate> {
      try {
        const response: ApiResponse<TraderTemplate> = await templateService.getTraderTemplateById(id);
        this.currentTraderTemplate = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 创建AI交易员模板
     */
    async createTraderTemplate(templateData: Partial<TraderTemplate>): Promise<TraderTemplate> {
      try {
        const response: ApiResponse<TraderTemplate> = await templateService.createTraderTemplate(templateData as any);
        
        // 添加到列表中
        this.traderTemplates.unshift(response.data);
        this.traderTemplatesPagination.total++;
        
        return response.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 更新AI交易员模板
     */
    async updateTraderTemplate(id: string, templateData: Partial<TraderTemplate>): Promise<TraderTemplate> {
      try {
        const response: ApiResponse<TraderTemplate> = await templateService.updateTraderTemplate(id, templateData as any);
        
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
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 删除AI交易员模板
     */
    async deleteTraderTemplate(id: string): Promise<boolean> {
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
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== 市场环境模板操作 ====================
    
    /**
     * 创建市场环境
     */
    async createMarketTemplate(config: CreateMarketEnvironmentRequest): Promise<ApiResponse<MarketTemplate>> {
      this.marketTemplatesLoading = true;
      this.error = null;
      
      try {
        const result = await templateService.createMarketEnvironment(config as any);
        
        if (result.success) {
          // 添加到列表开头
          this.marketTemplates.unshift(result.data);
          this.marketTemplatesPagination.total++;
          
          // 更新统计
          await this.fetchMarketStatistics();
        }

        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.marketTemplatesLoading = false;
      }
    },

    /**
     * 获取市场环境列表
     */
    async fetchMarketTemplates(params: Record<string, any> = {}): Promise<ApiResponse<MarketTemplate[]>> {
      this.marketTemplatesLoading = true;
      this.error = null;
      
      try {
        const queryParams = {
          page: this.marketTemplatesPagination.page,
          limit: this.marketTemplatesPagination.limit,
          ...this.marketTemplatesFilters,
          ...params
        };
        
        const result = await templateService.getMarketEnvironments(queryParams);
        
        if (result.success) {
          this.marketTemplates = result.data || [];
          if (result.pagination) {
            this.marketTemplatesPagination = result.pagination;
          }
        } else {
          console.warn('API返回失败状态:', result);
          this.marketTemplates = [];
        }

        return result;
      } catch (error: any) {
        console.error('获取市场环境列表失败:', error);
        this.error = error.message;
        this.marketTemplates = [];
        throw error;
      } finally {
        this.marketTemplatesLoading = false;
      }
    },

    /**
     * 获取市场环境详情
     */
    async fetchMarketTemplateById(id: string): Promise<MarketTemplate> {
      this.marketTemplatesLoading = true;
      this.error = null;
      
      try {
        const result = await templateService.getMarketEnvironmentById(id);
        
        if (result.success) {
          this.currentMarketTemplate = result.data;
        }

        return result.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.marketTemplatesLoading = false;
      }
    },

    /**
     * 更新市场环境
     */
    async updateMarketTemplate(id: string, updateData: Partial<MarketTemplate>): Promise<MarketTemplate> {
      this.marketTemplatesLoading = true;
      this.error = null;
      
      try {
        const result = await templateService.updateMarketEnvironment(id, updateData);
        
        if (result.success) {
          // 更新列表中的项目
          const index = this.marketTemplates.findIndex(market => market._id === id);
          if (index > -1) {
            this.marketTemplates[index] = result.data;
          }
          
          // 如果更新的是当前市场，也更新当前市场
          if (this.currentMarketTemplate?._id === id) {
            this.currentMarketTemplate = result.data;
          }
        }

        return result.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.marketTemplatesLoading = false;
      }
    },

    /**
     * 删除市场环境
     */
    async deleteMarketTemplate(id: string): Promise<boolean> {
      this.marketTemplatesLoading = true;
      this.error = null;
      
      try {
        const result = await templateService.deleteMarketEnvironment(id);
        
        if (result.success) {
          // 从列表中移除
          this.marketTemplates = this.marketTemplates.filter(market => market._id !== id);
          this.marketTemplatesPagination.total--;
          
          // 如果删除的是当前市场，清空当前市场
          if (this.currentMarketTemplate?._id === id) {
            this.currentMarketTemplate = null;
          }
          
          // 从选中列表中移除
          this.selectedMarketTemplates = this.selectedMarketTemplates.filter(selectedId => selectedId !== id);
          
          // 更新统计
          await this.fetchMarketStatistics();
        }

        return true;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.marketTemplatesLoading = false;
      }
    },

    /**
     * 导出市场环境
     */
    async exportMarketTemplate(id: string): Promise<ApiResponse<any>> {
      this.error = null;
      
      try {
        const result = await templateService.exportMarketEnvironment(id);
        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },

    /**
     * 验证市场环境
     */
    async validateMarketTemplate(id: string): Promise<ApiResponse<any>> {
      this.error = null;
      
      try {
        const result = await templateService.validateMarketEnvironment(id);
        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },

    /**
     * 验证导入数据
     */
    async validateImportData(importData: any): Promise<any> {
      this.error = null;
      
      try {
        const result = await templateService.validateImportData(importData);
        return result.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },

    /**
     * 获取市场统计
     */
    async fetchMarketStatistics(): Promise<MarketStatistics | undefined> {
      try {
        const result = await templateService.getMarketStatsSummary();
        
        if (result.success) {
          this.marketStatistics = result.data;
        }

        return result.data;
      } catch (error: any) {
        console.error('获取统计数据失败:', error);
        // 不抛出错误，统计数据获取失败不应影响主要功能
      }
    },

    /**
     * 获取市场趋势
     */
    async getMarketTrends(period: string = '30d'): Promise<ApiResponse<any>> {
      this.error = null;
      
      try {
        const result = await templateService.getMarketTrends(period);
        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },

    /**
     * 批量删除市场环境
     */
    async batchDeleteMarketTemplates(ids: string[]): Promise<ApiResponse<any>> {
      this.marketTemplatesLoading = true;
      this.error = null;
      
      try {
        const result = await templateService.batchDeleteMarketEnvironments(ids);
        
        if (result.success) {
          // 从列表中移除已删除的项目
          this.marketTemplates = this.marketTemplates.filter(
            market => !ids.includes(market._id)
          );
          
          // 如果当前市场被删除，清空当前市场
          if (this.currentMarketTemplate && ids.includes(this.currentMarketTemplate._id)) {
            this.currentMarketTemplate = null;
          }
          
          // 清空选中列表
          this.selectedMarketTemplates = [];
          
          // 更新统计
          await this.fetchMarketStatistics();
        }

        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.marketTemplatesLoading = false;
      }
    },

    /**
     * 搜索市场环境
     */
    async searchMarketTemplates(keyword: string, options: SearchOptions = {}): Promise<ApiResponse<MarketTemplate[]>> {
      this.marketTemplatesLoading = true;
      this.error = null;
      
      try {
        const result = await templateService.searchMarketEnvironments(keyword, options);
        
        if (result.success) {
          this.marketTemplates = result.data || [];
          if (result.pagination) {
            this.marketTemplatesPagination = result.pagination;
          }
        }

        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.marketTemplatesLoading = false;
      }
    },

    /**
     * 刷新市场环境列表
     */
    async refreshMarketTemplates(): Promise<void> {
      await this.fetchMarketTemplates({
        page: this.marketTemplatesPagination.page,
        limit: this.marketTemplatesPagination.limit
      });
    },
    
    // ==================== 批量操作 ====================
    
    /**
     * 批量删除模板
     */
    async batchDeleteTemplates(type: 'stock' | 'trader' | 'market'): Promise<{ deletedCount: number }> {
      try {
        let ids: string[];
        
        if (type === 'stock') {
          ids = this.selectedStockTemplates;
        } else if (type === 'trader') {
          ids = this.selectedTraderTemplates;
        } else {
          ids = this.selectedMarketTemplates;
        }
        
        if (ids.length === 0) {
          throw new Error('请选择要删除的模板');
        }
        
        let response: ApiResponse<{ deletedCount: number }>;
        
        if (type === 'market') {
          // 市场模板使用专门的批量删除方法
          const result = await this.batchDeleteMarketTemplates(ids);
          response = { data: { deletedCount: ids.length } };
        } else {
          response = await templateService.batchDeleteTemplates(type, ids);
        }
        
        // 更新本地状态
        if (type === 'stock') {
          this.stockTemplates = this.stockTemplates.filter(t => !ids.includes(t._id));
          this.stockTemplatesPagination.total -= response.data.deletedCount;
          this.selectedStockTemplates = [];
        } else if (type === 'trader') {
          this.traderTemplates = this.traderTemplates.filter(t => !ids.includes(t._id));
          this.traderTemplatesPagination.total -= response.data.deletedCount;
          this.selectedTraderTemplates = [];
        }
        
        return response.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    /**
     * 批量更新模板状态
     */
    async batchUpdateTemplateStatus(type: 'stock' | 'trader' | 'market', status: 'active' | 'inactive' | 'draft'): Promise<{ updatedCount: number }> {
      try {
        let ids: string[];
        
        if (type === 'stock') {
          ids = this.selectedStockTemplates;
        } else if (type === 'trader') {
          ids = this.selectedTraderTemplates;
        } else {
          ids = this.selectedMarketTemplates;
        }
        
        if (ids.length === 0) {
          throw new Error('请选择要更新的模板');
        }
        
        // 市场模板不支持状态更新（没有status字段）
        if (type === 'market') {
          throw new Error('市场模板不支持状态更新');
        }
        
        const response: ApiResponse<{ updatedCount: number }> = await templateService.batchUpdateTemplateStatus(type, ids, status as any);
        
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
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== 筛选和分页操作 ====================
    
    /**
     * 设置股票模板筛选条件
     */
    setStockTemplatesFilters(filters: Partial<StockTemplatesFilters>): void {
      this.stockTemplatesFilters = { ...this.stockTemplatesFilters, ...filters };
      this.stockTemplatesPagination.page = 1; // 重置到第一页
    },
    
    /**
     * 设置AI交易员模板筛选条件
     */
    setTraderTemplatesFilters(filters: Partial<TraderTemplatesFilters>): void {
      this.traderTemplatesFilters = { ...this.traderTemplatesFilters, ...filters };
      this.traderTemplatesPagination.page = 1; // 重置到第一页
    },
    
    /**
     * 设置市场环境模板筛选条件
     */
    setMarketTemplatesFilters(filters: Partial<MarketTemplatesFilters>): void {
      this.marketTemplatesFilters = { ...this.marketTemplatesFilters, ...filters };
      this.marketTemplatesPagination.page = 1; // 重置到第一页
    },
    
    /**
     * 设置股票模板分页
     */
    setStockTemplatesPagination(pagination: Partial<Pagination>): void {
      this.stockTemplatesPagination = { ...this.stockTemplatesPagination, ...pagination };
    },
    
    /**
     * 设置AI交易员模板分页
     */
    setTraderTemplatesPagination(pagination: Partial<Pagination>): void {
      this.traderTemplatesPagination = { ...this.traderTemplatesPagination, ...pagination };
    },
    
    /**
     * 设置市场环境模板分页
     */
    setMarketTemplatesPagination(pagination: Partial<Pagination>): void {
      this.marketTemplatesPagination = { ...this.marketTemplatesPagination, ...pagination };
    },
    
    // ==================== 选择操作 ====================
    
    /**
     * 切换股票模板选择状态
     */
    toggleStockTemplateSelection(id: string): void {
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
    toggleAllStockTemplatesSelection(): void {
      if (this.selectedStockTemplates.length === this.stockTemplates.length) {
        this.selectedStockTemplates = [];
      } else {
        this.selectedStockTemplates = this.stockTemplates.map(t => t._id);
      }
    },
    
    /**
     * 切换AI交易员模板选择状态
     */
    toggleTraderTemplateSelection(id: string): void {
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
    toggleAllTraderTemplatesSelection(): void {
      if (this.selectedTraderTemplates.length === this.traderTemplates.length) {
        this.selectedTraderTemplates = [];
      } else {
        this.selectedTraderTemplates = this.traderTemplates.map(t => t._id);
      }
    },
    
    /**
     * 切换市场环境模板选择状态
     */
    toggleMarketTemplateSelection(id: string): void {
      const index = this.selectedMarketTemplates.indexOf(id);
      if (index === -1) {
        this.selectedMarketTemplates.push(id);
      } else {
        this.selectedMarketTemplates.splice(index, 1);
      }
    },
    
    /**
     * 全选/取消全选市场环境模板
     */
    toggleAllMarketTemplatesSelection(): void {
      if (this.selectedMarketTemplates.length === this.marketTemplates.length) {
        this.selectedMarketTemplates = [];
      } else {
        this.selectedMarketTemplates = this.marketTemplates.map(t => t._id);
      }
    },
    
    // ==================== 统计信息 ====================
    
    /**
     * 获取模板统计信息
     */
    async fetchTemplateStats(): Promise<TemplateStats> {
      try {
        const response: ApiResponse<TemplateStats> = await templateService.getTemplateStats();
        this.templateStats = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },
    
    // ==================== 工具方法 ====================
    
    /**
     * 清除错误状态
     */
    clearError(): void {
      this.error = null;
    },
    
    /**
     * 重置股票模板状态
     */
    resetStockTemplatesState(): void {
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
    resetTraderTemplatesState(): void {
      this.traderTemplates = [];
      this.traderTemplatesPagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      };
      this.traderTemplatesFilters = {
        status: '',
        search: ''
      };
      this.selectedTraderTemplates = [];
      this.currentTraderTemplate = null;
    },
    
    /**
     * 重置市场环境模板状态
     */
    resetMarketTemplatesState(): void {
      this.marketTemplates = [];
      this.marketTemplatesPagination = {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      };
      this.marketTemplatesFilters = {
        status: '',
        search: ''
      };
      this.selectedMarketTemplates = [];
      this.currentMarketTemplate = null;
      this.marketStatistics = null;
    },
    
    /**
     * 重置所有状态
     */
    resetAllState(): void {
      this.resetStockTemplatesState();
      this.resetTraderTemplatesState();
      this.resetMarketTemplatesState();
      this.templateStats = null;
      this.error = null;
    }
  }
});