// 管理员接口类型定义
export interface Employee {
  id: number
  adminName: string
  account: string
  password: string
  createTime: string
  sorct: number  // 1: 超级管理员
  status: number // 1: 启用, 0: 禁用
}

// 分页请求参数
export interface PageQuery {
  name: string
  page: number
  pageSize: number
  total?: number
}

// 分页响应数据
export interface PageResult<T> {
  list: T[]
  total: number
}

// API响应数据结构
export interface ApiResponse<T> {
  code: number
  data: T
  msg: string | null
}