import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/admin',
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        redirect: '/admin/stock-templates',
      },
      {
        path: 'stock-templates',
        name: 'StockTemplates',
        component: () => import('@/components/admin/StockTemplateManager.vue'),
        meta: {
          title: '股票模板管理',
          icon: 'TrendCharts',
        },
      },
      {
        path: 'trader-templates',
        name: 'TraderTemplates',
        component: () => import('@/components/admin/TraderTemplateManager.vue'),
        meta: {
          title: 'AI交易员模板管理',
          icon: 'User',
        },
      },
    ],
  },
  {
    path: '/market',
    name: 'Market',
    component: () => import('@/layouts/MarketLayout.vue'),
    children: [
      {
        path: '',
        name: 'MarketDashboard',
        redirect: '/market/initializer',
      },
      {
        path: 'initializer',
        name: 'MarketInitializer',
        component: () => import('@/components/market/MarketInitializer.vue'),
        meta: {
          title: '市场环境初始化',
          icon: 'Setting',
        },
      },
      {
        path: 'exporter',
        name: 'MarketExporter',
        component: () => import('@/components/market/MarketExporter.vue'),
        meta: {
          title: '市场数据导出导入',
          icon: 'Download',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/components/common/NotFound.vue'),
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 股票交易模拟器`
  } else {
    document.title = '股票交易模拟器'
  }
  
  // 在开发环境中记录路由变化
  if (import.meta.env.DEV) {
    console.log(`🧭 Route: ${from.path} → ${to.path}`)
  }
  
  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等逻辑
})

// 路由错误处理
router.onError((error) => {
  console.error('❌ Router Error:', error)
})

export default router