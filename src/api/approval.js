import service from './index'

// 获取待我审批的申请
export function getMyPendingApprovals() {
  return service({
    url: '/approvals/pending',
    method: 'get'
  })
}

// 批准申请
export function approveRequest(requestId, stepId, data) {
  return service({
    url: `/approvals/${requestId}/steps/${stepId}/approve`,
    method: 'post',
    data
  })
}

// 拒绝申请
export function rejectRequest(requestId, stepId, data) {
  return service({
    url: `/approvals/${requestId}/steps/${stepId}/reject`,
    method: 'post',
    data
  })
}

// 取消申请
export function cancelRequest(requestId, data) {
  return service({
    url: `/approvals/${requestId}/cancel`,
    method: 'post',
    data
  })
}

// 获取审批历史
export function getApprovalHistory(requestId) {
  return service({
    url: `/approvals/${requestId}/history`,
    method: 'get'
  })
}
