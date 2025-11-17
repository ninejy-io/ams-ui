import service from './request'

export function getScanRecords(params) {
  return service({
    url: '/scan/records',
    method: 'get',
    params
  })
}

export function getScanRecordDetail(id) {
  return service({
    url: `/scan/records/${id}`,
    method: 'get'
  })
}

export function startScan(data) {
  return service({
    url: '/scan/start',
    method: 'post',
    data
  })
}

export function getScanStats() {
  return service({
    url: '/scan/stats',
    method: 'get'
  })
}

export function deleteScanRecord(id) {
  return service({
    url: `/scan/records/${id}`,
    method: 'delete'
  })
}
