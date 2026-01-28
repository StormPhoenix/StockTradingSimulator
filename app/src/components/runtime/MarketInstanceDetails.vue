<template>
  <div class="market-instance-details">
    <div class="page-header">
      <div class="header-left">
        <el-button
          icon="ArrowLeft"
          @click="handleGoBack"
          class="back-button"
        >
          返回列表
        </el-button>
        <div class="title-section">
          <h1 class="page-title">{{ marketInstance?.name || '市场实例详情' }}</h1>
          <p class="page-description">{{ marketInstance?.description }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-tag
          v-if="marketInstance"
          :type="getStatusType(marketInstance.status)"
          size="large"
          class="status-tag"
        >
          {{ getStatusText(marketInstance.status) }}
        </el-tag>
        <div class="action-buttons">
          <el-button
            icon="Refresh"
            @click="handleRefresh"
            :loading="isRefreshing"
            title="刷新数据"
          >
            刷新
          </el-button>
          <el-button
            type="success"
            icon="Download"
            @click="handleExportMarketInstance"
            :loading="isExporting"
          >
            导出市场实例
          </el-button>
          <el-button
            type="danger"
            icon="Delete"
            @click="handleDeleteMarketInstance"
            :loading="isDeleting"
          >
            删除市场实例
          </el-button>
        </div>
      </div>
    </div>

    <div v-loading="state.isLoading" class="content-container">
      <div v-if="marketInstance" class="market-instance-content">
        <!-- 概览信息 -->
        <div class="overview-section">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <h3>基本信息</h3>
              </div>
            </template>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">市场实例ID</span>
                <span class="info-value">{{ marketInstance.exchangeId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatTime(marketInstance.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最后活跃</span>
                <span class="info-value">{{ formatTime(marketInstance.lastActiveAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">模板</span>
                <span class="info-value">{{ marketInstance.templateInfo.templateName }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="stats-card">
            <template #header>
              <div class="card-header">
                <h3>统计信息</h3>
              </div>
            </template>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                  <div class="stat-value">{{ marketInstance.statistics.traderCount }}</div>
                  <div class="stat-label">交易员</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                  <div class="stat-value">{{ marketInstance.statistics.stockCount }}</div>
                  <div class="stat-label">股票</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                  <div class="stat-value">¥{{ formatCurrency(marketInstance.statistics.totalCapital) }}</div>
                  <div class="stat-label">总资金</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                  <div class="stat-value">¥{{ formatCurrency(marketInstance.statistics.averageCapitalPerTrader) }}</div>
                  <div class="stat-label">平均资金</div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 详细信息标签页 -->
        <el-card class="details-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">详细信息</span>
              <div class="header-actions">
                <el-tag size="small" type="success" v-if="autoRefreshInterval">
                  <el-icon><Timer /></el-icon>
                  自动刷新
                </el-tag>
                <span class="last-update" v-if="marketInstance">
                  最后更新: {{ formatTime(new Date()) }}
                </span>
              </div>
            </div>
          </template>
          <el-tabs v-model="state.activeTab" class="details-tabs">
            <!-- 交易员标签页 -->
            <el-tab-pane label="交易员" name="traders">
              <div class="traders-section">
                <div class="section-header">
                  <h4>交易员列表 ({{ marketInstance.traders.length }})</h4>
                </div>
                <div class="traders-grid">
                  <div
                    v-for="trader in marketInstance.traders"
                    :key="trader.id"
                    class="trader-card"
                  >
                    <div class="trader-header">
                      <div class="trader-info">
                        <h5 class="trader-name">{{ trader.name }}</h5>
                        <div class="trader-tags">
                          <el-tag size="small" type="info">{{ getRiskProfileText(trader.riskProfile) }}</el-tag>
                        </div>
                      </div>
                      <div class="trader-status">
                        <el-tag :type="trader.isActive ? 'success' : 'info'" size="small">
                          {{ trader.isActive ? '活跃' : '非活跃' }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="trader-metrics">
                      <div class="metric-item">
                        <span class="metric-label">当前资金</span>
                        <span class="metric-value">¥{{ formatCurrency(trader.currentCapital) }}</span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">初始资金</span>
                        <span class="metric-value">¥{{ formatCurrency(trader.initialCapital) }}</span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">盈亏</span>
                        <span 
                          class="metric-value"
                          :class="trader.performanceMetrics.profitLoss >= 0 ? 'profit' : 'loss'"
                        >
                          ¥{{ formatCurrency(trader.performanceMetrics.profitLoss) }}
                        </span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">盈亏率</span>
                        <span 
                          class="metric-value"
                          :class="trader.performanceMetrics.profitLossPercentage >= 0 ? 'profit' : 'loss'"
                        >
                          {{ trader.performanceMetrics.profitLossPercentage.toFixed(2) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 股票标签页 -->
            <el-tab-pane label="股票" name="stocks">
              <div class="stocks-section">
                <div class="section-header">
                  <h4>股票列表 ({{ marketInstance.stocks.length }})</h4>
                </div>
                <el-table :data="marketInstance.stocks" class="stocks-table">
                  <el-table-column prop="symbol" label="代码" width="100" />
                  <el-table-column prop="companyName" label="公司名称" />
                  <el-table-column prop="category" label="行业" width="120" />
                  <el-table-column prop="currentPrice" label="当前价格" width="120">
                    <template #default="{ row }">
                      ¥{{ row.currentPrice.toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="issuePrice" label="发行价" width="120">
                    <template #default="{ row }">
                      ¥{{ row.issuePrice.toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalShares" label="总股本" width="120">
                    <template #default="{ row }">
                      {{ formatCurrency(row.totalShares) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="marketCap" label="市值" width="150">
                    <template #default="{ row }">
                      ¥{{ formatCurrency(row.marketCap) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="!state.isLoading" class="error-state">
        <el-result
          icon="warning"
          title="市场实例不存在"
          sub-title="请检查市场实例ID是否正确"
        >
          <template #extra>
            <el-button type="primary" @click="handleGoBack">
              返回列表
            </el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { 
  MarketInstanceDetails,
  MarketInstanceDetailsState,
  MarketInstanceStatus
} from '@/types/environment';
import { MarketInstanceService } from '@/services/marketInstanceApi';

const route = useRoute();
const router = useRouter();

// 响应式状态
const state = reactive<MarketInstanceDetailsState>({
  marketInstance: null,
  isLoading: false,
  activeTab: 'traders'
});

const isDeleting = ref(false);
const isExporting = ref(false);
const isRefreshing = ref(false);
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);
const marketInstance = computed(() => state.marketInstance);

// 方法
const loadMarketInstanceDetails = async (showLoading = true) => {
  try {
    if (showLoading) {
      state.isLoading = true;
    }
    const marketInstanceId = route.params.id as string;
    const response = await MarketInstanceService.getDetails(marketInstanceId);
    state.marketInstance = response;
  } catch (error) {
    console.error('Failed to load market instance details:', error);
    ElMessage.error('加载市场实例详情失败');
  } finally {
    if (showLoading) {
      state.isLoading = false;
    }
  }
};

// 手动刷新
const handleRefresh = async () => {
  try {
    isRefreshing.value = true;
    await loadMarketInstanceDetails(false);
    ElMessage.success('数据已刷新');
  } catch (error) {
    ElMessage.error('刷新失败');
  } finally {
    isRefreshing.value = false;
  }
};

// 启动自动刷新
const startAutoRefresh = () => {
  // 清除现有定时器
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
  }
  
  // 每30秒自动刷新一次
  autoRefreshInterval.value = setInterval(() => {
    loadMarketInstanceDetails(false);
  }, 30000);
};

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
};

const handleGoBack = () => {
  router.push('/market-instances');
};

const handleDeleteMarketInstance = async () => {
  if (!state.marketInstance) return;

  try {
    await ElMessageBox.confirm(
      '确定要删除这个市场实例吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    isDeleting.value = true;
    await MarketInstanceService.destroy(state.marketInstance.exchangeId);
    ElMessage.success('市场实例删除成功');
    router.push('/market-instances');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete market instance:', error);
      ElMessage.error('删除市场实例失败');
    }
  } finally {
    isDeleting.value = false;
  }
};

const handleExportMarketInstance = async () => {
  if (!state.marketInstance) return;

  try {
    isExporting.value = true;
    
    // 使用 marketInstanceApi 的下载功能
    await MarketInstanceService.download(state.marketInstance.exchangeId);
    
    ElMessage.success('市场实例导出成功');
  } catch (error) {
    console.error('Failed to export market instance:', error);
    ElMessage.error('导出市场实例失败');
  } finally {
    isExporting.value = false;
  }
};

// 工具函数
const getStatusType = (status: MarketInstanceStatus) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    creating: 'warning',
    stopped: 'info',
    error: 'danger'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: MarketInstanceStatus) => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    creating: '创建中',
    stopped: '已停止',
    error: '错误'
  };
  return statusMap[status] || status;
};

const getRiskProfileText = (profile: string) => {
  const profileMap: Record<string, string> = {
    conservative: '保守型',
    moderate: '稳健型',
    aggressive: '激进型'
  };
  return profileMap[profile] || profile;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount);
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};

// 生命周期
onMounted(() => {
  loadMarketInstanceDetails();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 监听路由参数变化
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadMarketInstanceDetails();
  }
});

// 监听标签页切换
watch(() => state.activeTab, () => {
  // 标签页切换逻辑，如有需要可在此添加
});
</script>

<style scoped>
.market-instance-details {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  flex-shrink: 0;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.status-tag {
  font-weight: 500;
}

.content-container {
  min-height: 400px;
}

.market-instance-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.info-card,
.stats-card,
.details-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-update {
  font-size: 12px;
  color: #7f8c8d;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 4px;
}

.details-tabs {
  margin-top: -16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.traders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.trader-card {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 16px;
}

.trader-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.trader-info {
  flex: 1;
}

.trader-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.trader-tags {
  display: flex;
  gap: 8px;
}

.trader-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #7f8c8d;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.metric-value.profit {
  color: #27ae60;
}

.metric-value.loss {
  color: #e74c3c;
}

.stocks-table {
  width: 100%;
}

.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-section {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .market-instance-details {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-right {
    justify-content: space-between;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .traders-grid {
    grid-template-columns: 1fr;
  }

  .trader-metrics {
    grid-template-columns: 1fr;
  }
}
</style>