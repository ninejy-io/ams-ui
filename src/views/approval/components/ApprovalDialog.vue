<!-- src/views/approval/components/ApprovalDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="`审批申请 - ${request?.request_number}`"
    width="700px"
    :close-on-click-modal="false"
  >
    <div v-if="request" class="approval-dialog">
      <!-- 申请信息 -->
      <el-card header="申请信息" class="info-section">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请人">
            {{ request.applicant.real_name }} ({{ request.applicant.username }})
          </el-descriptions-item>
          <el-descriptions-item label="申请类型">
            <el-tag :type="request.request_type === 'borrow' ? 'warning' : 'primary'">
              {{ request.request_type === 'borrow' ? '借用' : '领用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资产名称">
            {{ request.asset.asset_name }} ({{ request.asset.asset_number }})
          </el-descriptions-item>
          <el-descriptions-item label="当前步骤">
            <el-tag type="warning">{{ request.current_step?.name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="使用用途" span="2">
            {{ request.purpose }}
          </el-descriptions-item>
          <el-descriptions-item label="预计归还日期">
            {{ request.expected_return_date ? formatDate(request.expected_return_date) : '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDate(request.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 审批流程 -->
      <el-card header="审批流程" class="info-section">
        <div class="approval-flow">
          <el-steps :active="getCurrentStepIndex()" align-center>
            <el-step
              v-for="step in request.approval_flow?.steps"
              :key="step.id"
              :title="step.name"
              :description="getStepDescription(step)"
            />
          </el-steps>
        </div>
      </el-card>

      <!-- 审批操作 -->
      <el-card header="审批操作" class="info-section">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="80px"
        >
          <el-form-item label="审批意见" prop="opinion">
            <el-input
              v-model="formData.opinion"
              type="textarea"
              :rows="4"
              placeholder="请输入审批意见"
              :maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item>
            <div class="action-buttons">
              <el-button
                type="success"
                @click="handleApprove"
                :loading="submitting"
                style="margin-right: 16px;"
              >
                <el-icon><Check /></el-icon>
                批准
              </el-button>
              <el-button
                type="danger"
                @click="handleReject"
                :loading="submitting"
              >
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import { approveRequest, rejectRequest } from '@/api/approval'

const props = defineProps({
  modelValue: Boolean,
  request: Object
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const submitting = ref(false)

const formData = reactive({
  opinion: ''
})

const formRules = {
  opinion: [
    { required: true, message: '请输入审批意见', trigger: 'blur' },
    { min: 5, message: '审批意见不能少于5个字符', trigger: 'blur' }
  ]
}

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 获取当前步骤索引
const getCurrentStepIndex = () => {
  if (!props.request?.current_step_id || !props.request?.approval_flow?.steps) {
    return 0
  }
  
  const steps = props.request.approval_flow.steps
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].id === props.request.current_step_id) {
      return i + 1
    }
  }
  return steps.length
}

// 获取步骤描述
const getStepDescription = (step) => {
  if (step.approver_type === 'user' && step.approver_user) {
    return `审批人: ${step.approver_user.real_name}`
  } else if (step.approver_type === 'role' && step.approver_role) {
    return `角色: ${step.approver_role.name}`
  } else if (step.approver_type === 'department_leader') {
    return '部门负责人'
  }
  return ''
}

// 批准申请
const handleApprove = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    await ElMessageBox.confirm('确定批准此申请吗？', '确认批准', {
      type: 'warning'
    })

    submitting.value = true
    await approveRequest(
      props.request.id,
      props.request.current_step_id,
      { opinion: formData.opinion }
    )
    
    emit('success')
    visible.value = false
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批准失败')
    }
  } finally {
    submitting.value = false
  }
}

// 拒绝申请
const handleReject = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    await ElMessageBox.confirm('确定拒绝此申请吗？', '确认拒绝', {
      type: 'warning'
    })

    submitting.value = true
    await rejectRequest(
      props.request.id,
      props.request.current_step_id,
      { opinion: formData.opinion }
    )
    
    emit('success')
    visible.value = false
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '拒绝失败')
    }
  } finally {
    submitting.value = false
  }
}

// 重置表单
watch(visible, (newVal) => {
  if (!newVal) {
    formData.opinion = ''
    formRef.value?.clearValidate()
  }
})
</script>

<style scoped>
.approval-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 16px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.approval-flow {
  padding: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: 600;
}

:deep(.el-step__title) {
  font-size: 14px;
}
</style>
