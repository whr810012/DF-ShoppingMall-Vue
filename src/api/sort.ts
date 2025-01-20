import request from '@/utils/request' // 引入自定义的axios函数

export const addSortApi = (formData: FormData) => {
  return request({
    url: '/admin/sort/add',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'  // 设置请求头为 multipart/form-data
    }
  })
}

export const amendSortApi = (formData: FormData) => {
  return request({
    url: '/admin/sort/amend',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'  // 设置请求头为 multipart/form-data
    }
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