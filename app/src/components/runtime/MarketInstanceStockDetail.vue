<template>
  <div class="market-instance-stock-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button icon="ArrowLeft" @click="handleGoBack" class="back-button">
          返回市场详情
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

        <!-- K线图表区：HTTP 全量 + WebSocket 增量 -->
        <el-card class="kline-card" shadow="hover">
          <template #header>
            <div class="kline-header">
              <span class="card-title">K 线图</span>
              <el-select
                v-model="granularity"
                size="small"
                class="granularity-select"
                @change="onGranularityChange"
              >
                <el-option label="1 分钟" value="1m" />
                <el-option label="5 分钟" value="5m" />
                <el-option label="15 分钟" value="15m" />
                <el-option label="30 分钟" value="30m" />
                <el-option label="60 分钟" value="60m" />
                <el-option label="日 K" value="1d" />
                <el-option label="周 K" value="1w" />
                <el-option label="月 K" value="1M" />
              </el-select>
            </div>
          </template>
          <div v-loading="klineState.loading" class="kline-body">
            <div v-if="klineState.error" class="kline-error">
              <el-alert type="error" :title="klineState.error" show-icon />
            </div>
            <div v-else-if="klineState.data.length === 0 && !klineState.loading" class="kline-placeholder">
              <el-empty description="暂无 K 线数据" :image-size="80" />
            </div>
            <div v-else class="kline-info">
              <p class="kline-count">共 {{ klineState.data.length }} 条 K 线（实时更新）</p>
              <div class="kline-placeholder-chart">
                <el-empty description="图表组件接入后可在此展示 ECharts K 线" :image-size="60" />
              </div>
            </div>
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
import { reactive, computed, watch, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { StockInfo } from '@/types/environment';
import type { KLinePoint, KLineMetadata } from '@/types/kline';
import { MarketInstanceService } from '@/services/marketInstanceApi';
import { marketInstanceWsService } from '@/services/marketInstanceWs';

const route = useRoute();
const router = useRouter();

const state = reactive<{
  stock: StockInfo | null;
  isLoading: boolean;
}>({
  stock: null,
  isLoading: false,
});

const klineState = reactive<{
  data: KLinePoint[];
  metadata: KLineMetadata | null;
  loading: boolean;
  error: string | null;
}>({
  data: [],
  metadata: null,
  loading: false,
  error: null
});

const granularity = ref<string>('1m');
const lastGranularity = ref<string>('1m');
const unsubMessage = ref<(() => void) | null>(null);
const unsubError = ref<(() => void) | null>(null);

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

/** 加载 K 线数据（HTTP 全量） */
async function loadKLineData() {
  if (!marketInstanceId.value || !symbol.value) return;
  try {
    klineState.loading = true;
    klineState.error = null;
    const result = await MarketInstanceService.getKLineData(marketInstanceId.value, symbol.value, {
      granularity: granularity.value,
      limit: 500
    });
    klineState.data = result.data ?? [];
    klineState.metadata = result.metadata ?? null;
  } catch (error) {
    console.error('Failed to load kline:', error);
    klineState.error = error instanceof Error ? error.message : '加载 K 线失败';
    klineState.data = [];
    klineState.metadata = null;
  } finally {
    klineState.loading = false;
  }
}

/** 合并 WebSocket 推送的 K 线增量到本地数据（按 timestamp 去重，追加或更新） */
function mergeKLineUpdate(payload: { symbol: string; granularity: string; data: KLinePoint[] }) {
  if (payload.symbol !== symbol.value || payload.granularity !== granularity.value) return;
  if (!payload.data?.length) return;
  const tsKey = (p: KLinePoint) => (typeof p.timestamp === 'string' ? p.timestamp : (p.timestamp as Date).toISOString());
  const existing = new Set(klineState.data.map(tsKey));
  const toAppend: KLinePoint[] = [];
  payload.data.forEach(p => {
    const key = tsKey(p);
    if (!existing.has(key)) {
      existing.add(key);
      toAppend.push(p);
    }
  });
  if (toAppend.length) {
    klineState.data = [...klineState.data, ...toAppend].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
}

function setupKLineWebSocket() {
  if (!marketInstanceId.value || !symbol.value) return;
  marketInstanceWsService.connect(marketInstanceId.value);
  marketInstanceWsService.subscribeKLine(symbol.value, granularity.value);
  unsubMessage.value = marketInstanceWsService.onMessage(msg => {
    if (msg.type === 'kline_update' && msg.data) mergeKLineUpdate(msg.data);
  });
  unsubError.value = marketInstanceWsService.onError(() => {
    ElMessage.warning('K 线实时连接异常，将使用已加载数据');
  });
}

function cleanupKLineWebSocket() {
  if (symbol.value) marketInstanceWsService.unsubscribeKLine(symbol.value, lastGranularity.value);
  unsubMessage.value?.();
  unsubMessage.value = null;
  unsubError.value?.();
  unsubError.value = null;
  marketInstanceWsService.disconnect();
}

function handleGoBack() {
  router.push({ name: 'GameplayDetails', params: { id: marketInstanceId.value } });
}

function onGranularityChange() {
  if (symbol.value) marketInstanceWsService.unsubscribeKLine(symbol.value, lastGranularity.value);
  lastGranularity.value = granularity.value;
  loadKLineData().then(() => {
    if (symbol.value) marketInstanceWsService.subscribeKLine(symbol.value, granularity.value);
  });
}

watch([marketInstanceId, symbol], () => {
  loadStock();
}, { immediate: false });

watch(symbol, (newSymbol, oldSymbol) => {
  if (!marketInstanceId.value) return;
  if (oldSymbol) marketInstanceWsService.unsubscribeKLine(oldSymbol, lastGranularity.value);
  loadKLineData();
  if (newSymbol) {
    if (!marketInstanceWsService.isConnected()) marketInstanceWsService.connect(marketInstanceId.value);
    marketInstanceWsService.subscribeKLine(newSymbol, granularity.value);
  }
}, { immediate: false });

onMounted(async () => {
  await loadStock();
  if (marketInstanceId.value && symbol.value) {
    await loadKLineData();
    setupKLineWebSocket();
  }
});

onBeforeUnmount(() => {
  cleanupKLineWebSocket();
});
</script>

<style scoped>
.market-instance-stock-detail {
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

.kline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kline-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.granularity-select {
  width: 120px;
}

.kline-body {
  min-height: 280px;
}

.kline-error {
  margin-bottom: 12px;
}

.kline-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kline-count {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.kline-placeholder,
.kline-placeholder-chart {
  min-height: 240px;
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
  .market-instance-stock-detail {
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
