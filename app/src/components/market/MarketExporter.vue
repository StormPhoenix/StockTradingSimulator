<template>
  <div class="market-exporter">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h2>市场数据导出导入</h2>
          <p class="subtitle">导出市场环境为JSON文件，或从JSON文件导入市场环境</p>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="exporter-tabs">
        <!-- 导出标签页 -->
        <el-tab-pane label="数据导出" name="export">
          <div class="export-section">
            <el-card shadow="never" class="section-card">
              <template #header>
                <h3>选择要导出的市场环境</h3>
              </template>

              <!-- 市场环境列表 -->
              <div class="market-list">
                <el-table
                  v-loading="loadingMarkets"
                  :data="marketEnvironments"
                  @selection-change="handleSelectionChange"
                  style="width: 100%"
                >
                  <el-table-column type="selection" width="55" />
                  
                  <el-table-column prop="name" label="市场名称" min-width="200">
                    <template #default="{ row }">
                      <div class="market-name">
                        <span>{{ row.name }}</span>
                        <el-tag v-if="row.id" size="small" type="info">{{ row.id.slice(-8) }}</el-tag>
                      </div>
                    </template>
                  </el-table-column>

                  <el-table-column prop="statistics.traderCount" label="交易员数" width="100" />
                  <el-table-column prop="statistics.stockCount" label="股票数" width="100" />
                  
                  <el-table-column prop="totalCapital" label="总资金" width="150">
                    <template #default="{ row }">
                      {{ formatCurrency(row.totalCapital) }}
                    </template>
                  </el-table-column>

                  <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">
                      {{ formatDateTime(row.createdAt) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                      <el-button
                        type="primary"
                        size="small"
                        @click="exportSingleMarket(row)"
                        :loading="exportingIds.includes(row.id)"
                      >
                        导出
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div class="pagination-wrapper">
                  <el-pagination
                    v-model:current-page="pagination.page"
                    v-model:page-size="pagination.limit"
                    :total="pagination.total"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                  />
                </div>
              </div>

              <!-- 批量导出操作 -->
              <div v-if="selectedMarkets.length > 0" class="batch-export">
                <el-alert
                  :title="`已选择 ${selectedMarkets.length} 个市场环境`"
                  type="info"
                  show-icon
                  :closable="false"
                />
                
                <div class="batch-actions">
                  <el-button
                    type="primary"
                    @click="exportSelectedMarkets"
                    :loading="batchExporting"
                  >
                    <el-icon><Download /></el-icon>
                    批量导出
                  </el-button>
                  
                  <el-button @click="clearSelection">
                    清除选择
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 导入标签页 -->
        <el-tab-pane label="数据导入" name="import">
          <div class="import-section">
            <el-card shadow="never" class="section-card">
              <template #header>
                <h3>从JSON文件导入市场环境</h3>
              </template>

              <!-- 文件上传 -->
              <div class="upload-area">
                <el-upload
                  ref="uploadRef"
                  class="upload-dragger"
                  drag
                  :auto-upload="false"
                  :show-file-list="false"
                  accept=".json"
                  :on-change="handleFileChange"
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">
                    将JSON文件拖到此处，或<em>点击上传</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      只能上传JSON文件，且不超过10MB
                    </div>
                  </template>
                </el-upload>
              </div>

              <!-- 文件信息 -->
              <div v-if="importFile" class="file-info">
                <el-card shadow="hover">
                  <div class="file-details">
                    <div class="file-header">
                      <el-icon><Document /></el-icon>
                      <span class="file-name">{{ importFile.name }}</span>
                      <el-tag size="small">{{ formatFileSize(importFile.size) }}</el-tag>
                    </div>
                    
                    <div v-if="filePreview" class="file-preview">
                      <h4>文件预览</h4>
                      <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="市场ID">
                          {{ filePreview.id }}
                        </el-descriptions-item>
                        <el-descriptions-item label="市场名称">
                          {{ filePreview.name }}
                        </el-descriptions-item>
                        <el-descriptions-item label="数据版本">
                          {{ filePreview.version }}
                        </el-descriptions-item>
                        <el-descriptions-item label="交易员数量">
                          {{ filePreview.traderCount }}
                        </el-descriptions-item>
                        <el-descriptions-item label="股票数量">
                          {{ filePreview.stockCount }}
                        </el-descriptions-item>
                        <el-descriptions-item label="总资金">
                          {{ formatCurrency(filePreview.totalCapital) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="导出时间">
                          {{ formatDateTime(filePreview.exportedAt) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="校验和">
                          <el-tag size="small" type="success">{{ filePreview.checksum?.slice(0, 8) }}...</el-tag>
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>

                    <!-- 验证结果 -->
                    <div v-if="validationResult" class="validation-result">
                      <h4>数据验证结果</h4>
                      <el-alert
                        :title="validationResult.valid ? '验证通过' : '验证失败'"
                        :type="validationResult.valid ? 'success' : 'error'"
                        show-icon
                        :closable="false"
                      >
                        <template #default>
                          <div class="validation-summary">
                            <p>严重错误: {{ validationResult.summary.criticalErrors }}</p>
                            <p>警告: {{ validationResult.summary.warnings }}</p>
                            <p>信息: {{ validationResult.summary.informational }}</p>
                          </div>
                        </template>
                      </el-alert>

                      <!-- 详细错误信息 -->
                      <div v-if="validationResult.errors.length > 0" class="error-details">
                        <h5>错误详情:</h5>
                        <ul>
                          <li v-for="error in validationResult.errors" :key="error" class="error-item">
                            {{ error }}
                          </li>
                        </ul>
                      </div>

                      <!-- 警告信息 -->
                      <div v-if="validationResult.warnings.length > 0" class="warning-details">
                        <h5>警告信息:</h5>
                        <ul>
                          <li v-for="warning in validationResult.warnings" :key="warning" class="warning-item">
                            {{ warning }}
                          </li>
                        </ul>
                      </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="file-actions">
                      <el-button
                        type="primary"
                        @click="validateImportFile"
                        :loading="validating"
                        :disabled="!importFile"
                      >
                        <el-icon><Check /></el-icon>
                        验证数据
                      </el-button>
                      
                      <el-button
                        type="success"
                        @click="importMarketEnvironment"
                        :loading="importing"
                        :disabled="!validationResult || !validationResult.valid"
                      >
                        <el-icon><Upload /></el-icon>
                        导入数据
                      </el-button>
                      
                      <el-button @click="clearImportFile">
                        <el-icon><Delete /></el-icon>
                        清除文件
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 历史记录标签页 -->
        <el-tab-pane label="操作历史" name="history">
          <div class="history-section">
            <el-card shadow="never" class="section-card">
              <template #header>
                <div class="section-header">
                  <h3>导出导入历史</h3>
                  <el-button @click="clearHistory" type="danger" text>
                    <el-icon><Delete /></el-icon>
                    清除历史
                  </el-button>
                </div>
              </template>

              <div v-if="operationHistory.length === 0" class="empty-history">
                <el-empty description="暂无操作历史" />
              </div>

              <el-timeline v-else>
                <el-timeline-item
                  v-for="item in operationHistory"
                  :key="item.id"
                  :timestamp="formatDateTime(item.timestamp)"
                  :type="item.type === 'export' ? 'primary' : 'success'"
                >
                  <div class="history-item">
                    <div class="history-header">
                      <el-tag :type="item.type === 'export' ? 'primary' : 'success'">
                        {{ item.type === 'export' ? '导出' : '导入' }}
                      </el-tag>
                      <span class="history-title">{{ item.title }}</span>
                    </div>
                    <div class="history-details">
                      <p>{{ item.description }}</p>
                      <div v-if="item.statistics" class="history-stats">
                        <el-tag size="small">交易员: {{ item.statistics.traders }}</el-tag>
                        <el-tag size="small">股票: {{ item.statistics.stocks }}</el-tag>
                        <el-tag size="small">资金: {{ formatCurrency(item.statistics.capital) }}</el-tag>
                      </div>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 导入结果对话框 -->
    <el-dialog
      v-model="importResultVisible"
      title="导入结果"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="importResult" class="import-result">
        <el-result
          :icon="importResult.success ? 'success' : 'error'"
          :title="importResult.success ? '导入成功' : '导入失败'"
          :sub-title="importResult.message"
        >
          <template #extra>
            <div v-if="importResult.success" class="result-details">
              <h4>导入详情</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="新市场ID">
                  {{ importResult.data?.id }}
                </el-descriptions-item>
                <el-descriptions-item label="市场名称">
                  {{ importResult.data?.name }}
                </el-descriptions-item>
                <el-descriptions-item label="交易员数量">
                  {{ importResult.data?.statistics?.traderCount }}
                </el-descriptions-item>
                <el-descriptions-item label="股票数量">
                  {{ importResult.data?.statistics?.stockCount }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="result-actions">
              <el-button
                v-if="importResult.success"
                type="primary"
                @click="viewImportedMarket"
              >
                查看详情
              </el-button>
              <el-button @click="importResultVisible = false">
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download,
  Upload,
  UploadFilled,
  Document,
  Check,
  Delete
} from '@element-plus/icons-vue'
import { useMarketStore } from '../../stores/market'

// 响应式数据
const activeTab = ref('export')
const loadingMarkets = ref(false)
const marketEnvironments = ref([])
const selectedMarkets = ref([])
const exportingIds = ref([])
const batchExporting = ref(false)

// 导入相关
const uploadRef = ref()
const importFile = ref(null)
const filePreview = ref(null)
const validationResult = ref(null)
const validating = ref(false)
const importing = ref(false)
const importResult = ref(null)
const importResultVisible = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 操作历史
const operationHistory = ref([])

// Store
const marketStore = useMarketStore()

// 计算属性
const hasSelectedMarkets = computed(() => selectedMarkets.value.length > 0)

// 生命周期
onMounted(() => {
  loadMarketEnvironments()
  loadOperationHistory()
})

// 方法
const loadMarketEnvironments = async () => {
  try {
    loadingMarkets.value = true
    const result = await marketStore.getMarketEnvironments({
      page: pagination.page,
      limit: pagination.limit
    })
    
    if (result.success) {
      marketEnvironments.value = result.data
      pagination.total = result.pagination.total
    }
  } catch (error) {
    console.error('加载市场环境失败:', error)
    ElMessage.error('加载市场环境失败')
  } finally {
    loadingMarkets.value = false
  }
}

const handleSelectionChange = (selection) => {
  selectedMarkets.value = selection
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadMarketEnvironments()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadMarketEnvironments()
}

const clearSelection = () => {
  selectedMarkets.value = []
}

// 导出单个市场环境
const exportSingleMarket = async (market) => {
  try {
    exportingIds.value.push(market.id)
    
    const result = await marketStore.exportMarketEnvironment(market.id)
    
    if (result.success) {
      // 触发文件下载
      downloadJsonFile(result.data, result.filename)
      
      // 记录操作历史
      addOperationHistory('export', `导出市场环境: ${market.name}`, {
        traders: market.statistics?.traderCount || 0,
        stocks: market.statistics?.stockCount || 0,
        capital: market.totalCapital || 0
      })
      
      ElMessage.success('导出成功')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error(error.message || '导出失败')
  } finally {
    const index = exportingIds.value.indexOf(market.id)
    if (index > -1) {
      exportingIds.value.splice(index, 1)
    }
  }
}

// 批量导出
const exportSelectedMarkets = async () => {
  if (selectedMarkets.value.length === 0) {
    ElMessage.warning('请选择要导出的市场环境')
    return
  }

  try {
    batchExporting.value = true
    
    const exportPromises = selectedMarkets.value.map(market => 
      marketStore.exportMarketEnvironment(market.id)
    )
    
    const results = await Promise.allSettled(exportPromises)
    
    let successCount = 0
    let failureCount = 0
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        const market = selectedMarkets.value[index]
        downloadJsonFile(result.value.data, result.value.filename)
        successCount++
      } else {
        failureCount++
      }
    })
    
    // 记录批量操作历史
    addOperationHistory('export', `批量导出 ${selectedMarkets.value.length} 个市场环境`, {
      traders: selectedMarkets.value.reduce((sum, m) => sum + (m.statistics?.traderCount || 0), 0),
      stocks: selectedMarkets.value.reduce((sum, m) => sum + (m.statistics?.stockCount || 0), 0),
      capital: selectedMarkets.value.reduce((sum, m) => sum + (m.totalCapital || 0), 0)
    })
    
    ElMessage.success(`批量导出完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    clearSelection()
    
  } catch (error) {
    console.error('批量导出失败:', error)
    ElMessage.error('批量导出失败')
  } finally {
    batchExporting.value = false
  }
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

// 处理文件选择
const handleFileChange = (file) => {
  if (!file.raw) return
  
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.json')) {
    ElMessage.error('只能上传JSON文件')
    return
  }
  
  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过10MB')
    return
  }
  
  importFile.value = file.raw
  validationResult.value = null
  
  // 读取文件预览
  readFilePreview(file.raw)
}

// 读取文件预览
const readFilePreview = (file) => {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      // 创建预览信息
      filePreview.value = {
        id: data.id,
        name: data.name,
        version: data.version,
        traderCount: data.traders?.length || 0,
        stockCount: data.stocks?.length || 0,
        totalCapital: data.configuration?.totalCapital || 0,
        exportedAt: data.exportedAt,
        checksum: data.metadata?.checksum
      }
      
    } catch (error) {
      ElMessage.error('JSON文件格式无效')
      filePreview.value = null
    }
  }
  
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  
  reader.readAsText(file)
}

// 验证导入文件
const validateImportFile = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  try {
    validating.value = true
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const result = await marketStore.validateImportData(data)
        
        validationResult.value = result
        
        if (result.valid) {
          ElMessage.success('数据验证通过')
        } else {
          ElMessage.warning('数据验证发现问题，请查看详情')
        }
      } catch (error) {
        ElMessage.error('数据验证失败: ' + error.message)
        validationResult.value = {
          valid: false,
          errors: [error.message],
          warnings: [],
          summary: { criticalErrors: 1, warnings: 0, informational: 0 }
        }
      } finally {
        validating.value = false
      }
    }
    
    reader.readAsText(importFile.value)
    
  } catch (error) {
    console.error('验证失败:', error)
    ElMessage.error('验证失败')
    validating.value = false
  }
}

// 导入市场环境
const importMarketEnvironment = async () => {
  if (!importFile.value || !validationResult.value?.valid) {
    ElMessage.warning('请先验证数据')
    return
  }
  
  try {
    importing.value = true
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const result = await marketStore.importMarketEnvironment(data)
        
        importResult.value = result
        importResultVisible.value = true
        
        if (result.success) {
          // 记录操作历史
          addOperationHistory('import', `导入市场环境: ${data.name}`, {
            traders: data.traders?.length || 0,
            stocks: data.stocks?.length || 0,
            capital: data.configuration?.totalCapital || 0
          })
          
          // 刷新市场环境列表
          loadMarketEnvironments()
          
          // 清除导入文件
          clearImportFile()
          
          ElMessage.success('导入成功')
        } else {
          ElMessage.error(result.message || '导入失败')
        }
      } catch (error) {
        ElMessage.error('导入失败: ' + error.message)
      } finally {
        importing.value = false
      }
    }
    
    reader.readAsText(importFile.value)
    
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
    importing.value = false
  }
}

// 清除导入文件
const clearImportFile = () => {
  importFile.value = null
  filePreview.value = null
  validationResult.value = null
  uploadRef.value?.clearFiles()
}

// 查看导入的市场环境
const viewImportedMarket = () => {
  if (importResult.value?.success) {
    // 跳转到市场环境详情页
    ElMessage.info('市场环境详情页面开发中...')
  }
  importResultVisible.value = false
}

// 添加操作历史
const addOperationHistory = (type, title, statistics) => {
  const historyItem = {
    id: Date.now(),
    type,
    title,
    description: `${type === 'export' ? '导出' : '导入'}操作于 ${formatDateTime(new Date())} 完成`,
    statistics,
    timestamp: new Date()
  }
  
  operationHistory.value.unshift(historyItem)
  
  // 保存到本地存储
  saveOperationHistory()
}

// 加载操作历史
const loadOperationHistory = () => {
  try {
    const stored = localStorage.getItem('market-export-import-history')
    if (stored) {
      const history = JSON.parse(stored)
      operationHistory.value = history.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }))
    }
  } catch (error) {
    console.error('加载操作历史失败:', error)
  }
}

// 保存操作历史
const saveOperationHistory = () => {
  try {
    // 只保留最近50条记录
    const historyToSave = operationHistory.value.slice(0, 50)
    localStorage.setItem('market-export-import-history', JSON.stringify(historyToSave))
  } catch (error) {
    console.error('保存操作历史失败:', error)
  }
}

// 清除历史
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有操作历史吗？', '确认操作', {
      type: 'warning'
    })
    
    operationHistory.value = []
    localStorage.removeItem('market-export-import-history')
    ElMessage.success('历史记录已清除')
  } catch {
    // 用户取消
  }
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.market-exporter {
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

.exporter-tabs {
  margin-top: 20px;
}

.section-card {
  margin-bottom: 20px;
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

/* 导出相关样式 */
.market-list {
  margin-bottom: 20px;
}

.market-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.batch-export {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.batch-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

/* 导入相关样式 */
.upload-area {
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.file-info {
  margin-top: 20px;
}

.file-details {
  padding: 20px;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.file-name {
  font-weight: bold;
  color: #303133;
}

.file-preview {
  margin: 20px 0;
}

.file-preview h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.validation-result {
  margin: 20px 0;
}

.validation-result h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.validation-summary p {
  margin: 5px 0;
}

.error-details,
.warning-details {
  margin-top: 15px;
}

.error-details h5,
.warning-details h5 {
  margin: 0 0 8px 0;
  color: #303133;
}

.error-details ul,
.warning-details ul {
  margin: 0;
  padding-left: 20px;
}

.error-item {
  color: #f56c6c;
  margin-bottom: 5px;
}

.warning-item {
  color: #e6a23c;
  margin-bottom: 5px;
}

.file-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

/* 历史记录样式 */
.empty-history {
  text-align: center;
  padding: 40px 0;
}

.history-item {
  padding: 10px 0;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.history-title {
  font-weight: bold;
  color: #303133;
}

.history-details p {
  margin: 0 0 8px 0;
  color: #606266;
}

.history-stats {
  display: flex;
  gap: 8px;
}

/* 结果对话框样式 */
.import-result {
  text-align: center;
}

.result-details {
  margin: 20px 0;
}

.result-details h4 {
  margin-bottom: 15px;
  color: #303133;
}

.result-actions {
  margin-top: 20px;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>