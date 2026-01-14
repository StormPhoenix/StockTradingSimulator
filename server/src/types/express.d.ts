import { Request } from 'express'

// 扩展 Express Request 接口
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
      
      // 可能的其他自定义属性
      requestId?: string
      startTime?: number
    }
    
    interface Response {
      // 自定义响应方法
      success?: (data?: any, message?: string) => Response
      error?: (message: string, statusCode?: number) => Response
    }
  }
}

// 导出以确保这是一个模块
export {}