import service from './request'

// 获取部门列表
export function getDepartments(params) {
  return service({
    url: '/departments',
    method: 'get',
    params
  })
}

// 获取部门树形结构
export function getDepartmentTree() {
  return service({
    url: '/departments/tree',
    method: 'get'
  })
}

// 获取部门详情
export function getDepartment(id) {
  return service({
    url: `/departments/${id}`,
    method: 'get'
  })
}

// 创建部门
export function createDepartment(data) {
  return service({
    url: '/departments',
    method: 'post',
    data
  })
}

// 更新部门
export function updateDepartment(id, data) {
  return service({
    url: `/departments/${id}`,
    method: 'put',
    data
  })
}

// 删除部门
export function deleteDepartment(id) {
  return service({
    url: `/departments/${id}`,
    method: 'delete'
  })
}

// 获取子部门
export function getSubDepartments(id) {
  return service({
    url: `/departments/${id}/subdepartments`,
    method: 'get'
  })
}

// 获取部门成员
export function getDepartmentMembers(id) {
  return service({
    url: `/departments/${id}/members`,
    method: 'get'
  })
}
