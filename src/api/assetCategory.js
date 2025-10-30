import service from './index'

// 获取资产分类列表
export function getAssetCategories(params) {
  return service({
    url: '/categories',
    method: 'get',
    params
  })
}

// 获取资产分类树形结构
export function getAssetCategoryTree() {
  return service({
    url: '/categories/tree',
    method: 'get'
  })
}

// 获取资产分类详情
export function getAssetCategory(id) {
  return service({
    url: `/categories/${id}`,
    method: 'get'
  })
}

// 创建资产分类
export function createAssetCategory(data) {
  return service({
    url: '/categories',
    method: 'post',
    data
  })
}

// 更新资产分类
export function updateAssetCategory(id, data) {
  return service({
    url: `/categories/${id}`,
    method: 'put',
    data
  })
}

// 删除资产分类
export function deleteAssetCategory(id) {
  return service({
    url: `/categories/${id}`,
    method: 'delete'
  })
}

// 获取子分类
export function getSubCategories(id) {
  return service({
    url: `/categories/${id}/subcategories`,
    method: 'get'
  })
}
