import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  getAssets, 
  getAsset, 
  createAsset, 
  updateAsset, 
  deleteAsset,
  changeAssetStatus,
  assignAsset
} from '@/api/asset'
import { getAssetCategories } from '@/api/assetCategory'

export const useAssetStore = defineStore('asset', () => {
  const assets = ref([])
  const assetDetail = ref(null)
  const categories = ref([])
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 获取资产列表
  const fetchAssets = async (params = {}) => {
    loading.value = true
    try {
      const response = await getAssets({
        page: pagination.value.page,
        page_size: pagination.value.pageSize,
        ...params
      })
      assets.value = response.data.items
      pagination.value.total = response.data.total
      return response
    } finally {
      loading.value = false
    }
  }

  // 获取资产详情
  const fetchAssetDetail = async (id) => {
    const response = await getAsset(id)
    assetDetail.value = response.data
    return response
  }

  // 创建资产
  const createNewAsset = async (assetData) => {
    const response = await createAsset(assetData)
    await fetchAssets() // 刷新列表
    return response
  }

  // 更新资产
  const updateExistingAsset = async (id, assetData) => {
    const response = await updateAsset(id, assetData)
    await fetchAssets() // 刷新列表
    return response
  }

  // 删除资产
  const deleteExistingAsset = async (id) => {
    const response = await deleteAsset(id)
    await fetchAssets() // 刷新列表
    return response
  }

  // 获取资产分类
  const fetchCategories = async () => {
    const response = await getAssetCategories()
    categories.value = response.data
    return response
  }

  // 变更资产状态
  const changeStatus = async (id, status) => {
    const response = await changeAssetStatus(id, status)
    await fetchAssets() // 刷新列表
    return response
  }

  // 分配资产
  const assignAssetToUser = async (id, userId) => {
    const response = await assignAsset(id, userId)
    await fetchAssets() // 刷新列表
    return response
  }

  // 更新分页
  const updatePagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  return {
    assets,
    assetDetail,
    categories,
    loading,
    pagination,
    fetchAssets,
    fetchAssetDetail,
    createNewAsset,
    updateExistingAsset,
    deleteExistingAsset,
    fetchCategories,
    changeStatus,
    assignAssetToUser,
    updatePagination
  }
})
