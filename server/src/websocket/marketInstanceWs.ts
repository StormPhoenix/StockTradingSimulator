/**
 * 市场实例 WebSocket 服务
 * 路径：/api/v1/market-instances/:id/ws
 * 消息：subscribe_kline / unsubscribe_kline；服务端推送 kline_update
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import gameInstanceController from '../controllers/gameInstanceController';
import { isValidKLineGranularity } from '../utils/klineGranularity';

const WS_PATH_REGEX = /^\/api\/v1\/market-instances\/([^/]+)\/ws\/?$/;
const KLINE_PUSH_INTERVAL_MS = 3000;

interface Subscription {
  symbol: string;
  granularity: string;
}

interface UpgradeContext {
  marketInstanceId: string;
  userId: string;
}

interface ConnectionContext {
  marketInstanceId: string;
  userId: string;
  subscriptions: Set<string>; // key: `${symbol}:${granularity}`
}

function parseSubKey(key: string): Subscription | null {
  const i = key.lastIndexOf(':');
  if (i <= 0) return null;
  return { symbol: key.slice(0, i), granularity: key.slice(i + 1) };
}

function getRecentKLine(marketInstanceId: string, userId: string, symbol: string, granularity: string) {
  const exchange = gameInstanceController.getExchangeInstance(marketInstanceId, userId);
  if (!exchange) return null;
  const endTime = exchange.getSimulatedTime();
  const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 最近约 10 分钟
  return gameInstanceController.getKLineData(marketInstanceId, userId, symbol, {
    granularity,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    limit: 20
  });
}

function pushKLineUpdates(): void {
  (wss as any).clients?.forEach((ws: WebSocket) => {
    const ctx = (ws as any).__ctx as ConnectionContext | undefined;
    if (!ctx || ctx.subscriptions.size === 0) return;
    if (ws.readyState !== WebSocket.OPEN) return;

    ctx.subscriptions.forEach(subKey => {
      const sub = parseSubKey(subKey);
      if (!sub || !isValidKLineGranularity(sub.granularity)) return;
      const result = getRecentKLine(ctx.marketInstanceId, ctx.userId, sub.symbol, sub.granularity);
      if (!result || result.data.length === 0) return;
      try {
        ws.send(
          JSON.stringify({
            type: 'kline_update',
            timestamp: new Date().toISOString(),
            data: {
              symbol: sub.symbol,
              granularity: sub.granularity,
              data: result.data.map(p => ({
                ...p,
                timestamp: p.timestamp instanceof Date ? p.timestamp.toISOString() : p.timestamp
              }))
            }
          })
        );
      } catch (e) {
        console.warn('[WS] kline push error:', e);
      }
    });
  });
}

let pushTimer: ReturnType<typeof setInterval> | null = null;

export const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  const context = (request as IncomingMessage & { wsContext?: UpgradeContext }).wsContext;
  if (!context) {
    ws.close();
    return;
  }
  const ctx: ConnectionContext = {
    marketInstanceId: context.marketInstanceId,
    userId: context.userId,
    subscriptions: new Set()
  };
  (ws as any).__ctx = ctx;

  ws.on('message', (raw: Buffer | string) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type, symbol, granularity } = msg || {};
      const key = symbol && granularity ? `${symbol}:${granularity}` : '';
      if (type === 'subscribe_kline' && key && isValidKLineGranularity(granularity)) {
        ctx.subscriptions.add(key);
      } else if (type === 'unsubscribe_kline' && key) {
        ctx.subscriptions.delete(key);
      }
    } catch (_) {
      // ignore invalid JSON
    }
  });

  ws.on('close', () => {
    (ws as any).__ctx = null;
  });
});

export function setupMarketInstanceWebSocket(server: import('http').Server): void {
  server.on('upgrade', (request: IncomingMessage, socket: import('stream').Duplex, head: Buffer) => {
    const url = request.url || '';
    const { pathname, query } = parseUrl(url, true);
    const match = pathname?.match(WS_PATH_REGEX);
    if (!match) {
      socket.destroy();
      return;
    }
    const marketInstanceId = match[1];
    const userId = (query.userId as string) || 'default-user';
    (request as IncomingMessage & { wsContext?: UpgradeContext }).wsContext = {
      marketInstanceId,
      userId
    };

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  if (!pushTimer) {
    pushTimer = setInterval(pushKLineUpdates, KLINE_PUSH_INTERVAL_MS);
  }
}

export function stopMarketInstanceWebSocket(): void {
  if (pushTimer) {
    clearInterval(pushTimer);
    pushTimer = null;
  }
  wss.close();
}
