import { LifecycleConfig, DEFAULT_CONFIG } from '../types';
import * as dotenv from 'dotenv';

/**
 * 生命周期系统配置加载器
 * 
 * 从环境变量加载配置，提供默认值和验证
 * 支持运行时配置更新和验证
 */
export class LifecycleConfigLoader {
  private config: LifecycleConfig;
  private isLoaded: boolean = false;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * 加载配置
   * 从环境变量读取配置值，使用默认值作为后备
   * 
   * @param envPath 可选的.env文件路径
   * @returns 加载的配置对象
   */
  load(envPath?: string): LifecycleConfig {
    // 加载环境变量
    if (envPath) {
      dotenv.config({ path: envPath });
    } else {
      dotenv.config();
    }

    // 从环境变量读取配置
    this.config = {
      DEFAULT_FPS: this.parseNumber('LIFECYCLE_DEFAULT_FPS', DEFAULT_CONFIG.DEFAULT_FPS),
      MIN_FPS: this.parseNumber('LIFECYCLE_MIN_FPS', DEFAULT_CONFIG.MIN_FPS),
      MAX_FPS: this.parseNumber('LIFECYCLE_MAX_FPS', DEFAULT_CONFIG.MAX_FPS),
      MAX_ERRORS_PER_OBJECT: this.parseNumber('LIFECYCLE_MAX_ERRORS_PER_OBJECT', DEFAULT_CONFIG.MAX_ERRORS_PER_OBJECT),
      DEBUG_API_PORT: this.parseNumber('DEBUG_API_PORT', DEFAULT_CONFIG.DEBUG_API_PORT),
      DEBUG_API_PREFIX: this.parseString('DEBUG_API_PREFIX', DEFAULT_CONFIG.DEBUG_API_PREFIX),
      ENABLE_PERFORMANCE_MONITORING: this.parseBoolean('ENABLE_PERFORMANCE_MONITORING', DEFAULT_CONFIG.ENABLE_PERFORMANCE_MONITORING),
      MEMORY_CHECK_INTERVAL: this.parseNumber('MEMORY_CHECK_INTERVAL', DEFAULT_CONFIG.MEMORY_CHECK_INTERVAL)
    };

    // 验证配置
    this.validateConfig();
    this.isLoaded = true;

    console.log('Lifecycle configuration loaded:', {
      DEFAULT_FPS: this.config.DEFAULT_FPS,
      MIN_FPS: this.config.MIN_FPS,
      MAX_FPS: this.config.MAX_FPS,
      MAX_ERRORS_PER_OBJECT: this.config.MAX_ERRORS_PER_OBJECT,
      DEBUG_API_PORT: this.config.DEBUG_API_PORT,
      DEBUG_API_PREFIX: this.config.DEBUG_API_PREFIX,
      ENABLE_PERFORMANCE_MONITORING: this.config.ENABLE_PERFORMANCE_MONITORING,
      MEMORY_CHECK_INTERVAL: this.config.MEMORY_CHECK_INTERVAL
    });

    return this.config;
  }

  /**
   * 获取当前配置
   * 
   * @returns 当前配置对象
   * @throws Error 如果配置尚未加载
   */
  getConfig(): LifecycleConfig {
    if (!this.isLoaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config };
  }

  /**
   * 更新配置项
   * 
   * @param updates 要更新的配置项
   * @throws Error 如果配置验证失败
   */
  updateConfig(updates: Partial<LifecycleConfig>): void {
    const newConfig = { ...this.config, ...updates };
    
    // 验证新配置
    this.validateConfigObject(newConfig);
    
    this.config = newConfig;
    console.log('Configuration updated:', updates);
  }

  /**
   * 重新加载配置
   * 
   * @param envPath 可选的.env文件路径
   * @returns 重新加载的配置对象
   */
  reload(envPath?: string): LifecycleConfig {
    this.isLoaded = false;
    return this.load(envPath);
  }

  /**
   * 检查配置是否已加载
   * 
   * @returns 是否已加载
   */
  isConfigLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 获取配置摘要（用于日志和调试）
   * 
   * @returns 配置摘要
   */
  getConfigSummary(): {
    fps: { default: number; min: number; max: number };
    errors: { maxPerObject: number };
    api: { port: number; prefix: string };
    monitoring: { enabled: boolean; memoryCheckInterval: number };
  } {
    return {
      fps: {
        default: this.config.DEFAULT_FPS,
        min: this.config.MIN_FPS,
        max: this.config.MAX_FPS
      },
      errors: {
        maxPerObject: this.config.MAX_ERRORS_PER_OBJECT
      },
      api: {
        port: this.config.DEBUG_API_PORT,
        prefix: this.config.DEBUG_API_PREFIX
      },
      monitoring: {
        enabled: this.config.ENABLE_PERFORMANCE_MONITORING,
        memoryCheckInterval: this.config.MEMORY_CHECK_INTERVAL
      }
    };
  }

