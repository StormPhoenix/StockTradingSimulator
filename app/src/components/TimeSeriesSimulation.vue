<template>
  <div class="time-series-simulation">
    <div class="header">
      <h1>时间序列模拟与数据可视化</h1>
      <p class="subtitle">模拟股票价格数据并绘制 K 线图</p>
    </div>

    <!-- 配置面板 -->
    <div class="config-panel">
      <el-form :model="config" label-width="120px" size="default">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="序列 ID">
              <el-input
                v-model="config.seriesId"
                placeholder="例如: STOCK-AAPL"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="config.baseTime"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="数据点数量">
              <el-input-number
                v-model="config.pointCount"
                :min="10"
                :max="10000"
                :step="10"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="时间间隔(秒)">
              <el-input-number
                v-model="config.intervalSeconds"
                :min="1"
                :max="3600"
                :step="1"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="初始价格">
              <el-input-number
                v-model="config.initialPrice"
                :min="1"
                :max="100000"
                :step="0.01"
                :precision="2"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="基础成交量">
              <el-input-number
                v-model="config.baseVolume"
                :min="1"
                :max="1000000"
                :step="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格波动率">
              <el-slider
                v-model="config.priceVolatility"
                :min="0.001"
                :max="0.1"
                :step="0.001"
                :format="(value: number) => (value * 100).toFixed(1) + '%'"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="成交量波动率">
              <el-slider
                v-model="config.volumeVolatility"
                :min="0.1"
                :max="2"
                :step="0.1"
                :format="(value: number) => (value * 100).toFixed(0) + '%'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleGenerateAndAdd" :loading="loading">
            生成并添加数据
          </el-button>
          <el-button @click="handleGenerateOnly">
            仅生成预览
          </el-button>
          <el-button @click="handleQuery" :disabled="!config.seriesId">
            查询数据
          </el-button>
          <el-button @click="handleClear" :disabled="!config.seriesId">
            清除数据
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 状态信息 -->
    <div class="status-panel">
      <el-alert
        v-if="statusMessage"
        :title="statusMessage.title"
        :type="statusMessage.type"
        :closable="true"
        @close="statusMessage = null"
      >
        <p>{{ statusMessage.content }}</p>
      </el-alert>
    </div>

    <!-- 图表区域 -->
    <div class="chart-panel" v-if="aggregatedData.length > 0">
      <div class="chart-header">
        <h2>数据可视化</h2>
        <div class="chart-controls">
          <el-select v-model="selectedGranularity" placeholder="选择粒度" @change="handleGranularityChange">
            <el-option label="1 分钟" value="MIN_1" />
            <el-option label="5 分钟" value="MIN_5" />
            <el-option label="15 分钟" value="MIN_15" />
            <el-option label="30 分钟" value="MIN_30" />
          </el-select>
        </div>
      </div>

      <!-- 简单的 SVG 图表 -->
      <div class="chart-container">
        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          :width="chartWidth"
          :height="chartHeight"
          class="k-line-chart"
        >
          <!-- 网格线 -->
          <g class="grid">
            <line
              v-for="(tick, index) in yTicks"
              :key="'grid-y-' + index"
              :x1="0"
              :y1="tick.y"
              :x2="chartWidth - 60"
              :y2="tick.y"
              stroke="#e0e0e0"
              stroke-width="1"
            />
            <line
              v-for="(tick, index) in xTicks"
              :key="'grid-x-' + index"
              :x1="tick.x"
              :y1="0"
              :x2="tick.x"
              :y2="chartHeight - 30"
              stroke="#e0e0e0"
              stroke-width="1"
            />
          </g>

          <!-- 坐标轴 -->
          <line
            :x1="0"
            :y1="chartHeight - 30"
            :x2="chartWidth - 60"
            :y2="chartHeight - 30"
            stroke="#999"
            stroke-width="2"
          />
          <line
            :x1="0"
            :y1="0"
            :x2="0"
            :y2="chartHeight - 30"
            stroke="#999"
            stroke-width="2"
          />

          <!-- Y 轴标签 -->
          <g class="y-labels">
            <text
              v-for="(tick, index) in yTicks"
              :key="'label-y-' + index"
              :x="chartWidth - 55"
              :y="tick.y + 4"
              font-size="10"
              fill="#666"
            >
              {{ tick.value.toFixed(2) }}
            </text>
          </g>

          <!-- X 轴标签 -->
          <g class="x-labels">
            <text
              v-for="(tick, index) in xTicks"
              :key="'label-x-' + index"
              :x="tick.x - 20"
              :y="chartHeight - 10"
              font-size="10"
              fill="#666"
            >
              {{ tick.label }}
            </text>
          </g>

          <!-- K 线 -->
          <g class="k-lines">
            <g v-for="(point, index) in aggregatedData" :key="'k-' + index">
              <!-- 影线 (从最高价到最低价的垂直线) -->
              <line
                :x1="getX(index)"
                :y1="getY(point.high)"
                :x2="getX(index)"
                :y2="getY(point.low)"
                :stroke="isUp(point) ? '#f56c6c' : '#67c23a'"
                :stroke-width="1"
              />

              <!-- 实体 (开盘价和收盘价之间的矩形) -->
              <rect
                :x="getX(index) - barWidth / 2 + 1"
                :y="getY(Math.max(point.open, point.close))"
                :width="barWidth - 2"
                :height="Math.abs(getY(point.open) - getY(point.close)) || 1"
                :fill="isUp(point) ? '#f56c6c' : '#67c23a'"
              />
            </g>
          </g>

          <!-- 成交量柱状图 -->
          <g class="volume-bars">
            <rect
              v-for="(point, index) in aggregatedData"
              :key="'volume-' + index"
              :x="getX(index) - barWidth / 2"
              :y="chartHeight - 20 - (point.volume / maxVolume) * 20"
              :width="barWidth"
              :height="(point.volume / maxVolume) * 20"
              :fill="isUp(point) ? 'rgba(245, 108, 108, 0.5)' : 'rgba(103, 194, 58, 0.5)'"
            />
          </g>
        </svg>

        <!-- 图例 -->
        <div class="legend">
          <span class="legend-item">
            <span class="legend-box up"></span>
            <span>上涨 (收盘价 > 开盘价)</span>
          </span>
          <span class="legend-item">
            <span class="legend-box down"></span>
            <span>下跌 (收盘价 < 开盘价)</span>
          </span>
          <span class="legend-item">
            <span class="legend-box volume"></span>
            <span>成交量</span>
          </span>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="data-table">
        <h3>聚合数据 ({{ aggregatedData.length }} 条)</h3>
        <el-table :data="aggregatedData" stripe style="width: 100%">
          <el-table-column prop="startTime" label="开始时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="endTime" label="结束时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="open" label="开盘价" width="100" />
          <el-table-column prop="high" label="最高价" width="100" />
          <el-table-column prop="low" label="最低价" width="100" />
          <el-table-column prop="close" label="收盘价" width="100">
            <template #default="{ row }">
              <span :class="{ 'up': row.close > row.open, 'down': row.close < row.open }">
                {{ row.close.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="volume" label="成交量" width="100" />
          <el-table-column prop="vwap" label="VWAP" width="100">
            <template #default="{ row }">
              {{ row.vwap ? row.vwap.toFixed(2) : 'N/A' }}
            </template>
          </el-table-column>
          <el-table-column prop="dataPointCount" label="数据点数" width="100" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { apiConfig } from '../config/api';

// 创建 API 实例
const api = axios.create({
  baseURL: apiConfig.baseURL + '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface AggregatedPoint {
  seriesId: string;
  granularity: string;
  startTime: Date;
  endTime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  dataPointCount: number;
}

interface StatusMessage {
  title: string;
  content: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

// 配置
const config = ref({
  seriesId: 'STOCK-SIM-001',
  baseTime: new Date(),
  pointCount: 100,
  intervalSeconds: 60,
  initialPrice: 100,
  baseVolume: 1000,
  priceVolatility: 0.01,
  volumeVolatility: 0.5,
});

// 状态
const loading = ref(false);
const selectedGranularity = ref('MIN_1');
const aggregatedData = ref<AggregatedPoint[]>([]);
const statusMessage = ref<StatusMessage | null>(null);

// 图表配置
const chartWidth = computed(() => Math.max(800, window.innerWidth * 0.9));
const chartHeight = ref(400);
const barWidth = ref(10);

// 计算属性
const maxVolume = computed(() => {
  return Math.max(...aggregatedData.value.map((p) => p.volume), 1);
});

const minPrice = computed(() => {
  return Math.min(...aggregatedData.value.map((p) => p.low));
});

const maxPrice = computed(() => {
  return Math.max(...aggregatedData.value.map((p) => p.high));
});

const priceRange = computed(() => maxPrice.value - minPrice.value);
const chartHeightWithoutPadding = computed(() => chartHeight.value - 30);

// Y 轴刻度
const yTicks = computed(() => {
  const ticks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const value = minPrice.value + (priceRange.value * i) / tickCount;
    const y =
      chartHeightWithoutPadding.value -
      ((value - minPrice.value) / priceRange.value) * chartHeightWithoutPadding.value;
    ticks.push({ value, y });
  }
  return ticks;
});

// X 轴刻度
const xTicks = computed(() => {
  const ticks = [];
  const tickCount = 6;
  const step = Math.max(1, Math.floor(aggregatedData.value.length / tickCount));
  for (let i = 0; i < aggregatedData.value.length; i += step) {
    const x = (i / (aggregatedData.value.length - 1)) * (chartWidth.value - 60);
    const dataPoint = aggregatedData.value[i];
    if (dataPoint) {
      const label = formatTime(dataPoint.startTime);
      ticks.push({ x, label });
    }
  }
  return ticks;
});

// 辅助方法
const formatTime = (date: Date): string => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getX = (index: number): number => {
  return (index / (aggregatedData.value.length - 1)) * (chartWidth.value - 60);
};

const getY = (price: number): number => {
  return (
    chartHeightWithoutPadding.value -
    ((price - minPrice.value) / priceRange.value) * chartHeightWithoutPadding.value
  );
};

const isUp = (point: AggregatedPoint): boolean => {
  return point.close >= point.open;
};

// API 方法
const handleGenerateAndAdd = async () => {
  try {
    loading.value = true;
    statusMessage.value = null;

    // 先清除旧数据，避免时间顺序冲突
    try {
      await api.delete(`/time-series/aggregated/${config.value.seriesId}`);
      console.log('已清除旧数据');
    } catch (clearError) {
      // 如果序列不存在，忽略清除错误
      console.log('清除旧数据时出错（可能序列不存在）:', clearError);
    }

    // 创建序列
    await api.post('/time-series/series', {
      seriesId: config.value.seriesId,
      name: `模拟股票 ${config.value.seriesId}`,
      dataType: 'CONTINUOUS',
      granularityLevels: ['MIN_1', 'MIN_5', 'MIN_15', 'MIN_30'],
      metrics: ['OPEN', 'HIGH', 'LOW', 'CLOSE', 'VOLUME', 'VWAP'],
    });

    // 生成并添加数据
    await api.post('/time-series/simulate-and-add', {
      seriesId: config.value.seriesId,
      baseTime: config.value.baseTime,
      pointCount: config.value.pointCount,
      intervalSeconds: config.value.intervalSeconds,
      initialPrice: config.value.initialPrice,
      baseVolume: config.value.baseVolume,
      priceVolatility: config.value.priceVolatility,
      volumeVolatility: config.value.volumeVolatility,
    });

    statusMessage.value = {
      title: '成功',
      content: `已清除旧数据并生成 ${config.value.pointCount} 个新数据点`,
      type: 'success',
    };

    // 清空前端显示的数据
    aggregatedData.value = [];

    // 自动查询数据
    await handleQuery();
  } catch (error) {
    console.error('Error generating and adding data:', error);
    statusMessage.value = {
      title: '错误',
      content: `生成数据失败: ${error}`,
      type: 'error',
    };
  } finally {
    loading.value = false;
  }
};

const handleGenerateOnly = async () => {
  try {
    loading.value = true;
    statusMessage.value = null;

    const response = await api.post('/time-series/simulate', {
        seriesId: config.value.seriesId,
        baseTime: config.value.baseTime,
        pointCount: config.value.pointCount,
        intervalSeconds: config.value.intervalSeconds,
        initialPrice: config.value.initialPrice,
        baseVolume: config.value.baseVolume,
        priceVolatility: config.value.priceVolatility,
        volumeVolatility: config.value.volumeVolatility,
      }
    );

    statusMessage.value = {
      title: '成功',
      content: `已生成 ${config.value.pointCount} 个数据点（预览模式）`,
      type: 'info',
    };
  } catch (error) {
    console.error('Error generating data:', error);
    statusMessage.value = {
      title: '错误',
      content: `生成数据失败: ${error}`,
      type: 'error',
    };
  } finally {
    loading.value = false;
  }
};

const handleQuery = async () => {
  if (!config.value.seriesId) {
    statusMessage.value = {
      title: '警告',
      content: '请输入序列 ID',
      type: 'warning',
    };
    return;
  }

  try {
    loading.value = true;
    statusMessage.value = null;

    const response = await api.get('/time-series/aggregated',
      {
        params: {
          seriesId: config.value.seriesId,
          granularity: selectedGranularity.value,
          startTime: config.value.baseTime,
          endTime: new Date(
            config.value.baseTime.getTime() +
              config.value.pointCount * config.value.intervalSeconds * 1000 +
              3600000
          ),
        },
      }
    );

    aggregatedData.value = response.data.data;

    statusMessage.value = {
      title: '成功',
      content: `查询到 ${aggregatedData.value.length} 条聚合数据`,
      type: 'success',
    };
  } catch (error) {
    console.error('Error querying data:', error);
    statusMessage.value = {
      title: '错误',
      content: `查询数据失败: ${error}`,
      type: 'error',
    };
  } finally {
    loading.value = false;
  }
};

const handleClear = async () => {
  try {
    loading.value = true;
    statusMessage.value = null;

    await api.delete(`/time-series/aggregated/${config.value.seriesId}`);

    aggregatedData.value = [];

    statusMessage.value = {
      title: '成功',
      content: `已清除序列 ${config.value.seriesId} 的聚合数据`,
      type: 'success',
    };
  } catch (error) {
    console.error('Error clearing data:', error);
    statusMessage.value = {
      title: '错误',
      content: `清除数据失败: ${error}`,
      type: 'error',
    };
  } finally {
    loading.value = false;
  }
};

const handleGranularityChange = async () => {
  if (aggregatedData.value.length > 0) {
    await handleQuery();
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 设置默认时间为当前时间
  config.value.baseTime = new Date();
});
</script>

<style scoped>
.time-series-simulation {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.config-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.status-panel {
  margin-bottom: 20px;
}

.chart-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h2 {
  font-size: 20px;
  color: #2c3e50;
  margin: 0;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-container {
  margin-bottom: 30px;
}

.k-line-chart {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.grid line {
  stroke-dasharray: 4, 4;
}

.k-lines line {
  transition: all 0.3s ease;
}

.k-lines rect {
  transition: all 0.3s ease;
}

.k-lines rect:hover {
  opacity: 0.8;
  cursor: pointer;
}

.volume-bars rect {
  transition: all 0.3s ease;
}

.volume-bars rect:hover {
  fill-opacity: 0.7;
}

.legend {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  font-size: 12px;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  display: inline-block;
  vertical-align: middle;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.legend-box.up {
  background: #f56c6c;
}

.legend-box.down {
  background: #67c23a;
}

.legend-box.volume {
  background: rgba(100, 100, 100, 0.5);
}

.data-table {
  margin-top: 30px;
}

.data-table h3 {
  font-size: 16px;
  color: #2c3e50;
  margin: 0 0 15px 0;
}

.up {
  color: #f56c6c;
  font-weight: 600;
}

.down {
  color: #67c23a;
  font-weight: 600;
}

.down {
  color: #ef4444;
  font-weight: 600;
}
</style>
