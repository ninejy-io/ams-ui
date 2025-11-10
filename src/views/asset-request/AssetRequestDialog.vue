<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="request-form"
    >
      <!-- 资产选择 -->
      <el-form-item label="选择资产" prop="asset_id">
        <div class="asset-selector">
          <el-select
            v-model="formData.asset_id"
            placeholder="请选择要申请的资产"
            filterable
            style="width: 100%"
            @change="handleAssetChange"
            :disabled="!!preselectedAssetId"
          >
            <el-option
              v-for="asset in availableAssets"
              :key="asset.id"
              :label="`${asset.asset_name} (${asset.asset_number})`"
              :value="asset.id"
            >
              <div class="asset-option">
                <div class="asset-name">{{ asset.asset_name }}</div>
                <div class="asset-info">
                  <span>编号: {{ asset.asset_number }}</span>
                  <span>类型: {{ asset.asset_type === 'server' ? '服务器' : '办公资产' }}</span>
                  <span>分类: {{ asset.asset_category?.name }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
          
          <!-- 资产详情预览 -->
          <div v-if="selectedAsset" class="asset-preview">
            <el-card shadow="never" class="preview-card">
              <template #header>
                <div class="preview-header">
                  <span>资产详情</span>
                  <el-tag :type="selectedAsset.asset_type === 'server' ? 'primary' : 'success'">
                    {{ selectedAsset.asset_type === 'server' ? '服务器' : '办公资产' }}
                  </el-tag>
                </div>
              </template>
              
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="资产编号">
                  {{ selectedAsset.asset_number }}
                </el-descriptions-item>
                <el-descriptions-item label="资产分类">
                  {{ selectedAsset.asset_category?.name }}
                </el-descriptions-item>
                <el-descriptions-item label="当前状态">
                  <el-tag :type="getStatusType(selectedAsset.status)" size="small">
                    {{ getStatusText(selectedAsset.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="存放位置">
                  {{ selectedAsset.location || '未指定' }}
                </el-descriptions-item>
                <el-descriptions-item label="采购价格" span="2">
                  {{ selectedAsset.purchase_price ? `¥${selectedAsset.purchase_price}` : '未记录' }}
                </el-descriptions-item>
              </el-descriptions>

              <!-- 服务器资产详情 -->
              <div v-if="selectedAsset.asset_type === 'server' && selectedAsset.server_asset" class="server-details">
                <el-divider content-position="left">服务器信息</el-divider>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="主机名">
                    {{ selectedAsset.server_asset.hostname }}
                  </el-descriptions-item>
                  <el-descriptions-item label="内网IP">
                    {{ selectedAsset.server_asset.private_ip }}
                  </el-descriptions-item>
                  <el-descriptions-item label="CPU核心">
                    {{ selectedAsset.server_asset.cpu_cores }} 核
                  </el-descriptions-item>
                  <el-descriptions-item label="内存">
                    {{ selectedAsset.server_asset.memory_gb }} GB
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 办公资产详情 -->
              <div v-if="selectedAsset.asset_type === 'office' && selectedAsset.office_asset" class="office-details">
                <el-divider content-position="left">办公资产信息</el-divider>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="品牌">
                    {{ selectedAsset.office_asset.brand }}
                  </el-descriptions-item>
                  <el-descriptions-item label="型号">
                    {{ selectedAsset.office_asset.model }}
                  </el-descriptions-item>
                  <el-descriptions-item label="序列号">
                    {{ selectedAsset.office_asset.serial_number }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </div>
        </div>
      </el-form-item>

      <!-- 申请信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="申请类型" prop="request_type">
            <el-radio-group v-model="formData.request_type" @change="handleRequestTypeChange">
              <el-radio label="borrow">借用</el-radio>
              <el-radio label="use">领用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item 
            label="预计归还日期" 
            prop="expected_return_date"
            :rules="formData.request_type === 'borrow' ? returnDateRules : []"
          >
            <el-date-picker
              v-model="formData.expected_return_date"
              type="date"
              placeholder="选择预计归还日期"
              style="width: 100%"
              :disabled="formData.request_type === 'use'"
              :clearable="formData.request_type === 'use'"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 使用用途 -->
      <el-form-item label="使用用途" prop="purpose">
        <el-input
          v-model="formData.purpose"
          type="textarea"
          :rows="4"
          placeholder="请详细描述资产的使用用途和场景"
          :maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <!-- 申请人信息 -->
      <el-card header="申请人信息" class="applicant-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请人">
            {{ currentUser?.real_name || currentUser?.username }}
          </el-descriptions-item>
          <el-descriptions-item label="所属部门">
            {{ currentUser?.department?.name || '未分配部门' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentUser?.phone || '未填写' }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ currentUser?.email || '未填写' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        提交申请
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { getAssets } from '@/api/asset'
import { createAssetRequest } from '@/api/assetRequest'

const props = defineProps({
  modelValue: Boolean,
  // 预选的资产ID，如果提供则自动选中该资产
  preselectedAssetId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const authStore = useAuthStore()
const submitting = ref(false)
const availableAssets = ref([])
const loadingAssets = ref(false)

const formData = reactive({
  asset_id: '',
  request_type: 'borrow',
  purpose: '',
  expected_return_date: null
})

// 表单验证规则
const formRules = {
  asset_id: [
    { required: true, message: '请选择要申请的资产', trigger: 'change' }
  ],
  request_type: [
    { required: true, message: '请选择申请类型', trigger: 'change' }
  ],
  purpose: [
    { required: true, message: '请输入使用用途', trigger: 'blur' },
    { min: 10, message: '使用用途不能少于10个字符', trigger: 'blur' }
  ]
}

const returnDateRules = [
  { required: true, message: '借用资产必须填写预计归还日期', trigger: 'change' },
  {
    validator: (rule, value, callback) => {
      if (!value) {
        callback(new Error('请选择预计归还日期'))
        return
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(value)
      if (selectedDate <= today) {
        callback(new Error('归还日期必须大于今天'))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }
]

// 计算属性
const currentUser = computed(() => authStore.user)
const selectedAsset = computed(() => {
  if (!formData.asset_id) return null
  return availableAssets.value.find(asset => asset.id === formData.asset_id)
})

const dialogTitle = computed(() => {
  return props.preselectedAssetId ? '资产领用申请' : '新建资产申请'
})

// 状态显示
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

// 事件处理
const handleAssetChange = (assetId) => {
  if (assetId) {
    const asset = availableAssets.value.find(a => a.id === assetId)
    if (asset && asset.status !== 'in_stock') {
      ElMessage.warning('该资产当前不可用，请选择其他资产')
      formData.asset_id = ''
    }
  }
}

const handleRequestTypeChange = (type) => {
  if (type === 'use') {
    // 领用时清空归还日期
    formData.expected_return_date = null
  }
}

// 加载可用资产
const loadAvailableAssets = async () => {
  loadingAssets.value = true
  try {
    const response = await getAssets({
      status: 'in_stock',
      page: 1,
      page_size: 100 // 获取所有在库资产
    })
    availableAssets.value = response.data.items || response.data
    
    // 如果有预选资产ID，自动选中
    if (props.preselectedAssetId) {
      const preselectedAsset = availableAssets.value.find(
        asset => asset.id == props.preselectedAssetId
      )
      if (preselectedAsset) {
        formData.asset_id = preselectedAsset.id
      } else {
        ElMessage.warning('预选的资产不存在或不可用')
      }
    }
  } catch (error) {
    ElMessage.error('加载资产列表失败')
    console.error('Failed to load assets:', error)
  } finally {
    loadingAssets.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    // 检查选择的资产是否可用
    if (selectedAsset.value && selectedAsset.value.status !== 'in_stock') {
      ElMessage.error('选择的资产当前不可用，请重新选择')
      return
    }

    submitting.value = true

    // 准备提交数据
    const submitData = {
      asset_id: formData.asset_id,
      request_type: formData.request_type,
      purpose: formData.purpose,
      expected_return_date: formData.expected_return_date
    }

    await createAssetRequest(submitData)
    ElMessage.success('申请提交成功，等待审批')

    emit('success')
    visible.value = false
  } catch (error) {
    ElMessage.error(error.message || '提交申请失败')
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  // 重置表单数据
  Object.keys(formData).forEach(key => {
    if (key === 'request_type') {
      formData[key] = 'borrow'
    } else {
      formData[key] = ''
    }
  })
  formData.expected_return_date = null
}

// 监听对话框显示状态
watch(visible, (newVal) => {
  if (newVal) {
    // 对话框显示时加载数据
    loadAvailableAssets()
  } else {
    // 对话框关闭时重置表单
    handleClose()
  }
})

// 监听预选资产ID变化
watch(() => props.preselectedAssetId, (newId) => {
  if (newId && visible.value) {
    // 延迟设置以确保 availableAssets 已加载
    nextTick(() => {
      const asset = availableAssets.value.find(a => a.id == newId)
      if (asset) {
        formData.asset_id = asset.id
      }
    })
  }
})
</script>

<style scoped>
.request-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

.asset-selector {
  width: 100%;
}

.asset-option {
  padding: 8px 0;
}

.asset-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.asset-info {
  font-size: 12px;
  color: #909399;
}

.asset-info span {
  margin-right: 12px;
}

.asset-preview {
  margin-top: 16px;
}

.preview-card {
  border: 1px solid #e4e7ed;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.server-details,
.office-details {
  margin-top: 16px;
}

.applicant-info {
  margin-top: 20px;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: 600;
  padding: 12px 16px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-descriptions__content) {
  font-weight: normal;
}

/* 自定义滚动条 */
.request-form::-webkit-scrollbar {
  width: 6px;
}

.request-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.request-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.request-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
