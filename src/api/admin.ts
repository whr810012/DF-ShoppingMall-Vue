import request from '@/utils/request' // 引入自定义的axios函数

export const addAdminApi = (params: any) => {
  return request({
    url: 'admin/add',
    method: 'post',
    data: { ...params }
  })
}

export const updateAdminApi = (params: any) => {
  return request({
    url: 'admin/amend',
    method: 'post',
    data: { ...params }
  })
}

export const deleteAdminApi = (ids: any) => {
  return request({
    url: 'admin/delete',
    method: 'post',
    data: { ids }
  })
}

export const loginAdminApi = (params: any) => {
  return request({
    url: 'admin/login',
    method: 'post',
    data: { ...params }
  })
}

export const queryAdminApi = (id: string) => {
  return request({
    url: `admin/query?id=${id}`,
    method: 'get'
  })
}

export const queryAllAdminApi = () => {
  return request({
    url: 'admin/queryAll',
    method: 'get'
  })
}