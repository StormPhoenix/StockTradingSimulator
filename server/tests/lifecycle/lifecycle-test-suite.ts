/**
 * 生命周期管理系统测试套件
 *
 * 这是一个综合测试套件，包含多个测试场景和性能基准测试
 *
 * 测试场景：
 * 1. 基础功能测试 - 系统启动、对象管理、生命周期
 * 2. 性能压力测试 - 大量对象的性能表现
 * 3. 错误处理测试 - 异常情况的处理能力
 * 4. 边界条件测试 - 极限参数的系统稳定性
 *
 * 运行方式：
 * - 全部测试: npx ts-node --project server/tsconfig.json server/tests/lifecycle/lifecycle-test-suite.ts
 * - 单个测试: npx ts-node --project server/tsconfig.json server/tests/lifecycle/lifecycle-test-suite.ts --test basic
 */

import { lifecycleConfig } from '../../src/lifecycle/config/LifecycleConfig'
import { AutoIncrementIdGenerator } from '../../src/lifecycle/core/AutoIncrementIdGenerator'
import { GameObjectManager } from '../../src/lifecycle/core/GameObjectManager'
import { TestGameObject } from '../fixtures/lifecycle/TestGameObject'

// 测试结果接口
interface TestResult {
  name: string
  passed: boolean
  duration: number
  details?: any
  error?: string
}

// 性能测试对象
class PerformanceTestObject extends TestGameObject {
  private computeIntensity: number

  constructor(id: number, name: string = 'PerfTestObject', intensity: number = 1) {
    super(id, name)
    this.computeIntensity = intensity
  }

  onTick(deltaTime: number): void {
    super.onTick(deltaTime)

    // 模拟计算密集型操作
    for (let i = 0; i < this.computeIntensity * 1000; i++) {
      Math.random() * Math.PI
    }
  }
}

// 错误测试对象
class ErrorTestObject extends TestGameObject {
  private errorOnTick: number
  private currentTick: number = 0

  constructor(id: number, name: string = 'ErrorTestObject', errorOnTick: number = 5) {
    super(id, name)
    this.errorOnTick = errorOnTick
  }

  onTick(deltaTime: number): void {
    super.onTick(deltaTime)
    this.currentTick++

    if (this.currentTick === this.errorOnTick) {
      throw new Error(`Intentional error on tick ${this.currentTick}`)
    }
  }
}

class LifecycleTestSuite {
  private results: TestResult[] = []

  async runAllTests(): Promise<void> {
    console.log('🧪 === 生命周期管理系统测试套件 ===\n')

    await this.runTest('基础功能测试', () => this.testBasicFunctionality())
    await this.runTest('性能压力测试', () => this.testPerformanceStress())
    await this.runTest('错误处理测试', () => this.testErrorHandling())
    await this.runTest('边界条件测试', () => this.testBoundaryConditions())

    this.printSummary()
  }

  async runSingleTest(testName: string): Promise<void> {
    console.log(`🧪 === 运行单个测试: ${testName} ===\n`)

    switch (testName.toLowerCase()) {
      case 'basic':
        await this.runTest('基础功能测试', () => this.testBasicFunctionality())
        break
      case 'performance':
        await this.runTest('性能压力测试', () => this.testPerformanceStress())
        break
      case 'error':
        await this.runTest('错误处理测试', () => this.testErrorHandling())
        break
      case 'boundary':
        await this.runTest('边界条件测试', () => this.testBoundaryConditions())
        break
      default:
        console.error(`❌ 未知的测试名称: ${testName}`)
        console.log('可用的测试: basic, performance, error, boundary')
        return
    }

    this.printSummary()
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    console.log(`🔬 开始测试: ${name}`)
    const startTime = Date.now()

    try {
      const result = await testFn()
      const duration = Date.now() - startTime

      this.results.push({
        name,
        passed: true,
        duration,
        details: result,
      })

      console.log(`✅ ${name} - 通过 (${duration}ms)\n`)
    } catch (error) {
      const duration = Date.now() - startTime

      this.results.push({
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      })

      console.log(`❌ ${name} - 失败 (${duration}ms)`)
      console.log(`   错误: ${error instanceof Error ? error.message : String(error)}\n`)
    }
  }

  private async testBasicFunctionality(): Promise<any> {
    const config = lifecycleConfig.load()
    const idGenerator = new AutoIncrementIdGenerator()
    const gameObjectManager = new GameObjectManager(idGenerator, config.MAX_ERRORS_PER_OBJECT)

    // 测试系统启动
    gameObjectManager.setFPS(60)
    gameObjectManager.start()

    // 测试对象创建
    const obj1 = gameObjectManager.createObject(TestGameObject, 'TestObj1')
    const obj2 = gameObjectManager.createObject(TestGameObject, 'TestObj2')

    // 运行一段时间
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 测试对象控制
    gameObjectManager.pauseObject(obj1.id)
    await new Promise(resolve => setTimeout(resolve, 500))
    gameObjectManager.resumeObject(obj1.id)

    // 获取统计信息
    const overview = gameObjectManager.getSystemOverview()

    // 清理
    gameObjectManager.destroyAllObjects()
    await new Promise(resolve => setTimeout(resolve, 200))
    gameObjectManager.stop()

    return {
      objectsCreated: 2,
      finalFPS: overview.performance.actualFPS,
      totalTicks: overview.performance.totalTicks,
      objectsByState: overview.objectsByState,
    }
  }

