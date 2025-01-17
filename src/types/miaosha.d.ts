declare module '@/api/miaosha' {
  interface SeckillParams {
    id?: number
    name?: string
    avatar?: string
    price?: number
    status?: number
    createTime?: string | null
    endTime?: string | null
    number?: number
  }

  interface ApiResponse<T = any> {
    code: number
    data: T
    msg: string
  }

  export function addSeckillApi(params: SeckillParams): Promise<ApiResponse>
  export function updateSeckillApi(params: SeckillParams): Promise<ApiResponse>
  export function deleteSeckillApi(ids: number[]): Promise<ApiResponse>
  export function getSeckillDetailApi(id: number): Promise<ApiResponse>
  export function getSeckillListApi(): Promise<ApiResponse>
} 