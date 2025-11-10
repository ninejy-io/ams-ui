<template>
  <el-dialog
    v-model="visible"
    :title="`申请详情 - ${request?.request_number}`"
    width="700px"
    :close-on-click-modal="false"
  >
    <div v-if="request" class="request-detail">
      <!-- 基本信息 -->
      <el-card header="基本信息" class="detail-section">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请单号">
            {{ request.request_number }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDate(request.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ request.applicant.real_name }} ({{ request.applicant.username }})
          </el-descriptions-item>
          <el-descriptions-item label="申请类型">
            <el-tag :type="request.request_type === 'borrow' ? 'warning' : 'primary'">
              {{ request.request_type === 'borrow' ? '借用' : '领用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(request.status)">
              {{ getStatusText(request.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计归还日期">
            {{ request.expected_return_date ? formatDate(request.expected_return_date) : '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 资产信息 -->
      <el-card header="资产信息" class="detail-section">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="资产名称">
            {{ request.asset.asset_name }}
          </el-descriptions-item>
          <el-descriptions-item label="资产编号">
            {{ request.asset.asset_number }}
          </el-descriptions-item>
          <el-descriptions-item label="资产类型">
            <el-tag :type="request.asset.asset_type === 'server' ? 'primary' : 'success'">
              {{ request.asset.asset_type === 'server' ? '服务器' : '办公资产' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资产分类">
            {{ request.asset.asset_category?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="存放位置">
            {{ request.asset.location || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="采购价格">
            {{ request.asset.purchase_price ? `¥${request.asset.purchase_price}` : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 使用用途 -->
      <el-card header="使用用途" class="detail-section">
        <div class="purpose-content">
          {{ request.purpose }}
        </div>
      </el-card>

      <!-- 审批信息 -->
      <el-card v-if="request.status !== 'pending'" header="审批信息" class="detail-section">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="审批人">
            {{ request.approver?.real_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审批时间">
            {{ request.approval_time ? formatDate(request.approval_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审批意见" span="2">
            {{ request.approval_opinion || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 归还信息 -->
      <el-card v-if="request.status === 'completed'" header="归还信息" class="detail-section">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="实际归还日期">
            {{ request.actual_return_date ? formatDate(request.actual_return_date) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  request: Object
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
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
</script>

<style scoped>
.request-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.purpose-content {
  padding: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: 600;
}
</style>
