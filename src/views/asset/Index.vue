<template>
  <div class="asset-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资产管理</span>
          <div>
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新增资产
            </el-button>
            <el-button @click="handleServerDiscovery">
              <el-icon><Search /></el-icon>
              服务器发现
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="类型">
          <el-select v-model="searchForm.asset_type" placeholder="全部" clearable class="input-160">
            <el-option label="服务器" value="server" />
            <el-option label="办公资产" value="office" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable class="input-160">
            <el-option label="在库" value="in_stock" />
            <el-option label="在用" value="in_use" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="已报废" value="scrapped" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="searchForm.keyword"
            placeholder="编号 / 名称 / 规格"
            clearable
            class="input-300"
            @keyup.enter.native="onSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="assetStore.assets"
        v-loading="assetStore.loading"
        style="width: 100%"
      >
        <el-table-column prop="asset_number" label="资产编号" width="200" />
        <el-table-column prop="asset_name" label="资产名称" min-width="150" />
        <el-table-column prop="asset_type" label="资产类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.asset_type === 'server' ? 'primary' : 'success'">
              {{ row.asset_type === 'server' ? '服务器' : '办公资产' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="assetStore.pagination.page"
          v-model:page-size="assetStore.pagination.pageSize"
          :total="assetStore.pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <AssetFormDialog
      v-model="formDialog.visible"
      :mode="formDialog.mode"
      :data="formDialog.data"
      @success="handleFormSuccess"
    />

    <ServerDiscoveryDialog
      v-model="discoveryDialog.visible"
      @success="handleDiscoverySuccess"
    />
  </div>
</template>

<script setup>
import { reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useAssetStore } from '@/store/asset'
import AssetFormDialog from './AssetFormDialog.vue'
import ServerDiscoveryDialog from './ServerDiscoveryDialog.vue'

const assetStore = useAssetStore()

const searchForm = reactive({
  asset_type: '',
  status: '',
  keyword: ''
})

const formDialog = reactive({
  visible: false,
  mode: 'create', // 'create' | 'edit' | 'view'
  data: null
})

const discoveryDialog = reactive({
  visible: false
})

const loadData = async () => {
  // assetStore.fetchAssets 应接受 search/filter 参数并根据内部 pagination 请求
  await assetStore.fetchAssets({ ...searchForm })
}

const onSearch = () => {
  // reset to first page then load
  assetStore.updatePagination({ page: 1 })
  loadData()
}

const onReset = () => {
  searchForm.asset_type = ''
  searchForm.status = ''
  searchForm.keyword = ''
  assetStore.updatePagination({ page: 1 })
  loadData()
}

const getStatusType = (status) => {
  const types = {
    in_stock: 'success',
    in_use: 'primary',
    maintenance: 'warning',
    scrapped: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    in_stock: '在库',
    in_use: '使用中',
    maintenance: '维修中',
    scrapped: '已报废'
  }
  return texts[status] || status
}

const handleCreate = async () => {
  formDialog.mode = 'create'
  // ensure dialog sees fresh data
  formDialog.data = null
  await nextTick()
  formDialog.visible = true
}

// helper to open dialog with fresh copy of row data to avoid stale render
const openFormWithData = async (mode, row) => {
  formDialog.mode = mode
  formDialog.data = null
  await nextTick()
  formDialog.data = { ...row }
  formDialog.visible = true
}

const handleEdit = (row) => {
  console.log('Editing row:', row)
  openFormWithData('edit', row)
}

const handleView = (row) => {
  console.log('Viewing row:', row)
  openFormWithData('view', row)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定删除资产 "${row.asset_name || row.asset_number}" 吗？`,
      '提示',
      { type: 'warning' }
    )
    await assetStore.deleteExistingAsset(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // ignore
  }
}

const handleServerDiscovery = () => {
  discoveryDialog.visible = true
}

const handleFormSuccess = () => {
  formDialog.visible = false
  loadData()
}

const handleDiscoverySuccess = () => {
  discoveryDialog.visible = false
  loadData()
}

const handleSizeChange = (size) => {
  assetStore.updatePagination({ pageSize: size, page: 1 })
  loadData()
}

const handlePageChange = (page) => {
  assetStore.updatePagination({ page })
  loadData()
}

onMounted(() => {
  // ensure store pagination initialized, then load
  loadData()
  assetStore.fetchCategories()
})
</script>

<style scoped>
.asset-list {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 搜索表单样式 */
.search-form {
  margin: 12px 0;
}
.input-160 { width: 160px; }
.input-300 { width: 300px; }

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
