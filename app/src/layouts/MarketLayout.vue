<template>
  <div class="market-layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon class="logo-icon">
            <Setting />
          </el-icon>
          <span class="logo-text">玩家体验中心</span>
        </div>

        <div class="nav-menu">
          <el-menu :default-active="activeMenu" mode="horizontal" router class="header-menu" :ellipsis="false">
            <el-menu-item index="/market/initializer">
              <el-icon>
                <Setting />
              </el-icon>
              <span>市场环境管理</span>
            </el-menu-item>

          </el-menu>
        </div>

        <div class="header-actions">
          <el-button @click="goToAdmin">
            <el-icon>
              <User />
            </el-icon>
            管理后台
          </el-button>
          <el-button type="primary" @click="createNewMarket">
            <el-icon>
              <Plus />
            </el-icon>
            新建市场
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="main-content">
      <div class="content-wrapper">
        <!-- 面包屑导航 -->
        <el-breadcrumb class="breadcrumb" separator="/">
          <el-breadcrumb-item :to="{ path: '/market' }">玩家体验</el-breadcrumb-item>
          <el-breadcrumb-item v-if="currentRoute.meta?.title">
            {{ currentRoute.meta.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 页面内容 -->
        <div class="page-content">
          <router-view />
        </div>
      </div>
    </el-main>

    <!-- 底部 -->
    <el-footer class="footer">
      <div class="footer-content">
        <div class="footer-stats">
          <el-statistic title="活跃市场" :value="marketStats.activeMarkets" suffix="个" />
          <el-statistic title="总交易员" :value="marketStats.totalTraders" suffix="个" />
          <el-statistic title="总股票" :value="marketStats.totalStocks" suffix="只" />
        </div>
        <span class="copyright">© 2026 股票交易模拟器 - 玩家体验中心</span>
      </div>
    </el-footer>
  </div>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Setting,
  User,
  Plus
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 当前路由信息
const currentRoute = computed(() => route)

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 市场统计数据
const marketStats = reactive({
  activeMarkets: 0,
  totalTraders: 0,
  totalStocks: 0
})

// 跳转到管理后台
const goToAdmin = () => {
  router.push('/admin/stock-templates')
}

// 创建新市场
const createNewMarket = () => {
  router.push('/market/initializer')
}

// 加载市场统计数据
const loadMarketStats = async () => {
  try {
    // 这里可以调用API获取实际统计数据
    // 暂时使用模拟数据
    marketStats.activeMarkets = 5
    marketStats.totalTraders = 150
    marketStats.totalStocks = 50
  } catch (error) {
    console.error('加载市场统计数据失败:', error)
  }
}

onMounted(() => {
  loadMarketStats()
})
</script>

<style scoped>
.market-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(228, 231, 237, 0.3);
  padding: 0;
  height: 60px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.logo-icon {
  font-size: 24px;
  color: #667eea;
  margin-right: 8px;
}

.logo-text {
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-menu {
  border-bottom: none;
  background: transparent;
}

.header-menu .el-menu-item {
  border-bottom: 2px solid transparent;
  color: #606266;
}

.header-menu .el-menu-item:hover,
.header-menu .el-menu-item.is-active {
  border-bottom-color: #667eea;
  color: #667eea;
  background: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-content {
  flex: 1;
  background: transparent;
  padding: 0;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 140px);
}

.breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb :deep(.el-breadcrumb__item .el-breadcrumb__inner) {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #fff;
}

.breadcrumb :deep(.el-breadcrumb__separator) {
  color: rgba(255, 255, 255, 0.6);
}

.page-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(228, 231, 237, 0.3);
  padding: 16px 0;
  height: 80px;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-stats {
  display: flex;
  gap: 48px;
}

.footer-stats :deep(.el-statistic__content) {
  color: #303133;
  font-size: 16px;
}

.footer-stats :deep(.el-statistic__head) {
  color: #909399;
  font-size: 12px;
}

.copyright {
  color: #909399;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo-text {
    display: none;
  }

  .nav-menu {
    flex: none;
  }

  .header-menu .el-menu-item span {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }

  .content-wrapper {
    padding: 16px;
  }

  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .footer-stats {
    gap: 24px;
  }
}
</style>
