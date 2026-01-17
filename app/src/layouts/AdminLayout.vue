<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon class="logo-icon"><TrendCharts /></el-icon>
          <span class="logo-text">股票交易模拟器</span>
        </div>

        <div class="nav-menu">
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            router
            class="header-menu"
            :ellipsis="false"
          >
            <el-menu-item index="/admin/stock-templates">
              <el-icon><TrendCharts /></el-icon>
              <span>股票模板</span>
            </el-menu-item>
            <el-menu-item index="/admin/trader-templates">
              <el-icon><User /></el-icon>
              <span>AI交易员模板</span>
            </el-menu-item>
            <el-menu-item index="/admin/market-templates">
              <el-icon><Setting /></el-icon>
              <span>市场环境模板</span>
            </el-menu-item>
          </el-menu>
        </div>

        <div class="header-actions">
          <el-button type="primary" @click="goToHome">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="main-content">
      <div class="content-wrapper">
        <!-- 面包屑导航 -->
        <el-breadcrumb class="breadcrumb" separator="/">
          <el-breadcrumb-item :to="{ path: '/admin' }">管理后台</el-breadcrumb-item>
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
        <span>© 2026 股票交易模拟器 - 管理后台系统</span>
      </div>
    </el-footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  TrendCharts,
  User,
  Setting,
  House
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 当前路由信息
const currentRoute = computed(() => route)

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 跳转到首页
const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  color: #409eff;
  margin-right: 8px;
}

.logo-text {
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.header-menu {
  border-bottom: none;
  background: transparent;
  min-width: 500px;
}

.header-menu .el-menu-item {
  border-bottom: 2px solid transparent;
  color: #606266;
  padding: 0 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.header-menu .el-menu-item:hover,
.header-menu .el-menu-item.is-active {
  border-bottom-color: #409eff;
  color: #409eff;
  background: transparent;
}

.header-menu .el-menu-item .el-icon {
  margin-right: 6px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  background: #f5f7fa;
  padding: 0;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 120px);
}

.breadcrumb {
  margin-bottom: 16px;
}

.page-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.footer {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 16px 0;
  height: 60px;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-content {
    padding: 0 20px;
  }
  
  .header-menu .el-menu-item {
    padding: 0 16px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .logo-text {
    display: none;
  }
  
  .nav-menu {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  
  .header-menu {
    min-width: 400px;
  }
  
  .header-menu .el-menu-item {
    padding: 0 8px;
    font-size: 14px;
  }
  
  .header-menu .el-menu-item span {
    display: inline;
  }
  
  .header-actions {
    margin-left: 8px;
  }
  
  .header-actions .el-button span {
    display: none;
  }
  
  .content-wrapper {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 8px;
  }
  
  .logo {
    font-size: 16px;
  }
  
  .logo-icon {
    font-size: 20px;
    margin-right: 4px;
  }
  
  .header-menu {
    min-width: 280px;
  }
  
  .header-menu .el-menu-item {
    padding: 0 4px;
    font-size: 12px;
  }
  
  .header-menu .el-menu-item span {
    font-size: 10px;
  }
  
  .header-menu .el-menu-item .el-icon {
    font-size: 14px;
    margin-right: 2px;
  }
  
  .header-actions .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
