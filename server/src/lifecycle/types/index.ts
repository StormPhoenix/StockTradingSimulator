/**
 * GameObject 生命周期管理器 - TypeScript 类型定义
 * 
 * 此文件定义了生命周期管理系统的所有 TypeScript 接口和类型
 * 仅用于后端，不与前端共享
 */

// ============================================================================
// 核心接口定义
// ============================================================================

/**
 * 游戏对象生命周期状态枚举
 */
export enum GameObjectState {
  READY = 'READY',           // 已创建，等待开始
  ACTIVE = 'ACTIVE',         // 活跃状态，参与 Tick
  PAUSED = 'PAUSED',         // 暂停状态，不参与 Tick
  DESTROYING = 'DESTROYING', // 销毁中，执行清理逻辑
  DESTROYED = 'DESTROYED'    // 已销毁，等待移除
}

/**
 * 游戏对象基础接口
 * 所有业务对象必须实现此接口
 */
export interface GameObject {
  /** 对象唯一标识符，由系统自动分配 */
  readonly id: number;
  
  /** 当前生命周期状态 */
  state: GameObjectState;
  
  /** 对象激活时调用，用于初始化逻辑 */
  onBeginPlay(): void;
  
  /** 每帧更新时调用，deltaTime 为时间间隔(秒) */
  onTick(deltaTime: number): void;
  
  /** 对象销毁时调用，用于清理逻辑 */
  onDestroy(): void;
}

/**
 * ID 生成器接口
 * 支持不同的 ID 生成策略
 */
export interface IIdGenerator {
  /** 生成唯一ID */
  generateId(): number;
}

// ============================================================================
// API 数据传输对象 (DTO)
// ============================================================================

/**
 * 标准 API 响应格式
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  
  /** 响应数据 */
  data: T;
  
  /** 响应消息 */
  message: string;
}

/**
 * 游戏对象信息 DTO
 */
export interface GameObjectInfo {
  /** 对象ID */
  id: number;
  
  /** 对象状态 */
  state: GameObjectState;
  
  /** 对象类型名称 */
  type: string;
  
  /** 累计错误次数 (可选) */
  errorCount?: number;
}

/**
 * 游戏对象列表响应 DTO
 */
export interface GameObjectListResponse {
  /** 总对象数量 */
  total: number;
  
  /** 按状态分组的对象计数 */
  byState: Record<GameObjectState, number>;
  
  /** 对象信息列表 */
  objects: GameObjectInfo[];
}

/**
 * 性能统计 DTO
 */
export interface PerformanceStats {
  /** 当前实际FPS */
  fps: number;
  
  /** 目标FPS */
  targetFPS: number;
  
  /** 当前对象总数 */
  objectCount: number;
  
  /** 上次Tick执行耗时 (毫秒) */
  tickDuration: number;
  
  /** 内存使用情况 */
  memoryUsage: MemoryUsage;
}

/**
 * 内存使用统计
 */
export interface MemoryUsage {
  /** 常驻内存大小 (字节) */
  rss: number;
  
  /** 堆内存总大小 (字节) */
  heapTotal: number;
  
  /** 已使用堆内存 (字节) */
  heapUsed: number;
  
  /** 外部内存使用 (字节) */
  external: number;
  
  /** ArrayBuffer 内存使用 (字节) */
  arrayBuffers: number;
}

/**
 * 游戏循环状态 DTO
 */
export interface LoopStatus {
  /** 循环是否正在运行 */
  isRunning: boolean;
  
  /** 当前设置的FPS */
  fps: number;
  
  /** 运行时长 (毫秒) */
  uptime: number;
  
  /** 总Tick执行次数 */
  totalTicks: number;
}

// ============================================================================
// 配置接口
// ============================================================================

/**
 * 生命周期系统配置
 */
export interface LifecycleConfig {
  /** 默认帧率 */
  DEFAULT_FPS: number;
  
  /** 最小帧率 */
  MIN_FPS: number;
  
  /** 最大帧率 */
  MAX_FPS: number;
  
  /** 每对象最大错误次数 */
  MAX_ERRORS_PER_OBJECT: number;
  
  /** 调试API端口 */
  DEBUG_API_PORT: number;
  
  /** API路径前缀 */
  DEBUG_API_PREFIX: string;
  
