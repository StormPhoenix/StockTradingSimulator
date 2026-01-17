// 全局类型声明

// 扩展 Window 接口
declare global {
  interface Window {
    // 可能的全局变量
    __STOCK_SIMULATOR_CONFIG__?: any
  }
}

// Element Plus 组件实例类型
declare module '@vue/runtime-core' {
  export interface GlobalProperties {
    $message: typeof import('element-plus')['ElMessage']
    $notify: typeof import('element-plus')['ElNotification']
    $confirm: typeof import('element-plus')['ElMessageBox']['confirm']
    $alert: typeof import('element-plus')['ElMessageBox']['alert']
  }
}

export {}