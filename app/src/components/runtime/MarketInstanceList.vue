<template>
  <div class="market-instance-list">
    <div class="page-header">
      <h1 class="page-title">市场实例管理</h1>
      <p class="page-description">管理您的交易市场实例</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="state.searchQuery"
          placeholder="搜索市场实例..."
          prefix-icon="Search"
          class="search-input"
          @input="handleSearch"
        />
        <el-select
          v-model="state.filterStatus"
          placeholder="状态筛选"
          class="status-filter"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="all" />
          <el-option label="活跃" value="active" />
          <el-option label="创建中" value="creating" />
          <el-option label="已停止" value="stopped" />
          <el-option label="错误" value="error" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button
          type="primary"
          icon="Plus"
          @click="handleOpenCreateDialog"
        >
          创建市场实例
        </el-button>
        <el-button
          icon="Refresh"
          @click="handleRefresh"
          :loading="state.isLoading"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 市场实例列表 -->
    <div class="market-instance-grid" v-loading="state.isLoading">
      <div
        v-for="marketInstance in filteredMarketInstances"
        :key="marketInstance.exchangeId"
        class="market-instance-card"
        @click="handleViewMarketInstance(marketInstance.exchangeId)"
      >
        <div class="card-header">
          <div class="market-instance-info">
            <h3 class="market-instance-name">{{ marketInstance.name }}</h3>
            <p class="market-instance-description">{{ marketInstance.description }}</p>
          </div>
          <div class="market-instance-status">
            <el-tag
              :type="getStatusType(marketInstance.status)"
              class="status-tag"
            >
              {{ getStatusText(marketInstance.status) }}
            </el-tag>
          </div>
        </div>

        <div class="card-content">
          <div class="statistics">
            <div class="stat-item">
              <span class="stat-label">交易员</span>
              <span class="stat-value">{{ marketInstance.statistics.traderCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">股票</span>
              <span class="stat-value">{{ marketInstance.statistics.stockCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总资金</span>
              <span class="stat-value">¥{{ formatCurrency(marketInstance.statistics.totalCapital) }}</span>
            </div>
          </div>

          <div class="template-info">
            <el-tag size="small" type="info">
              {{ marketInstance.templateInfo.templateName }}
            </el-tag>
          </div>
        </div>

        <div class="card-footer">
          <div class="time-info">
            <span class="created-time">
              创建于 {{ formatTime(marketInstance.createdAt) }}
            </span>
            <span class="last-active">
              最后活跃 {{ formatTime(marketInstance.lastActiveAt) }}
            </span>
          </div>
          <div class="actions">
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="handleViewMarketInstance(marketInstance.exchangeId)"
            >
              查看详情
            </el-button>
            <el-button
              size="small"
              type="danger"
              text
              @click.stop="handleDeleteMarketInstance(marketInstance.exchangeId)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredMarketInstances.length === 0 && !state.isLoading" class="empty-state">
        <el-empty description="暂无市场实例">
          <el-button type="primary" @click="handleOpenCreateDialog">
            创建第一个市场实例
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="filteredMarketInstances.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredMarketInstances.length"
        :page-sizes="[12, 24, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建市场实例弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建交易市场实例"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleCloseCreateDialog"
    >
      <div class="create-market-instance-form">
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createFormRules"
          label-width="120px"
          label-position="left"
        >
          <el-form-item label="选择模板" prop="templateId">
            <el-select
              v-model="createForm.templateId"
              placeholder="请选择市场实例模板"
              style="width: 100%"
              :loading="isLoadingTemplates"
              @change="handleTemplateChange"
            >
              <el-option
                v-for="template in availableTemplates"
                :key="template.id"
                :label="`${template.name} (${template.traderCount}个交易员, ${template.stockCount}只股票)`"
                :value="template.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="自定义名称" prop="customName">
            <el-input
              v-model="createForm.customName"
              placeholder="输入市场实例名称（可选）"
              clearable
            />
          </el-form-item>

          <!-- 模板预览 -->
          <div v-if="selectedTemplate" class="template-preview">
            <el-divider content-position="left">模板预览</el-divider>
            <div class="preview-grid">
              <div class="preview-item">
                <span class="label">模板名称:</span>
                <span class="value">{{ selectedTemplate.name }}</span>
              </div>
              <div class="preview-item">
                <span class="label">描述:</span>
                <span class="value">{{ selectedTemplate.description }}</span>
              </div>
              <div class="preview-item">
                <span class="label">AI交易员:</span>
                <span class="value">{{ selectedTemplate.traderCount }}个</span>
              </div>
              <div class="preview-item">
                <span class="label">股票数量:</span>
                <span class="value">{{ selectedTemplate.stockCount }}只</span>
              </div>
              <div class="preview-item">
                <span class="label">难度:</span>
                <el-tag :type="getDifficultyTagType(selectedTemplate.difficulty)">
                  {{ getDifficultyText(selectedTemplate.difficulty) }}
                </el-tag>
              </div>
              <div class="preview-item">
                <span class="label">预计创建时间:</span>
                <span class="value">{{ selectedTemplate.estimatedCreationTime }}秒</span>
              </div>
            </div>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseCreateDialog" :disabled="isCreating">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handleCreateMarketInstance"
            :loading="isCreating"
            :disabled="!canCreateMarketInstance"
          >
            {{ isCreating ? '创建中...' : '创建市场实例' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import type { 
  EnvironmentPreview, 
  EnvironmentStatus,
  MarketInstanceListState 
} from '@/types/environment';
import { EnvironmentService } from '@/services/environmentApi';
import templateService from '@/services/templateService';

const router = useRouter();

// 响应式状态
const state = reactive<MarketInstanceListState>({
  environments: [],
  isLoading: false,
  selectedEnvironment: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  filterStatus: 'all',
  searchQuery: ''
});

// 分页状态
const currentPage = ref(1);
const pageSize = ref(12);

// 创建市场实例弹窗状态
const createDialogVisible = ref(false);
const createFormRef = ref<FormInstance>();
const isLoadingTemplates = ref(false);
const isCreating = ref(false);
const availableTemplates = ref<any[]>([]);

// 创建市场实例表单
const createForm = reactive({
  templateId: '',
  customName: ''
});

// 表单验证规则
const createFormRules = {
  templateId: [
    { required: true, message: '请选择市场实例模板', trigger: 'change' }
  ]
};

// 计算属性
const filteredMarketInstances = computed(() => {
  // 确保 environments 是一个数组
  const marketInstances = Array.isArray(state.environments) ? state.environments : [];
  let filtered = [...marketInstances];

  // 状态筛选
  if (state.filterStatus !== 'all') {
    filtered = filtered.filter(env => env.status === state.filterStatus);
  }

  // 搜索筛选
  if (state.searchQuery.trim()) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(env => 
      env.name.toLowerCase().includes(query) ||
      env.description.toLowerCase().includes(query)
    );
  }

  // 排序
  filtered.sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    if (state.sortBy === 'traderCount') {
      aValue = a.statistics.traderCount;
      bValue = b.statistics.traderCount;
    } else {
      aValue = a[state.sortBy];
      bValue = b[state.sortBy];
    }
    
    if (state.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return filtered;
});

const selectedTemplate = computed(() => {
  return availableTemplates.value.find(t => t.id === createForm.templateId);
});

const canCreateMarketInstance = computed(() => {
  return createForm.templateId && !isCreating.value;
});

// 方法
const loadMarketInstances = async () => {
  try {
    state.isLoading = true;
    const response = await EnvironmentService.getAll();
    // 确保 environments 是一个数组
    state.environments = Array.isArray(response.environments) ? response.environments : [];
  } catch (error) {
    console.error('Failed to load market instances:', error);
    ElMessage.error('加载市场实例列表失败');
    // 发生错误时确保 environments 是空数组
    state.environments = [];
  } finally {
    state.isLoading = false;
  }
};

const loadTemplates = async () => {
  try {
    isLoadingTemplates.value = true;
    
    // 从后端获取市场环境模板
    const response = await templateService.getMarketEnvironments();
    
    if (response.success && response.data) {
      // 将市场环境数据转换为模板选项格式
      availableTemplates.value = response.data.map((marketEnv: any) => ({
        id: marketEnv._id || marketEnv.id,
        name: marketEnv.name || '未命名模板',
        description: marketEnv.description || '暂无描述',
        traderCount: marketEnv.traders?.length || 0,
        stockCount: marketEnv.stocks?.length || 0,
        difficulty: marketEnv.difficulty || 'medium',
        estimatedCreationTime: marketEnv.estimatedCreationTime || 30
      }));
    } else {
      throw new Error('获取模板失败');
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
    ElMessage.error('加载模板列表失败');
    // 发生错误时使用空数组
    availableTemplates.value = [];
  } finally {
    isLoadingTemplates.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleFilterChange = () => {
  currentPage.value = 1;
};

const handleRefresh = () => {
  loadMarketInstances();
};

const handleCreateMarketInstance = async () => {
  if (!createFormRef.value) return;
  
  try {
    const valid = await createFormRef.value.validate();
    if (!valid) return;

    isCreating.value = true;
    
    await EnvironmentService.create(createForm.templateId, createForm.customName || undefined);
    ElMessage.success('市场实例创建成功');
    
    // 关闭弹窗并重新加载列表
    createDialogVisible.value = false;
    resetCreateForm();
    await loadMarketInstances();
  } catch (error) {
    console.error('Failed to create market instance:', error);
    ElMessage.error('创建市场实例失败');
  } finally {
    isCreating.value = false;
  }
};

const handleOpenCreateDialog = async () => {
  createDialogVisible.value = true;
  await loadTemplates();
};

const handleCloseCreateDialog = () => {
  if (isCreating.value) {
    ElMessage.warning('市场实例创建中，请稍候...');
    return;
  }
  createDialogVisible.value = false;
  resetCreateForm();
};

const handleTemplateChange = () => {
  // 模板变化时可以做一些处理
};

const resetCreateForm = () => {
  createForm.templateId = '';
  createForm.customName = '';
  if (createFormRef.value) {
    createFormRef.value.resetFields();
  }
};

const handleViewMarketInstance = (marketInstanceId: string) => {
  router.push(`/environments/${marketInstanceId}`);
};

const handleDeleteMarketInstance = async (marketInstanceId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个市场实例吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await EnvironmentService.destroy(marketInstanceId);
    ElMessage.success('市场实例删除成功');
    await loadMarketInstances();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete market instance:', error);
      ElMessage.error('删除市场实例失败');
    }
  }
};

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  currentPage.value = 1;
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
};

// 工具函数
const getStatusType = (status: EnvironmentStatus) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    creating: 'warning',
    stopped: 'info',
    error: 'danger'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: EnvironmentStatus) => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    creating: '创建中',
    stopped: '已停止',
    error: '错误'
  };
  return statusMap[status] || status;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount);
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};

const getDifficultyText = (difficulty: string) => {
  const difficultyMap: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return difficultyMap[difficulty] || difficulty;
};

const getDifficultyTagType = (difficulty: string) => {
  const typeMap: Record<string, string> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  };
  return typeMap[difficulty] || 'info';
};

// 生命周期
onMounted(() => {
  loadMarketInstances();
});
</script>

<style scoped>
.market-instance-list {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.status-filter {
  width: 120px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.market-instance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.market-instance-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e1e8ed;
}

.market-instance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.market-instance-info {
  flex: 1;
}

.market-instance-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.market-instance-description {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

.market-instance-status {
  margin-left: 16px;
}

.status-tag {
  font-weight: 500;
}

.card-content {
  margin-bottom: 16px;
}

.statistics {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.template-info {
  margin-top: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #ecf0f1;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.created-time,
.last-active {
  font-size: 12px;
  color: #95a5a6;
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .market-instance-list {
    padding: 16px;
  }

  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
    gap: 12px;
  }

  .search-input {
    width: 100%;
  }

  .market-instance-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .statistics {
    flex-direction: column;
    gap: 12px;
  }

  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .actions {
    justify-content: center;
  }
}

/* 创建市场实例弹窗样式 */
.create-market-instance-form {
  padding: 8px 0;
}

.template-preview {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.preview-item .label {
  font-weight: 500;
  color: #6c757d;
  font-size: 14px;
}

.preview-item .value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>