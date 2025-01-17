import request from '@/utils/request' // 引入自定义的axios函数

export const addGoodsApi = (params: any) => {
  return request({
    url: 'admin/dity/add',
    method: 'post',
    data: { ...params }
  })
}

export const updateGoodsApi = (formData: FormData) => {
  return request({
    url: 'admin/dity/amend',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'  // 设置请求头为 multipart/form-data
    }
  })
}

export const deleteGoodsApi = (ids: any) => {
  return request({
    url: 'admin/dity/detele',
    method: 'post',
    data: ids 
  })
}

export const getGoodsDetailApi = (id: any) => {
  return request({
    url: `admin/dity/query?id=${id}`,
    method: 'get'
  })
}

export const getGoodsListApi = () => {
  return request({
    url: 'admin/dity/queryAll',
    method: 'get',
  })
}