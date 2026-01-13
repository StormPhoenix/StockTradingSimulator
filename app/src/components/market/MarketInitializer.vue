<template>
  <div class="market-initializer">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h2>市场环境初始化</h2>
          <p class="subtitle">基于模板创建市场环境，包括AI交易员生成和股票分配</p>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="initialization-form">
        <!-- 基础配置 -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <h3>基础配置</h3>
          </template>

          <el-form-item label="市场名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入市场环境名称" clearable />
          </el-form-item>

          <el-form-item label="描述信息" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入市场环境描述（可选）" />
          </el-form-item>

          <el-form-item label="分配算法" prop="allocationAlgorithm">
            <el-select v-model="form.allocationAlgorithm" placeholder="选择股票分配算法">
              <el-option v-for="algorithm in allocationAlgorithms" :key="algorithm.value" :label="algorithm.label"
                :value="algorithm.value">
                <span>{{ algorithm.label }}</span>
                <span class="algorithm-desc">{{ algorithm.description }}</span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="随机种子" prop="seed">
            <el-input-number v-model="form.seed" :min="0" :max="999999" placeholder="可选，用于确保结果可重现"
              style="width: 200px" />
            <el-button link @click="generateRandomSeed" style="margin-left: 10px">
              随机生成
            </el-button>
          </el-form-item>
        </el-card>

        <!-- 交易员配置 -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <h3>交易员配置</h3>
              <el-button type="primary" @click="addTraderConfig">
                <el-icon>
                  <Plus />
                </el-icon>
                添加交易员模板
              </el-button>
            </div>
          </template>

          <div v-if="form.traderConfigs.length === 0" class="empty-state">
            <el-empty description="暂无交易员配置，请添加至少一个交易员模板" />
          </div>

          <div v-for="(config, index) in form.traderConfigs" :key="index" class="trader-config-item">
            <el-card shadow="hover">
              <template #header>
                <div class="config-item-header">
                  <span>交易员配置 {{ index + 1 }}</span>
                  <el-button type="danger" text @click="removeTraderConfig(index)">
                    <el-icon>
                      <Delete />
                    </el-icon>
                    删除
                  </el-button>
                </div>
              </template>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item :prop="`traderConfigs.${index}.templateId`" label="交易员模板"
                    :rules="{ required: true, message: '请选择交易员模板' }">
                    <el-select v-model="config.templateId" placeholder="选择交易员模板" filterable style="width: 100%">
                      <el-option v-for="template in traderTemplates" :key="template._id" :label="template.name"
                        :value="template._id">
                        <div class="template-option">
                          <span>{{ template.name }}</span>
                          <span class="template-info">
                            {{ formatCurrency(template.initialCapital) }} |
                            {{ getRiskProfileLabel(template.riskProfile) }}
                          </span>
                        </div>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item :prop="`traderConfigs.${index}.count`" label="生成数量"
                    :rules="{ required: true, message: '请输入生成数量' }">
                    <el-input-number v-model="config.count" :min="1" :max="1000" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="资金倍数" prop="capitalMultiplier">
                    <el-input-number v-model="config.capitalMultiplier" :min="0.1" :max="10" :step="0.1" :precision="1"
                      style="width: 100%" />
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="资金变化率" prop="capitalVariation">
                    <el-input-number v-model="config.capitalVariation" :min="0" :max="1" :step="0.05" :precision="2"
                      style="width: 100%" />
                    <div class="form-tip">0.2 表示 ±20% 随机变化</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </el-card>

        <!-- 股票配置 -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <h3>股票配置</h3>
          </template>

          <el-form-item label="股票模板" prop="stockTemplateIds">
            <el-select v-model="form.stockTemplateIds" multiple filterable placeholder="选择股票模板（可多选）"
              style="width: 100%">
              <el-option v-for="template in stockTemplates" :key="template._id" :label="template.name"
                :value="template._id">
                <div class="template-option">
                  <span>{{ template.name }} ({{ template.symbol }})</span>
                  <span class="template-info">
                    {{ formatCurrency(template.issuePrice) }} |
                    {{ formatQuantity(template.totalShares) }}股 |
                    {{ getCategoryLabel(template.category) }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <div v-if="form.stockTemplateIds.length > 0" class="selected-stocks">
            <h4>已选择的股票 ({{ form.stockTemplateIds.length }})</h4>
            <div class="stock-tags">
              <el-tag v-for="templateId in form.stockTemplateIds" :key="templateId" closable
                @close="removeStockTemplate(templateId)">
                {{ getStockTemplateName(templateId) }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 预览统计 -->
        <el-card v-if="previewStats" class="config-section" shadow="never">
          <template #header>
            <h3>配置预览</h3>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="交易员总数" :value="previewStats.totalTraders" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="股票总数" :value="previewStats.totalStocks" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总资金" :value="previewStats.totalCapital" :formatter="formatCurrency" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总市值" :value="previewStats.totalMarketValue" :formatter="formatCurrency" />
            </el-col>
          </el-row>
        </el-card>

        <!-- 操作按钮 -->
        <el-form-item class="form-actions">
          <el-button type="primary" @click="createMarketEnvironment" :loading="loading">
            <el-icon>
              <Star />
            </el-icon>
            创建市场环境
          </el-button>
          <el-button @click="resetForm">
            <el-icon>
              <Refresh />
            </el-icon>
            重置表单
          </el-button>
          <el-button @click="previewConfiguration">
            <el-icon>
              <View />
            </el-icon>
            预览配置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 创建结果对话框 -->
    <el-dialog v-model="resultDialogVisible" title="市场环境创建结果" width="800px" :close-on-click-modal="false">
      <div v-if="creationResult" class="creation-result">
        <el-result :icon="creationResult.success ? 'success' : 'error'"
          :title="creationResult.success ? '创建成功' : '创建失败'" :sub-title="creationResult.message">
          <template #extra>
            <div v-if="creationResult.success" class="result-stats">
              <h4>市场环境统计</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="市场ID">
                  {{ creationResult.data.id }}
                </el-descriptions-item>
                <el-descriptions-item label="交易员数量">
                  {{ creationResult.data.statistics.traderCount }}
                </el-descriptions-item>
                <el-descriptions-item label="股票数量">
                  {{ creationResult.data.statistics.stockCount }}
                </el-descriptions-item>
                <el-descriptions-item label="总资金">
                  {{ formatCurrency(creationResult.data.totalCapital) }}
                </el-descriptions-item>
                <el-descriptions-item label="总市值">
                  {{ formatCurrency(creationResult.data.totalMarketValue) }}
                </el-descriptions-item>
                <el-descriptions-item label="分配公平性">
                  {{ (creationResult.data.statistics.allocationFairness * 100).toFixed(2) }}%
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="result-actions">
              <el-button v-if="creationResult.success" type="primary" @click="viewMarketEnvironment">
                查看详情
              </el-button>
              <el-button @click="resultDialogVisible = false">
                关闭
              </el-button>
            </div>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Star, Refresh, View } from '@element-plus/icons-vue'
import { useTemplatesStore } from '../../stores/templates'
import { useMarketStore } from '../../stores/market'

// 响应式数据
const formRef = ref()
const loading = ref(false)
const resultDialogVisible = ref(false)
const creationResult = ref(null)

// Store
const templatesStore = useTemplatesStore()
const marketStore = useMarketStore()

// 表单数据
const form = reactive({
  name: '',
  description: '',
  allocationAlgorithm: 'weighted_random',
  seed: null,
  traderConfigs: [],
  stockTemplateIds: []
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入市场名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  stockTemplateIds: [
    { required: true, message: '请至少选择一个股票模板', trigger: 'change' }
  ]
}

// 分配算法选项
const allocationAlgorithms = [
  {
    value: 'weighted_random',
    label: '加权随机分配',
    description: '基于交易员资金进行加权随机分配'
  },
  {
    value: 'equal_distribution',
    label: '平均分配',
    description: '尽可能平均地分配给所有交易员'
  },
  {
    value: 'risk_based',
    label: '基于风险分配',
    description: '根据风险偏好匹配相应股票类别'
  }
]

// 计算属性
const traderTemplates = computed(() => templatesStore.traderTemplates)
const stockTemplates = computed(() => templatesStore.stockTemplates)

const previewStats = computed(() => {
  if (form.traderConfigs.length === 0 || form.stockTemplateIds.length === 0) {
    return null
  }

  const totalTraders = form.traderConfigs.reduce((sum, config) => sum + (config.count || 0), 0)
  const totalStocks = form.stockTemplateIds.length

  let totalCapital = 0
  let totalMarketValue = 0

  form.traderConfigs.forEach(config => {
    const template = traderTemplates.value.find(t => t._id === config.templateId)
    if (template) {
      const multiplier = config.capitalMultiplier || 1
      totalCapital += template.initialCapital * multiplier * (config.count || 0)
    }
  })

  form.stockTemplateIds.forEach(templateId => {
    const template = stockTemplates.value.find(t => t._id === templateId)
    if (template) {
      totalMarketValue += template.issuePrice * template.totalShares
    }
  })

  return {
    totalTraders,
    totalStocks,
    totalCapital,
    totalMarketValue
  }
})

// 生命周期
onMounted(async () => {
  await Promise.all([
    templatesStore.fetchTraderTemplates(),
    templatesStore.fetchStockTemplates()
  ])
})

// 方法
const addTraderConfig = () => {
  form.traderConfigs.push({
    templateId: '',
    count: 1,
    capitalMultiplier: 1.0,
    capitalVariation: 0.0
  })
}

const removeTraderConfig = (index) => {
  form.traderConfigs.splice(index, 1)
}

const removeStockTemplate = (templateId) => {
  const index = form.stockTemplateIds.indexOf(templateId)
  if (index > -1) {
    form.stockTemplateIds.splice(index, 1)
  }
}

const generateRandomSeed = () => {
  form.seed = Math.floor(Math.random() * 1000000)
}

const getStockTemplateName = (templateId) => {
  const template = stockTemplates.value.find(t => t._id === templateId)
  return template ? `${template.name} (${template.symbol})` : templateId
}

const getRiskProfileLabel = (riskProfile) => {
  const labels = {
    conservative: '保守型',
    moderate: '稳健型',
    aggressive: '激进型'
  }
  return labels[riskProfile] || riskProfile
}

const getCategoryLabel = (category) => {
  const labels = {
    tech: '科技',
    finance: '金融',
    healthcare: '医疗',
    energy: '能源',
    consumer: '消费'
  }
  return labels[category] || '其他'
}

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '¥0.00'
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const formatQuantity = (quantity) => {
  if (typeof quantity !== 'number') return '0'
  return quantity.toLocaleString('zh-CN')
}

const previewConfiguration = () => {
  if (!previewStats.value) {
    ElMessage.warning('请先完成基础配置')
    return
  }

  const message = `
    配置预览：
    • 交易员总数：${previewStats.value.totalTraders} 个
    • 股票总数：${previewStats.value.totalStocks} 只
    • 总资金：${formatCurrency(previewStats.value.totalCapital)}
    • 总市值：${formatCurrency(previewStats.value.totalMarketValue)}
    • 分配算法：${allocationAlgorithms.find(a => a.value === form.allocationAlgorithm)?.label}
  `

  ElMessageBox.alert(message, '配置预览', {
    confirmButtonText: '确定',
    type: 'info'
  })
}

const createMarketEnvironment = async () => {
  try {
    // 表单验证
    await formRef.value.validate()

    if (form.traderConfigs.length === 0) {
      ElMessage.error('请至少添加一个交易员配置')
      return
    }

    // 验证交易员配置
    for (const config of form.traderConfigs) {
      if (!config.templateId) {
        ElMessage.error('请为所有交易员配置选择模板')
        return
      }
      if (!config.count || config.count < 1) {
        ElMessage.error('交易员数量必须大于0')
        return
      }
    }

    loading.value = true

    // 清理表单数据，移除null值
    const cleanedForm = { ...form }
    if (cleanedForm.seed === null || cleanedForm.seed === '') {
      delete cleanedForm.seed
    }

    // 调用市场服务创建市场环境
    const result = await marketStore.createMarketEnvironment(cleanedForm)

    creationResult.value = result
    resultDialogVisible.value = true

    if (result.success) {
      ElMessage.success('市场环境创建成功！')
      resetForm()
    } else {
      ElMessage.error(result.message || '创建失败')
    }
  } catch (error) {
    console.error('创建市场环境失败:', error)
    ElMessage.error(error.message || '创建失败，请重试')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.traderConfigs = []
  form.stockTemplateIds = []
  form.seed = null
}

const viewMarketEnvironment = () => {
  if (creationResult.value?.success) {
    // 跳转到市场环境详情页
    // router.push(`/market/${creationResult.value.data.id}`)
    ElMessage.info('市场环境详情页面开发中...')
  }
  resultDialogVisible.value = false
}
</script>

<style scoped>
.market-initializer {
  padding: 20px;
}

.main-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.initialization-form {
  margin-top: 20px;
}

.config-section {
  margin-bottom: 20px;
}

.config-section :deep(.el-card__header) {
  padding: 15px 20px;
  background-color: #f8f9fa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.trader-config-item {
  margin-bottom: 15px;
}

.config-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-info {
  font-size: 12px;
  color: #909399;
}

.algorithm-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.selected-stocks {
  margin-top: 15px;
}

.selected-stocks h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.stock-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
}

.creation-result {
  text-align: center;
}

.result-stats {
  margin: 20px 0;
}

.result-stats h4 {
  margin-bottom: 15px;
  color: #303133;
}

.result-actions {
  margin-top: 20px;
}

:deep(.el-statistic__content) {
  font-size: 24px;
  font-weight: bold;
}

:deep(.el-statistic__title) {
  font-size: 14px;
  color: #909399;
}
</style>
