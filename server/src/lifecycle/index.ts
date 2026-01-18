/**
 * GameObject 生命周期管理器 - 主入口文件
 * 
 * 导出所有核心类和接口，方便外部使用
 */

// 核心类
export { AutoIncrementIdGenerator } from './core/AutoIncrementIdGenerator';
export { SafeGameObjectContainer } from './core/SafeGameObjectContainer';
export { GameObjectStateManager } from './core/GameObjectStateManager';
export { ErrorIsolationManager } from './core/ErrorIsolationManager';
export { GameLoop } from './core/GameLoop';
export { GameObjectManager } from './core/GameObjectManager';

// 配置
export { LifecycleConfigLoader, lifecycleConfig } from './config/LifecycleConfig';

// 测试辅助类（从测试目录导出）
export { TestGameObject } from '../../tests/fixtures/lifecycle/TestGameObject';

// 演示脚本（从demos目录导出）
export { demonstrateUserStory1 } from './demos/user-story-1-demo';

// 共享类型（重新导出）
export * from './types';