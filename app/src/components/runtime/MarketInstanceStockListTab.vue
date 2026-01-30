<template>
  <div class="market-instance-stock-list-tab">
    <div class="section-header">
      <h4>股票列表 ({{ stocks.length }})</h4>
    </div>
    <el-table
      :data="sortedStocks"
      class="stocks-table"
      stripe
      default-sort="{ prop: 'dailyChangePercent', order: 'descending' }"
    >
      <el-table-column prop="symbol" label="代码" width="100" />
      <el-table-column prop="companyName" label="公司名称" min-width="140" />
      <el-table-column prop="category" label="行业" width="120" />
      <el-table-column prop="currentPrice" label="当前价格" width="120" align="right">
        <template #default="{ row }">
          ¥{{ row.currentPrice.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="issuePrice" label="发行价" width="120" align="right">
        <template #default="{ row }">
          ¥{{ row.issuePrice.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="当日涨幅" width="120" align="right" sortable :sort-method="sortByDailyChange">
        <template #default="{ row }">
          <span :class="dailyChangeClass(row)">
            {{ formatDailyChange(row) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="marketCap" label="市值" width="150" align="right">
        <template #default="{ row }">
          ¥{{ formatCurrency(row.marketCap) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewStock(row.symbol)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { StockInfo } from '@/types/environment';

const props = defineProps<{
  marketInstanceId: string;
  stocks: StockInfo[];
}>();

const router = useRouter();

/** 当日涨幅：优先用后端字段，否则用 (currentPrice - issuePrice) / issuePrice * 100 */
function getDailyChangePercent(row: StockInfo): number {
  if (row.dailyChangePercent != null) return row.dailyChangePercent;
  if (row.issuePrice === 0) return 0;
  return ((row.currentPrice - row.issuePrice) / row.issuePrice) * 100;
}

const sortedStocks = computed(() => {
  const list = [...props.stocks];
  list.sort((a, b) => getDailyChangePercent(b) - getDailyChangePercent(a));
  return list;
});

function sortByDailyChange(a: StockInfo, b: StockInfo) {
  return getDailyChangePercent(a) - getDailyChangePercent(b);
}

function formatDailyChange(row: StockInfo): string {
  const pct = getDailyChangePercent(row);
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function dailyChangeClass(row: StockInfo): string {
  const pct = getDailyChangePercent(row);
  if (pct > 0) return 'change-up';
  if (pct < 0) return 'change-down';
  return 'change-flat';
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount);
};

function handleViewStock(symbol: string) {
  router.push({
    path: `/market-instances/${props.marketInstanceId}/stocks/${symbol}`,
  });
}
</script>

<style scoped>
.market-instance-stock-list-tab {
  padding: 0;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.stocks-table {
  width: 100%;
}

.change-up {
  color: #27ae60;
  font-weight: 600;
}

.change-down {
  color: #e74c3c;
  font-weight: 600;
}

.change-flat {
  color: #7f8c8d;
}
</style>
