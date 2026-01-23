/**
 * 生命周期管理服务
 * 
 * @description 应用级生命周期管理服务，负责统一管理 GameObjectManager 的
 * 创建、启动、关闭等生命周期操作。
 */

import { GameObjectManager } from '../lifecycle/core/gameObjectManager'

export class LifecycleManagerService {
  private gameObjectManager: GameObjectManager
  private isInitialized: boolean = false

  constructor() {
    // 使用单例的 GameObjectManager
    this.gameObjectManager = GameObjectManager.getInstance()
  }

  /**
   * 初始化生命周期管理系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ Lifecycle system already initialized, skipping...')
      return
    }

    try {
      console.log('🎮 Initializing lifecycle management system...')
      
      // 启动游戏对象管理器的循环
      this.gameObjectManager.start()
      
      this.isInitialized = true
      console.log('✅ Lifecycle management system started successfully')
    } catch (error: any) {
      console.error('❌ Failed to initialize lifecycle management system:', error.message)
      throw error
    }
  }

  /**
   * 优雅关闭生命周期管理系统
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ Lifecycle system not initialized, nothing to shutdown')
      return
    }

    try {
      console.log('🛑 Shutting down lifecycle management system...')
      
      // 停止游戏循环
      if (this.gameObjectManager.isRunning()) {
        this.gameObjectManager.stop()
      }
      
      // 清理所有游戏对象
      this.gameObjectManager.destroyAllObjects()
      
      this.isInitialized = false
      console.log('✅ Lifecycle management system stopped successfully')
    } catch (error: any) {
      console.error('❌ Error during lifecycle system shutdown:', error.message)
      throw error
    }
  }

  /**
   * 获取 GameObjectManager 实例
   */
  getManager(): GameObjectManager {
    if (!this.isInitialized) {
      throw new Error('Lifecycle management system not initialized')
    }
    return this.gameObjectManager
  }

  /**
   * 检查生命周期系统是否已准备就绪
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * 获取生命周期系统状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      loopRunning: this.isInitialized ? this.gameObjectManager.isRunning() : false,
      objectCount: this.isInitialized ? this.gameObjectManager.getTotalObjectCount() : 0,
      timestamp: new Date().toISOString()
    }
  }
}