<template>
  <div class="market-environment-manager">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>市场环境管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            创建市场环境
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filters">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="filters.search"
              placeholder="搜索市场环境名称或ID"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.traderCount" placeholder="交易员数量" clearable @change="handleFilter">
              <el-option label="1-10个" value="1-10" />
              <el-option label="11-50个" value="11-50" />
              <el-option label="51-100个" value="51-100" />
              <el-option label="100个以上" value="100+" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.stockCount" placeholder="股票数量" clearable @change="handleFilter">
              <el-option label="1-5只" value="1-5" />
              <el-option label="6-20只" value="6-20" />
              <el-option label="21-50只" value="21-50" />
              <el-option label="50只以上" value="50+" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <!-- 批量操作 -->
      <div v-if="hasSelected" class="batch-actions">
        <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
        <el-button @click="handleBatchExport">批量导出</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="marketEnvironments"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="市场名称" min-width="200">
          <template #default="{ row }">
            <div class="market-name">
              <span>{{ row?.name || '未命名市场' }}</span>
              <el-tag v-if="row?.id" size="small" type="info">{{ row.id.slice(-8) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="statistics.traderCount" label="交易员数" width="100">
          <template #default="{ row }">
            {{ row?.statistics?.traderCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="statistics.stockCount" label="股票数" width="100">
          <template #default="{ row }">
            {{ row?.statistics?.stockCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCapital" label="总资金" width="150">
          <template #default="{ row }">
            {{ formatCurrency(row?.totalCapital || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row?.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleExport(row)">导出</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑市场环境' : '创建市场环境'"
      width="80%"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="market-form-container">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="140px"
          class="market-form"
        >
          <!-- 基本信息 -->
          <el-card shadow="never" class="form-section">
            <template #header>
              <h3>基本信息</h3>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="市场名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入市场名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分配算法" prop="allocationAlgorithm">
                  <el-select v-model="form.allocationAlgorithm" placeholder="请选择分配算法">
                    <el-option label="加权随机分配" value="weighted_random" />
                    <el-option label="平均分配" value="equal_distribution" />
                    <el-option label="风险基础分配" value="risk_based" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="描述信息" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入市场环境描述"
              />
            </el-form-item>
          </el-card>

          <!-- 交易员配置 -->
          <el-card shadow="never" class="form-section">
            <template #header>
              <div class="section-header">
                <h3>交易员配置</h3>
                <el-dropdown @command="addTraderConfig">
                  <el-button>
                    <el-icon><Plus /></el-icon>
                    添加交易员模板
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item 
                        v-for="template in availableTraderTemplates" 
                        :key="template._id"
                        :command="template"
                        :disabled="form.traderConfigs.some(config => config.templateId === template._id)"
                      >
                        {{ template.name }} ({{ template.riskProfile }})
                      </el-dropdown-item>
                      <el-dropdown-item divided command="refresh">
                        <el-icon><Refresh /></el-icon>
                        刷新模板列表
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            
            <div v-if="form.traderConfigs.length === 0" class="empty-state">
              <el-empty description="暂无交易员配置，请添加交易员模板" />
            </div>
            
            <div v-else class="trader-configs">
              <div
                v-for="(config, index) in form.traderConfigs"
                :key="config.templateId"
                class="trader-config-item"
              >
                <el-card shadow="hover">
                  <div class="config-header">
                    <span class="template-name">{{ config.templateName }}</span>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="removeTraderConfig(index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item :label="`数量`" :prop="`traderConfigs.${index}.count`">
                        <el-input-number
                          v-model="config.count"
                          :min="1"
                          :max="100"
                          placeholder="交易员数量"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item :label="`资金倍数`" :prop="`traderConfigs.${index}.capitalMultiplier`">
                        <el-input-number
                          v-model="config.capitalMultiplier"
                          :min="0.1"
                          :max="10"
                          :precision="2"
                          :step="0.1"
                          placeholder="基于模板初始资金的倍数"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item :label="`资金变化率`" :prop="`traderConfigs.${index}.capitalVariation`">
                        <el-input-number
                          v-model="config.capitalVariation"
                          :min="0"
                          :max="1"
                          :precision="2"
                          :step="0.05"
                          placeholder="随机变化幅度(0-1)"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-card>
              </div>
            </div>
          </el-card>

          <!-- 股票配置 -->
          <el-card shadow="never" class="form-section">
            <template #header>
              <div class="section-header">
                <h3>股票配置</h3>
                <el-dropdown @command="addStockConfig">
                  <el-button>
                    <el-icon><Plus /></el-icon>
                    添加股票模板
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item 
                        v-for="template in availableStockTemplates" 
                        :key="template._id"
                        :command="template"
                        :disabled="form.stockConfigs.some(config => config.templateId === template._id)"
                      >
                        {{ template.name }} ({{ template.symbol }})
                      </el-dropdown-item>
                      <el-dropdown-item divided command="refresh">
                        <el-icon><Refresh /></el-icon>
                        刷新模板列表
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            
            <div v-if="form.stockConfigs.length === 0" class="empty-state">
              <el-empty description="暂无股票配置，请添加股票模板" />
            </div>
            
            <div v-else class="stock-configs">
              <div
                v-for="(config, index) in form.stockConfigs"
                :key="config.templateId"
                class="stock-config-item"
              >
                <el-card shadow="hover">
                  <div class="config-header">
                    <span class="template-name">{{ config.templateName }} ({{ config.symbol }})</span>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="removeStockConfig(index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item :label="`发行价格`" :prop="`stockConfigs.${index}.issuePrice`">
                        <el-input-number
                          v-model="config.issuePrice"
                          :min="0.01"
                          :max="999999.99"
                          :precision="2"
                          placeholder="股票发行价格"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item :label="`总股数`" :prop="`stockConfigs.${index}.totalShares`">
                        <el-input-number
                          v-model="config.totalShares"
                          :min="1"
                          :max="1000000000"
                          placeholder="股票总数"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-card>
              </div>
            </div>
          </el-card>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 模板选择对话框 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Delete, ArrowDown, Refresh } from '@element-plus/icons-vue'
import { useMarketStore } from '@/stores/market'
import { useTemplatesStore } from '@/stores/templates'

const marketStore = useMarketStore()
const templatesStore = useTemplatesStore()

// 模板数据
const availableTraderTemplates = ref([])
const availableStockTemplates = ref([])

// 响应式数据
const loading = ref(false)
const marketEnvironments = ref([])
const selectedEnvironments = ref([])
const hasSelected = computed(() => selectedEnvironments.value.length > 0)

const filters = reactive({
  search: '',
  traderCount: '',
  stockCount: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

const form = reactive({
  name: '',
  description: '',
  allocationAlgorithm: 'weighted_random',
  traderConfigs: [],
  stockConfigs: []
})

const rules = {
  name: [
    { required: true, message: '请输入市场名称', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  allocationAlgorithm: [
    { required: true, message: '请选择分配算法', trigger: 'change' }
  ]
}

// 方法
const fetchData = async () => {
  try {
    loading.value = true
    console.log('开始获取市场环境数据...')
    
    const result = await marketStore.getMarketEnvironments({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    })
    
    console.log('获取到的数据:', result)
    
    if (result.success) {
      const data = result.data || []
      console.log('处理后的数据:', data)
      
      // 验证数据完整性
      const validData = data.filter(item => {
        if (!item) {
          console.warn('发现空数据项:', item)
          return false
        }
        if (!item.name) {
          console.warn('发现缺少name字段的数据项:', item)
        }
        return true
      })
      
      marketEnvironments.value = validData
      
      if (result.pagination) {
        pagination.total = result.pagination.total || 0
        pagination.pages = result.pagination.pages || 0
      } else {
        pagination.total = 0
        pagination.pages = 0
      }
    }
  } catch (error) {
    console.error('获取市场环境列表失败:', error)
    ElMessage.error('获取数据失败：' + error.message)
    // 重置数据
    marketEnvironments.value = []
    pagination.total = 0
    pagination.pages = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleFilter = () => {
  pagination.page = 1
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedEnvironments.value = selection
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  // 复制数据到表单
  Object.assign(form, {
    _id: row._id,
    name: row.name,
    description: row.description,
    allocationAlgorithm: row.allocationAlgorithm,
    traderConfigs: row.traderConfigs || [],
    stockConfigs: row.stockConfigs || []
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个市场环境吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await marketStore.deleteMarketEnvironment(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

const handleExport = async (row) => {
  try {
    const result = await marketStore.exportMarketEnvironment(row.id)
    
    if (result.success) {
      // 触发文件下载
      downloadJsonFile(result.data, result.filename)
      ElMessage.success('导出成功')
    }
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除选中的市场环境吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const deletePromises = selectedEnvironments.value.map(env => 
      marketStore.deleteMarketEnvironment(env.id)
    )
    
    await Promise.all(deletePromises)
    ElMessage.success('批量删除成功')
    selectedEnvironments.value = []
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + error.message)
    }
  }
}

const handleBatchExport = async () => {
  if (selectedEnvironments.value.length === 0) {
    ElMessage.warning('请选择要导出的市场环境')
    return
  }

  try {
    const exportPromises = selectedEnvironments.value.map(env => 
      marketStore.exportMarketEnvironment(env.id)
    )
    
    const results = await Promise.allSettled(exportPromises)
    
    let successCount = 0
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        downloadJsonFile(result.value.data, result.value.filename)
        successCount++
      }
    })
    
    ElMessage.success(`批量导出完成：成功 ${successCount} 个`)
    selectedEnvironments.value = []
  } catch (error) {
    ElMessage.error('批量导出失败：' + error.message)
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (form.traderConfigs.length === 0) {
      ElMessage.warning('请至少添加一个交易员配置')
      return
    }
    
    if (form.stockConfigs.length === 0) {
      ElMessage.warning('请至少添加一个股票配置')
      return
    }
    
    submitting.value = true
    
    // 转换数据格式以匹配后端API期望的格式
    const submitData = {
      name: form.name,
      description: form.description,
      allocationAlgorithm: form.allocationAlgorithm,
      traderConfigs: form.traderConfigs.map(config => ({
        templateId: config.templateId,
        count: config.count,
        capitalMultiplier: config.capitalMultiplier || 1.0,
        capitalVariation: config.capitalVariation || 0.0
      })),
      stockTemplateIds: form.stockConfigs.map(config => config.templateId)
    }
    
    console.log('提交的数据:', submitData)
    
    if (isEdit.value) {
      await marketStore.updateMarketEnvironment(form._id, submitData)
      ElMessage.success('更新成功')
    } else {
      await marketStore.createMarketEnvironment(submitData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    
    // 延迟刷新数据，确保后端数据已经保存
    setTimeout(() => {
      fetchData()
    }, 500)
    
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

// 加载模板数据
const loadTemplates = async () => {
  try {
    await Promise.all([
      templatesStore.fetchTraderTemplates({ limit: 1000 }),
      templatesStore.fetchStockTemplates({ limit: 1000 })
    ])
    
    // 直接从store的state中获取数据
    availableTraderTemplates.value = templatesStore.traderTemplates
    availableStockTemplates.value = templatesStore.stockTemplates
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败：' + error.message)
  }
}

// 添加交易员配置
const addTraderConfig = (command) => {
  if (command === 'refresh') {
    loadTemplates()
    return
  }
  
  const template = command
  if (!form.traderConfigs.find(config => config.templateId === template._id)) {
    form.traderConfigs.push({
      templateId: template._id,
      templateName: template.name,
      count: 1,
      capitalMultiplier: 1.0,
      capitalVariation: 0.2
    })
  }
}

// 添加股票配置
const addStockConfig = (command) => {
  if (command === 'refresh') {
    loadTemplates()
    return
  }
  
  const template = command
  if (!form.stockConfigs.find(config => config.templateId === template._id)) {
    form.stockConfigs.push({
      templateId: template._id,
      templateName: template.name,
      symbol: template.symbol,
      issuePrice: template.issuePrice || 10.00,
      totalShares: template.totalShares || 1000000
    })
  }
}

const removeTraderConfig = (index) => {
  form.traderConfigs.splice(index, 1)
}

const removeStockConfig = (index) => {
  form.stockConfigs.splice(index, 1)
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    allocationAlgorithm: 'weighted_random',
    traderConfigs: [],
    stockConfigs: []
  })
}

// 下载JSON文件
const downloadJsonFile = (data, filename) => {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// 工具函数
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '¥0.00'
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  fetchData()
  loadTemplates()
})
</script>

<style scoped>
.market-environment-manager {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.market-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 表单样式 */
.market-form-container {
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
  margin-bottom: 0;
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

.trader-configs,
.stock-configs {
  display: grid;
  gap: 16px;
}

.trader-config-item,
.stock-config-item {
  border-radius: 8px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.template-name {
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .market-environment-manager {
    padding: 10px;
  }
  
  .market-form-container {
    max-height: 60vh;
  }
  
  .trader-configs,
  .stock-configs {
    grid-template-columns: 1fr;
  }
}
</style>