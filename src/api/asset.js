import service from './index'

// 资产管理
export function getAssets(params) {
  return service({
    url: '/assets',
    method: 'get',
    params
  })
}

export function getAsset(id) {
  return service({
    url: `/assets/${id}`,
    method: 'get'
  })
}

export function createAsset(data) {
  return service({
    url: '/assets',
    method: 'post',
    data
  })
}

export function updateAsset(id, data) {
  return service({
    url: `/assets/${id}`,
    method: 'put',
    data
  })
}

export function deleteAsset(id) {
  return service({
    url: `/assets/${id}`,
    method: 'delete'
  })
}

export function changeAssetStatus(id, status) {
  return service({
    url: `/assets/${id}/status`,
    method: 'put',
    params: { status }
  })
}

export function assignAsset(id, userId) {
  return service({
    url: `/assets/${id}/assign`,
    method: 'put',
    params: { user_id: userId }
  })
}

// 服务器发现
export function discoverCloudAssets(data) {
  return service({
    url: '/assets/server-discovery/cloud',
    method: 'post',
    data
  })
}

export function scanInternalNetwork(data) {
  return service({
    url: '/assets/server-discovery/internal',
    method: 'post',
    data
  })
}

export function getDiscoveredAssets() {
  return service({
    url: '/assets/server-discovery/discovered',
    method: 'get'
  })
}

export function getAssetStatistics() {
  return service({
    url: '/assets/statistics',
    method: 'get'
  })
}

export function getExpiringWarrantyAssets() {
  return service({
    url: '/assets/expiring-warranty',
    method: 'get'
  })
}

