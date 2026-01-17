<template>
  <div class="trader-template-manager">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>AI交易员模板管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filters">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="filters.search"
              placeholder="搜索模板名称"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.status" placeholder="状态" clearable @change="handleFilter">
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </el-col>

        </el-row>
      </div>

      <!-- 批量操作 -->
      <div v-if="hasSelected" class="batch-actions">
        <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
        <el-button @click="handleBatchStatus('active')">批量启用</el-button>
        <el-button @click="handleBatchStatus('inactive')">批量禁用</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="templates"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="initialCapital" label="初始资金">
          <template #default="{ row }">
            ¥{{ row.initialCapital.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="riskProfile" label="风险偏好">
          <template #default="{ row }">
            <el-tag :type="getRiskProfileTagType(row.riskProfile)">
              {{ getRiskProfileLabel(row.riskProfile) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tradingStyle" label="交易风格">
          <template #default="{ row }">
            {{ getTradingStyleLabel(row.tradingStyle) }}
          </template>
        </el-table-column>
        <el-table-column prop="maxPositions" label="最大持仓" />

        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
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
      :title="isEdit ? '编辑AI交易员模板' : '创建AI交易员模板'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="初始资金" prop="initialCapital">
          <el-input-number
            v-model="form.initialCapital"
            :min="1000"
            :max="100000000"
            placeholder="请输入初始资金"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="风险偏好" prop="riskProfile">
          <el-select v-model="form.riskProfile" placeholder="请选择风险偏好" style="width: 100%">
            <el-option label="保守型" value="conservative" />
            <el-option label="稳健型" value="moderate" />
            <el-option label="激进型" value="aggressive" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易风格" prop="tradingStyle">
          <el-select v-model="form.tradingStyle" placeholder="请选择交易风格" style="width: 100%">
            <el-option label="日内交易" value="day_trading" />
            <el-option label="波段交易" value="swing_trading" />
            <el-option label="趋势交易" value="position_trading" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大持仓" prop="maxPositions">
          <el-input-number
            v-model="form.maxPositions"
            :min="1"
            :max="100"
            placeholder="请输入最大持仓数量"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述信息" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        <el-form-item label="交易参数" prop="parameters">
          <el-input
            v-model="parametersJson"
            type="textarea"
            :rows="4"
            placeholder='请输入JSON格式的交易参数，例如：{"stopLoss": 0.05, "takeProfit": 0.1}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
// @ts-ignore - stores are still JS files
import { useTemplatesStore } from '../../stores/templates'
import { getRiskProfileLabel, getRiskProfileTagType, getTradingStyleLabel } from '@/utils/categoryUtils'

// Define types
interface TraderTemplate {
  _id: string
  name: string
  initialCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle: 'day_trading' | 'swing_trading' | 'position_trading'
  maxPositions: number
  parameters: Record<string, any>
  description?: string
  status: 'active' | 'inactive'
}

interface TraderTemplateForm {
  _id?: string
  name: string
  initialCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle: 'day_trading' | 'swing_trading' | 'position_trading'
  maxPositions: number
  description: string
  parameters: Record<string, any>
}

interface Filters {
  search: string
  status: string
}

const templatesStore = useTemplatesStore()

// 响应式数据
const loading = computed(() => templatesStore.traderTemplatesLoading)
const templates = computed(() => templatesStore.traderTemplates)
const pagination = computed(() => templatesStore.traderTemplatesPagination || { page: 1, limit: 10, total: 0, pages: 0 })
const hasSelected = computed(() => templatesStore.hasSelectedTraderTemplates)

const filters = reactive<Filters>({
  search: '',
  status: ''
})

const dialogVisible = ref<boolean>(false)
const isEdit = ref<boolean>(false)
const formRef = ref()
const parametersJson = ref<string>('')

const form = reactive<TraderTemplateForm>({
  name: '',
  initialCapital: 10000,
  riskProfile: 'moderate',
  tradingStyle: 'swing_trading',
  maxPositions: 10,
  description: '',
  parameters: {}
})

const rules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  initialCapital: [
    { required: true, message: '请输入初始资金', trigger: 'blur' },
    { type: 'number', min: 1000, max: 100000000, message: '初始资金必须在1000-100000000之间', trigger: 'blur' }
  ],
  riskProfile: [
    { required: true, message: '请选择风险偏好', trigger: 'change' }
  ],
  maxPositions: [
    { type: 'number', min: 1, max: 100, message: '最大持仓数量必须在1-100之间', trigger: 'blur' }
  ]
}

// 监听parameters变化
watch(() => parametersJson.value, (newVal: string) => {
  try {
    if (newVal.trim()) {
      form.parameters = JSON.parse(newVal)
    } else {
      form.parameters = {}
    }
  } catch (error) {
    // JSON格式错误，保持原值
  }
})

// 方法
const fetchData = async (): Promise<void> => {
  try {
    await templatesStore.fetchTraderTemplates()
  } catch (error) {
    ElMessage.error('获取数据失败：' + (error as Error).message)
  }
}

const handleSearch = (): void => {
  templatesStore.setTraderTemplatesFilters({ search: filters.search })
  fetchData()
}

const handleFilter = (): void => {
  templatesStore.setTraderTemplatesFilters({
    status: filters.status
  })
  fetchData()
}

const handleSelectionChange = (selection: TraderTemplate[]): void => {
  templatesStore.selectedTraderTemplates = selection.map(item => item._id)
}

const showCreateDialog = (): void => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 暴露方法给父组件
defineExpose({
  showCreateDialog
})

const handleEdit = (row: TraderTemplate): void => {
  isEdit.value = true
  Object.assign(form, row)
  parametersJson.value = JSON.stringify(row.parameters || {}, null, 2)
  dialogVisible.value = true
}

const handleDelete = async (row: TraderTemplate): Promise<void> => {
  try {
    await ElMessageBox.confirm('确定要删除这个AI交易员模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await templatesStore.deleteTraderTemplate(row._id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error as Error).message)
    }
  }
}

const handleBatchDelete = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm('确定要删除选中的AI交易员模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await templatesStore.batchDeleteTemplates('trader')
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error as Error).message)
    }
  }
}

