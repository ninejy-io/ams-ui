<template>
  <div class="my-asset-requests">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的资产申请</span>
          <el-button type="primary" @click="showRequestDialog">
            <el-icon><Plus /></el-icon>
            新建申请
          </el-button>
        </div>
      </template>

      <!-- 申请列表内容保持不变 -->
      <el-table
        :data="requests"
        v-loading="loading"
        style="width: 100%"
      >
        <!-- 表格列定义 -->
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && requests.length === 0"
        description="暂无申请记录"
        :image-size="200"
      >
        <el-button type="primary" @click="showRequestDialog">
          创建申请
        </el-button>
      </el-empty>

      <!-- 分页 -->
      <div class="pagination" v-if="requests.length > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 资产领用申请对话框 -->
    <AssetRequestDialog
      v-model="requestDialog.visible"
      @success="handleRequestSuccess"
    />

    <!-- 申请详情对话框 -->
    <RequestDetailDialog
      v-model="detailDialog.visible"
      :request="detailDialog.data"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMyAssetRequests, returnAsset } from '@/api/assetRequest'
import AssetRequestDialog from './AssetRequestDialog.vue'
import RequestDetailDialog from './RequestDetailDialog.vue'

const loading = ref(false)
const requests = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const requestDialog = reactive({
  visible: false
})

const detailDialog = reactive({
  visible: false,
  data: null
})

// 显示申请对话框
const showRequestDialog = () => {
  requestDialog.visible = true
}

// 处理申请成功
const handleRequestSuccess = () => {
  loadData() // 刷新申请列表
}

// 其他方法保持不变...
const loadData = async () => {
  loading.value = true
  try {
    const response = await getMyAssetRequests()
    requests.value = response.data.items || response.data
    pagination.total = response.data.total || requests.value.length
  } catch (error) {
    ElMessage.error('加载申请数据失败')
    console.error('Failed to load requests:', error)
  } finally {
    loading.value = false
  }
}

const handleView = (row) => {
  detailDialog.data = row
  detailDialog.visible = true
}

const handleReturn = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要归还资产 "${row.asset.asset_name}" 吗？`,
      '归还确认',
      { type: 'warning' }
    )
    
    await returnAsset(row.id)
    ElMessage.success('资产归还成功')
    loadData()
  } catch (error) {
    // 用户取消
  }
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-asset-requests {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.asset-info {
  line-height: 1.4;
}

.asset-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.asset-number {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
