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
            <el-button size="small" @click="handleViewDetail(row)">查看</el-button>
            <el-button size="small" type="success" @click="handleExport(row)">导出</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建市场环境"
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
                        {{ template.name }} ({{ getRiskProfileLabel(template.riskProfile) }})
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
                    <div class="trader-info">
                      <span class="template-name">{{ config.templateName }}</span>
                      <el-tag v-if="config.riskProfile" size="small" :type="getRiskProfileTagType(config.riskProfile)">
                        {{ getRiskProfileLabel(config.riskProfile) }}
                      </el-tag>
                      <el-tag v-if="config.tradingStyle" size="small" type="info">
                        {{ getTradingStyleLabel(config.tradingStyle) }}
                      </el-tag>
                    </div>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="removeTraderConfig(index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  
                  <!-- 模板信息展示 -->
                  <div class="template-info">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item label="模板初始资金">
                          <el-input
                            :value="formatCurrency(config.initialCapital)"
                            readonly
                            placeholder="来自模板定义"
                          >
                            <template #suffix>
                              <el-tag size="small" type="info">模板定义</el-tag>
                            </template>
                          </el-input>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="模板描述">
                          <el-input
                            :value="config.description || '无描述'"
                            readonly
                            placeholder="来自模板定义"
                          >
                            <template #suffix>
                              <el-tag size="small" type="info">模板定义</el-tag>
                            </template>
                          </el-input>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </div>
                  
                  <!-- 可配置参数 -->
                  <div class="config-params">
                    <el-divider content-position="left">配置参数</el-divider>
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
                  </div>
                  
                  <div class="template-note">
                    <el-alert
                      title="交易员基础信息由模板定义，只能配置数量和资金参数"
                      type="info"
                      :closable="false"
                      show-icon
                    />
                  </div>
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
                    <div class="stock-info">
                      <span class="template-name">{{ config.templateName }} ({{ config.symbol }})</span>
                      <el-tag v-if="config.category" size="small" type="success">{{ config.category }}</el-tag>
                    </div>
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
                      <el-form-item label="发行价格">
                        <el-input
                          :value="formatCurrency(config.issuePrice)"
                          readonly
                          placeholder="来自模板定义"
                        >
                          <template #suffix>
                            <el-tag size="small" type="info">模板定义</el-tag>
                          </template>
                        </el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="总股数">
                        <el-input
                          :value="config.totalShares?.toLocaleString('zh-CN')"
                          readonly
                          placeholder="来自模板定义"
                        >
                          <template #suffix>
                            <el-tag size="small" type="info">模板定义</el-tag>
                          </template>
                        </el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <div class="template-note">
                    <el-alert
                      title="股票参数由模板定义，不可修改"
                      type="info"
                      :closable="false"
                      show-icon
                    />
                  </div>
                </el-card>
              </div>
            </div>
          </el-card>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 模板选择对话框 -->

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="市场环境详情"
      width="90%"
      :close-on-click-modal="false"
      append-to-body
    >
      <div v-if="currentMarketDetail" class="market-detail-container">
        <!-- 基本信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <h3>基本信息</h3>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="市场名称">{{ currentMarketDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="市场ID">{{ currentMarketDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="描述信息">{{ currentMarketDetail.description || '无描述' }}</el-descriptions-item>
            <el-descriptions-item label="分配算法">{{ getAllocationAlgorithmName(currentMarketDetail.allocationAlgorithm || '') }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentMarketDetail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ currentMarketDetail.version || '1.0.0' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 统计信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <h3>统计信息</h3>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="交易员总数" :value="currentMarketDetail.statistics?.traderCount || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="股票总数" :value="currentMarketDetail.statistics?.stockCount || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总资金" :value="currentMarketDetail.totalCapital || 0" :formatter="formatCurrency" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总市值" :value="currentMarketDetail.totalMarketValue || 0" :formatter="formatCurrency" />
            </el-col>
          </el-row>
        </el-card>

        <!-- 交易员信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <h3>交易员信息 ({{ currentMarketDetail.traders?.length || 0 }}人)</h3>
          </template>
          <el-table :data="currentMarketDetail.traders" max-height="300">
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="initialCapital" label="初始资金" width="120">
              <template #default="{ row }">
                {{ formatCurrency(row.initialCapital) }}
              </template>
            </el-table-column>
            <el-table-column prop="riskProfile" label="风险偏好" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getRiskProfileTagType(row.riskProfile)">
                  {{ getRiskProfileLabel(row.riskProfile) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tradingStyle" label="交易风格" width="120" />
            <el-table-column prop="holdings" label="持股数量" width="100">
              <template #default="{ row }">
                {{ row.holdings?.length || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="templateId.name" label="模板来源" show-overflow-tooltip />
          </el-table>
        </el-card>

        <!-- 股票信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <h3>股票信息 ({{ currentMarketDetail.stocks?.length || 0 }}只)</h3>
          </template>
          <el-table :data="currentMarketDetail.stocks" max-height="300">
            <el-table-column prop="symbol" label="股票代码" width="100" />
            <el-table-column prop="name" label="股票名称" width="150" />
            <el-table-column prop="issuePrice" label="发行价格" width="120">
              <template #default="{ row }">
                {{ formatCurrency(row.issuePrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalShares" label="总股数" width="120">
              <template #default="{ row }">
                {{ row.totalShares?.toLocaleString('zh-CN') }}
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <el-tag size="small" type="success">{{ getCategoryLabel(row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="holders" label="持有人数" width="100">
              <template #default="{ row }">
                {{ row.holders?.length || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="templateId.name" label="模板来源" show-overflow-tooltip />
          </el-table>
        </el-card>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleExportFromDetail">导出数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Delete, ArrowDown, Refresh } from '@element-plus/icons-vue'
// @ts-ignore - stores are still JS files
import { useMarketStore } from '@/stores/market'
// @ts-ignore - stores are still JS files  
import { useTemplatesStore } from '@/stores/templates'
import { getCategoryLabel, getRiskProfileTagType, getRiskProfileLabel, getTradingStyleLabel } from '@/utils/categoryUtils'

// Define local types based on what the component actually uses
interface MarketEnvironment {
  id: string
  name: string
  description: string
  allocationAlgorithm?: string
  version?: string
  createdAt: string | Date
  updatedAt: string | Date
  statistics?: {
    traderCount: number
    stockCount: number
  }
  totalCapital?: number
  totalMarketValue?: number
  traders?: Array<{
    name: string
    initialCapital: number
    riskProfile: string
    tradingStyle: string
    holdings?: any[]
    templateId?: { name: string }
  }>
  stocks?: Array<{
    symbol: string
    name: string
    issuePrice: number
    totalShares: number
    category: string
    holders?: any[]
    templateId?: { name: string }
  }>
}
interface TraderTemplate {
  _id: string
  name: string
  initialCapital: number
  riskProfile: string
  tradingStyle: string
  description?: string
  status: 'active' | 'inactive'
}

interface StockTemplate {
  _id: string
  name: string
  symbol: string
  issuePrice: number
  totalShares: number
  category: string
  description?: string
  status: 'active' | 'inactive'
}

interface TraderConfig {
  templateId: string
  templateName: string
  riskProfile: string
  tradingStyle: string
  initialCapital: number
  description: string
  count: number
  capitalMultiplier: number
  capitalVariation: number
  readonly: boolean
}

interface StockConfig {
  templateId: string
  templateName: string
  symbol: string
  category: string
  issuePrice: number
  totalShares: number
  readonly: boolean
}

interface CreateMarketEnvironmentRequest {
  name?: string
  description?: string
  allocationAlgorithm: 'weighted_random' | 'equal_distribution' | 'risk_based'
  traderConfigs: Array<{
    templateId: string
    count: number
    capitalMultiplier: number
    capitalVariation: number
  }>
  stockTemplateIds: string[]
}

const marketStore = useMarketStore()
const templatesStore = useTemplatesStore()

// 模板数据
const availableTraderTemplates = ref<TraderTemplate[]>([])
const availableStockTemplates = ref<StockTemplate[]>([])

// 响应式数据
const loading = ref<boolean>(false)
// 使用store中的响应式数据
const marketEnvironments = computed(() => marketStore.marketEnvironments)
const selectedEnvironments = ref<MarketEnvironment[]>([])
const hasSelected = computed(() => selectedEnvironments.value.length > 0)

interface Filters {
  search: string
  traderCount: string
  stockCount: string
}

const filters = reactive<Filters>({
  search: '',
  traderCount: '',
  stockCount: ''
})

// 使用store中的分页数据
const pagination = computed(() => marketStore.pagination)
// 对话框相关
const dialogVisible = ref<boolean>(false)
const submitting = ref<boolean>(false)
const formRef = ref()

// 详情对话框相关
const detailDialogVisible = ref<boolean>(false)
const currentMarketDetail = ref<MarketEnvironment | null>(null)

interface MarketForm {
  name: string
  description: string
  allocationAlgorithm: 'weighted_random' | 'equal_distribution' | 'risk_based'
  traderConfigs: TraderConfig[]
  stockConfigs: StockConfig[]
}

const form = reactive<MarketForm>({
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
const fetchData = async (): Promise<void> => {
  try {
    loading.value = true
    console.log('开始获取市场环境数据...')
    
    await marketStore.getMarketEnvironments({
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters
    })
    
    console.log('获取到的数据:', marketStore.marketEnvironments)
    console.log('分页信息:', marketStore.pagination)
    
  } catch (error) {
    console.error('获取市场环境列表失败:', error)
    ElMessage.error('获取数据失败：' + (error as Error).message)
    // 重置数据
    // marketEnvironments.value = [] // This is computed, can't assign
    // pagination.total = 0 // This is computed, can't assign
    // pagination.pages = 0 // This is computed, can't assign
  } finally {
    loading.value = false
  }
}

const handleSearch = (): void => {
  marketStore.pagination.page = 1
  fetchData()
}

const handleFilter = (): void => {
  marketStore.pagination.page = 1
  fetchData()
}

const handleSelectionChange = (selection: MarketEnvironment[]): void => {
  selectedEnvironments.value = selection
}

const handleSizeChange = (size: number): void => {
  marketStore.pagination.limit = size
  marketStore.pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page: number): void => {
  marketStore.pagination.page = page
  fetchData()
}

const showCreateDialog = (): void => {
  resetForm()
  dialogVisible.value = true
}

// 暴露方法给父组件
defineExpose({
  showCreateDialog
})

const handleViewDetail = async (row: MarketEnvironment): Promise<void> => {
  try {
    loading.value = true
    console.log('查看市场环境详情:', row)
    
    // 获取完整的市场环境数据
    const result = await marketStore.getMarketEnvironmentById(row.id)
    
    if (!result.success) {
      throw new Error('获取市场环境详情失败')
    }
    
    currentMarketDetail.value = result.data || null
    console.log('获取到的详情数据:', result.data)
    detailDialogVisible.value = true
    
  } catch (error) {
    console.error('查看详情失败:', error)
    ElMessage.error('获取详情失败：' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: MarketEnvironment): Promise<void> => {
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
      ElMessage.error('删除失败：' + (error as Error).message)
    }
  }
}

const handleExport = async (row: MarketEnvironment): Promise<void> => {
  try {
    const result = await marketStore.exportMarketEnvironment(row.id)
    
    if (result.success) {
      // 触发文件下载
      downloadJsonFile(result.data, result.filename || 'export.json')
      ElMessage.success('导出成功')
    }
  } catch (error) {
    ElMessage.error('导出失败：' + (error as Error).message)
  }
}

const handleBatchDelete = async (): Promise<void> => {
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
      ElMessage.error('批量删除失败：' + (error as Error).message)
    }
  }
}

const handleBatchExport = async (): Promise<void> => {
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
        downloadJsonFile(result.value.data, result.value.filename || 'export.json')
        successCount++
      }
    })
    
    ElMessage.success(`批量导出完成：成功 ${successCount} 个`)
    selectedEnvironments.value = []
  } catch (error) {
    ElMessage.error('批量导出失败：' + (error as Error).message)
  }
}

const handleSubmit = async (): Promise<void> => {
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
    
    // 验证模板ID的有效性
    const invalidTraderConfigs = form.traderConfigs.filter(config => !config.templateId || config.templateId.trim() === '')
    if (invalidTraderConfigs.length > 0) {
      ElMessage.error('存在无效的交易员模板ID')
      console.error('无效的交易员配置:', invalidTraderConfigs)
      return
    }
    
    const invalidStockConfigs = form.stockConfigs.filter(config => !config.templateId || config.templateId.trim() === '')
    if (invalidStockConfigs.length > 0) {
      ElMessage.error('存在无效的股票模板ID')
      console.error('无效的股票配置:', invalidStockConfigs)
      return
    }
    
    submitting.value = true
    
    // 转换数据格式以匹配后端API期望的格式
    const submitData: CreateMarketEnvironmentRequest = {
      allocationAlgorithm: form.allocationAlgorithm,
      traderConfigs: form.traderConfigs.map(config => ({
        templateId: config.templateId.trim(),
        count: Math.max(1, config.count || 1),
        capitalMultiplier: Math.max(0.1, config.capitalMultiplier || 1.0),
        capitalVariation: Math.max(0, Math.min(1, config.capitalVariation || 0.0))
      })),
      // 只提交模板ID，让后端使用模板中的原始数据
      stockTemplateIds: form.stockConfigs.map(config => config.templateId.trim()).filter(id => id)
    }
    
    // 只有在有值的情况下才添加 name 和 description
    if (form.name && form.name.trim()) {
      submitData.name = form.name.trim()
    }
    if (form.description && form.description.trim()) {
      submitData.description = form.description.trim()
    }
    
    console.log('提交的数据:', JSON.stringify(submitData, null, 2))
    console.log('股票配置（仅供参考）:', form.stockConfigs.map(config => ({
      模板ID: config.templateId,
      股票名称: config.templateName,
      股票代码: config.symbol,
      发行价格: config.issuePrice,
      总股数: config.totalShares,
      说明: '实际使用模板中的数据'
    })))
    
    await marketStore.createMarketEnvironment(submitData)
    ElMessage.success('创建成功')
    
    dialogVisible.value = false
    
    // 延迟刷新数据，确保后端数据已经保存
    setTimeout(() => {
      fetchData()
    }, 500)
    
  } catch (error) {
    console.error('提交失败:', error)
    
    // 提取详细的错误信息
    let errorMessage = '操作失败'
    if (error && typeof error === 'object') {
      const err = error as any
      if (err.message) {
        errorMessage = err.message
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      // 如果是验证错误，显示更详细的信息
      if (err.code === 'VALIDATION_ERROR' || err.response?.data?.error?.code === 'VALIDATION_ERROR') {
        console.error('验证错误详情:', err.response?.data)
        if (err.response?.data?.error?.details) {
          errorMessage += '\n详细信息: ' + JSON.stringify(err.response.data.error.details, null, 2)
        }
      }
    }
    
    ElMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 加载模板数据
const loadTemplates = async (): Promise<void> => {
  try {
    await Promise.all([
      templatesStore.fetchTraderTemplates({ limit: 1000 }),
      templatesStore.fetchStockTemplates({ limit: 1000 })
    ])
    
    // 直接从store的state中获取数据
    availableTraderTemplates.value = templatesStore.traderTemplates as any
    availableStockTemplates.value = templatesStore.stockTemplates as any
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败：' + (error as Error).message)
  }
}

// 添加交易员配置
const addTraderConfig = (command: TraderTemplate | string): void => {
  if (command === 'refresh') {
    loadTemplates()
    return
  }
  
  const template = command as TraderTemplate
  if (!form.traderConfigs.find(config => config.templateId === template._id)) {
    form.traderConfigs.push({
      templateId: template._id,
      templateName: template.name,
      riskProfile: template.riskProfile,
      tradingStyle: template.tradingStyle,
      initialCapital: template.initialCapital || 10000,
      description: template.description || '',
      count: 1,
      capitalMultiplier: 1.0,
      capitalVariation: 0.2,
      // 添加只读标识
      readonly: true
    })
  }
}

// 添加股票配置
const addStockConfig = (command: StockTemplate | string): void => {
  if (command === 'refresh') {
    loadTemplates()
    return
  }
  
  const template = command as StockTemplate
  if (!form.stockConfigs.find(config => config.templateId === template._id)) {
    form.stockConfigs.push({
      templateId: template._id,
      templateName: template.name,
      symbol: template.symbol,
      category: template.category || '未分类',
      issuePrice: template.issuePrice || 10.00,
      totalShares: template.totalShares || 1000000,
      // 添加只读标识，确保这些值不会被意外修改
      readonly: true
    })
  }
}

const removeTraderConfig = (index: number): void => {
  form.traderConfigs.splice(index, 1)
}

const removeStockConfig = (index: number): void => {
  form.stockConfigs.splice(index, 1)
}

const resetForm = (): void => {
  Object.assign(form, {
    name: '',
    description: '',
    allocationAlgorithm: 'weighted_random' as const,
    traderConfigs: [],
    stockConfigs: []
  })
}

// 下载JSON文件
const downloadJsonFile = (data: any, filename: string): void => {
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
const formatCurrency = (amount: number | string): string => {
  if (typeof amount !== 'number') return '¥0.00'
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 获取风险偏好标签类型
// 获取分配算法名称
const getAllocationAlgorithmName = (algorithm: string): string => {
  const nameMap: Record<string, string> = {
    'weighted_random': '加权随机分配',
    'equal_distribution': '平均分配',
    'risk_based': '风险基础分配'
  }
  return nameMap[algorithm] || algorithm
}

// 从详情页导出
const handleExportFromDetail = async (): Promise<void> => {
  if (currentMarketDetail.value) {
    await handleExport(currentMarketDetail.value)
  }
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

.trader-info,
.stock-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-info {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.config-params {
  margin-top: 16px;
}

.template-note {
  margin-top: 12px;
}

.template-note .el-alert {
  --el-alert-padding: 8px 12px;
  --el-alert-title-font-size: 12px;
}

/* 详情对话框样式 */
.market-detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
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