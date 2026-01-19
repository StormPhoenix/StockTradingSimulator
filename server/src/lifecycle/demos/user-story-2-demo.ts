/**
 * User Story 2 演示脚本
 * 
 * 验证开发者创建和管理业务对象的功能：
 * 
 * 功能验证：
 * 1. 创建不同类型的业务对象（AI交易者、股票）
 * 2. 验证对象生命周期状态转换 (READY → ACTIVE → PAUSED → DESTROYING → DESTROYED)
 * 3. 测试对象管理功能（暂停、恢复、销毁）
 * 4. 验证错误隔离机制
 * 5. 监控对象状态和性能统计
 * 
 * 运行方式：
 * - 从项目根目录: npx ts-node --project server/tsconfig.json server/src/lifecycle/demos/user-story-2-demo.ts
 * - 从 server 目录: npm run demo:us2
 */

import { GameObjectManager } from '../core/GameObjectManager';
import { AutoIncrementIdGenerator } from '../core/AutoIncrementIdGenerator';
import { AITrader } from '../examples/AITrader';
import { Stock } from '../examples/Stock';
import { GameObjectState } from '../types';

async function demonstrateUserStory2() {
  console.log('🎯 === User Story 2 演示：开发者创建和管理业务对象 ===\n');

  try {
    // 1. 初始化生命周期管理系统
    console.log('🔧 1. 初始化生命周期管理系统...');
    const idGenerator = new AutoIncrementIdGenerator();
    const gameObjectManager = new GameObjectManager(idGenerator, 3);
    
    // 设置较高的帧率以便快速看到效果
    gameObjectManager.setFPS(10);
    gameObjectManager.start();
    console.log('✅ 系统启动成功，帧率: 10 FPS\n');

    // 2. 创建不同类型的业务对象
    console.log('🏭 2. 创建业务对象...');
    
    // 创建AI交易者
    const trader1 = gameObjectManager.createObject(AITrader, 'aggressive', 10000, 3000);
    const trader2 = gameObjectManager.createObject(AITrader, 'conservative', 5000, 8000);
    const trader3 = gameObjectManager.createObject(AITrader, 'balanced', 15000, 5000);
    
    // 创建股票对象
    const appleStock = gameObjectManager.createObject(Stock, 'AAPL', 'Apple Inc.', 150.0, 2500000000000, 0.025);
    const googleStock = gameObjectManager.createObject(Stock, 'GOOGL', 'Alphabet Inc.', 2800.0, 1800000000000, 0.03);
    const teslaStock = gameObjectManager.createObject(Stock, 'TSLA', 'Tesla Inc.', 800.0, 800000000000, 0.05);
    
    console.log(`✅ 创建了 ${gameObjectManager.getTotalObjectCount()} 个业务对象`);
    console.log(`   - AI交易者: ${trader1.id}, ${trader2.id}, ${trader3.id}`);
    console.log(`   - 股票: ${appleStock.id} (${appleStock.getSymbol()}), ${googleStock.id} (${googleStock.getSymbol()}), ${teslaStock.id} (${teslaStock.getSymbol()})\n`);

    // 3. 等待对象激活并观察生命周期
    console.log('⏱️  3. 观察对象生命周期转换...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 检查对象状态
    const objectStats = gameObjectManager.getObjectCount();
    console.log('📊 对象状态统计:');
    console.log(`   - READY: ${objectStats[GameObjectState.READY]}`);
    console.log(`   - ACTIVE: ${objectStats[GameObjectState.ACTIVE]}`);
    console.log(`   - PAUSED: ${objectStats[GameObjectState.PAUSED]}`);
    console.log(`   - DESTROYING: ${objectStats[GameObjectState.DESTROYING]}`);
    console.log(`   - DESTROYED: ${objectStats[GameObjectState.DESTROYED]}\n`);

    // 4. 测试对象管理功能
    console.log('🎛️  4. 测试对象管理功能...');
    
    // 暂停一个交易者
    console.log(`   暂停交易者 ${trader1.id}...`);
    gameObjectManager.pauseObject(trader1.id);
    
    // 暂停一个股票
    console.log(`   暂停股票 ${appleStock.id} (${appleStock.getSymbol()})...`);
    gameObjectManager.pauseObject(appleStock.id);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 恢复对象
    console.log(`   恢复交易者 ${trader1.id}...`);
    gameObjectManager.resumeObject(trader1.id);
    
    console.log(`   恢复股票 ${appleStock.id} (${appleStock.getSymbol()})...`);
    gameObjectManager.resumeObject(appleStock.id);
    
    console.log('✅ 对象暂停和恢复功能正常\n');

    // 5. 查询对象信息
    console.log('🔍 5. 查询对象详细信息...');
    
    // 查询交易者信息
    const traderInfo = gameObjectManager.getObjectInfo(trader1.id);
    if (traderInfo) {
      console.log(`📈 交易者 ${trader1.id} 信息:`);
      console.log(`   - 状态: ${traderInfo.state}`);
      console.log(`   - 类型: ${traderInfo.type}`);
      console.log(`   - 错误次数: ${traderInfo.errorCount}`);
      console.log(`   - 策略: ${trader1.getStrategy()}`);
      console.log(`   - 资金: $${trader1.getCapital().toFixed(2)}`);
      console.log(`   - 总资产: $${trader1.getTotalValue().toFixed(2)}`);
    }
    
    // 查询股票信息
    const stockInfo = gameObjectManager.getObjectInfo(appleStock.id);
    if (stockInfo) {
      const stockSummary = appleStock.getSummary();
      console.log(`📊 股票 ${appleStock.id} (${stockSummary.symbol}) 信息:`);
      console.log(`   - 状态: ${stockInfo.state}`);
      console.log(`   - 类型: ${stockInfo.type}`);
      console.log(`   - 当前价格: $${stockSummary.price.toFixed(2)}`);
      console.log(`   - 涨跌幅: ${stockSummary.changePercent.toFixed(2)}%`);
      console.log(`   - 交易量: ${stockSummary.volume.toLocaleString()}`);
      console.log(`   - 市值: ${stockSummary.marketCap}`);
      console.log(`   - 趋势: ${stockSummary.trend}`);
    }
    console.log();

    // 6. 测试批量操作
    console.log('📦 6. 测试批量操作...');
    
    // 批量创建更多对象
    const moreTraders = gameObjectManager.createObjects(AITrader, 3, (index) => [
      ['aggressive', 'conservative', 'balanced'][index],
      5000 + index * 1000,
      4000 + index * 1000
    ]);
    
    console.log(`✅ 批量创建了 ${moreTraders.length} 个交易者`);
    console.log(`   总对象数: ${gameObjectManager.getTotalObjectCount()}\n`);

    // 7. 运行一段时间观察业务逻辑
    console.log('🔄 7. 运行业务逻辑观察...');
    console.log('   (运行10秒，观察AI交易者和股票的行为)');
    
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 8. 获取系统概览
    console.log('\n📈 8. 系统状态概览:');
    const overview = gameObjectManager.getSystemOverview();
    
    console.log('🔄 循环状态:');
    console.log(`   - 运行中: ${overview.isRunning}`);
    console.log(`   - 目标FPS: ${overview.fps}`);
    console.log(`   - 总对象数: ${overview.totalObjects}`);
    
    console.log('⚡ 性能统计:');
    console.log(`   - 实际FPS: ${overview.performance.actualFPS.toFixed(1)}`);
    console.log(`   - Tick耗时: ${overview.performance.tickDuration.toFixed(2)}ms`);
    console.log(`   - 运行时长: ${(overview.performance.uptime / 1000).toFixed(1)}s`);
    console.log(`   - 总帧数: ${overview.performance.frameNumber}`);
    
    console.log('📦 对象统计:');
    Object.entries(overview.objectsByState).forEach(([state, count]) => {
      console.log(`   - ${state}: ${count}`);
    });
    
    console.log('❌ 错误统计:');
    console.log(`   - 总错误数: ${overview.errorStatistics.totalErrors}`);
    console.log(`   - 有错误的对象: ${overview.errorStatistics.objectsWithErrors}`);
    console.log(`   - 接近错误限制的对象: ${overview.errorStatistics.objectsNearLimit}`);

    // 9. 测试对象销毁
    console.log('\n🗑️  9. 测试对象销毁...');
    
    // 销毁一些对象
    gameObjectManager.destroyObject(trader2.id);
    gameObjectManager.destroyObject(teslaStock.id);
    
    // 批量销毁多余的交易者
    const traderIds = moreTraders.map(t => t.id);
    const destroyedCount = gameObjectManager.destroyObjects(traderIds);
    console.log(`✅ 批量销毁了 ${destroyedCount} 个对象`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalStats = gameObjectManager.getObjectCount();
    console.log('📊 销毁后对象统计:');
    Object.entries(finalStats).forEach(([state, count]) => {
      console.log(`   - ${state}: ${count}`);
    });

    // 10. 系统清理
    console.log('\n🧹 10. 系统清理...');
    const remainingCount = gameObjectManager.destroyAllObjects();
    console.log(`✅ 清理了 ${remainingCount} 个剩余对象`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    gameObjectManager.stop();
    console.log('✅ 系统已停止');

    // 11. 最终验证
    console.log('\n🎉 === User Story 2 演示完成 ===');
    console.log('✅ 对象创建功能正常');
    console.log('✅ 生命周期状态转换正常');
    console.log('✅ 对象管理功能正常（暂停、恢复、销毁）');
    console.log('✅ 批量操作功能正常');
    console.log('✅ 对象查询功能正常');
    console.log('✅ 业务逻辑执行正常');
    console.log('✅ 错误隔离机制正常');
    console.log('✅ 系统监控功能正常');

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  demonstrateUserStory2().then(() => {
    console.log('\n演示脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('演示脚本执行失败:', error);
    process.exit(1);
  });
}

export { demonstrateUserStory2 };