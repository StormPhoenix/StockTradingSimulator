<template>
  <div class="market-instance-details">
    <div class="page-header">
      <div class="header-left">
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
        </div>
      </div>
    </div>

    <div v-loading="state.isLoading" class="content-container">
      <div v-if="marketInstance" class="market-instance-content">
        <!-- Tab：市场总览 | 股票列表 -->
        <el-card class="details-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">市场详情</span>
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
            <el-tab-pane label="市场总览" name="overview">
              <MarketInstanceOverviewTab
                :market-instance-id="marketInstance.exchangeId"
                :exchange-id="marketInstance.exchangeId"
                :name="marketInstance.name"
                :description="marketInstance.description"
                :created-at="marketInstance.createdAt"
                :last-active-at="marketInstance.lastActiveAt"
                :template-name="marketInstance.templateInfo.templateName"
                :statistics="marketInstance.statistics"
              />
            </el-tab-pane>
            <el-tab-pane label="股票列表" name="stocks">
              <MarketInstanceStockListTab
                :market-instance-id="marketInstance.exchangeId"
                :stocks="marketInstance.stocks"
              />
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
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { 
  MarketInstanceDetailsState,
  MarketInstanceStatus
} from '@/types/environment';
import { MarketInstanceService } from '@/services/marketInstanceApi';
import MarketInstanceOverviewTab from './MarketInstanceOverviewTab.vue';
import MarketInstanceStockListTab from './MarketInstanceStockListTab.vue';

const route = useRoute();

// 响应式状态
const state = reactive<MarketInstanceDetailsState>({
  marketInstance: null,
  isLoading: false,
  activeTab: 'overview'
});

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

.details-tabs {
  margin-top: -16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
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
}
</style>