  /** 启用性能监控 */
  ENABLE_PERFORMANCE_MONITORING: boolean;
  
  /** 内存检查间隔 (毫秒) */
  MEMORY_CHECK_INTERVAL: number;
}

// ============================================================================
// 请求/响应类型
// ============================================================================

/**
 * 启动游戏循环请求参数
 */
export interface StartLoopRequest {
  /** 目标帧率 (可选，默认30) */
  fps?: number;
}

/**
 * 创建对象请求参数
 */
export interface CreateObjectRequest {
  /** 对象类型 */
  type: string;
  
  /** 初始化参数 (可选) */
  params?: Record<string, any>;
}

// ============================================================================
// 错误类型
// ============================================================================

/**
 * 生命周期管理相关错误
 */
export class LifecycleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly objectId?: number
  ) {
    super(message);
    this.name = 'LifecycleError';
  }
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  OBJECT_NOT_FOUND = 'OBJECT_NOT_FOUND',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  LOOP_ALREADY_RUNNING = 'LOOP_ALREADY_RUNNING',
  LOOP_NOT_RUNNING = 'LOOP_NOT_RUNNING',
  INVALID_FPS = 'INVALID_FPS',
  OBJECT_CREATION_FAILED = 'OBJECT_CREATION_FAILED',
  MAX_ERRORS_EXCEEDED = 'MAX_ERRORS_EXCEEDED'
}

// ============================================================================
// 类型守卫函数
// ============================================================================

/**
 * 检查是否为有效的游戏对象状态
 */
export function isValidGameObjectState(state: any): state is GameObjectState {
  return Object.values(GameObjectState).includes(state);
}

/**
 * 检查是否为有效的游戏对象
 */
export function isGameObject(obj: any): obj is GameObject {
  return obj && 
         typeof obj.id === 'number' && 
         obj.id > 0 &&
         isValidGameObjectState(obj.state) &&
         typeof obj.onBeginPlay === 'function' &&
         typeof obj.onTick === 'function' &&
         typeof obj.onDestroy === 'function';
}

/**
 * 检查是否为有效的API响应
 */
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj &&
         typeof obj.success === 'boolean' &&
         obj.data !== undefined &&
         typeof obj.message === 'string';
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 状态转换映射
 */
export type StateTransitionMap = {
  [K in GameObjectState]: GameObjectState[];
};

/**
 * 有效的状态转换规则
 */
export const VALID_STATE_TRANSITIONS: StateTransitionMap = {
  [GameObjectState.READY]: [GameObjectState.ACTIVE, GameObjectState.DESTROYING],
  [GameObjectState.ACTIVE]: [GameObjectState.PAUSED, GameObjectState.DESTROYING],
  [GameObjectState.PAUSED]: [GameObjectState.ACTIVE, GameObjectState.DESTROYING],
  [GameObjectState.DESTROYING]: [GameObjectState.DESTROYED],
  [GameObjectState.DESTROYED]: [] // 终态，无法转换
};

/**
 * 检查状态转换是否有效
 */
export function isValidStateTransition(
  from: GameObjectState, 
  to: GameObjectState
): boolean {
  return VALID_STATE_TRANSITIONS[from].includes(to);
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG: LifecycleConfig = {
  DEFAULT_FPS: 30,
  MIN_FPS: 1,
  MAX_FPS: 120,
  MAX_ERRORS_PER_OBJECT: 3,
  DEBUG_API_PORT: 3000,
  DEBUG_API_PREFIX: '/api/debug',
  ENABLE_PERFORMANCE_MONITORING: true,
  MEMORY_CHECK_INTERVAL: 60000
};

/**
 * API 端点路径常量
 */
export const API_ENDPOINTS = {
  GAMEOBJECTS: '/gameobjects',
  GAMEOBJECT_BY_ID: '/gameobjects/:id',
  PAUSE_OBJECT: '/gameobjects/:id/pause',
  RESUME_OBJECT: '/gameobjects/:id/resume',
  DESTROY_OBJECT: '/gameobjects/:id/destroy',
  PERFORMANCE: '/performance',
  LOOP_STATUS: '/loop/status',
  LOOP_START: '/loop/start',
  LOOP_STOP: '/loop/stop'
} as const;