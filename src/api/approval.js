import service from './index'

export function getApprovalProcesses(params) {
  return service({
    url: '/approval-processes',
    method: 'get',
    params
  })
}

export function createApprovalProcess(data) {
  return service({
    url: '/approval-processes',
    method: 'post',
    data
  })
}

export function updateApprovalProcess(id, data) {
  return service({
    url: `/approval-processes/${id}`,
    method: 'put',
    data
  })
}

export function deleteApprovalProcess(id) {
  return service({
    url: `/approval-processes/${id}`,
    method: 'delete'
  })
}

export function getApprovalRecords(params) {
  return service({
    url: '/approval-records',
    method: 'get',
    params
  })
}

export function getApprovalRecordDetail(id) {
  return service({
    url: `/approval-records/${id}`,
    method: 'get'
  })
}

export function approveApprovalRecord(id, data) {
  return service({
    url: `/approval-records/${id}/approve`,
    method: 'post',
    data
  })
}

export function rejectApprovalRecord(id, data) {
  return service({
    url: `/approval-records/${id}/reject`,
    method: 'post',
    data
  })
}

export function createApprovalRecord(data) {
  return service({
    url: '/approval-records',
    method: 'post',
    data
  })
}

export function updateApprovalRecord(id, data) {
  return service({
    url: `/approval-records/${id}`,
    method: 'put',
    data
  })
}

export function deleteApprovalRecord(id) {
  return service({
    url: `/approval-records/${id}`,
    method: 'delete'
  })
}
