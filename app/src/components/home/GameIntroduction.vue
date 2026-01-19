<template>
  <div class="game-introduction">
    <!-- 头部横幅 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">股票交易模拟器</h1>
        <p class="hero-subtitle">体验真实的股票交易环境，提升投资技能</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goToAdmin">
            <el-icon><Setting /></el-icon>
            后台管理
          </el-button>
          <el-button type="success" size="large" @click="goToDebug">
            <el-icon><Monitor /></el-icon>
            调试界面
          </el-button>
          <el-button size="large" @click="startDemo">
            <el-icon><VideoPlay /></el-icon>
            观看演示
          </el-button>
        </div>
      </div>
      <div class="hero-image">
        <el-image 
          src="/images/trading-dashboard.png" 
          alt="交易界面预览"
          fit="contain"
          :preview-src-list="['/images/trading-dashboard.png']"
        />
      </div>
    </div>

    <!-- 功能特色 -->
    <div class="features-section">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon size="48"><TrendCharts /></el-icon>
            </div>
            <h3>市场环境模拟</h3>
            <p>基于真实市场数据构建的模拟交易环境，支持多种市场场景配置</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon size="48"><User /></el-icon>
            </div>
            <h3>AI智能交易员</h3>
            <p>配置不同风险偏好和交易策略的AI交易员，观察不同策略的表现</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon size="48"><DataAnalysis /></el-icon>
            </div>
            <h3>数据分析</h3>
            <p>实时交易数据分析，包括收益率、风险指标、交易统计等</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon size="48"><Document /></el-icon>
            </div>
            <h3>模板管理</h3>
            <p>灵活的股票模板和交易员模板管理，快速构建不同的市场场景</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用流程 -->
    <div class="workflow-section">
      <div class="container">
        <h2 class="section-title">使用流程</h2>
        <div class="workflow-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>配置模板</h3>
              <p>在后台管理中创建股票模板、AI交易员模板和市场环境模板</p>
            </div>
          </div>
          <div class="step-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>初始化市场</h3>
              <p>基于模板创建市场环境，系统自动分配股票和生成AI交易员</p>
            </div>
          </div>
          <div class="step-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>观察交易</h3>
              <p>观察AI交易员的交易行为，分析不同策略的表现和市场变化</p>
            </div>
          </div>
          <div class="step-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>数据分析</h3>
              <p>查看交易报告，分析收益情况，总结投资经验和策略优化</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术特点 -->
    <div class="tech-section">
      <div class="container">
        <h2 class="section-title">技术特点</h2>
        <div class="tech-grid">
          <div class="tech-item">
            <el-icon><Monitor /></el-icon>
            <span>Vue.js 3 + TypeScript</span>
          </div>
          <div class="tech-item">
            <el-icon><Service /></el-icon>
            <span>Node.js + Express</span>
          </div>
          <div class="tech-item">
            <el-icon><Coin /></el-icon>
            <span>MongoDB 数据库</span>
          </div>
          <div class="tech-item">
            <el-icon><Lightning /></el-icon>
            <span>实时数据更新</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 演示对话框 -->
    <el-dialog
      v-model="demoDialogVisible"
      title="系统演示"
      width="80%"
      :before-close="closeDemoDialog"
      class="demo-dialog"
    >
      <div class="demo-content">
        <div class="demo-steps">
          <el-steps :active="currentDemoStep" direction="vertical" finish-status="success">
            <el-step 
              v-for="(step, index) in demoSteps" 
              :key="index"
              :title="step.title"
              :description="step.description"
            />
          </el-steps>
        </div>
        
        <div class="demo-display">
          <div class="demo-screen">
            <div v-if="currentDemoStep === 0" class="demo-step-content">
              <h3>欢迎使用股票交易模拟器</h3>
              <p>本系统提供完整的股票交易模拟环境，帮助您学习和实践投资策略。</p>
              <div class="demo-features">
                <div class="demo-feature">
                  <el-icon><TrendCharts /></el-icon>
                  <span>真实市场模拟</span>
                </div>
                <div class="demo-feature">
                  <el-icon><User /></el-icon>
                  <span>AI智能交易</span>
                </div>
                <div class="demo-feature">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>数据分析</span>
                </div>
              </div>
            </div>

            <div v-if="currentDemoStep === 1" class="demo-step-content">
              <h3>模板管理</h3>
              <p>首先需要在后台管理中配置各种模板：</p>
              <ul class="demo-list">
                <li><strong>股票模板：</strong>定义股票的基本信息，如股票代码、发行价格、总股数等</li>
                <li><strong>交易员模板：</strong>配置AI交易员的风险偏好、交易策略、初始资金等</li>
                <li><strong>市场环境模板：</strong>组合股票和交易员，创建完整的市场环境</li>
              </ul>
              <div class="demo-mockup">
                <div class="mockup-header">模板管理界面</div>
                <div class="mockup-tabs">
                  <span class="tab active">股票模板</span>
                  <span class="tab">交易员模板</span>
                  <span class="tab">市场环境</span>
                </div>
                <div class="mockup-content">
                  <div class="mockup-item">
                    <span>AAPL - 苹果公司</span>
                    <span class="status active">活跃</span>
                  </div>
                  <div class="mockup-item">
                    <span>GOOGL - 谷歌</span>
                    <span class="status active">活跃</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentDemoStep === 2" class="demo-step-content">
              <h3>市场初始化</h3>
              <p>基于配置的模板创建市场环境：</p>
              <ul class="demo-list">
                <li>系统根据股票模板生成股票实例</li>
                <li>根据交易员模板创建AI交易员</li>
                <li>为每个交易员分配初始资金和股票</li>
                <li>启动市场交易机制</li>
              </ul>
              <div class="demo-progress">
                <div class="progress-item">
                  <span>创建股票实例</span>
                  <el-progress :percentage="100" status="success" />
                </div>
                <div class="progress-item">
                  <span>生成AI交易员</span>
                  <el-progress :percentage="100" status="success" />
                </div>
                <div class="progress-item">
                  <span>分配初始资产</span>
                  <el-progress :percentage="100" status="success" />
                </div>
                <div class="progress-item">
                  <span>启动交易系统</span>
                  <el-progress :percentage="100" status="success" />
                </div>
              </div>
            </div>

            <div v-if="currentDemoStep === 3" class="demo-step-content">
              <h3>交易观察</h3>
              <p>观察AI交易员的实时交易行为：</p>
              <div class="demo-trading">
                <div class="trading-panel">
                  <h4>实时交易</h4>
                  <div class="trade-item">
                    <span class="trader">保守型交易员A</span>
                    <span class="action buy">买入</span>
                    <span class="stock">AAPL 100股</span>
                    <span class="price">$150.25</span>
                  </div>
                  <div class="trade-item">
                    <span class="trader">激进型交易员B</span>
                    <span class="action sell">卖出</span>
                    <span class="stock">GOOGL 50股</span>
                    <span class="price">$2,750.80</span>
                  </div>
                </div>
                <div class="market-data">
                  <h4>市场数据</h4>
                  <div class="stock-item">
                    <span>AAPL</span>
                    <span class="price up">$150.25 (+2.3%)</span>
                  </div>
                  <div class="stock-item">
                    <span>GOOGL</span>
                    <span class="price down">$2,750.80 (-1.2%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentDemoStep === 4" class="demo-step-content">
              <h3>数据分析</h3>
              <p>系统提供详细的交易分析和报告：</p>
              <div class="demo-analytics">
                <div class="analytics-card">
                  <h4>收益统计</h4>
                  <div class="stat-item">
                    <span>总收益率</span>
                    <span class="value positive">+12.5%</span>
                  </div>
                  <div class="stat-item">
                    <span>最佳交易员</span>
                    <span class="value">激进型交易员B</span>
                  </div>
                </div>
                <div class="analytics-card">
                  <h4>风险指标</h4>
                  <div class="stat-item">
                    <span>夏普比率</span>
                    <span class="value">1.25</span>
                  </div>
                  <div class="stat-item">
                    <span>最大回撤</span>
                    <span class="value negative">-5.2%</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentDemoStep === 5" class="demo-step-content">
              <h3>开始使用</h3>
              <p>现在您已经了解了系统的基本功能，可以开始使用了！</p>
              <div class="demo-actions">
                <el-button type="primary" size="large" @click="goToAdminFromDemo">
                  <el-icon><Setting /></el-icon>
                  进入后台管理
                </el-button>
                <el-button size="large" @click="restartDemo">
                  <el-icon><Refresh /></el-icon>
                  重新观看演示
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="demo-controls">
          <el-button @click="prevDemoStep" :disabled="currentDemoStep === 0">
            <el-icon><ArrowLeft /></el-icon>
            上一步
          </el-button>
          <el-button type="primary" @click="nextDemoStep" :disabled="currentDemoStep === demoSteps.length - 1">
            下一步
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button @click="closeDemoDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Setting, 
  VideoPlay, 
  TrendCharts, 
  User, 
  DataAnalysis, 
  Document, 
  ArrowRight,
  ArrowLeft,
  Monitor,
  Coin,
  Lightning,
  Refresh,
  Service
} from '@element-plus/icons-vue'

