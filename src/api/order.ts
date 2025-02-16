import request from '@/utils/request'

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 查询列表页接口
export const getOrderListApi = () => {
  return request<ApiResponse>({
    url: '/admin/order/queryAll',
    method: 'get'
  })
}
// 退款接口
export const refundOrderApi = (id: number) => {
  const data = {
    id,
    status:4
  }
  return request<ApiResponse>({
    url: `/admin/order/amend`,
    method: 'post',
    data
  })
}

