import request from '@/utils/request' // 引入自定义的axios函数

export const addUserApi = (params: any) => {
  return request({
    url: '/admin/user/add',
    method: 'post',
    data: { ...params }
  })
}

export const amendUserApi = (params: any) => {
  return request({
    url: '/admin/user/amend',
    method: 'post',
    data: { ...params }
  })
}

export const deleteUserApi = (ids: Array<String>) => {
  return request({
    url: '/admin/user/delete',
    method: 'post',
    data: { ids }
  })
}

export const getUserDetailApi = (id: any) => {
  return request({
    url: `/admin/user/query?id=${id}`,
    method: 'get'
  })
}

export const getUserListApi = () => {
  return request({
    url: '/admin/user/queryAll',
    method: 'get'
  })
}