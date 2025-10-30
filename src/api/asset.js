import service from './index'

export function getAssetList(params) {
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

export function borrowAsset(data) {
  return service({
    url: '/assets/borrow',
    method: 'post',
    data
  })
}

export function returnAsset(data) {
  return service({
    url: '/assets/return',
    method: 'post',
    data
  })
}

export function transferAsset(data) {
  return service({
    url: '/assets/transfer',
    method: 'post',
    data
  })
}

export function scrapAsset(data) {
  return service({
    url: '/assets/scrap',
    method: 'post',
    data
  })
}

export function getAssetStatistics() {
  return service({
    url: '/assets/statistics',
    method: 'get'
  })
}

export function getExpiringWarrantyAssets(params) {
  return service({
    url: '/assets/expiring-warranty',
    method: 'get',
    params
  })
}

export function batchImportAssets(data) {
  return service({
    url: '/assets/import',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  })
}

export function generateQRCode(id) {
  return service({
    url: `/assets/${id}/qrcode`,
    method: 'post'
  })
}

// category


// department
export function getDepartments(params) {
    return service({
    url: '/departments',
    method: 'get',
    params
  })
}