  /**
   * 解析数字类型的环境变量
   * 
   * @param key 环境变量名
   * @param defaultValue 默认值
   * @returns 解析的数字值
   */
  private parseNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      console.warn(`Invalid number value for ${key}: ${value}, using default: ${defaultValue}`);
      return defaultValue;
    }

    return parsed;
  }

  /**
   * 解析字符串类型的环境变量
   * 
   * @param key 环境变量名
   * @param defaultValue 默认值
   * @returns 解析的字符串值
   */
  private parseString(key: string, defaultValue: string): string {
    const value = process.env[key];
    return value || defaultValue;
  }

  /**
   * 解析布尔类型的环境变量
   * 
   * @param key 环境变量名
   * @param defaultValue 默认值
   * @returns 解析的布尔值
   */
  private parseBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }

    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return true;
    }
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
      return false;
    }

    console.warn(`Invalid boolean value for ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }

  /**
   * 验证当前配置
   * 
   * @throws Error 如果配置无效
   */
  private validateConfig(): void {
    this.validateConfigObject(this.config);
  }

  /**
   * 验证配置对象
   * 
   * @param config 要验证的配置对象
   * @throws Error 如果配置无效
   */
  private validateConfigObject(config: LifecycleConfig): void {
    const errors: string[] = [];

    // 验证FPS配置
    if (config.MIN_FPS < 1) {
      errors.push('MIN_FPS must be at least 1');
    }
    if (config.MAX_FPS > 120) {
      errors.push('MAX_FPS must not exceed 120');
    }
    if (config.MIN_FPS >= config.MAX_FPS) {
      errors.push('MIN_FPS must be less than MAX_FPS');
    }
    if (config.DEFAULT_FPS < config.MIN_FPS || config.DEFAULT_FPS > config.MAX_FPS) {
      errors.push('DEFAULT_FPS must be between MIN_FPS and MAX_FPS');
    }

    // 验证错误配置
    if (config.MAX_ERRORS_PER_OBJECT < 1) {
      errors.push('MAX_ERRORS_PER_OBJECT must be at least 1');
    }

    // 验证API配置
    if (config.DEBUG_API_PORT < 1 || config.DEBUG_API_PORT > 65535) {
      errors.push('DEBUG_API_PORT must be between 1 and 65535');
    }
    if (!config.DEBUG_API_PREFIX.startsWith('/')) {
      errors.push('DEBUG_API_PREFIX must start with "/"');
    }

    // 验证监控配置
    if (config.MEMORY_CHECK_INTERVAL < 1000) {
      errors.push('MEMORY_CHECK_INTERVAL must be at least 1000ms');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * 导出配置到环境变量格式
   * 用于生成.env文件内容
   * 
   * @returns 环境变量格式的配置字符串
   */
  exportToEnvFormat(): string {
    const lines = [
      '# GameObject 生命周期管理器配置',
      '',
      '# 性能配置',
      `LIFECYCLE_DEFAULT_FPS=${this.config.DEFAULT_FPS}`,
      `LIFECYCLE_MIN_FPS=${this.config.MIN_FPS}`,
      `LIFECYCLE_MAX_FPS=${this.config.MAX_FPS}`,
      '',
      '# 错误处理配置',
      `LIFECYCLE_MAX_ERRORS_PER_OBJECT=${this.config.MAX_ERRORS_PER_OBJECT}`,
      '',
      '# 调试API配置',
      `DEBUG_API_PORT=${this.config.DEBUG_API_PORT}`,
      `DEBUG_API_PREFIX=${this.config.DEBUG_API_PREFIX}`,
      '',
      '# 监控配置',
      `ENABLE_PERFORMANCE_MONITORING=${this.config.ENABLE_PERFORMANCE_MONITORING}`,
      `MEMORY_CHECK_INTERVAL=${this.config.MEMORY_CHECK_INTERVAL}`,
      ''
    ];

    return lines.join('\n');
  }
}

// 导出单例实例
export const lifecycleConfig = new LifecycleConfigLoader();