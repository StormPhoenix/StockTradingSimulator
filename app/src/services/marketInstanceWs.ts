/**
 * 市场实例 WebSocket 服务
 * 连接：ws://host/api/v1/market-instances/:id/ws
 * 消息：subscribe_kline / unsubscribe_kline；服务端推送 kline_update
 */

import type { MarketInstanceWsMessage } from '@/types/kline';

const WS_PATH_PREFIX = '/api/v1/market-instances';

function getWsBaseUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}`;
}

function buildWsUrl(marketInstanceId: string): string {
  return `${getWsBaseUrl()}${WS_PATH_PREFIX}/${encodeURIComponent(marketInstanceId)}/ws`;
}

type MessageHandler = (message: MarketInstanceWsMessage) => void;
type ErrorHandler = (error: Event) => void;

export class MarketInstanceWsService {
  private ws: WebSocket | null = null;
  private marketInstanceId: string | null = null;
  private subscriptions: Set<string> = new Set(); // key: `${symbol}:${granularity}`
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  isConnected(): boolean {
    return this.ws != null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(marketInstanceId: string): void {
    if (this.ws && this.marketInstanceId === marketInstanceId) {
      if (this.ws.readyState === WebSocket.OPEN) return;
      this.ws.close();
    }
    if (this.marketInstanceId !== marketInstanceId) {
      this.subscriptions.clear();
    }
    this.marketInstanceId = marketInstanceId;
    const url = buildWsUrl(marketInstanceId);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.subscriptions.forEach(subKey => {
        const [symbol, granularity] = subKey.split(':');
        if (symbol && granularity) this.sendSubscribe(symbol, granularity);
      });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as MarketInstanceWsMessage;
        this.messageHandlers.forEach(h => h(message));
      } catch (_) {
        // ignore invalid JSON
      }
    };

    this.ws.onerror = (error: Event) => {
      this.errorHandlers.forEach(h => h(error));
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.marketInstanceId && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect(this.marketInstanceId!);
        }, this.reconnectDelay);
      }
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.subscriptions.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.marketInstanceId = null;
  }

  private sendSubscribe(symbol: string, granularity: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'subscribe_kline', symbol, granularity }));
  }

  private sendUnsubscribe(symbol: string, granularity: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'unsubscribe_kline', symbol, granularity }));
  }

  subscribeKLine(symbol: string, granularity: string): void {
    const key = `${symbol}:${granularity}`;
    if (this.subscriptions.has(key)) return;
    this.subscriptions.add(key);
    this.sendSubscribe(symbol, granularity);
  }

  unsubscribeKLine(symbol: string, granularity: string): void {
    const key = `${symbol}:${granularity}`;
    if (!this.subscriptions.has(key)) return;
    this.subscriptions.delete(key);
    this.sendUnsubscribe(symbol, granularity);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }
}

export const marketInstanceWsService = new MarketInstanceWsService();
