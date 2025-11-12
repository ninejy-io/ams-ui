import service from './request'

// 发起云服务器发现
export function discoverCloudAssets(data) {
  return service({
    url: '/assets/server-discovery/cloud',
    method: 'post',
    data
  })
}

// 获取云发现记录列表
export function getDiscoveryRecords(params) {
  return service({
    url: '/assets/server-discovery/records',
    method: 'get',
    params
  })
}

// 获取发现记录详情
export function getDiscoveryRecordDetail(id) {
  return service({
    url: `/assets/server-discovery/records/${id}`,
    method: 'get'
  })
}
