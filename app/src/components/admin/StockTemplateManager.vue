<template>
  <div class="stock-template-manager">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>股票模板管理</span>
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
              placeholder="搜索股票名称或代码"
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
          <el-col :span="4">
            <el-select v-model="filters.category" placeholder="分类" clearable @change="handleFilter">
              <el-option label="科技" value="tech" />
              <el-option label="金融" value="finance" />
              <el-option label="医疗" value="healthcare" />
              <el-option label="能源" value="energy" />
              <el-option label="消费" value="consumer" />
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
        <el-table-column prop="name" label="股票名称" />
        <el-table-column prop="symbol" label="股票代码" />
        <el-table-column prop="issuePrice" label="发行价格">
          <template #default="{ row }">
            ¥{{ row.issuePrice.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalShares" label="总股本">
          <template #default="{ row }">
            {{ row.totalShares.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类">
          <template #default="{ row }">
            <el-tag>{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
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
      :title="isEdit ? '编辑股票模板' : '创建股票模板'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="股票名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入股票名称" />
        </el-form-item>
        <el-form-item label="股票代码" prop="symbol">
          <el-input v-model="form.symbol" placeholder="请输入股票代码" />
        </el-form-item>
        <el-form-item label="发行价格" prop="issuePrice">
          <el-input-number
            v-model="form.issuePrice"
            :min="0.01"
            :max="999999.99"
            :precision="2"
            placeholder="请输入发行价格"
          />
        </el-form-item>
        <el-form-item label="总股本" prop="totalShares">
          <el-input-number
            v-model="form.totalShares"
            :min="1"
            :max="1000000000"
            placeholder="请输入总股本"
          />
        </el-form-item>
        <el-form-item label="股票分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="科技" value="tech" />
            <el-option label="金融" value="finance" />
            <el-option label="医疗" value="healthcare" />
            <el-option label="能源" value="energy" />
            <el-option label="消费" value="consumer" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述信息" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
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

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { useTemplatesStore } from '../../stores/templates.js';

const templatesStore = useTemplatesStore();

// 响应式数据
const loading = computed(() => templatesStore.stockTemplatesLoading);
const templates = computed(() => templatesStore.stockTemplates);
const pagination = computed(() => templatesStore.stockTemplatesPagination || { page: 1, limit: 10, total: 0, pages: 0 });
const hasSelected = computed(() => templatesStore.hasSelectedStockTemplates);

const filters = reactive({
  search: '',
  status: '',
  category: ''
});

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();
const form = reactive({
  name: '',
  symbol: '',
  issuePrice: null,
  totalShares: null,
  category: '',
  description: ''
});

const rules = {
  name: [
    { required: true, message: '请输入股票名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  symbol: [
    { required: true, message: '请输入股票代码', trigger: 'blur' },
    { pattern: /^[A-Z0-9]{1,10}$/, message: '股票代码必须是1-10位大写字母或数字', trigger: 'blur' }
  ],
  issuePrice: [
    { required: true, message: '请输入发行价格', trigger: 'blur' },
    { type: 'number', min: 0.01, max: 999999.99, message: '发行价格必须在0.01-999999.99之间', trigger: 'blur' }
  ],
  totalShares: [
    { required: true, message: '请输入总股本', trigger: 'blur' },
    { type: 'number', min: 1, max: 1000000000, message: '总股本必须在1-1000000000之间', trigger: 'blur' }
  ]
};

// 方法
const fetchData = async () => {
  try {
    await templatesStore.fetchStockTemplates();
  } catch (error) {
    ElMessage.error('获取数据失败：' + error.message);
  }
};

const handleSearch = () => {
  templatesStore.setStockTemplatesFilters({ search: filters.search });
  fetchData();
};

const handleFilter = () => {
  templatesStore.setStockTemplatesFilters({
    status: filters.status,
    category: filters.category
  });
  fetchData();
};

const handleSelectionChange = (selection) => {
  templatesStore.selectedStockTemplates = selection.map(item => item._id);
};

const showCreateDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  Object.assign(form, row);
  dialogVisible.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个股票模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await templatesStore.deleteStockTemplate(row._id);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message);
    }
  }
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除选中的股票模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await templatesStore.batchDeleteTemplates('stock');
    ElMessage.success('批量删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + error.message);
    }
  }
};

const handleBatchStatus = async (status) => {
  try {
    const action = status === 'active' ? '启用' : '禁用';
    await ElMessageBox.confirm(`确定要${action}选中的股票模板吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await templatesStore.batchUpdateTemplateStatus('stock', status);
    ElMessage.success(`批量${action}成功`);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量操作失败：' + error.message);
    }
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    
    if (isEdit.value) {
      await templatesStore.updateStockTemplate(form._id, form);
      ElMessage.success('更新成功');
    } else {
      await templatesStore.createStockTemplate(form);
      ElMessage.success('创建成功');
    }
    
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    ElMessage.error('操作失败：' + error.message);
  }
};

const handleSizeChange = (size) => {
  templatesStore.setStockTemplatesPagination({ limit: size, page: 1 });
  fetchData();
};

const handleCurrentChange = (page) => {
  templatesStore.setStockTemplatesPagination({ page });
  fetchData();
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    symbol: '',
    issuePrice: null,
    totalShares: null,
    category: '',
    description: ''
  });
};

const getCategoryLabel = (category) => {
  const labels = {
    tech: '科技',
    finance: '金融',
    healthcare: '医疗',
    energy: '能源',
    consumer: '消费'
  };
  return labels[category] || category;
};

// 生命周期
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.stock-template-manager {
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