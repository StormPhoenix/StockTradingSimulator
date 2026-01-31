import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 定义路由元信息类型
interface RouteMeta {
  title?: string
  icon?: string
  requiresAuth?: boolean
  roles?: string[]
  [key: string]: any
  [key: symbol]: any
}

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/components/home/GameIntroduction.vue'),
    meta: {
      title: '股票交易模拟器',
      icon: 'House',
    } as RouteMeta,
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
        } as RouteMeta,
      },
      {
        path: 'trader-templates',
        name: 'TraderTemplates',
        component: () => import('@/components/admin/TraderTemplateManager.vue'),
        meta: {
          title: 'AI交易员模板管理',
          icon: 'User',
        } as RouteMeta,
      },
      {
        path: 'market-templates',
        name: 'MarketTemplates',
        component: () => import('@/components/admin/MarketTemplateManager.vue'),
        meta: {
          title: '市场环境模板管理',
          icon: 'Setting',
        } as RouteMeta,
      },
    ],
  },
  {
    path: '/market-instances',
    name: 'MarketInstances',
    children: [
      {
        path: '',
        name: 'MarketInstanceList',
        component: () => import('@/components/runtime/MarketInstanceList.vue'),
        meta: {
          title: '市场实例管理',
          icon: 'Grid',
        } as RouteMeta,
      },
    ],
  },
  {
    path: '/gameplay',
    component: () => import('@/layouts/GameplayLayout.vue'),
    meta: { layout: 'gameplay' } as RouteMeta,
    redirect: '/market-instances',
    children: [
      {
        path: ':id',
        name: 'GameplayDetails',
        component: () => import('@/components/runtime/MarketInstanceDetails.vue'),
        meta: {
          title: '市场实例详情',
          icon: 'View',
        } as RouteMeta,
      },
      {
        path: ':id/stocks/:symbol',
        name: 'GameplayStockDetail',
        component: () => import('@/components/runtime/MarketInstanceStockDetail.vue'),
        meta: {
          title: '股票详情',
          icon: 'TrendCharts',
        } as RouteMeta,
      },
    ],
  },
  {
    path: '/debug/lifecycle',
    name: 'LifecycleDebug',
    component: () => import('@/components/lifecycle/LifecycleDebug.vue'),
    meta: {
      title: '生命周期管理调试',
      icon: 'Monitor',
    } as RouteMeta,
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
  const meta = to.meta as RouteMeta
  if (meta?.title) {
    document.title = `${meta.title} - 股票交易模拟器`
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
router.onError((error: Error) => {
  console.error('❌ Router Error:', error)
})

export default router