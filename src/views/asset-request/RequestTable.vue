<template>
  <div class="request-table">
    <el-table
      :data="requests"
      v-loading="loading"
      style="width: 100%"
      :default-sort="{ prop: 'created_at', order: 'descending' }"
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
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="approval_time" label="审批时间" width="160">
        <template #default="{ row }">
          {{ row.approval_time ? formatDate(row.approval_time) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="approver.real_name" label="审批人" width="100">
        <template #default="{ row }">
          {{ row.approver ? row.approver.real_name : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleView(row)">查看</el-button>
          <el-button
            v-if="row.status === 'pending' && hasPermission('admin')"
            size="small"
            type="primary"
            @click="handleApprove(row)"
          >
            审批
          </el-button>
          <el-button
            v-if="row.status === 'approved' && isMyRequest(row)"
            size="small"
            type="success"
            @click="handleReturn(row)"
          >
            归还
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && requests.length === 0"
      description="暂无申请记录"
      :image-size="200"
    />

    <!-- 申请详情对话框 -->
    <RequestDetailDialog
      v-model="detailDialog.visible"
      :request="detailDialog.data"
    />
  </div>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { returnAsset } from '@/api/assetRequest'
import RequestDetailDialog from './RequestDetailDialog.vue'

const props = defineProps({
  requests: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const authStore = useAuthStore()
const showApproveDialog = inject('showApproveDialog') // 从父组件注入审批方法

const detailDialog = reactive({
  visible: false,
  data: null
})

// 状态显示
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    completed: '已完成'
  }
  return texts[status] || status
}

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 权限检查
const hasPermission = (permission) => {
  // 这里根据实际权限系统实现
  return authStore.user?.role === 'admin'
}

// 检查是否是我的申请
const isMyRequest = (request) => {
  return request.applicant_id === authStore.user?.id
}

// 事件处理
const handleView = (row) => {
  detailDialog.data = row
  detailDialog.visible = true
}

const handleApprove = (row) => {
  if (showApproveDialog) {
    showApproveDialog(row)
  }
}

const handleReturn = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要归还资产 "${row.asset.asset_name}" 吗？`,
      '归还确认',
      {
        type: 'warning'
      }
    )
    
    await returnAsset(row.id)
    ElMessage.success('资产归还成功')
    emit('refresh') // 刷新数据
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped>
.request-table {
  width: 100%;
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
