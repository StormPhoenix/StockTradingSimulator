<template>
  <div id="app">
    <!-- 简单的导航栏 -->
    <nav class="main-nav" v-if="showNavigation">
      <div class="nav-container">
        <div class="nav-brand">
          <router-link to="/" class="brand-link">
            股票交易模拟器
          </router-link>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/time-series" class="nav-link">时间序列模拟</router-link>
          <router-link to="/market-instances" class="nav-link">市场实例</router-link>
          <router-link to="/admin" class="nav-link">管理后台</router-link>
        </div>
      </div>
    </nav>
    
    <!-- 主内容区域 -->
    <main class="main-content" :class="{ 'with-nav': showNavigation }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 计算是否显示导航栏
const showNavigation = computed(() => {
  // 在某些页面隐藏导航栏
  const hideNavRoutes = ['NotFound'];
  return !hideNavRoutes.includes(route.name as string);
});
</script>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

/* 导航栏样式 */
.main-nav {
  background-color: #2c3e50;
  color: white;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
}

.nav-brand .brand-link {
  color: white;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #bdc3c7;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  background-color: #f8f9fa;
}

.main-content.with-nav {
  min-height: calc(100vh - 60px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 15px 20px;
  }
  
  .nav-links {
    margin-top: 15px;
    gap: 20px;
  }
  
  .main-content.with-nav {
    min-height: calc(100vh - 90px);
  }
}
</style>