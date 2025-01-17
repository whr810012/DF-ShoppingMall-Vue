import request from '@/utils/request'

export interface SeckillFormData {
  name: string
  price: number
  number: number
  createTime: string
  endTime: string
  image: File | null
  status?: number
}

export interface SeckillResponse {
  code: number
  msg?: string
  data: any
}

// 添加秒杀商品
export const addSeckillApi = (params: SeckillFormData): Promise<SeckillResponse> => {
  const formData = new FormData()
  formData.append('name', params.name)
  formData.append('price', params.price.toString())
  formData.append('number', params.number.toString())
  formData.append('createTime', params.createTime)
  formData.append('endTime', params.endTime)
  if (params.image) {
    formData.append('image', params.image)
  }

  return request({
    url: 'admin/seckill/add',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 修改秒杀商品状态
export const updateSeckillApi = (params: { id: number, status: number }): Promise<SeckillResponse> => {
  return request({
    url: 'admin/seckill/amend',
    method: 'post',
    params
  })
}

// 删除秒杀商品
export const deleteSeckillApi = (ids: number[]): Promise<SeckillResponse> => {
  return request({
    url: 'admin/seckill/detele',
    method: 'post',
    data: ids
  })
}

// 查询秒杀商品详情
export const getSeckillDetailApi = (id: number): Promise<SeckillResponse> => {
  return request({
    url: `admin/seckill/query?id=${id}`,
    method: 'get'
  })
}

// 查询所有秒杀商品
export const getSeckillListApi = (): Promise<SeckillResponse> => {
  return request({
    url: 'admin/seckill/queryAll',
    method: 'get'
  })
}