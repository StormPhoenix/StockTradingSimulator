<template>
  <div class="performance-stats">
    <div class="stats-header">
      <h3>性能监控</h3>
      <div class="header-actions">
        <button 
          @click="refreshStats" 
          :disabled="loading"
          class="btn btn-secondary"
        >
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
        <div class="auto-refresh">
          <label>
            <input 
              type="checkbox" 
              v-model="autoRefresh"
              @change="toggleAutoRefresh"
            />
            自动刷新 (1秒)
          </label>
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      <strong>错误:</strong> {{ error }}
      <button @click="error = null" class="close-btn">&times;</button>
    </div>

    <!-- 性能指标卡片 -->
    <div class="stats-grid" v-if="performanceStats">
      <!-- FPS 监控 -->
      <div class="stat-card fps-card">
        <div class="stat-header">
          <h4>帧率 (FPS)</h4>
          <div class="stat-icon">📊</div>
        </div>
        <div class="stat-content">
          <div class="primary-value">
            <span class="value">{{ performanceStats.fps.toFixed(1) }}</span>
            <span class="unit">FPS</span>
          </div>
          <div class="secondary-info">
            <span>目标: {{ performanceStats.targetFPS }} FPS</span>
            <div class="fps-bar">
              <div 
                class="fps-fill" 
                :style="{ width: `${Math.min(100, (performanceStats.fps / performanceStats.targetFPS) * 100)}%` }"
                :class="getFPSStatus()"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 对象数量 -->
      <div class="stat-card objects-card">
        <div class="stat-header">
          <h4>对象数量</h4>
          <div class="stat-icon">🎯</div>
        </div>
        <div class="stat-content">
          <div class="primary-value">
            <span class="value">{{ performanceStats.objectCount }}</span>
            <span class="unit">个</span>
          </div>
          <div class="secondary-info">
            <span :class="getObjectCountStatus()">
              {{ getObjectCountLabel() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tick 耗时 -->
      <div class="stat-card tick-card">
        <div class="stat-header">
          <h4>Tick 耗时</h4>
          <div class="stat-icon">⏱️</div>
        </div>
        <div class="stat-content">
          <div class="primary-value">
            <span class="value">{{ performanceStats.tickDuration.toFixed(2) }}</span>
            <span class="unit">ms</span>
          </div>
          <div class="secondary-info">
            <span>目标: {{ (1000 / performanceStats.targetFPS).toFixed(2) }}ms</span>
            <div class="tick-bar">
              <div 
                class="tick-fill" 
                :style="{ width: `${Math.min(100, (performanceStats.tickDuration / (1000 / performanceStats.targetFPS)) * 100)}%` }"
                :class="getTickStatus()"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 内存使用 -->
      <div class="stat-card memory-card">
        <div class="stat-header">
          <h4>内存使用</h4>
          <div class="stat-icon">💾</div>
        </div>
        <div class="stat-content">
          <div class="primary-value">
            <span class="value">{{ formatBytes(performanceStats.memoryUsage.heapUsed) }}</span>
            <span class="unit">MB</span>
          </div>
          <div class="secondary-info">
            <div class="memory-breakdown">
              <div class="memory-item">
                <span>堆总计: {{ formatBytes(performanceStats.memoryUsage.heapTotal) }}MB</span>
              </div>
              <div class="memory-item">
                <span>RSS: {{ formatBytes(performanceStats.memoryUsage.rss) }}MB</span>
              </div>
            </div>
            <div class="memory-bar">
              <div 
                class="memory-fill" 
                :style="{ width: `${(performanceStats.memoryUsage.heapUsed / performanceStats.memoryUsage.heapTotal) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细内存信息 -->
    <div class="memory-details" v-if="performanceStats">
      <h4>详细内存信息</h4>
      <div class="memory-grid">
        <div class="memory-detail-item">
          <span class="label">常驻内存 (RSS):</span>
          <span class="value">{{ formatBytes(performanceStats.memoryUsage.rss) }} MB</span>
        </div>
        <div class="memory-detail-item">
          <span class="label">堆内存总计:</span>
          <span class="value">{{ formatBytes(performanceStats.memoryUsage.heapTotal) }} MB</span>
        </div>
        <div class="memory-detail-item">
          <span class="label">已用堆内存:</span>
          <span class="value">{{ formatBytes(performanceStats.memoryUsage.heapUsed) }} MB</span>
        </div>
        <div class="memory-detail-item">
          <span class="label">外部内存:</span>
          <span class="value">{{ formatBytes(performanceStats.memoryUsage.external) }} MB</span>
        </div>
        <div class="memory-detail-item">
          <span class="label">ArrayBuffers:</span>
          <span class="value">{{ formatBytes(performanceStats.memoryUsage.arrayBuffers) }} MB</span>
        </div>
        <div class="memory-detail-item">
          <span class="label">堆使用率:</span>
          <span class="value">{{ ((performanceStats.memoryUsage.heapUsed / performanceStats.memoryUsage.heapTotal) * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- 历史趋势图 (简化版) -->
    <div class="trends-section" v-if="fpsHistory.length > 0">
      <h4>FPS 趋势 (最近 30 秒)</h4>
      <div class="trend-chart">
        <svg width="100%" height="100" viewBox="0 0 300 100">
          <polyline
            :points="getFPSChartPoints()"
            fill="none"
            stroke="#007bff"
            stroke-width="2"
          />
          <!-- 目标 FPS 线 -->
          <line
            x1="0"
            :y1="100 - ((performanceStats?.targetFPS || 0) / maxFPS * 80)"
            x2="300"
            :y2="100 - ((performanceStats?.targetFPS || 0) / maxFPS * 80)"
            stroke="#28a745"
            stroke-width="1"
            stroke-dasharray="5,5"
          />
        </svg>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-color" style="background: #007bff;"></span>
            实际 FPS
          </span>
          <span class="legend-item">
            <span class="legend-color" style="background: #28a745;"></span>
            目标 FPS
          </span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !performanceStats" class="loading-state">
      <p>加载性能数据中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { lifecycleApi } from '../../services/lifecycleApi';
import type { PerformanceStats } from '@shared';

// 响应式数据
const performanceStats = ref<PerformanceStats | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const autoRefresh = ref(true);
const fpsHistory = ref<number[]>([]);
const maxHistoryLength = 30; // 保存30个数据点

// 自动刷新定时器
let refreshInterval: NodeJS.Timeout | null = null;

// 计算属性
const maxFPS = computed(() => {
  if (!performanceStats.value) return 60;
  return Math.max(performanceStats.value.targetFPS, Math.max(...fpsHistory.value, performanceStats.value.fps));
});

// 方法
const loadStats = async () => {
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const stats = await lifecycleApi.getPerformanceStats();
    performanceStats.value = stats;
    
    // 更新 FPS 历史
    fpsHistory.value.push(stats.fps);
    if (fpsHistory.value.length > maxHistoryLength) {
      fpsHistory.value.shift();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载性能数据失败';
    console.error('Failed to load performance stats:', err);
  } finally {
    loading.value = false;
  }
};

const refreshStats = () => {
  loadStats();
};

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const startAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(loadStats, 1000);
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const formatBytes = (bytes: number): string => {
  return (bytes / 1024 / 1024).toFixed(1);
};

const getFPSStatus = (): string => {
  if (!performanceStats.value) return '';
  const ratio = performanceStats.value.fps / performanceStats.value.targetFPS;
  if (ratio >= 0.95) return 'good';
  if (ratio >= 0.8) return 'warning';
  return 'poor';
};

const getTickStatus = (): string => {
  if (!performanceStats.value) return '';
  const targetTime = 1000 / performanceStats.value.targetFPS;
  const ratio = performanceStats.value.tickDuration / targetTime;
  if (ratio <= 0.7) return 'good';
  if (ratio <= 0.9) return 'warning';
  return 'poor';
};

const getObjectCountStatus = (): string => {
  if (!performanceStats.value) return '';
  const count = performanceStats.value.objectCount;
  if (count <= 100) return 'good';
  if (count <= 500) return 'warning';
  return 'high';
};

const getObjectCountLabel = (): string => {
  if (!performanceStats.value) return '';
  const count = performanceStats.value.objectCount;
  if (count <= 100) return '正常';
  if (count <= 500) return '较多';
  return '很多';
};

const getFPSChartPoints = (): string => {
  if (fpsHistory.value.length === 0) return '';
  
  const points = fpsHistory.value.map((fps, index) => {
    const x = (index / (maxHistoryLength - 1)) * 300;
    const y = 100 - (fps / maxFPS.value * 80);
    return `${x},${y}`;
  });
  
  return points.join(' ');
};

// 生命周期钩子
onMounted(() => {
  loadStats();
  if (autoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 暴露给模板的方法
defineExpose({
  refreshStats,
  loadStats
});
</script>

<style scoped>
.performance-stats {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-header h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.auto-refresh label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #666;
}

.error-message {
  padding: 10px 15px;
  margin-bottom: 15px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  position: relative;
}

.close-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #007bff;
}

.fps-card { border-left-color: #007bff; }
.objects-card { border-left-color: #28a745; }
.tick-card { border-left-color: #ffc107; }
.memory-card { border-left-color: #dc3545; }

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.stat-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.stat-icon {
  font-size: 20px;
}

.primary-value {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 10px;
}

.primary-value .value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.primary-value .unit {
  font-size: 14px;
  color: #666;
}

.secondary-info {
  font-size: 14px;
  color: #666;
}

.fps-bar, .tick-bar, .memory-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  margin-top: 5px;
  overflow: hidden;
}

.fps-fill, .tick-fill, .memory-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.fps-fill.good, .tick-fill.good { background: #28a745; }
.fps-fill.warning, .tick-fill.warning { background: #ffc107; }
.fps-fill.poor, .tick-fill.poor { background: #dc3545; }
.memory-fill { background: #17a2b8; }

.good { color: #28a745; }
.warning { color: #ffc107; }
.high { color: #dc3545; }

.memory-breakdown {
  margin-bottom: 5px;
}

.memory-item {
  font-size: 12px;
  color: #666;
}

.memory-details {
  margin-bottom: 30px;
}

.memory-details h4 {
  margin-bottom: 15px;
  color: #333;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.memory-detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.memory-detail-item .label {
  color: #666;
  font-size: 14px;
}

.memory-detail-item .value {
  font-weight: bold;
  color: #333;
}

.trends-section {
  margin-bottom: 20px;
}

.trends-section h4 {
  margin-bottom: 15px;
  color: #333;
}

.trend-chart {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
}

.trend-chart svg {
  width: 100%;
  height: 100px;
  background: white;
  border-radius: 4px;
}

.chart-legend {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}
</style>