const handleBatchStatus = async (status: 'active' | 'inactive'): Promise<void> => {
  try {
    const action = status === 'active' ? '启用' : '禁用'
    await ElMessageBox.confirm(`确定要${action}选中的AI交易员模板吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await templatesStore.batchUpdateTemplateStatus('trader', status)
    ElMessage.success(`批量${action}成功`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量操作失败：' + (error as Error).message)
    }
  }
}

const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value.validate()
    
    // 验证JSON格式
    if (parametersJson.value.trim()) {
      try {
        form.parameters = JSON.parse(parametersJson.value)
      } catch (error) {
        ElMessage.error('交易参数JSON格式不正确')
        return
      }
    }
    
    if (isEdit.value) {
      await templatesStore.updateTraderTemplate(form._id!, form)
      ElMessage.success('更新成功')
    } else {
      await templatesStore.createTraderTemplate(form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error('操作失败：' + (error as Error).message)
  }
}

const handleSizeChange = (size: number): void => {
  templatesStore.setTraderTemplatesPagination({ limit: size, page: 1 })
  fetchData()
}

const handleCurrentChange = (page: number): void => {
  templatesStore.setTraderTemplatesPagination({ page })
  fetchData()
}

const resetForm = (): void => {
  Object.assign(form, {
    name: '',
    initialCapital: 10000,
    riskProfile: 'moderate',
    tradingStyle: 'swing_trading',
    maxPositions: 10,
    description: '',
    parameters: {}
  })
  parametersJson.value = ''
}

// 生命周期
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.trader-template-manager {
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

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>