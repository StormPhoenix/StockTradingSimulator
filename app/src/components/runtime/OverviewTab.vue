<template>
  <div class="overview-tab">
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
import { computed } from 'vue';

const props = defineProps<{
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount);
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};
</script>

<style scoped>
.overview-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
