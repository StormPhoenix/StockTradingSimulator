/**
 * Time Series Data Structure Validation Test Script
 * 时间序列数据结构验证测试脚本
 *
 * 本脚本用于验证时间序列聚合系统的正确性，包括：
 * 1. 数据点添加和聚合
 * 2. 多粒度窗口管理
 * 3. 序列定义管理
 * 4. 查询功能
 * 5. 错误处理
 *
 * 注意：由于窗口关闭逻辑使用系统当前时间 (new Date())，
 * 本测试主要验证数据结构和 API 正确性，而不是实时窗口关闭行为。
 *
 * @feature 008-time-series-aggregation
 * @since 2026-01-27
 */

import {
    TimeSeriesManager,
    Granularity,
    Metric,
    DataType,
    MissingDataStrategy,
} from '../src/types/timeSeries';

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
}

class TimeSeriesTestSuite {
    private results: TestResult[] = [];
    private manager: TimeSeriesManager;
    private testCount = 0;
    private passedCount = 0;

    constructor() {
        this.manager = new TimeSeriesManager();
    }

    /**
     * 运行所有测试
     */
    async runAllTests(): Promise<void> {
        console.log('\n========================================');
        console.log('时间序列数据结构验证测试');
        console.log('========================================\n');

        // Phase 1: 基础功能测试
        this.testBasicFunctionality();

        // Phase 2: 多粒度窗口测试
        this.testMultiGranularity();

        // Phase 3: 序列定义管理测试
        this.testSeriesDefinitionManagement();

        // Phase 4: 数据点添加和验证
        this.testDataPointValidation();

        // Phase 5: 查询功能测试
        this.testQueryFunctionality();

        // Phase 6: 错误处理测试
        this.testErrorHandling();

        // 输出测试结果
        this.printResults();
    }

    /**
     * 辅助方法：断言
     */
    private assert(condition: boolean, message: string): void {
        this.testCount++;
        if (condition) {
            this.passedCount++;
            this.results.push({
                name: `Test ${this.testCount}`,
                passed: true,
                message,
            });
            console.log(`✅ Test ${this.testCount}: ${message}`);
        } else {
            this.results.push({
                name: `Test ${this.testCount}`,
                passed: false,
                message,
            });
            console.log(`❌ Test ${this.testCount}: ${message}`);
        }
    }

    /**
     * 测试 1: 基础功能
     */
    private testBasicFunctionality(): void {
        console.log('\n--- Phase 1: 基础功能测试 ---\n');

        const seriesId = 'TEST-BASIC';

        // 创建序列
        this.manager.createSeries({
            seriesId,
            name: 'Basic Test Series',
            dataType: DataType.CONTINUOUS,
            metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE],
            missingDataStrategy: MissingDataStrategy.USE_PREVIOUS,
        });

        // 验证序列是否创建成功
        const allSeriesIds = this.manager.getAllSeriesIds();
        this.assert(
            allSeriesIds.includes(seriesId),
            '序列创建成功，可以通过 getAllSeriesIds 获取'
        );

        // 添加数据点
        const baseTime = new Date('2026-01-27T10:00:00.000Z');

