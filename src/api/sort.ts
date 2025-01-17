import request from '@/utils/request' // 引入自定义的axios函数

export const addSortApi = (params: any) => {
  return request({
    url: '/admin/sort/add',
    method: 'post',
    data: { ...params }
  })
}

export const amendSortApi = (params: any) => {
  return request({
    url: '/admin/sort/amend',
    method: 'post',
    data: { ...params }
  })
}

export const deleteSortApi = (ids: any) => {
  return request({
    url: '/admin/sort/delete',
    method: 'post',
    data:  ids 
  })
}

export const getSortListApi = () => {
  return request({
    url: '/admin/sort/queryAll',
    method: 'get',
  })
}