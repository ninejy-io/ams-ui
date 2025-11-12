import service from './request'

// 获取供应商列表
export function getSuppliers(params) {
  return service({
    url: '/suppliers',
    method: 'get',
    params
  })
}

// 获取供应商详情
export function getSupplier(id) {
  return service({
    url: `/suppliers/${id}`,
    method: 'get'
  })
}

// 创建供应商
export function createSupplier(data) {
  return service({
    url: '/suppliers',
    method: 'post',
    data
  })
}

// 更新供应商
export function updateSupplier(id, data) {
  return service({
    url: `/suppliers/${id}`,
    method: 'put',
    data
  })
}

// 删除供应商
export function deleteSupplier(id) {
  return service({
    url: `/suppliers/${id}`,
    method: 'delete'
  })
}

// 搜索供应商
// export function searchSuppliers(params) {
//   return service({
//     url: '/suppliers/search',
//     method: 'get',
//     params
//   })
// }