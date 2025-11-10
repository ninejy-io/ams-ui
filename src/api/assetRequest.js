import service from "./index";

// 资产领用
export function getAssetRequests(params) {
  return service({
    url: '/asset-requests',
    method: 'get',
    params
  })
}

export function createAssetRequest(data) {
  return service({
    url: '/asset-requests',
    method: 'post',
    data
  })
}

export function getAssetRequest(id) {
  return service({
    url: `/asset-requests/${id}`,
    method: 'get'
  })
}

export function approveAssetRequest(id, data) {
  return service({
    url: `/asset-requests/${id}/approve`,
    method: 'post',
    data
  })
}

export function returnAsset(id) {
  return service({
    url: `/asset-requests/${id}/return`,
    method: 'post'
  })
}

export function getMyAssetRequests() {
  return service({
    url: '/asset-requests/my',
    method: 'get'
  })
}

export function getPendingAssetRequests() {
  return service({
    url: '/asset-requests/pending',
    method: 'get'
  })
}