const router = useRouter()

// 演示相关状态
const demoDialogVisible = ref(false)
const currentDemoStep = ref(0)

// 演示步骤配置
const demoSteps = [
  {
    title: '系统介绍',
    description: '了解股票交易模拟器的基本功能和特点'
  },
  {
    title: '模板管理',
    description: '学习如何配置股票模板、交易员模板和市场环境'
  },
  {
    title: '市场初始化',
    description: '了解系统如何基于模板创建完整的交易环境'
  },
  {
    title: '交易观察',
    description: '观察AI交易员的实时交易行为和市场变化'
  },
  {
    title: '数据分析',
    description: '学习如何分析交易数据和生成报告'
  },
  {
    title: '开始使用',
    description: '准备开始使用系统进行实际操作'
  }
]

const goToAdmin = (): void => {
  router.push('/admin')
}

const goToDebug = (): void => {
  router.push('/debug/lifecycle')
}

const startDemo = (): void => {
  demoDialogVisible.value = true
  currentDemoStep.value = 0
}

const closeDemoDialog = (): void => {
  demoDialogVisible.value = false
  currentDemoStep.value = 0
}

const nextDemoStep = (): void => {
  if (currentDemoStep.value < demoSteps.length - 1) {
    currentDemoStep.value++
  }
}

