

import request from '@/utils/request' // 引入自定义的axios函数

export const addQiShouApi = (params: any) => {
  return request({
    url: 'admin/rider/add',
    method: 'post',
    data: { ...params }
  })
}
