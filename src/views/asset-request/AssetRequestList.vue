<template>
  <div class="asset-request-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资产领用申请</span>
          <el-button type="primary" @click="openCreateDialog()">
            <el-icon><Plus /></el-icon>
            新建申请
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="待审批" name="pending">
          <RequestTable 
            :requests="pendingRequests" 
            :loading="loading" 
            @refresh="loadData"
            ref="requestTableRef"
          />
        </el-tab-pane>
        
        <el-tab-pane label="已审批" name="approved">
          <RequestTable 
            :requests="approvedRequests" 
            :loading="loading" 
            @refresh="loadData"
            ref="requestTableRef"
          />
        </el-tab-pane>
        
        <el-tab-pane label="全部" name="all">
          <RequestTable 
            :requests="allRequests" 
            :loading="loading" 
            @refresh="loadData"
            ref="requestTableRef"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 使用复用的 AssetRequestDialog 组件 -->
    <AssetRequestDialog
      v-model="createDialogVisible"
      :preselected-asset-id="preselectedAssetId"
      @success="handleCreateSuccess"
    />

    <!-- 审批对话框 -->
    <ApproveDialog
      v-model="approveDialog.visible"
      :request="approveDialog.request"
      @success="handleApproveSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, provide } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getPendingAssetRequests, getAssetRequests } from '@/api/assetRequest'
import RequestTable from './RequestTable.vue'
import ApproveDialog from './ApproveDialog.vue'
import AssetRequestDialog from './AssetRequestDialog.vue'

const activeTab = ref('pending')
const loading = ref(false)
const allRequests = ref([])
const pendingRequests = ref([])
const approvedRequests = ref([])
const requestTableRef = ref()

const approveDialog = reactive({
  visible: false,
  request: null
})

// 控制创建对话框可见性和可选的预选资产ID（可选）
const createDialogVisible = ref(false)
const preselectedAssetId = ref(null) // 若需要可在 openCreateDialog 时设置

const loadData = async () => {
  loading.value = true
  try {
    const [allRes, pendingRes] = await Promise.all([
      getAssetRequests(),
      getPendingAssetRequests()
    ])
    allRequests.value = Array.isArray(allRes?.data?.items) ? allRes.data.items : (Array.isArray(allRes?.data) ? allRes.data : [])
    pendingRequests.value = Array.isArray(pendingRes?.data?.items) ? pendingRes.data.items : (Array.isArray(pendingRes?.data) ? pendingRes.data : [])
    approvedRequests.value = allRequests.value.filter(req => req.status !== 'pending')
  } catch (error) {
    console.error('加载申请数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleApproveSuccess = () => {
  approveDialog.visible = false
  loadData()
}

const showApproveDialog = (request) => {
  approveDialog.request = request
  approveDialog.visible = true
}
provide('showApproveDialog', showApproveDialog)

// 打开创建对话框（支持带预选资产）
const openCreateDialog = (assetId = null) => {
  preselectedAssetId.value = assetId
  createDialogVisible.value = true
}

// 创建成功回调
const handleCreateSuccess = () => {
  createDialogVisible.value = false
  preselectedAssetId.value = null
  ElMessage.success('申请已提交')
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
