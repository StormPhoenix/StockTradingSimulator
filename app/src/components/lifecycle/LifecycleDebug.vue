<template>
  <div class="lifecycle-debug">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>生命周期管理调试</h1>
        <p class="header-description">
          实时监控和控制游戏对象生命周期管理系统
        </p>
      </div>
      <div class="header-actions">
        <button 
          @click="refreshAll" 
          :disabled="refreshing"
          class="btn btn-primary"
        >
          <span class="btn-icon">🔄</span>
          {{ refreshing ? '刷新中...' : '全部刷新' }}
        </button>
        <button 
          @click="toggleAutoRefresh"
          class="btn btn-secondary"
          :class="{ 'active': globalAutoRefresh }"
        >
          <span class="btn-icon">{{ globalAutoRefresh ? '⏸️' : '▶️' }}</span>
          {{ globalAutoRefresh ? '停止自动刷新' : '开启自动刷新' }}
        </button>
      </div>
    </div>

    <!-- 连接状态指示器 -->
    <div class="connection-status" :class="connectionStatusClass">
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="status-text">{{ connectionStatusText }}</span>
      </div>
      <div class="last-update" v-if="lastUpdateTime">
        最后更新: {{ formatTime(lastUpdateTime) }}
      </div>
    </div>

    <!-- 全局错误信息 -->
    <div v-if="globalError" class="global-error">
      <div class="error-content">
        <strong>系统错误:</strong> {{ globalError }}
        <button @click="globalError = null" class="close-btn">&times;</button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧面板 - 系统控制和性能监控 -->
      <div class="left-panel">
        <!-- 系统控制 -->
        <div class="panel-section">
          <ObjectControl 
            ref="objectControlRef"
            @error="handleComponentError"
            @success="handleComponentSuccess"
          />
        </div>

        <!-- 性能监控 -->
        <div class="panel-section">
          <PerformanceStats 
            ref="performanceStatsRef"
            @error="handleComponentError"
          />
        </div>
      </div>

      <!-- 右侧面板 - 对象统计 -->
      <div class="right-panel">
        <div class="panel-section full-height">
          <ObjectStats 
            ref="objectStatsRef"
            @error="handleComponentError"
          />
        </div>
      </div>
    </div>

    <!-- 底部统计信息 -->
    <div class="footer-stats" v-if="systemStats">
      <div class="stats-container">
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">总对象:</span>
          <span class="stat-value">{{ systemStats.totalObjects }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⚡</span>
          <span class="stat-label">活跃对象:</span>
          <span class="stat-value">{{ systemStats.activeObjects }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📊</span>
          <span class="stat-label">实际FPS:</span>
          <span class="stat-value">{{ systemStats.actualFPS }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🔧</span>
          <span class="stat-label">系统状态:</span>
          <span class="stat-value" :class="{ 'running': systemStats.isRunning }">
            {{ systemStats.isRunning ? '运行中' : '已停止' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 快捷键提示 -->
    <div class="keyboard-shortcuts" v-if="showShortcuts">
      <div class="shortcuts-content">
        <h4>快捷键</h4>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>R</kbd> <span>刷新所有数据</span>
          </div>
          <div class="shortcut-item">
            <kbd>Space</kbd> <span>启动/停止循环</span>
          </div>
          <div class="shortcut-item">
            <kbd>A</kbd> <span>切换自动刷新</span>
          </div>
          <div class="shortcut-item">
            <kbd>?</kbd> <span>显示/隐藏快捷键</span>
          </div>
        </div>
        <button @click="showShortcuts = false" class="close-shortcuts">×</button>
      </div>
    </div>

    <!-- 快捷键触发按钮 -->
    <button 
      @click="showShortcuts = !showShortcuts"
      class="shortcuts-toggle"
      title="快捷键帮助"
    >
      ?
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import ObjectControl from './ObjectControl.vue';
import PerformanceStats from './PerformanceStats.vue';
import ObjectStats from './ObjectStats.vue';
import { lifecycleApi } from '../../services/lifecycleApi';

// 组件引用
const objectControlRef = ref<InstanceType<typeof ObjectControl>>();
const performanceStatsRef = ref<InstanceType<typeof PerformanceStats>>();
const objectStatsRef = ref<InstanceType<typeof ObjectStats>>();

// 响应式数据
const refreshing = ref(false);
const globalAutoRefresh = ref(true);
const globalError = ref<string | null>(null);
const connectionStatus = ref<'connected' | 'disconnected' | 'checking'>('checking');
const lastUpdateTime = ref<Date | null>(null);
const showShortcuts = ref(false);
const systemStats = ref<{
  totalObjects: number;
  activeObjects: number;
  actualFPS: string;
  isRunning: boolean;
} | null>(null);

// 自动刷新定时器
let autoRefreshInterval: NodeJS.Timeout | null = null;
let connectionCheckInterval: NodeJS.Timeout | null = null;

// 计算属性
const connectionStatusClass = computed(() => ({
  'connected': connectionStatus.value === 'connected',
  'disconnected': connectionStatus.value === 'disconnected',
  'checking': connectionStatus.value === 'checking'
}));

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'API 连接正常';
    case 'disconnected': return 'API 连接断开';
    case 'checking': return '检查连接中...';
    default: return '未知状态';
  }
});

// 方法
const refreshAll = async () => {
  if (refreshing.value) return;
  
  refreshing.value = true;
  globalError.value = null;
  
  try {
    // 并行刷新所有组件
    const promises = [];
    
    if (objectControlRef.value?.refreshStatus) {
      promises.push(objectControlRef.value.refreshStatus());
    }
    
    if (performanceStatsRef.value?.refreshStats) {
      promises.push(performanceStatsRef.value.refreshStats());
    }
    
    if (objectStatsRef.value?.refreshStats) {
      promises.push(objectStatsRef.value.refreshStats());
    }
    
    await Promise.allSettled(promises);
    
    // 更新系统统计
    await updateSystemStats();
    
    lastUpdateTime.value = new Date();
  } catch (error) {
    globalError.value = error instanceof Error ? error.message : '刷新失败';
    console.error('Failed to refresh all components:', error);
  } finally {
    refreshing.value = false;
  }
};

const updateSystemStats = async () => {
  try {
    const [loopStatus, performanceStats, objectStats] = await Promise.all([
      lifecycleApi.getLoopStatus(),
      lifecycleApi.getPerformanceStats(),
      lifecycleApi.getObjectStats()
    ]);
    
    systemStats.value = {
      totalObjects: objectStats.total,
      activeObjects: objectStats.byState.active + objectStats.byState.ready,
      actualFPS: performanceStats.fps.toFixed(1),
      isRunning: loopStatus.isRunning
    };
  } catch (error) {
    console.error('Failed to update system stats:', error);
  }
};

const toggleAutoRefresh = () => {
  globalAutoRefresh.value = !globalAutoRefresh.value;
  
  if (globalAutoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const startAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  autoRefreshInterval = setInterval(() => {
    if (!refreshing.value) {
      refreshAll();
    }
  }, 2000);
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
};

const checkConnection = async () => {
  try {
    connectionStatus.value = 'checking';
    const isConnected = await lifecycleApi.checkConnection();
    connectionStatus.value = isConnected ? 'connected' : 'disconnected';
  } catch (error) {
    connectionStatus.value = 'disconnected';
    console.error('Connection check failed:', error);
  }
};

const startConnectionCheck = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  connectionCheckInterval = setInterval(checkConnection, 5000);
};

const stopConnectionCheck = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

const handleComponentError = (error: string) => {
  globalError.value = error;
  connectionStatus.value = 'disconnected';
};

const handleComponentSuccess = (message: string) => {
  // 可以在这里处理成功消息，比如显示通知
  console.log('Component success:', message);
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 键盘快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // 忽略在输入框中的按键
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }
  
  switch (event.key.toLowerCase()) {
    case 'r':
      event.preventDefault();
      refreshAll();
      break;
    case ' ':
      event.preventDefault();
      // 切换循环状态
      if (systemStats.value?.isRunning) {
        objectControlRef.value?.stopLoop();
      } else {
        objectControlRef.value?.startLoop();
      }
      break;
    case 'a':
      event.preventDefault();
      toggleAutoRefresh();
      break;
    case '?':
      event.preventDefault();
      showShortcuts.value = !showShortcuts.value;
      break;
  }
};

// 生命周期钩子
onMounted(async () => {
  // 初始化
  await checkConnection();
  await refreshAll();
  
  // 启动定时器
  if (globalAutoRefresh.value) {
    startAutoRefresh();
  }
  startConnectionCheck();
  
  // 绑定键盘事件
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  stopAutoRefresh();
  stopConnectionCheck();
  document.removeEventListener('keydown', handleKeydown);
});

// 页面标题
document.title = '生命周期管理调试 - StockTradeSimulator';
</script>

<style scoped>
.lifecycle-debug {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 28px;
}

.header-description {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  margin-bottom: 20px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.connection-status.connected {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.connection-status.disconnected {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.connection-status.checking {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.connection-status.connected .status-dot {
  animation: pulse 2s infinite;
}

.last-update {
  font-size: 12px;
  opacity: 0.8;
}

.global-error {
  margin-bottom: 20px;
}

.error-content {
  padding: 12px 20px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  position: relative;
}

.close-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.panel-section.full-height {
  flex: 1;
}

.footer-stats {
  background: white;
  border-radius: 8px;
  padding: 15px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.stat-icon {
  font-size: 16px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.stat-value.running {
  color: #28a745;
}

.keyboard-shortcuts {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 300px;
}

.shortcuts-content {
  padding: 20px;
  position: relative;
}

.shortcuts-content h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortcut-item kbd {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 12px;
  font-family: monospace;
  min-width: 24px;
  text-align: center;
}

.close-shortcuts {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.shortcuts-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 999;
}

.shortcuts-toggle:hover {
  background: #0056b3;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-secondary.active {
  background: #28a745;
}

.btn-icon {
  font-size: 16px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .stats-container {
    flex-wrap: wrap;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .lifecycle-debug {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .connection-status {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .stats-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stat-item {
    justify-content: center;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
}
</style>