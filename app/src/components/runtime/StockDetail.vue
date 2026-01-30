<template>
  <div class="stock-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button icon="ArrowLeft" @click="handleGoBack" class="back-button">
          返回股票列表
        </el-button>
        <div class="title-section" v-if="stock">
          <h1 class="page-title">{{ stock.symbol }} {{ stock.companyName }}</h1>
          <p class="page-description">{{ stock.category }} · 当前价 ¥{{ stock.currentPrice.toFixed(2) }}</p>
        </div>
        <div class="title-section" v-else-if="state.isLoading">
          <h1 class="page-title">加载中...</h1>
        </div>
        <div class="title-section" v-else>
          <h1 class="page-title">股票不存在</h1>
        </div>
      </div>
    </div>

    <div v-loading="state.isLoading" class="content-container">
      <template v-if="stock">
        <!-- 股票基本信息卡片区 -->
        <div class="info-cards">
          <el-card class="info-card" shadow="hover">
            <div class="card-label">当前价格</div>
            <div class="card-value">¥{{ stock.currentPrice.toFixed(2) }}</div>
          </el-card>
          <el-card class="info-card" shadow="hover">
            <div class="card-label">发行价</div>
            <div class="card-value">¥{{ stock.issuePrice.toFixed(2) }}</div>
          </el-card>
          <el-card class="info-card" shadow="hover">
            <div class="card-label">当日涨幅</div>
            <div class="card-value" :class="dailyChangeClass">
              {{ formatDailyChange }}
            </div>
          </el-card>
          <el-card class="info-card" shadow="hover">
            <div class="card-label">市值</div>
            <div class="card-value">¥{{ formatCurrency(stock.marketCap) }}</div>
          </el-card>
          <el-card class="info-card" shadow="hover">
            <div class="card-label">总股本</div>
            <div class="card-value">{{ formatCurrency(stock.totalShares) }}</div>
          </el-card>
        </div>

        <!-- K线图表区（占位，待后端 K 线 API 接入） -->
        <el-card class="kline-card" shadow="hover">
          <template #header>
            <span class="card-title">K 线图</span>
            <el-tag size="small" type="info">开发中：待后端 K 线数据接口</el-tag>
          </template>
          <div class="kline-placeholder">
            <el-empty description="K 线数据接口接入后可在此展示图表" :image-size="80" />
          </div>
        </el-card>
      </template>

      <div v-else-if="!state.isLoading" class="error-state">
        <el-result icon="warning" title="未找到该股票" sub-title="请确认市场实例与股票代码是否正确">
          <template #extra>
            <el-button type="primary" @click="handleGoBack">返回股票列表</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { StockInfo } from '@/types/environment';
import { MarketInstanceService } from '@/services/marketInstanceApi';

const route = useRoute();
const router = useRouter();

const state = reactive<{
  stock: StockInfo | null;
  isLoading: boolean;
}>({
  stock: null,
  isLoading: false,
});

const marketInstanceId = computed(() => route.params.id as string);
const symbol = computed(() => route.params.symbol as string);

const stock = computed(() => state.stock);

/** 当日涨幅（百分比） */
const dailyChangePercent = computed(() => {
  const s = state.stock;
  if (!s) return 0;
  if (s.dailyChangePercent != null) return s.dailyChangePercent;
  if (s.issuePrice === 0) return 0;
  return ((s.currentPrice - s.issuePrice) / s.issuePrice) * 100;
});

const formatDailyChange = computed(() => {
  const pct = dailyChangePercent.value;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
});

const dailyChangeClass = computed(() => {
  const pct = dailyChangePercent.value;
  if (pct > 0) return 'change-up';
  if (pct < 0) return 'change-down';
  return 'change-flat';
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount);
};

async function loadStock() {
  if (!marketInstanceId.value || !symbol.value) return;
  try {
    state.isLoading = true;
    state.stock = null;
    const details = await MarketInstanceService.getDetails(marketInstanceId.value);
    const found = details.stocks?.find((s: StockInfo) => s.symbol === symbol.value) ?? null;
    state.stock = found ?? null;
    if (!found) {
      ElMessage.warning(`未找到股票 ${symbol.value}`);
    }
  } catch (error) {
    console.error('Failed to load stock:', error);
    ElMessage.error('加载股票信息失败');
  } finally {
    state.isLoading = false;
  }
}

function handleGoBack() {
  router.push({ path: `/market-instances/${marketInstanceId.value}` });
}

watch([marketInstanceId, symbol], () => {
  loadStock();
}, { immediate: false });

onMounted(() => {
  loadStock();
});
</script>

<style scoped>
.stock-detail {
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
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.content-container {
  min-height: 400px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
  border-radius: 8px;
}

.info-card .card-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.info-card .card-value {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.change-up {
  color: #27ae60;
}

.change-down {
  color: #e74c3c;
}

.change-flat {
  color: #7f8c8d;
}

.kline-card {
  border-radius: 8px;
}

.kline-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.kline-placeholder {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

@media (max-width: 768px) {
  .stock-detail {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .info-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
