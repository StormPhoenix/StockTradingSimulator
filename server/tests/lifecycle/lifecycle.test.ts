/**
 * 生命周期管理系统 Jest 测试套件
 * 
 * 这是使用 Jest 框架重构的测试套件，包含：
 * 1. 基础功能测试 - 系统启动、对象管理、生命周期
 * 2. 性能压力测试 - 大量对象的性能表现  
 * 3. 错误处理测试 - 异常情况的处理能力
 * 4. 边界条件测试 - 极限参数的系统稳定性
 * 
 * 运行方式：
 * - 全部测试: npm test -- tests/lifecycle/lifecycle.test.ts
 * - 单个测试: npm test -- tests/lifecycle/lifecycle.test.ts --testNamePattern="基础功能测试"
 */

import { lifecycleConfig } from '../../src/lifecycle/config/lifecycleConfig'
import { AutoIncrementIdGenerator } from '../../src/lifecycle/core/autoIncrementIdGenerator'
import { GameObjectManager } from '../../src/lifecycle/core/gameObjectManager'
import { TestGameObject } from '../fixtures/lifecycle/testGameObject'

describe('生命周期管理系统', () => {
  let gameObjectManager: GameObjectManager
  
  beforeEach(() => {
    // 每个测试前创建新的管理器实例
    const idGenerator = new AutoIncrementIdGenerator()
    gameObjectManager = new GameObjectManager(idGenerator, 3)
  })
  
  afterEach(async () => {
    // 每个测试后清理资源
    if (gameObjectManager.isRunning()) {
      gameObjectManager.stop()
    }
    gameObjectManager.destroyAllObjects()
    
    // 等待一小段时间确保清理完成
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  describe('基础功能测试', () => {
    test('系统启动和停止', () => {
      expect(gameObjectManager.isRunning()).toBe(false)
      
      gameObjectManager.setFPS(60)
      gameObjectManager.start()
      expect(gameObjectManager.isRunning()).toBe(true)
      
      gameObjectManager.stop()
      expect(gameObjectManager.isRunning()).toBe(false)
    })

    test('对象创建和管理', () => {
      const obj = gameObjectManager.createObject(TestGameObject, 'TestObject')
      
      expect(obj).toBeDefined()
      expect(obj.getName()).toBe('TestObject')
      expect(obj.id).toBeGreaterThan(0)
      
      const objectInfo = gameObjectManager.getObjectInfo(obj.id)
      expect(objectInfo).toBeDefined()
      expect(objectInfo?.type).toBe('TestGameObject')
    })

    test('对象生命周期管理', async () => {
      const obj = gameObjectManager.createObject(TestGameObject, 'LifecycleTest')
      
      // 启动系统
      gameObjectManager.setFPS(30)
      gameObjectManager.start()
      
      // 等待几个 tick
      await new Promise(resolve => setTimeout(resolve, 200))
      
      expect(obj.isBeginPlayExecuted()).toBe(true)
      expect(obj.getTickCount()).toBeGreaterThan(0)
      
      // 暂停对象
      gameObjectManager.pauseObject(obj.id)
      const tickCountAfterPause = obj.getTickCount()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 暂停后 tick 计数不应增加
      expect(obj.getTickCount()).toBe(tickCountAfterPause)
      
      // 恢复对象
      gameObjectManager.resumeObject(obj.id)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 恢复后 tick 计数应该继续增加
      expect(obj.getTickCount()).toBeGreaterThan(tickCountAfterPause)
      
      gameObjectManager.stop()
    })

    test('帧号功能', async () => {
      gameObjectManager.setFPS(60)
      gameObjectManager.start()
      
      // 等待几个 tick
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const frameNumber = gameObjectManager.getFrameNumber()
      expect(frameNumber).toBeGreaterThan(0)
      
      // 验证向后兼容性 - 注意：GameObjectManager 没有 getTotalTicks 方法
      // const totalTicks = gameObjectManager.getTotalTicks()
      // expect(totalTicks).toBe(frameNumber)
      
      gameObjectManager.stop()
    })
  })

  describe('性能测试', () => {
    test('大量对象性能', async () => {
      const objectCount = 1000
      const startTime = Date.now()
      
      // 创建大量对象
      const objects = gameObjectManager.createObjects(TestGameObject, objectCount)
      expect(objects).toHaveLength(objectCount)
      
      const creationTime = Date.now() - startTime
      expect(creationTime).toBeLessThan(1000) // 创建1000个对象应该在1秒内完成
      
      // 启动系统并运行一段时间
      gameObjectManager.setFPS(60)
      gameObjectManager.start()
      
      const runStartTime = Date.now()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const overview = gameObjectManager.getSystemOverview()
      expect(overview.totalObjects).toBe(objectCount)
      expect(overview.performance.actualFPS).toBeGreaterThan(0)
      
      gameObjectManager.stop()
      
      const runTime = Date.now() - runStartTime
      console.log(`性能测试结果: ${objectCount}个对象运行${runTime}ms, 实际FPS: ${overview.performance.actualFPS}`)
    }, 10000) // 增加超时时间
  })

  describe('错误处理测试', () => {
    test('对象错误处理', async () => {
      // 创建会抛出错误的测试对象
      class ErrorTestObject extends TestGameObject {
        onTick(deltaTime: number): void {
          super.onTick(deltaTime)
          if (this.getTickCount() > 3) {
            throw new Error('测试错误')
          }
        }
      }
      
      const obj = gameObjectManager.createObject(ErrorTestObject, 'ErrorTest')
      
      gameObjectManager.setFPS(30)
      gameObjectManager.start()
      
      // 等待错误发生
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const overview = gameObjectManager.getSystemOverview()
      expect(overview.errorStatistics.totalErrors).toBeGreaterThan(0)
      
      gameObjectManager.stop()
    })
  })

  describe('边界条件测试', () => {
    test('极限帧率设置', () => {
      // 测试极低帧率
      gameObjectManager.setFPS(1)
      expect(gameObjectManager.getTargetFPS()).toBe(1)
      
      // 测试高帧率（在允许范围内）
      gameObjectManager.setFPS(120)
      expect(gameObjectManager.getTargetFPS()).toBe(120)
      
      // 测试无效帧率 - 系统有FPS限制
      expect(() => gameObjectManager.setFPS(0)).toThrow()
      expect(() => gameObjectManager.setFPS(-1)).toThrow()
      expect(() => gameObjectManager.setFPS(1000)).toThrow() // 超出最大限制
    })

    test('空对象管理', () => {
      const overview = gameObjectManager.getSystemOverview()
      expect(overview.totalObjects).toBe(0)
      expect(overview.objectsByState.READY).toBe(0)
      expect(overview.objectsByState.ACTIVE).toBe(0)
      expect(overview.objectsByState.PAUSED).toBe(0)
      expect(overview.objectsByState.DESTROYED).toBe(0)
    })

    test('重复启动停止', () => {
      // 启动系统
      gameObjectManager.start()
      expect(gameObjectManager.isRunning()).toBe(true)
      
      // 重复启动会抛出错误（这是预期行为）
      expect(() => gameObjectManager.start()).toThrow()
      
      // 停止系统
      gameObjectManager.stop()
      expect(gameObjectManager.isRunning()).toBe(false)
      
      // 重复停止会抛出错误（这是预期行为）
      expect(() => gameObjectManager.stop()).toThrow()
    })
  })

  describe('系统监控测试', () => {
    test('系统概览信息', async () => {
      const obj1 = gameObjectManager.createObject(TestGameObject, 'Object1')
      const obj2 = gameObjectManager.createObject(TestGameObject, 'Object2')
      
      gameObjectManager.setFPS(60)
      gameObjectManager.start()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const overview = gameObjectManager.getSystemOverview()
      
      expect(overview.isRunning).toBe(true)
      expect(gameObjectManager.getTargetFPS()).toBe(60)
      expect(gameObjectManager.getActualFPS()).toBeGreaterThan(0)
      expect(overview.totalObjects).toBe(2)
      expect(overview.objectsByState.ACTIVE).toBe(2)
      expect(overview.performance.frameNumber).toBeGreaterThan(0)
      
      gameObjectManager.stop()
    })
  })
})