<template>
  <div class="market-instance-overview-tab">
    <!-- 交易所模拟时间显示 -->
    <el-card class="time-card" shadow="hover">
      <div class="time-content">
        <span class="time-icon">🕐</span>
        <div class="time-body">
          <div class="time-label">交易时间（交易所模拟）</div>
          <div class="time-value">{{ simulatedTimeDisplay }}</div>
        </div>
      </div>
    </el-card>

    <!-- 核心指标卡片区 -->
    <div class="stats-row">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <span class="stat-icon">👥</span>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.traderCount }}</div>
            <div class="stat-label">参与人数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <span class="stat-icon">💰</span>
          <div class="stat-body">
            <div class="stat-value">¥{{ formatCurrency(statistics.totalCapital) }}</div>
            <div class="stat-label">总资金体量</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <span class="stat-icon">📈</span>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.stockCount }}</div>
            <div class="stat-label">活跃股票</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <span class="stat-icon">📊</span>
          <div class="stat-body">
            <div class="stat-value">¥{{ formatCurrency(statistics.averageCapitalPerTrader) }}</div>
            <div class="stat-label">平均资金</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 基本信息卡片区 -->
    <el-card class="info-card" shadow="hover">
      <template #header>
        <span class="card-title">基本信息</span>
      </template>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">市场实例ID</span>
          <span class="info-value">{{ exchangeId }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ formatTime(createdAt) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">最后活跃</span>
          <span class="info-value">{{ formatTime(lastActiveAt) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">模板</span>
          <span class="info-value">{{ templateName }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { MarketInstanceService } from '@/services/marketInstanceApi';

const props = defineProps<{
  marketInstanceId: string;
  exchangeId: string;
  name: string;
  description?: string;
  createdAt: string | Date;
  lastActiveAt: string | Date;
  templateName: string;
  statistics: {
    traderCount: number;
    stockCount: number;
    totalCapital: number;
    averageCapitalPerTrader: number;
  };
}>();

const simulatedTime = ref<string | null>(null);
let timePollTimer: ReturnType<typeof setInterval> | null = null;

const simulatedTimeDisplay = computed(() => {
  if (!simulatedTime.value) return '--';
  const d = new Date(simulatedTime.value);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
});

async function fetchSimulatedTime() {
  try {
    const data = await MarketInstanceService.getTime(props.marketInstanceId);
    simulatedTime.value = data.simulatedTime;
  } catch (_) {
    simulatedTime.value = null;
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount);
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};

onMounted(() => {
  fetchSimulatedTime();
  timePollTimer = setInterval(fetchSimulatedTime, 1000);
});

onUnmounted(() => {
  if (timePollTimer) {
    clearInterval(timePollTimer);
    timePollTimer = null;
  }
});
</script>

<style scoped>
.market-instance-overview-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.time-card {
  border-radius: 8px;
}

.time-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf5ff;
  border-radius: 50%;
}

.time-body {
  flex: 1;
}

.time-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.time-value {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  font-variant-numeric: tabular-nums;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
}

.stat-body {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 4px;
}

.info-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  font-size: 15px;
  color: #2c3e50;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