  private async testPerformanceStress(): Promise<any> {
    const config = lifecycleConfig.load()
    const idGenerator = new AutoIncrementIdGenerator()
    const gameObjectManager = new GameObjectManager(idGenerator, config.MAX_ERRORS_PER_OBJECT)

    gameObjectManager.setFPS(60)
    gameObjectManager.start()

    // 创建大量对象
    const objectCount = 100
    const objects = []

    console.log(`   创建 ${objectCount} 个性能测试对象...`)
    for (let i = 0; i < objectCount; i++) {
      const obj = gameObjectManager.createObject(PerformanceTestObject, `PerfObj${i}`, 1)
      objects.push(obj)
    }

    // 运行性能测试
    console.log('   运行性能测试 2 秒...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const overview = gameObjectManager.getSystemOverview()

    // 清理
    gameObjectManager.destroyAllObjects()
    await new Promise(resolve => setTimeout(resolve, 500))
    gameObjectManager.stop()

    return {
      objectCount,
      averageFPS: overview.performance.actualFPS,
      tickDuration: overview.performance.tickDuration,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      totalTicks: overview.performance.totalTicks,
    }
  }

  private async testErrorHandling(): Promise<any> {
    const config = lifecycleConfig.load()
    const idGenerator = new AutoIncrementIdGenerator()
    const gameObjectManager = new GameObjectManager(idGenerator, 2) // 设置较低的错误阈值

    gameObjectManager.setFPS(30)
    gameObjectManager.start()

    // 创建会出错的对象
    const errorObj = gameObjectManager.createObject(ErrorTestObject, 'ErrorObj', 3)
    const normalObj = gameObjectManager.createObject(TestGameObject, 'NormalObj')

    // 等待错误发生和处理
    console.log('   等待错误对象触发错误...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const overview = gameObjectManager.getSystemOverview()

    // 清理
    gameObjectManager.destroyAllObjects()
    await new Promise(resolve => setTimeout(resolve, 200))
    gameObjectManager.stop()

    return {
      initialObjects: 2,
      finalObjectCount: overview.totalObjects,
      errorHandled: overview.totalObjects < 2, // 错误对象应该被销毁
      systemStillRunning: overview.performance.actualFPS > 0,
    }
  }

  private async testBoundaryConditions(): Promise<any> {
    const config = lifecycleConfig.load()
    const idGenerator = new AutoIncrementIdGenerator()
    const gameObjectManager = new GameObjectManager(idGenerator, config.MAX_ERRORS_PER_OBJECT)

    const results: any = {}

    // 测试最小 FPS
    try {
      gameObjectManager.setFPS(1)
      results.minFPS = true
    } catch (error) {
      results.minFPS = false
    }

    // 测试最大 FPS
    try {
      gameObjectManager.setFPS(120)
      results.maxFPS = true
    } catch (error) {
      results.maxFPS = false
    }

    // 测试无效 FPS
    try {
      gameObjectManager.setFPS(0)
      results.invalidFPS = false // 应该抛出错误
    } catch (error) {
      results.invalidFPS = true // 正确处理了无效输入
    }

    // 测试空对象管理
    gameObjectManager.setFPS(60)
    gameObjectManager.start()

    await new Promise(resolve => setTimeout(resolve, 500))

    const overview = gameObjectManager.getSystemOverview()
    results.emptySystemFPS = overview.performance.actualFPS

    gameObjectManager.stop()

    return results
  }

  private printSummary(): void {
    console.log('📊 === 测试结果汇总 ===')

    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`\n总体结果: ${passed}/${total} 测试通过`)
    console.log(`总耗时: ${totalTime}ms`)
    console.log()

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.name} (${result.duration}ms)`)

      if (result.passed && result.details) {
        console.log(`   详情: ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\n   ')}`)
      }

      if (!result.passed && result.error) {
        console.log(`   错误: ${result.error}`)
      }
    })

    console.log()

    if (passed === total) {
      console.log('🎉 所有测试通过！生命周期管理系统运行正常。')
    } else {
      console.log('⚠️  部分测试失败，请检查系统实现。')
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const testSuite = new LifecycleTestSuite()

  if (args.includes('--test') && args.length > 1) {
    const testName = args[args.indexOf('--test') + 1]
    await testSuite.runSingleTest(testName)
  } else {
    await testSuite.runAllTests()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n测试套件执行完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('测试套件执行失败:', error)
      process.exit(1)
    })
}

export { LifecycleTestSuite }
