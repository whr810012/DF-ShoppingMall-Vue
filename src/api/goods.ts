import request from '@/utils/request' // 引入自定义的axios函数

export const addGoodsApi = (params: any) => {
  return request({
    url: '/admin/dity/add',
    method: 'post',
    data: { ...params }
  })
}

export const updateGoodsApi = (params: any) => {
  return request({
    url: '/admin/dity/amend',
    method: 'post',
    params: { ...params }
  })
}

export const deleteGoodsApi = (ids: any) => {
  return request({
    url: '/admin/dity/detele',
    method: 'post',
    params: { ids }
  })
}

export const getGoodsDetailApi = (id: any) => {
  return request({
    url: `/admin/dity/query?id=${id}`,
    method: 'get'
  })
}

export const getGoodsListApi = () => {
  return request({
    url: '/admin/dity/queryAll',
    method: 'get',
  })
}