const prevDemoStep = (): void => {
  if (currentDemoStep.value > 0) {
    currentDemoStep.value--
  }
}

const restartDemo = (): void => {
  currentDemoStep.value = 0
}

const goToAdminFromDemo = (): void => {
  closeDemoDialog()
  goToAdmin()
}
</script>

<style scoped>
.game-introduction {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 头部横幅 */
.hero-section {
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 0 2rem;
  color: white;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-image {
  flex: 1;
  max-width: 500px;
  margin-left: 2rem;
}

/* 功能特色 */
.features-section {
  padding: 5rem 0;
  background: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #1f2937;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  color: #667eea;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.feature-card p {
  color: #6b7280;
  line-height: 1.6;
}

/* 使用流程 */
.workflow-section {
  padding: 5rem 0;
  background: #f9fafb;
}

.workflow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 200px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.step-content p {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.step-arrow {
  color: #667eea;
  font-size: 1.5rem;
}

/* 技术特点 */
.tech-section {
  padding: 5rem 0;
  background: #1f2937;
  color: white;
}

.tech-section .section-title {
  color: white;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.tech-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tech-item .el-icon {
  font-size: 1.5rem;
  color: #60a5fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1rem;
  }

  .hero-image {
    margin-left: 0;
    margin-top: 2rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .workflow-steps {
    flex-direction: column;
  }

  .step-arrow {
    transform: rotate(90deg);
  }

  .step {
    max-width: 100%;
  }
}

/* 演示对话框样式 */
.demo-dialog {
  .el-dialog__body {
    padding: 0;
  }
}

.demo-content {
  display: flex;
  min-height: 500px;
}

.demo-steps {
  width: 300px;
  padding: 2rem;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.demo-display {
  flex: 1;
  padding: 2rem;
}

.demo-screen {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  min-height: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-step-content h3 {
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.demo-step-content p {
  color: #6b7280;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.demo-features {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.demo-feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  color: #374151;
}

.demo-feature .el-icon {
  color: #667eea;
}

.demo-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
}

.demo-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.demo-list li:last-child {
  border-bottom: none;
}

.demo-mockup {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 1.5rem;
  overflow: hidden;
}

.mockup-header {
  background: #374151;
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 500;
}

.mockup-tabs {
  display: flex;
  background: #e5e7eb;
}

.tab {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-right: 1px solid #d1d5db;
}

.tab.active {
  background: white;
  color: #667eea;
  font-weight: 500;
}

.mockup-content {
  padding: 1rem;
}

.mockup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.status.active {
  color: #10b981;
  font-weight: 500;
}

.demo-progress {
  margin-top: 1.5rem;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-item span {
  min-width: 120px;
  color: #374151;
}

.demo-trading {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
}

.trading-panel,
.market-data {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.trading-panel h4,
.market-data h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.trade-item,
.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.action.buy {
  color: #10b981;
  font-weight: 500;
}

.action.sell {
  color: #ef4444;
  font-weight: 500;
}

.price.up {
  color: #10b981;
}

.price.down {
  color: #ef4444;
}

.demo-analytics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
}

.analytics-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.analytics-card h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  color: #6b7280;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.value {
  font-weight: 500;
  color: #374151;
}

.value.positive {
  color: #10b981;
}

.value.negative {
  color: #ef4444;
}

.demo-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.demo-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

@media (max-width: 768px) {
  .demo-content {
    flex-direction: column;
  }

  .demo-steps {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }

  .demo-trading,
  .demo-analytics {
    grid-template-columns: 1fr;
  }

  .demo-features {
    flex-direction: column;
    gap: 1rem;
  }

  .demo-actions {
    flex-direction: column;
  }
}
</style>