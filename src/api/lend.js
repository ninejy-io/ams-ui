import service from './request'

// 获取借出记录列表
export function listLendRecords(params) {
  return service({
    url: '/asset-lend/records',
    method: 'get',
    params
  })
}

// 获取借出申请列表
export function listLendRequests(params) {
  return service({
    url: '/asset-lend/requests',
    method: 'get',
    params
  })
}

// 直接借出资产
export function lendAsset(data) {
  return service({
    url: '/asset-lend/lend',
    method: 'post',
    data
  })
}

// 创建借出申请
export function createLendRequest(data) {
  return service({
    url: '/asset-lend/request',
    method: 'post',
    data
  })
}

// 审批借出申请
export function approveLendRequest(data) {
  return service({
    url: '/asset-lend/approve',
    method: 'post',
    data
  })
}

// 归还资产
export function returnAsset(data) {
  return service({
    url: '/asset-lend/return',
    method: 'post',
    data
  })
}

// 取消借出申请
export function cancelLendRequest(id) {
  return service({
    url: `/asset-lend/request/${id}/cancel`,
    method: 'post'
  })
}

// 获取逾期记录
export function getOverdueRecords() {
  return service({
    url: '/asset-lend/overdue',
    method: 'get'
  })
}
