import request from '@/utils/request' // 引入自定义的axios函数

export const addSeckillApi = (params: any) => {
  return request({
    url: 'admin/seckill/add',
    method: 'post',
    data: { ...params }
  })
}

export const updateSeckillApi = (params: any) => {
  return request({
    url: 'admin/seckill/amend',
    method: 'post',
    params: { ...params }
  })
}

export const deleteSeckillApi = (ids: any) => {
  return request({
    url: 'admin/seckill/detele',
    method: 'post',
    data: ids 
  })
}

export const getSeckillDetailApi = (id: any) => {
  return request({
    url: `admin/seckill/query?id=${id}`,
    method: 'get'
  })
}

export const getSeckillListApi = () => {
  return request({
    url: 'admin/seckill/queryAll',
    method: 'get',
  })
}