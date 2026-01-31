<template>
  <div class="kline-chart-wrapper">
    <div
      ref="chartRef"
      class="kline-chart-container"
      :style="{ width: chartContentWidthPx + 'px' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { CandlestickChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { KLinePoint } from '@/types/kline';

echarts.use([
  CanvasRenderer,
  CandlestickChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
]);

const props = withDefaults(
  defineProps<{
    data: KLinePoint[];
    granularity?: string;
  }>(),
  { granularity: '1m' }
);

/** 单根 K 线/柱子占位宽度（barMaxWidth 30 + 间隙 2），使 K 线紧邻排布 */
const BAR_SLOT_PX = 32;

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: ReturnType<typeof echarts.init> | null = null;
let resizeObserver: ResizeObserver | null = null;

/** 图表内容区宽度：根数 × 单格宽度，K 线紧邻；根数多时由外层横向滚动查看 */
const chartContentWidthPx = computed(() =>
  Math.max(props.data.length * BAR_SLOT_PX, BAR_SLOT_PX)
);

function formatTimeLabel(ts: string | Date): string {
  const d = new Date(ts);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function toCandlestickData(data: KLinePoint[]): [number, number, number, number][] {
  return data.map((p) => [p.open, p.close, p.low, p.high]);
}

function toVolumeData(data: KLinePoint[]): number[] {
  return data.map((p) => p.volume);
}

/** 判定为「正在看最右侧」的 dataZoom end 阈值（>= 即视为跟尾） */
const DATA_ZOOM_AT_END_THRESHOLD = 98;

function getOption(stickToEnd: boolean = false) {
  const { data, granularity } = props;
  if (!data.length) {
    return { title: { text: '暂无数据', left: 'center' } };
  }
  const xAxisData = data.map((p) => formatTimeLabel(p.timestamp));
  const candlestickData = toCandlestickData(data);
  const volumeData = toVolumeData(data);

  const n = data.length;
  const defaultStart = Math.max(0, 100 - 6000 / Math.max(n, 1));
  const zoomStart = stickToEnd ? Math.max(0, 100 - 4000 / Math.max(n, 1)) : defaultStart;
  const zoomEnd = 100;

  return {
    animation: false,
    // 使用固定像素边距，避免容器很窄时 10% 导致 Y 轴价格标签被挤没；left 略大以在 Y 轴与 K 线柱之间留出间隙
    grid: [
      { left: 50, right: 20, top: '8%', height: '52%' },
      { left: 50, right: 20, top: '68%', height: '18%' },
    ],
    xAxis: [
      {
        type: 'category',
        data: xAxisData,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        axisLabel: { show: true },
        min: 'dataMin',
        max: 'dataMax',
      },
      {
        type: 'category',
        gridIndex: 1,
        data: xAxisData,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: 'dataMin',
        max: 'dataMax',
      },
    ],
    yAxis: [
      {
        scale: true,
        splitArea: { show: true },
        axisLabel: { formatter: (v: number) => v.toFixed(2) },
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: zoomStart,
        end: zoomEnd,
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        top: '92%',
        start: zoomStart,
        end: zoomEnd,
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        if (!params || !params.length) return '';
        const idx = params[0].dataIndex;
        const p = data[idx];
        if (!p) return '';
        const t = formatTimeLabel(p.timestamp);
        return [
          `<div>${t}</div>`,
          `开盘: ${p.open.toFixed(2)}  收盘: ${p.close.toFixed(2)}`,
          `最高: ${p.high.toFixed(2)}  最低: ${p.low.toFixed(2)}`,
          `成交量: ${p.volume}`,
        ].join('<br/>');
      },
    },
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: candlestickData,
        barMaxWidth: 30,
        itemStyle: {
          color: '#26a69a',
          color0: '#ef5350',
          borderColor: '#26a69a',
          borderColor0: '#ef5350',
        },
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumeData,
        barMaxWidth: 30,
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const p = data[params.dataIndex];
            return p && p.close >= p.open ? '#26a69a' : '#ef5350';
          },
        },
      },
    ],
  };
}

function isDataZoomAtEnd(): boolean {
  if (!chartInstance) return false;
  const opt = chartInstance.getOption();
  const dataZoom = opt?.dataZoom as Array<{ start?: number; end?: number }> | undefined;
  if (!Array.isArray(dataZoom) || dataZoom.length === 0) return false;
  const slider = dataZoom.find((d) => d.type === 'slider') ?? dataZoom[dataZoom.length - 1];
  const end = slider?.end;
  return typeof end === 'number' && end >= DATA_ZOOM_AT_END_THRESHOLD;
}

function updateChart() {
  if (!chartInstance) return;
  const stickToEnd = isDataZoomAtEnd();
  chartInstance.setOption(getOption(stickToEnd), { replaceMerge: ['series'] });
}

function initChart() {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  updateChart();
  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize();
  });
  resizeObserver.observe(chartRef.value);
}

function disposeChart() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstance?.dispose();
  chartInstance = null;
}

watch(
  () => props.data,
  () => {
    nextTick(() => {
      updateChart();
      chartInstance?.resize();
    });
  },
  { deep: true }
);

onMounted(() => {
  initChart();
});

onBeforeUnmount(() => {
  disposeChart();
});
</script>

<style scoped>
.kline-chart-wrapper {
  width: 100%;
  height: 360px;
  overflow-x: auto;
  overflow-y: hidden;
}

.kline-chart-container {
  height: 360px;
}
</style>
