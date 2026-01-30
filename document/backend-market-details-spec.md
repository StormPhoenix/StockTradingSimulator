# 市场详情后端开发规范清单

本文档列出在继续开发市场详情相关后端（市场总览、成交量趋势、K 线、股票列表扩展、WebSocket）之前，需要**先规范**的内容，以便前后端与设计文档一致、实现可落地。

---

## 已敲定方案（2026-01-27）

| 项 | 决策 |
|----|------|
| **1. API 路由** | 使用**子路由挂载**：`router.use('/:environmentId', idRouter)`，在 `idRouter` 中定义 `overview`、`volume-trend`、`stocks/:symbol`、`stocks/:symbol/kline`、`/`、`/export`、`/logs`、`DELETE /`。 |
| **2. K 线粒度映射** | 建立字符串到枚举映射：`1m`→MIN_1，`5m`→MIN_5，…，`60m`→MIN_60，`1d`→DAY_1，`1w`→DAY_5，`1M`→DAY_20。实现见 `server/src/utils/klineGranularity.ts`。 |
| **3. K 线 OHLCV** | 数据来源：TimeSeriesManager 聚合结果；K 线点 `timestamp` 用窗口 **startTime**。 |
| **4. 时间语义** | **todayVolume**、成交量趋势以**游戏时间**（交易所实例模拟时间）为准；当日开盘由交易所时间模拟提供。 |
| **5. 成交量趋势** | 每个点的 **volume** 为该**时间窗口的增量**（非累计）；时间字段用**窗口 start**。 |
| **6. dailyChangePercent** | 在 **StockInstance** 中计算（`getDailyChangePercent()`），Controller / ExchangeInstance.getStockDetails() 仅负责获取并返回。 |

---

## 1. API 路由与顺序（已敲定：子路由挂载）

**决策**：使用子路由挂载。`gameInstanceRoutes` 中创建 `idRouter = Router({ mergeParams: true })`，在 `idRouter` 上注册：

- `GET /stocks/:symbol/kline`
- `GET /stocks/:symbol`
- `GET /overview`
- `GET /volume-trend`
- `GET /`（市场详情）
- `DELETE /`（销毁）
- `GET /export`
- `GET /logs`

主路由执行 `router.use('/:environmentId', idRouter)`。`/progress/:requestId`、`/_status` 保留在主路由上。

---

## 2. 时间语义：「当日」与时间范围（已敲定）

**决策**：**todayVolume**、成交量趋势以**游戏时间**（交易所实例模拟时间）为准；当日开盘由交易所时间模拟提供。实现 overview/volume-trend 时，默认 `startTime`/`endTime` 使用游戏时间的当日开盘与当前时间。

---

## 3. K 线粒度与后端 Granularity 映射（已敲定）

**决策**：建立字符串到枚举映射，实现于 `server/src/utils/klineGranularity.ts`：

- `1m`→MIN_1，`5m`→MIN_5，`15m`→MIN_15，`30m`→MIN_30，`60m`→MIN_60，`1d`→DAY_1；
- **`1w`→DAY_5**（约一周交易日），**`1M`→DAY_20**（约一月交易日）。

---

## 4. K 线数据来源与 OHLCV 组装（已敲定）

**决策**：K 线数据来源为 TimeSeriesManager 的 price + volume 聚合结果；每个 K 线点的 **timestamp** 使用窗口 **startTime**。OHLCV 与 `AggregatedPoint` 的 open/high/low/close/volume 一一对应；元数据从 StockInstance/市场实例上下文获取。

---

## 5. 成交量趋势的「累计」语义与格式（已敲定）

**决策**：每个点的 **volume** 为该**时间窗口的增量**（非从起点累计）；时间字段用**窗口 start**。返回数组按时间排序；interval 与 TimeSeriesManager 粒度对应（如 1 分钟对应 MIN_1）。

---

## 6. 股票列表扩展：dailyChangePercent（已敲定并实现）

**决策**：**dailyChangePercent** 在 **StockInstance** 中计算（`getDailyChangePercent()`），Controller 与 `ExchangeInstance.getStockDetails()` 仅负责获取并返回。已实现：`StockInstance.getDailyChangePercent()`、`getStockDetails()` 返回含 `dailyChangePercent`，Controller 透传。

---

## 7. 单只股票详情接口（可选）

**现状**：前端股票详情页通过 `GET /market-instances/:id` 取全量再按 symbol 筛。

