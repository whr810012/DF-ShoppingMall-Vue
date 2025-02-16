import request from '@/utils/request' // 引入自定义的axios函数

// 修改新增骑手接口
export const addQiShouApi = (formData: FormData) => {
  return request({
    url: 'admin/rider/add',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'  // 设置请求头为 multipart/form-data
    }
  })
}

// 删除骑手
export const deleteQiShouApi = (ids: number[]) => {
  return request({
    url: 'admin/rider/detele',
    method: 'post',
    data: ids
  })
}

// 查询单个骑手
export const queryQiShouApi = (params: any) => {
  return request({
    url: 'admin/rider/query',
    method: 'get',
    params
  })
}

// 查询所有骑手
export const queryAllQiShouApi = () => {
  return request({
    url: 'admin/rider/queryAll',
    method: 'get'
  })
}

// 为骑手分配订单
export const assignOrderToRiderApi = (data: {
  orderId: number;
  riderId: number;
}) => {
  return request({
    url: 'admin/rider/order',
    method: 'post',
    data
  })
}