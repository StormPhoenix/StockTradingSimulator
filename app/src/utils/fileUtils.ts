/**
 * 文件操作工具
 * 提供前端文件处理相关的工具函数
 */

// 文件预览信息接口
interface FilePreview {
  name: string
  size: number
  type: string
  lastModified: number
  lastModifiedDate: Date
  extension: string
  sizeFormatted: string
}

// JSON验证结果接口
interface JsonValidationResult {
  valid: boolean
  data: any | null
  error: string | null
}

// 浏览器支持检查结果接口
interface BrowserSupport {
  fileReader: boolean
  blob: boolean
  url: boolean
  download: boolean
}

// 批量下载文件项接口
interface DownloadFile {
  data: any
  filename: string
}

/**
 * 文件工具类
 */
class FileUtils {
  /**
   * 下载JSON文件
   * @param data - 要下载的数据
   * @param filename - 文件名
   */
  static downloadJsonFile(data: any, filename: string): void {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
      
      this.downloadBlob(blob, filename)
    } catch (error) {
      throw new Error(`下载JSON文件失败: ${(error as Error).message}`)
    }
  }

  /**
   * 下载文本文件
   * @param content - 文件内容
   * @param filename - 文件名
   * @param mimeType - MIME类型
   */
  static downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    try {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
      this.downloadBlob(blob, filename)
    } catch (error) {
      throw new Error(`下载文本文件失败: ${(error as Error).message}`)
    }
  }

  /**
   * 下载Blob对象
   * @param blob - Blob对象
   * @param filename - 文件名
   */
  static downloadBlob(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 释放URL对象
      URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error(`下载文件失败: ${(error as Error).message}`)
    }
  }

  /**
   * 读取文件内容
   * @param file - 文件对象
   * @param readAs - 读取方式 ('text', 'json', 'arrayBuffer', 'dataURL')
   * @returns 文件内容
   */
  static readFile(file: File, readAs: 'text' | 'json' | 'arrayBuffer' | 'dataURL' = 'text'): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('文件不能为空'))
        return
      }

      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          let result = event.target?.result
          
          if (readAs === 'json' && typeof result === 'string') {
            result = JSON.parse(result)
          }
          
          resolve(result)
        } catch (error) {
          reject(new Error(`解析文件内容失败: ${(error as Error).message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      // 根据读取方式选择对应的方法
      switch (readAs) {
        case 'text':
        case 'json':
          reader.readAsText(file)
          break
        case 'arrayBuffer':
          reader.readAsArrayBuffer(file)
          break
        case 'dataURL':
          reader.readAsDataURL(file)
          break
        default:
          reject(new Error(`不支持的读取方式: ${readAs}`))
      }
    })
  }

  /**
   * 验证文件类型
   * @param file - 文件对象
   * @param allowedTypes - 允许的文件类型
   * @returns 是否为允许的类型
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    if (!file) return false
    
    // 检查文件扩展名
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedTypes.some(type => 
      fileName.endsWith(type.toLowerCase())
    )
    
    // 检查MIME类型
    const mimeTypeMap: Record<string, string> = {
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.xml': 'application/xml'
    }
    
    const expectedMimeType = allowedTypes
      .map(type => mimeTypeMap[type])
      .filter(Boolean)
    
    const hasValidMimeType = expectedMimeType.length === 0 || 
      expectedMimeType.includes(file.type)
    
    return hasValidExtension && hasValidMimeType
  }

  /**
   * 验证文件大小
   * @param file - 文件对象
   * @param maxSizeInBytes - 最大文件大小（字节）
   * @returns 是否在允许的大小范围内
   */
  static validateFileSize(file: File, maxSizeInBytes: number): boolean {
    if (!file) return false
    return file.size <= maxSizeInBytes
  }

  /**
   * 格式化文件大小
   * @param bytes - 字节数
   * @param decimals - 小数位数
   * @returns 格式化后的文件大小
   */
  static formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  /**
   * 获取文件扩展名
   * @param filename - 文件名
   * @returns 文件扩展名
   */
  static getFileExtension(filename: string): string {
    if (!filename) return ''
    
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1) return ''
    
    return filename.substring(lastDotIndex)
  }

  /**
   * 获取文件名（不含扩展名）
   * @param filename - 文件名
   * @returns 不含扩展名的文件名
   */
  static getFileNameWithoutExtension(filename: string): string {
    if (!filename) return ''
    
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1) return filename
    
    return filename.substring(0, lastDotIndex)
  }

  /**
   * 生成唯一文件名
   * @param originalName - 原始文件名
   * @param suffix - 后缀
   * @returns 唯一文件名
   */
  static generateUniqueFilename(originalName: string, suffix: string = ''): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = this.getFileExtension(originalName)
    const nameWithoutExt = this.getFileNameWithoutExtension(originalName)
    
    return `${nameWithoutExt}${suffix}_${timestamp}${extension}`
  }

  /**
   * 批量下载文件
   * @param files - 文件列表 [{data, filename}, ...]
   * @param delay - 下载间隔（毫秒）
   */
  static async batchDownload(files: DownloadFile[], delay: number = 500): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file) continue
      
      const { data, filename } = file
      
      try {
        this.downloadJsonFile(data, filename)
        
        // 添加延迟避免浏览器阻止多个下载
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`下载文件 ${filename} 失败:`, error)
      }
    }
  }

  /**
   * 压缩JSON数据
   * @param data - 要压缩的数据
   * @returns 压缩后的JSON字符串
   */
  static compressJson(data: any): string {
    return JSON.stringify(data)
  }

  /**
   * 美化JSON数据
   * @param data - 要美化的数据
   * @param indent - 缩进空格数
   * @returns 美化后的JSON字符串
   */
  static prettifyJson(data: any, indent: number = 2): string {
    return JSON.stringify(data, null, indent)
  }

  /**
   * 创建文件预览信息
   * @param file - 文件对象
   * @returns 预览信息
   */
  static createFilePreview(file: File): FilePreview | null {
    if (!file) return null
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      lastModifiedDate: new Date(file.lastModified),
      extension: this.getFileExtension(file.name),
      sizeFormatted: this.formatFileSize(file.size)
    }
  }

  /**
   * 验证JSON文件内容
   * @param jsonString - JSON字符串
   * @returns 验证结果
   */
  static validateJsonContent(jsonString: string): JsonValidationResult {
    try {
      const data = JSON.parse(jsonString)
      return {
        valid: true,
        data,
        error: null
      }
    } catch (error) {
      return {
        valid: false,
        data: null,
        error: (error as Error).message
      }
    }
  }

  /**
   * 检查浏览器文件API支持
   * @returns 支持情况
   */
  static checkBrowserSupport(): BrowserSupport {
    return {
      fileReader: typeof FileReader !== 'undefined',
      blob: typeof Blob !== 'undefined',
      url: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
      download: 'download' in document.createElement('a')
    }
  }

  /**
   * 创建临时URL
   * @param blob - Blob对象
   * @returns 临时URL
   */
  static createObjectURL(blob: Blob): string {
    if (!URL || !URL.createObjectURL) {
      throw new Error('浏览器不支持创建对象URL')
    }
    
    return URL.createObjectURL(blob)
  }

  /**
   * 释放临时URL
   * @param url - 临时URL
   */
  static revokeObjectURL(url: string): void {
    if (URL && URL.revokeObjectURL) {
      URL.revokeObjectURL(url)
    }
  }

  /**
   * 复制文本到剪贴板
   * @param text - 要复制的文本
   * @returns 是否成功
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        
        document.body.appendChild(textArea)
        textArea.select()
        
        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        return success
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
      return false
    }
  }
}

export default FileUtils