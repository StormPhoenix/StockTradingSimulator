import type { Component, Ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import type { Portfolio, Position } from '@shared/portfolio'
import type { Trade, TradeOrder } from '@shared/trading'
import type { Stock, MarketEnvironment } from '@shared/market'
import type { User } from '@shared/auth'

// Vue 组件相关类型定义

// ========== 通用组件类型 ==========
export interface BaseComponentProps {
  loading?: boolean
  disabled?: boolean
  size?: 'small' | 'default' | 'large'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

export interface TableColumn<T = any> {
  key: string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean
  filterable?: boolean
  formatter?: (value: any, row: T) => string
  render?: (value: any, row: T) => Component
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  pagination?: PaginationConfig
  selection?: boolean
  stripe?: boolean
  border?: boolean
  height?: string | number
  maxHeight?: string | number
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  pageSizes?: number[]
  layout?: string
}

// ========== 表单组件类型 ==========
export interface FormField {
  name: string
  label: string
  type: FormFieldType
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: ValidationRule[]
  disabled?: boolean
  readonly?: boolean
  help?: string
}

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'datetime'
  | 'textarea'
  | 'switch'

export interface SelectOption {
  label: string
  value: any
  disabled?: boolean
}

export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: any) => boolean | string
  message?: string
}

export interface FormProps extends BaseComponentProps {
  fields: FormField[]
  model: Record<string, any>
  rules?: Record<string, ValidationRule[]>
  labelWidth?: string
  inline?: boolean
}

// ========== 投资组合组件类型 ==========
export interface PortfolioCardProps extends BaseComponentProps {
  portfolio: Portfolio
  showActions?: boolean
  compact?: boolean
}

export interface PortfolioListProps extends BaseComponentProps {
  portfolios: Portfolio[]
  loading?: boolean
  onSelect?: (portfolio: Portfolio) => void
  onCreate?: () => void
  onEdit?: (portfolio: Portfolio) => void
  onDelete?: (portfolio: Portfolio) => void
}

export interface PortfolioFormProps extends BaseComponentProps {
  portfolio?: Partial<Portfolio>
  mode: 'create' | 'edit'
  onSubmit: (data: Partial<Portfolio>) => void
  onCancel: () => void
}

export interface PositionTableProps extends BaseComponentProps {
  positions: Position[]
  portfolioId: string
  onTrade?: (position: Position, action: 'buy' | 'sell') => void
}

// ========== 交易组件类型 ==========
export interface TradingPanelProps extends BaseComponentProps {
  stock: Stock
  portfolio: Portfolio
  onSubmit: (order: Partial<TradeOrder>) => void
}

export interface TradeHistoryProps extends BaseComponentProps {
  trades: Trade[]
  loading?: boolean
  pagination?: PaginationConfig
  onPageChange?: (page: number, pageSize: number) => void
}

export interface OrderBookProps extends BaseComponentProps {
  orders: TradeOrder[]
  onCancel?: (order: TradeOrder) => void
}

// ========== 市场组件类型 ==========
export interface StockListProps extends BaseComponentProps {
  stocks: Stock[]
  loading?: boolean
  searchable?: boolean
  filterable?: boolean
  onSelect?: (stock: Stock) => void
  onTrade?: (stock: Stock) => void
}

export interface StockCardProps extends BaseComponentProps {
  stock: Stock
  showChart?: boolean
  showActions?: boolean
  compact?: boolean
}

export interface MarketEnvironmentProps extends BaseComponentProps {
  environment: MarketEnvironment
  onJoin?: (environment: MarketEnvironment) => void
  onLeave?: (environment: MarketEnvironment) => void
}

// ========== 图表组件类型 ==========
export interface ChartProps extends BaseComponentProps {
  data: ChartData[]
  type: ChartType
  width?: number
  height?: number
  options?: ChartOptions
}

export type ChartType = 'line' | 'bar' | 'pie' | 'candlestick' | 'area'

export interface ChartData {
  x: string | number | Date
  y: number
  [key: string]: any
}

export interface ChartOptions {
  title?: string
  xAxis?: AxisOptions
  yAxis?: AxisOptions
  legend?: LegendOptions
  tooltip?: TooltipOptions
  colors?: string[]
}

export interface AxisOptions {
  title?: string
  min?: number
  max?: number
  format?: string
}

export interface LegendOptions {
  show?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export interface TooltipOptions {
  show?: boolean
  format?: string
  formatter?: (data: ChartData) => string
}

// ========== 导航组件类型 ==========
export interface MenuItem {
  key: string
  label: string
  icon?: string
  path?: string
  children?: MenuItem[]
  disabled?: boolean
  badge?: string | number
}

export interface NavigationProps extends BaseComponentProps {
  items: MenuItem[]
  collapsed?: boolean
  mode?: 'horizontal' | 'vertical'
  theme?: 'light' | 'dark'
  onSelect?: (key: string, item: MenuItem) => void
}

export interface BreadcrumbItem {
  label: string
  path?: string
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[]
  separator?: string
}

// ========== 布局组件类型 ==========
export interface LayoutProps {
  header?: Component
  sidebar?: Component
  footer?: Component
  sidebarCollapsed?: boolean
  sidebarWidth?: string
  headerHeight?: string
  footerHeight?: string
}

export interface CardProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  shadow?: 'always' | 'hover' | 'never'
  bodyStyle?: Record<string, any>
  headerStyle?: Record<string, any>
}

// ========== 模态框组件类型 ==========
export interface ModalProps extends BaseComponentProps {
  visible: boolean
  title?: string
  width?: string | number
  height?: string | number
  closable?: boolean
  maskClosable?: boolean
  destroyOnClose?: boolean
  onClose: () => void
  onConfirm?: () => void
  onCancel?: () => void
}

export interface DialogOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

// ========== 通知组件类型 ==========
export interface NotificationOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  showClose?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

// ========== 组件事件类型 ==========
export interface ComponentEvents {
  onClick?: (event: MouseEvent) => void
  onDoubleClick?: (event: MouseEvent) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
  onChange?: (value: any) => void
  onInput?: (value: any) => void
  onSubmit?: (data: any) => void
  onReset?: () => void
}

// ========== 组件状态类型 ==========
export interface ComponentState {
  loading: Ref<boolean>
  error: Ref<string | null>
  data: Ref<any>
}

export interface AsyncComponentState<T = any> extends ComponentState {
  data: Ref<T | null>
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}

// ========== 路由相关类型 ==========
export interface RouteGuard {
  beforeEnter?: (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ) => boolean | string | void
}

export interface PageMeta {
  title?: string
  requiresAuth?: boolean
  roles?: string[]
  layout?: string
  keepAlive?: boolean
}