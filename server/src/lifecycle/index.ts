/**
 * GameObject 生命周期管理器 - 主入口文件
 * 
 * 导出所有核心类和接口，方便外部使用
 */

// 核心类 - 简化后的架构
export { AutoIncrementIdGenerator } from './core/AutoIncrementIdGenerator';
export { ErrorIsolationManager } from './core/ErrorIsolationManager';
export { GameLoop } from './core/GameLoop';
export { GameObjectManager } from './core/GameObjectManager';

// Web API 控制器和路由
export { GameObjectDebugController } from '../controllers/gameObjectDebugController';
export { createDebugRoutes } from '../routes/debugRoutes';

// 配置
export { LifecycleConfigLoader, lifecycleConfig } from './config/LifecycleConfig';

// 测试辅助类（从测试目录导出）
export { TestGameObject } from '../../tests/fixtures/lifecycle/TestGameObject';

// 共享类型（重新导出）
export * from './types';