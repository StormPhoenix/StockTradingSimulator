<template>
  <div class="object-stats">
    <!-- 组件头部 -->
    <div class="stats-header">
      <div class="header-content">
        <h3>对象统计</h3>
        <p class="header-description">游戏对象生命周期统计信息</p>
      </div>
      <div class="header-actions">
        <button 
          @click="refreshStats" 
          :disabled="loading"
          class="btn btn-sm btn-primary"
        >
          <span class="btn-icon">🔄</span>
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !stats" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载统计数据中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      <div class="error-content">
        <strong>加载失败:</strong> {{ error }}
        <button @click="refreshStats" class="retry-btn">重试</button>
      </div>
    </div>

    <!-- 统计数据 -->
    <div v-if="stats && !loading" class="stats-content">
      <!-- 总体统计 -->
      <div class="stats-section">
        <h4>总体统计</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总对象数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.byState.active }}</div>
              <div class="stat-label">活跃对象</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏸️</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.byState.paused }}</div>
              <div class="stat-label">暂停对象</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔄</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.byState.ready }}</div>
              <div class="stat-label">准备对象</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 状态分布 -->
      <div class="stats-section">
        <h4>状态分布</h4>
        <div class="state-distribution">
          <div class="state-item" v-for="(count, state) in stats.byState" :key="state">
            <div class="state-info">
              <span class="state-name">{{ getStateDisplayName(state) }}</span>
              <span class="state-count">{{ count }}</span>
            </div>
            <div class="state-bar">
              <div 
                class="state-progress" 
                :class="`state-${state}`"
                :style="{ width: getStatePercentage(count) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 类型分布 -->
      <div class="stats-section" v-if="Object.keys(stats.byType).length > 0">
        <h4>类型分布</h4>
        <div class="type-distribution">
          <div class="type-item" v-for="(count, type) in stats.byType" :key="type">
            <div class="type-info">
              <span class="type-name">{{ type }}</span>
              <span class="type-count">{{ count }}</span>
            </div>
            <div class="type-bar">
              <div 
                class="type-progress"
                :style="{ width: getTypePercentage(count) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误统计 -->
      <div class="stats-section">
        <h4>错误统计</h4>
        <div class="error-stats">
          <div class="error-stat-item">
            <span class="error-icon">⚠️</span>
            <span class="error-label">有错误的对象:</span>
            <span class="error-value" :class="{ 'has-errors': stats.errorStats.objectsWithErrors > 0 }">
              {{ stats.errorStats.objectsWithErrors }}
            </span>
          </div>
          <div class="error-stat-item">
            <span class="error-icon">❌</span>
            <span class="error-label">总错误次数:</span>
            <span class="error-value" :class="{ 'has-errors': stats.errorStats.totalErrors > 0 }">
              {{ stats.errorStats.totalErrors }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最后更新时间 -->
    <div v-if="lastUpdateTime" class="last-update">
      最后更新: {{ formatTime(lastUpdateTime) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { GameObjectStatsResponse } from '@shared';
import { lifecycleApi } from '../../services/lifecycleApi';

// 响应式数据
const stats = ref<GameObjectStatsResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const lastUpdateTime = ref<Date | null>(null);

// 自动刷新
const autoRefresh = ref(true);
let autoRefreshInterval: NodeJS.Timeout | null = null;

// 事件定义
const emit = defineEmits<{
  error: [message: string];
}>();

// 计算属性
const maxStateCount = computed(() => {
  if (!stats.value) return 0;
  return Math.max(...Object.values(stats.value.byState));
});

const maxTypeCount = computed(() => {
  if (!stats.value) return 0;
  return Math.max(...Object.values(stats.value.byType));
});

// 方法
const refreshStats = async () => {
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const result = await lifecycleApi.getObjectStats();
    stats.value = result;
    lastUpdateTime.value = new Date();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取统计数据失败';
    error.value = errorMessage;
    emit('error', errorMessage);
  } finally {
    loading.value = false;
  }
};

const getStateDisplayName = (state: string): string => {
  const stateNames: Record<string, string> = {
    ready: '准备',
    active: '活跃',
    paused: '暂停',
    destroying: '销毁中',
    destroyed: '已销毁'
  };
  return stateNames[state] || state;
};

const getStatePercentage = (count: number): number => {
  if (maxStateCount.value === 0) return 0;
  return (count / maxStateCount.value) * 100;
};

const getTypePercentage = (count: number): number => {
  if (maxTypeCount.value === 0) return 0;
  return (count / maxTypeCount.value) * 100;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const startAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  autoRefreshInterval = setInterval(() => {
    if (!loading.value) {
      refreshStats();
    }
  }, 3000);
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
};

// 生命周期钩子
onMounted(() => {
  refreshStats();
  if (autoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 暴露给模板的方法
defineExpose({
  refreshStats
});
</script>

<style scoped>
.object-stats {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.header-content h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 20px;
}

.header-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.error-message {
  margin-bottom: 20px;
}

.error-content {
  padding: 12px 16px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.retry-btn:hover {
  background: #c82333;
}

.stats-content {
  flex: 1;
  overflow-y: auto;
}

.stats-section {
  margin-bottom: 25px;
}

.stats-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-icon {
  font-size: 24px;
  margin-right: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.state-distribution, .type-distribution {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.state-item, .type-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.state-info, .type-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.state-name, .type-name {
  color: #333;
  font-weight: 500;
}

.state-count, .type-count {
  color: #666;
  font-weight: bold;
}

.state-bar, .type-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.state-progress, .type-progress {
  height: 100%;
  transition: width 0.3s ease;
}

.state-ready { background: #17a2b8; }
.state-active { background: #28a745; }
.state-paused { background: #ffc107; }
.state-destroying { background: #fd7e14; }
.state-destroyed { background: #6c757d; }

.type-progress {
  background: #007bff;
}

.error-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.error-label {
  color: #666;
  flex: 1;
}

.error-value {
  font-weight: bold;
  color: #28a745;
}

.error-value.has-errors {
  color: #dc3545;
}

.last-update {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-icon {
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .stat-icon {
    font-size: 20px;
    margin-right: 10px;
  }
  
  .stat-value {
    font-size: 18px;
  }
}
</style>