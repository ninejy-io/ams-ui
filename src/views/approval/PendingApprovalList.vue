<!-- src/views/approval/PendingApprovalList.vue -->
<template>
  <div class="pending-approval-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待我审批</span>
          <el-button @click="refreshList" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table
        :data="approvalList"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="request_number" label="申请单号" width="160" />
        <el-table-column prop="asset.asset_name" label="资产名称" min-width="150">
          <template #default="{ row }">
            <div class="asset-info">
              <div class="asset-name">{{ row.asset.asset_name }}</div>
              <div class="asset-number">编号: {{ row.asset.asset_number }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="applicant.real_name" label="申请人" width="100" />
        <el-table-column prop="request_type" label="申请类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.request_type === 'borrow' ? 'warning' : 'primary'">
              {{ row.request_type === 'borrow' ? '借用' : '领用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="使用用途" min-width="150" show-overflow-tooltip />
        <el-table-column label="当前步骤" width="120">
          <template #default="{ row }">
            <el-tag type="warning">
              {{ row.current_step?.name || '等待审批' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleApproveDialog(row)"
            >
              审批
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && approvalList.length === 0"
        description="暂无待审批的申请"
        :image-size="200"
      />
    </el-card>

    <!-- 审批对话框 -->
    <ApprovalDialog
      v-model="approvalDialog.visible"
      :request="approvalDialog.request"
      @success="handleApprovalSuccess"
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
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getMyPendingApprovals } from '@/api/approval'
import ApprovalDialog from './components/ApprovalDialog.vue'
import RequestDetailDialog from '../asset-request/RequestDetailDialog.vue'

const loading = ref(false)
const approvalList = ref([])

const approvalDialog = reactive({
  visible: false,
  request: null
})

const detailDialog = reactive({
  visible: false,
  data: null
})

// 加载待审批列表
const loadPendingApprovals = async () => {
  loading.value = true
  try {
    const response = await getMyPendingApprovals()
    approvalList.value = response.data
  } catch (error) {
    ElMessage.error('加载待审批列表失败')
    console.error('Failed to load pending approvals:', error)
  } finally {
    loading.value = false
  }
}

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 事件处理
const refreshList = () => {
  loadPendingApprovals()
}

const handleView = (row) => {
  detailDialog.data = row
  detailDialog.visible = true
}

const handleApproveDialog = (row) => {
  approvalDialog.request = row
  approvalDialog.visible = true
}

const handleApprovalSuccess = () => {
  approvalDialog.visible = false
  loadPendingApprovals()
  ElMessage.success('审批操作完成')
}

onMounted(() => {
  loadPendingApprovals()
})
</script>

<style scoped>
.pending-approval-list {
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
</style>