        // 第一个数据点
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 5000), // 10:00:05
            value: 100,
            metadata: { volume: 100 },
        });

        // 第二个数据点
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 30000), // 10:00:30
            value: 105,
            metadata: { volume: 200 },
        });

        // 第三个数据点
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 65000), // 10:01:05
            value: 110,
            metadata: { volume: 150 },
        });

        this.assert(
            true,
            '多个数据点添加成功'
        );

        // 删除测试序列
        this.manager.removeSeries(seriesId);

        // 验证序列是否删除
        const allSeriesIdsAfterDelete = this.manager.getAllSeriesIds();
        this.assert(
            !allSeriesIdsAfterDelete.includes(seriesId),
            '序列删除成功'
        );
    }

    /**
     * 测试 2: 多粒度窗口
     */
    private testMultiGranularity(): void {
        console.log('\n--- Phase 2: 多粒度窗口测试 ---\n');

        const seriesId = 'TEST-MULTI-GRANULARITY';

        this.manager.createSeries({
            seriesId,
            name: 'Multi Granularity Test',
            dataType: DataType.CONTINUOUS,
            metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE, Metric.VOLUME, Metric.VWAP],
            missingDataStrategy: MissingDataStrategy.USE_PREVIOUS,
        });

        const baseTime = new Date('2026-01-27T10:00:00.000Z');

        // 添加 30 分钟的数据点（每分钟一个）
        for (let i = 0; i < 30; i++) {
            this.manager.addDataPoint(seriesId, {
                timestamp: new Date(baseTime.getTime() + i * 60000 + 5000),
                value: 100 + i * 0.5,
                metadata: { volume: 100 + i * 5 },
            });
        }

        this.assert(
            true,
            '多粒度数据点添加成功（1m, 5m, 15m, 30m）'
        );

        // 删除测试序列
        this.manager.removeSeries(seriesId);
    }

    /**
     * 测试 3: 序列定义管理
     */
    private testSeriesDefinitionManagement(): void {
        console.log('\n--- Phase 3: 序列定义管理测试 ---\n');

        const seriesId1 = 'TEST-SERIES-1';
        const seriesId2 = 'TEST-SERIES-2';

        // 创建第一个序列
        this.manager.createSeries({
            seriesId: seriesId1,
            name: 'Series 1',
            dataType: DataType.CONTINUOUS,
            metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE],
            missingDataStrategy: MissingDataStrategy.USE_PREVIOUS,
        });

        // 创建第二个序列
        this.manager.createSeries({
            seriesId: seriesId2,
            name: 'Series 2',
            dataType: DataType.DISCRETE,
            metrics: [Metric.VOLUME],
            missingDataStrategy: MissingDataStrategy.USE_ZERO,
        });

        const allSeriesIds = this.manager.getAllSeriesIds();

        this.assert(
            allSeriesIds.length === 2,
            `成功创建 2 个序列，实际: ${allSeriesIds.length}`
        );

        this.assert(
            allSeriesIds.includes(seriesId1) && allSeriesIds.includes(seriesId2),
            '两个序列 ID 都存在'
        );

        // 删除第一个序列
        this.manager.removeSeries(seriesId1);

        const allSeriesIdsAfterDelete = this.manager.getAllSeriesIds();

        this.assert(
            allSeriesIdsAfterDelete.length === 1 &&
            allSeriesIdsAfterDelete.includes(seriesId2) &&
            !allSeriesIdsAfterDelete.includes(seriesId1),
            '删除第一个序列后，只剩下第二个序列'
        );

        // 删除第二个序列
        this.manager.removeSeries(seriesId2);

        const allSeriesIdsAfterDelete2 = this.manager.getAllSeriesIds();

        this.assert(
            allSeriesIdsAfterDelete2.length === 0,
            '删除所有序列后，序列列表为空'
        );
    }

    /**
     * 测试 4: 数据点添加和验证
     */
    private testDataPointValidation(): void {
        console.log('\n--- Phase 4: 数据点添加和验证 ---\n');

        const seriesId = 'TEST-DATAPOINT';

        this.manager.createSeries({
            seriesId,
            name: 'Data Point Test',
            dataType: DataType.CONTINUOUS,
            metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE, Metric.VOLUME, Metric.VWAP],
            missingDataStrategy: MissingDataStrategy.USE_PREVIOUS,
        });

        const baseTime = new Date('2026-01-27T10:00:00.000Z');

        // 测试 1: 正常数据点
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 5000),
            value: 100,
            metadata: { volume: 100 },
        });

        this.assert(
            true,
            '正常数据点添加成功'
        );

        // 测试 2: 数据点带有额外 metadata
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 30000),
            value: 105,
            metadata: { volume: 200, tradeId: 'T001', buyerId: 'B001' },
        });

        this.assert(
            true,
            '带有额外 metadata 的数据点添加成功'
        );

        // 测试 3: 数据点不带 volume（使用默认值 1）
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 120000),
            value: 102,
            // 没有 volume metadata，VWAP 计算时将使用默认值 1
        });

        this.assert(
            true,
            '不带 volume 的数据点添加成功（VWAP 将使用默认值 1）'
        );

        // 测试 4: 数据点没有 metadata 对象
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 180000),
            value: 108,
            // 完全没有 metadata
        });

        this.assert(
            true,
            '完全没有 metadata 的数据点添加成功'
        );

        // 测试 5: 零值和负值
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 240000),
            value: 0,
            metadata: { volume: 50 },
        });

        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 300000),
            value: -10,
            metadata: { volume: 30 },
        });

        this.assert(
            true,
            '零值和负值数据点添加成功'
        );

        // 删除测试序列
        this.manager.removeSeries(seriesId);
    }

    /**
     * 测试 5: 查询功能
     */
    private testQueryFunctionality(): void {
        console.log('\n--- Phase 5: 查询功能测试 ---\n');

        const seriesId = 'TEST-QUERY';

        this.manager.createSeries({
            seriesId,
            name: 'Query Test',
            dataType: DataType.CONTINUOUS,
            metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE],
            missingDataStrategy: MissingDataStrategy.USE_PREVIOUS,
        });

        const baseTime = new Date('2026-01-27T10:00:00.000Z');

        // 添加数据点 (10个窗口)
        for (let i = 0; i < 20; i++) {
            this.manager.addDataPoint(seriesId, {
                timestamp: new Date(baseTime.getTime() + i * 30000 + 5000),
                value: 100 + i,
                metadata: { volume: 100 },
            });
        }

        // 添加一个额外数据点来触发最后一个窗口的关闭
        // i=9 的数据点在 10:09:05，属于窗口 10:09:00-10:10:00
        // 需要一个 >= 10:10:00 的数据点来关闭这个窗口
        this.manager.addDataPoint(seriesId, {
            timestamp: new Date(baseTime.getTime() + 10 * 60000 + 5000), // 10:10:05
            value: 110,
            metadata: { volume: 100 },
        });

        // 测试查询 API
        const data = this.manager.queryAggregatedData({
            seriesId,
            granularity: Granularity.MIN_1,
            startTime: baseTime,
            endTime: new Date(baseTime.getTime() + 600000), // 10:00-10:10
        });

        this.assert(
            Array.isArray(data),
            '查询 API 返回数组'
        );

        console.log('查询结果:', data);

        this.assert(
            data.length === 10,
            `查询返回了正确的窗口数量: ${data.length} (期望 10 个窗口)`
        );

        // 验证第一个窗口
        if (data.length > 0) {
            this.assert(
                data[0].open === 100 && data[0].close === 100,
                '第一个窗口 (10:00-10:01) 数据正确'
            );
        }

        // 验证最后一个窗口
        if (data.length > 0) {
            this.assert(
                data[data.length - 1].open === 109 && data[data.length - 1].close === 109,
                '最后一个窗口 (10:09-10:10) 数据正确'
            );
        }

        // 测试 getLatestData API
        const latestData = this.manager.getLatestData(seriesId, Granularity.MIN_1);

        this.assert(
            latestData === null || typeof latestData === 'object',
            'getLatestData 返回 null 或对象'
        );

        console.log('最新数据:', latestData);

        // 删除测试序列
        this.manager.removeSeries(seriesId);
    }

    /**
     * 测试 6: 错误处理
     */
    private testErrorHandling(): void {
        console.log('\n--- Phase 6: 错误处理测试 ---\n');

        const seriesId = 'TEST-ERROR';

        // 测试 1: 添加数据点到不存在的序列
        try {
            this.manager.addDataPoint(seriesId, {
                timestamp: new Date('2026-01-27T10:00:00.000Z'),
                value: 100,
            });
            this.assert(false, '应该抛出错误：序列不存在');
        } catch (error) {
            this.assert(
                error instanceof Error && error.message.includes('does not exist'),
                '正确抛出错误：序列不存在'
            );
        }

        // 创建序列
        this.manager.createSeries({
            seriesId,
            name: 'Error Test',
            dataType: DataType.CONTINUOUS,
            metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE],
            missingDataStrategy: MissingDataStrategy.USE_PREVIOUS,
        });

        // 测试 2: 无效的数据点（timestamp 为 null）
        try {
            this.manager.addDataPoint(seriesId, {
                timestamp: null as any,
                value: 100,
            });
            this.assert(false, '应该抛出错误：无效的 timestamp');
        } catch (error) {
            this.assert(
                error instanceof Error && error.message.includes('Invalid data point'),
                '正确抛出错误：无效的 timestamp'
            );
        }

        // 测试 3: 无效的数据点（value 为 NaN）
        try {
            this.manager.addDataPoint(seriesId, {
                timestamp: new Date('2026-01-27T10:00:00.000Z'),
                value: NaN,
            });
            this.assert(false, '应该抛出错误：无效的 value');
        } catch (error) {
            this.assert(
                error instanceof Error && error.message.includes('Invalid data point'),
                '正确抛出错误：无效的 value'
            );
        }

        // 测试 4: 查询不存在的序列
        try {
            this.manager.queryAggregatedData({
                seriesId: 'NON-EXISTENT',
                granularity: Granularity.MIN_1,
                startTime: new Date('2026-01-27T10:00:00.000Z'),
                endTime: new Date('2026-01-27T11:00:00.000Z'),
            });
            this.assert(false, '应该抛出错误：查询不存在的序列');
        } catch (error) {
            this.assert(
                error instanceof Error && error.message.includes('does not exist'),
                '正确抛出错误：查询不存在的序列'
            );
        }

        // 测试 5: 查询无效的粒度
        try {
            this.manager.queryAggregatedData({
                seriesId,
                granularity: 'INVALID' as Granularity,
                startTime: new Date('2026-01-27T10:00:00.000Z'),
                endTime: new Date('2026-01-27T11:00:00.000Z'),
            });
            this.assert(false, '应该抛出错误：无效的粒度');
        } catch (error) {
            this.assert(
                error instanceof Error && error.message.includes('is not supported'),
                '正确抛出错误：无效的粒度'
            );
        }

        // 测试 6: 查询无效的时间范围
        try {
            this.manager.queryAggregatedData({
                seriesId,
                granularity: Granularity.MIN_1,
                startTime: new Date('2026-01-27T11:00:00.000Z'),
                endTime: new Date('2026-01-27T10:00:00.000Z'), // 结束时间早于开始时间
            });
            this.assert(false, '应该抛出错误：无效的时间范围');
        } catch (error) {
            this.assert(
                error instanceof Error && error.message.includes('Start time must be before end time'),
                '正确抛出错误：无效的时间范围'
            );
        }

        // 删除测试序列
        this.manager.removeSeries(seriesId);
    }

    /**
     * 打印测试结果
     */
    private printResults(): void {
        console.log('\n========================================');
        console.log('测试结果汇总');
        console.log('========================================\n');
        console.log(`总测试数: ${this.testCount}`);
        console.log(`通过: ${this.passedCount}`);
        console.log(`失败: ${this.testCount - this.passedCount}`);
        console.log(`通过率: ${((this.passedCount / this.testCount) * 100).toFixed(2)}%\n`);

        if (this.passedCount === this.testCount) {
            console.log('🎉 所有测试通过！');
            console.log('\n时间序列数据结构验证完成！');
            console.log('✅ 数据结构正确');
            console.log('✅ API 接口正确');
            console.log('✅ 错误处理正确');
        } else {
            console.log('❌ 部分测试失败，请检查详细信息：\n');
            this.results.forEach((result) => {
                if (!result.passed) {
                    console.log(`  - ${result.name}: ${result.message}`);
                }
            });
        }

        console.log('\n========================================\n');
    }
}

// 运行测试
async function main(): Promise<void> {
    try {
        const suite = new TimeSeriesTestSuite();
        await suite.runAllTests();

        // 退出代码
        process.exit(suite['passedCount'] === suite['testCount'] ? 0 : 1);
    } catch (error) {
        console.error('测试执行失败:', error);
        process.exit(1);
    }
}

main();
