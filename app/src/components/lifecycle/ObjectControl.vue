<template>
  <div class="object-control">
    <div class="control-header">
      <h3>系统控制</h3>
      <div class="status-indicator" :class="{ 'running': loopStatus?.isRunning }">
        <span class="status-dot"></span>
        <span class="status-text">
          {{ loopStatus?.isRunning ? '运行中' : '已停止' }}
        </span>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      <strong>错误:</strong> {{ error }}
      <button @click="error = null" class="close-btn">&times;</button>
    </div>

    <!-- 成功信息 -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
      <button @click="successMessage = null" class="close-btn">&times;</button>
    </div>

    <!-- 循环控制面板 -->
    <div class="control-panel">
      <div class="control-section">
        <h4>游戏循环控制</h4>
        
        <!-- 当前状态 -->
        <div class="current-status" v-if="loopStatus">
          <div class="status-grid">
            <div class="status-item">
              <span class="label">状态:</span>
              <span class="value" :class="{ 'running': loopStatus.isRunning }">
                {{ loopStatus.isRunning ? '运行中' : '已停止' }}
              </span>
            </div>
            <div class="status-item">
              <span class="label">目标FPS:</span>
              <span class="value">{{ loopStatus.fps }}</span>
            </div>
            <div class="status-item">
              <span class="label">运行时长:</span>
              <span class="value">{{ formatUptime(loopStatus.uptime) }}</span>
            </div>
            <div class="status-item">
              <span class="label">总Tick数:</span>
              <span class="value">{{ loopStatus.totalTicks.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- FPS 设置 -->
        <div class="fps-control">
          <label for="fps-input">设置FPS:</label>
          <div class="fps-input-group">
            <input
              id="fps-input"
              type="number"
              v-model.number="targetFPS"
              min="1"
              max="120"
              :disabled="actionLoading"
              class="fps-input"
            />
            <span class="fps-range">（1-120）</span>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="control-buttons">
          <button
            v-if="!loopStatus?.isRunning"
            @click="startLoop"
            :disabled="actionLoading"
            class="btn btn-success btn-lg"
          >
            <span class="btn-icon">▶️</span>
            {{ actionLoading ? '启动中...' : '启动循环' }}
          </button>
          
          <button
            v-if="loopStatus?.isRunning"
            @click="stopLoop"
            :disabled="actionLoading"
            class="btn btn-danger btn-lg"
          >
            <span class="btn-icon">⏹️</span>
            {{ actionLoading ? '停止中...' : '停止循环' }}
          </button>

          <button
            @click="refreshStatus"
            :disabled="actionLoading"
            class="btn btn-secondary"
          >
            <span class="btn-icon">🔄</span>
            刷新状态
          </button>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="control-section">
        <h4>快速操作</h4>
        
        <div class="quick-actions">
          <div class="action-group">
            <h5>预设FPS</h5>
            <div class="preset-buttons">
              <button
                v-for="fps in presetFPS"
                :key="fps"
                @click="setPresetFPS(fps)"
                :disabled="actionLoading"
                class="btn btn-outline"
                :class="{ 'active': targetFPS === fps }"
              >
                {{ fps }} FPS
              </button>
            </div>
          </div>

          <div class="action-group">
            <h5>系统操作</h5>
            <div class="system-buttons">
              <button
                @click="restartLoop"
                :disabled="actionLoading"
                class="btn btn-warning"
              >
                <span class="btn-icon">🔄</span>
                重启循环
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 监控信息 -->
      <div class="control-section">
        <h4>实时监控</h4>
        
        <div class="monitoring-info" v-if="loopStatus">
          <div class="monitor-item">
            <span class="monitor-label">平均FPS:</span>
            <span class="monitor-value">{{ averageFPS.toFixed(1) }}</span>
          </div>
          <div class="monitor-item">
            <span class="monitor-label">FPS稳定性:</span>
            <span class="monitor-value" :class="getFPSStabilityClass()">
              {{ getFPSStabilityText() }}
            </span>
          </div>
          <div class="monitor-item">
            <span class="monitor-label">Tick频率:</span>
            <span class="monitor-value">
              {{ loopStatus.totalTicks > 0 && loopStatus.uptime > 0 
                  ? (loopStatus.totalTicks / (loopStatus.uptime / 1000)).toFixed(1) 
                  : '0' }} /秒
            </span>
          </div>
        </div>

        <!-- 自动刷新控制 -->
        <div class="auto-refresh-control">
          <label>
            <input 
              type="checkbox" 
              v-model="autoRefresh"
              @change="toggleAutoRefresh"
            />
            自动刷新状态 (1秒)
          </label>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !loopStatus" class="loading-state">
      <p>加载系统状态中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { lifecycleApi } from '../../services/lifecycleApi';
import type { LoopStatus } from '@shared';

// 响应式数据
const loopStatus = ref<LoopStatus | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const autoRefresh = ref(true);
const targetFPS = ref(30);
const fpsHistory = ref<number[]>([]);
const presetFPS = [15, 30, 60, 120];

// 自动刷新定时器
let refreshInterval: NodeJS.Timeout | null = null;

// 计算属性
const averageFPS = computed(() => {
  if (fpsHistory.value.length === 0) return 0;
  const sum = fpsHistory.value.reduce((a, b) => a + b, 0);
  return sum / fpsHistory.value.length;
});

// 方法
const loadStatus = async () => {
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const status = await lifecycleApi.getLoopStatus();
    loopStatus.value = status;
    targetFPS.value = status.fps;
    
    // 更新FPS历史（用于计算平均值和稳定性）
    fpsHistory.value.push(status.fps);
    if (fpsHistory.value.length > 10) {
      fpsHistory.value.shift();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载系统状态失败';
    console.error('Failed to load loop status:', err);
  } finally {
    loading.value = false;
  }
};

const refreshStatus = () => {
  loadStatus();
};

const startLoop = async () => {
  actionLoading.value = true;
  error.value = null;
  
  try {
    await lifecycleApi.startLoop(targetFPS.value);
    successMessage.value = `游戏循环已启动，FPS: ${targetFPS.value}`;
    await loadStatus(); // 刷新状态
  } catch (err) {
    error.value = err instanceof Error ? err.message : '启动循环失败';
  } finally {
    actionLoading.value = false;
  }
};

const stopLoop = async () => {
  actionLoading.value = true;
  error.value = null;
  
  try {
    await lifecycleApi.stopLoop();
    successMessage.value = '游戏循环已停止';
    await loadStatus(); // 刷新状态
  } catch (err) {
    error.value = err instanceof Error ? err.message : '停止循环失败';
  } finally {
    actionLoading.value = false;
  }
};

const restartLoop = async () => {
  if (!confirm('确定要重启游戏循环吗？这将暂时中断所有对象的执行。')) {
    return;
  }
  
  actionLoading.value = true;
  error.value = null;
  
  try {
    // 如果正在运行，先停止
    if (loopStatus.value?.isRunning) {
      await lifecycleApi.stopLoop();
      // 等待一小段时间确保完全停止
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 重新启动
    await lifecycleApi.startLoop(targetFPS.value);
    successMessage.value = `游戏循环已重启，FPS: ${targetFPS.value}`;
    await loadStatus(); // 刷新状态
  } catch (err) {
    error.value = err instanceof Error ? err.message : '重启循环失败';
  } finally {
    actionLoading.value = false;
  }
};

const setPresetFPS = (fps: number) => {
  targetFPS.value = fps;
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
  refreshInterval = setInterval(loadStatus, 1000);
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const formatUptime = (uptime: number): string => {
  if (uptime < 1000) {
    return `${uptime}ms`;
  }
  
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

const getFPSStabilityClass = (): string => {
  if (fpsHistory.value.length < 3) return '';
  
  const variance = calculateVariance(fpsHistory.value);
  if (variance < 1) return 'stable';
  if (variance < 5) return 'moderate';
  return 'unstable';
};

const getFPSStabilityText = (): string => {
  if (fpsHistory.value.length < 3) return '计算中...';
  
  const variance = calculateVariance(fpsHistory.value);
  if (variance < 1) return '稳定';
  if (variance < 5) return '一般';
  return '不稳定';
};

const calculateVariance = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
};

// 生命周期钩子
onMounted(() => {
  loadStatus();
  if (autoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 清除消息的定时器
const clearMessages = () => {
  setTimeout(() => {
    successMessage.value = null;
  }, 3000);
};

// 监听成功消息变化
const watchSuccessMessage = () => {
  if (successMessage.value) {
    clearMessages();
  }
};

// 暴露给模板的方法
defineExpose({
  refreshStatus,
  loadStatus,
  startLoop,
  stopLoop
});
</script>

<style scoped>
.object-control {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.control-header h3 {
  margin: 0;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.status-indicator.running {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
}

.status-indicator.running .status-dot {
  background: #28a745;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.error-message, .success-message {
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 6px;
  position: relative;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
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

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.control-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.control-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.control-section h5 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

.current-status {
  margin-bottom: 20px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-item .label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.status-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.status-item .value.running {
  color: #28a745;
}

.fps-control {
  margin-bottom: 20px;
}

.fps-control label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.fps-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fps-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.fps-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.fps-range {
  font-size: 12px;
  color: #666;
}

.control-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-buttons, .system-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.monitoring-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.monitor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.monitor-item:last-child {
  border-bottom: none;
}

.monitor-label {
  font-size: 14px;
  color: #666;
}

.monitor-value {
  font-weight: bold;
  color: #333;
}

.monitor-value.stable { color: #28a745; }
.monitor-value.moderate { color: #ffc107; }
.monitor-value.unstable { color: #dc3545; }

.auto-refresh-control label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
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

.btn-lg {
  padding: 12px 24px;
  font-size: 16px;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-outline {
  background: white;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-outline.active {
  background: #007bff;
  color: white;
}

.btn-icon {
  font-size: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .control-panel {
    gap: 20px;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    gap: 15px;
  }
  
  .preset-buttons, .system-buttons {
    flex-direction: column;
  }
  
  .control-buttons {
    flex-direction: column;
  }
}
</style>