<template>
  <el-dialog
    v-model="visible"
    :title="`审批申请 - ${request?.request_number}`"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 申请信息 -->
    <div class="request-info">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请人">
          {{ request?.applicant?.real_name }} ({{ request?.applicant?.username }})
        </el-descriptions-item>
        <el-descriptions-item label="申请类型">
          <el-tag :type="request?.request_type === 'borrow' ? 'warning' : 'primary'">
            {{ request?.request_type === 'borrow' ? '借用' : '领用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" span="2">
          {{ request?.asset?.asset_name }} ({{ request?.asset?.asset_number }})
        </el-descriptions-item>
        <el-descriptions-item label="使用用途" span="2">
          {{ request?.purpose }}
        </el-descriptions-item>
        <el-descriptions-item label="预计归还日期">
          {{ request?.expected_return_date ? formatDate(request.expected_return_date) : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ formatDate(request?.created_at) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 审批表单 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      style="margin-top: 20px;"
    >
      <el-form-item label="审批结果" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio label="approved">批准</el-radio>
          <el-radio label="rejected">拒绝</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="审批意见" prop="approval_opinion">
        <el-input
          v-model="formData.approval_opinion"
          type="textarea"
          :rows="4"
          placeholder="请输入审批意见"
          :maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
      >
        提交审批
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { approveAssetRequest } from '@/api/assetRequest'

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
  status: 'approved',
  approval_opinion: ''
})

const formRules = {
  status: [
    { required: true, message: '请选择审批结果', trigger: 'change' }
  ],
  approval_opinion: [
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

// 提交审批
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true

    await approveAssetRequest(props.request.id, formData)
    ElMessage.success('审批提交成功')
    
    emit('success')
    visible.value = false
  } catch (error) {
    ElMessage.error(error.message || '审批提交失败')
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  formData.status = 'approved'
  formData.approval_opinion = ''
}

// 监听请求数据变化
watch(() => props.request, (newRequest) => {
  if (newRequest) {
    // 可以在这里预填充一些数据
    console.log('审批申请:', newRequest)
  }
})
</script>

<style scoped>
.request-info {
  margin-bottom: 20px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-descriptions__content) {
  font-weight: normal;
}
</style>