**需规范**：

- 是否提供 `GET /market-instances/:id/stocks/:symbol`，仅返回单只股票信息（与当前 details 中单只股票结构一致），以减轻前端请求量并便于鉴权/审计。
- 若提供，需约定路径、响应结构（含 dailyChangePercent）及 404（市场不存在 vs 股票不存在）的 error.code。

**结论**：决定是否提供该接口；若提供，补充到 API 文档与路由规范。

---

## 8. WebSocket 协议细节

**设计文档**：连接 `ws://host/api/v1/market-instances/:id/ws`，消息类型 `subscribe_kline`、`unsubscribe_kline` 等。

**需规范**：

- **消息格式**：客户端与服务端 JSON 字段命名风格（下划线 vs 驼峰）；若前端已约定一种，后端保持一致。
- **心跳**：心跳间隔、服务端是否主动发 ping、客户端 pong 要求，以及超时断开时间。
- **错误**：连接失败、订阅失败（如 symbol 不存在）的 payload 结构（type、code、message）及是否关闭连接。
- **推送频率**：K 线增量推送间隔（如 3 秒）可配置，配置项所在文件与默认值需写明。
- **路由**：WebSocket 挂载在 Express 上的路径（如 `/api/v1/market-instances/:id/ws`）与现有 REST 路由不冲突；若使用同一 `app`，需明确 ws 是在同一 server 上 upgrade 还是单独端口。

**结论**：在 frontend-market-details-design 或单独 WebSocket 文档中，定稿消息类型、字段命名、心跳与错误格式、推送间隔与路由。

---

## 9. 错误码与 HTTP 状态

**涉及**：overview、volume-trend、kline、单只股票详情。

**需规范**：

- **市场实例不存在**：404，error.code 如 `MARKET_INSTANCE_NOT_FOUND`（与现有 `MARKET_INSTANCE_NOT_FOUND` 一致）。
- **股票不存在**（kline 或 stocks/:symbol）：404，error.code 如 `STOCK_NOT_FOUND`，message 可区分「市场存在但该 symbol 不存在」。
- **K 线无数据**：建议 200 + 空数组 `data: []`，而不是 404，以便前端统一按「无数据」处理；若采用 404，需在文档中说明。
- **参数错误**（如 granularity 非法）：400，error.code 如 `VALIDATION_ERROR`，与 document/api/README 一致。

**结论**：在 API 文档中为上述接口补充错误码表与推荐 HTTP 状态，并与现有 README 保持一致。

---

## 10. 共享类型与后端 DTO

**需规范**：

- **KLinePoint、KLineMetadata、KLineGranularity**：若前后端共用，应在 `shared/types` 中定义（或已有 kline 相关类型），后端在返回 K 线时使用相同结构；若仅在 document 中定义，建议在 shared 或 server 中落一份 TypeScript 类型，避免实现与文档不一致。
- **MarketOverview、VolumeTrendPoint** 等：若前端类型已定，后端 DTO 与之前端/设计文档一致（字段名、可选性、数值单位）。

**结论**：明确 K 线、总览、成交量趋势的「权威类型」所在文件（shared 或 server），后端 DTO 与其对齐。

---

## 11. 小结：规范优先级建议

| 优先级 | 内容 | 说明 |
|--------|------|------|
| P0 | 路由顺序 / 子路由挂载 | 否则新接口无法正确命中 |
| P0 | K 线粒度映射（含 1w/1M） | 否则 K 线接口无法实现 |
| P0 | K 线数据来源与 OHLCV 组装 | 否则实现方式不明确 |
| P1 | 「当日」与时间范围（游戏时间 vs 系统时间） | 影响 overview、volume-trend 语义 |
| P1 | 成交量趋势「累计」语义与时间字段 | 影响前端展示与一致性 |
| P1 | dailyChangePercent 计算位置与 DTO | 与前端已实现的列表/详情一致 |
| P2 | 单只股票详情接口是否提供 | 优化体验与架构 |
| P2 | WebSocket 消息/心跳/错误格式 | 便于前端对接与联调 |
| P2 | 错误码与 HTTP 状态 | 与现有 API 风格统一 |
| P2 | 共享类型与 DTO 对齐 | 减少前后端类型不一致 |

完成上述规范后，再按「市场总览 API → 成交量趋势 API → 股票列表 dailyChangePercent → K 线 API → WebSocket」的顺序实现，可减少返工。
