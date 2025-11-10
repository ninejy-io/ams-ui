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
      label-width="100px"
      :disabled="mode === 'view'"
    >
      <el-form-item label="资产类型" prop="asset_type">
        <el-radio-group v-model="formData.asset_type" @change="handleTypeChange">
          <el-radio label="server">服务器资产</el-radio>
          <el-radio label="office">办公资产</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="资产名称" prop="asset_name">
            <el-input v-model="formData.asset_name" placeholder="请输入资产名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="资产分类" prop="asset_category_id">
            <el-select v-model="formData.asset_category_id" placeholder="请选择" style="width: 100%">
              <el-option
                v-for="category in assetStore.categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 服务器资产特有字段 -->
      <div v-if="formData.asset_type === 'server'">
        <el-divider>服务器信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来源类型" prop="server_asset.source_type">
              <el-select v-model="formData.server_asset.source_type" style="width: 100%">
                <el-option label="云厂商" value="cloud" />
                <el-option label="自建机房" value="on_premise" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item 
              label="云厂商" 
              prop="server_asset.cloud_provider"
              v-if="formData.server_asset.source_type === 'cloud'"
            >
              <el-select v-model="formData.server_asset.cloud_provider" style="width: 100%">
                <el-option label="阿里云" value="aliyun" />
                <el-option label="腾讯云" value="tencent" />
                <el-option label="AWS" value="aws" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="内网IP" prop="server_asset.private_ip">
              <el-input v-model="formData.server_asset.private_ip" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主机名" prop="server_asset.hostname">
              <el-input v-model="formData.server_asset.hostname" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="CPU核心" prop="server_asset.cpu_cores">
              <el-input-number v-model="formData.server_asset.cpu_cores" :min="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内存(GB)" prop="server_asset.memory_gb">
              <el-input-number v-model="formData.server_asset.memory_gb" :min="1" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 办公资产特有字段 -->
      <div v-if="formData.asset_type === 'office'">
        <el-divider>办公资产信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="office_asset.brand">
              <el-input v-model="formData.office_asset.brand" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="office_asset.model">
              <el-input v-model="formData.office_asset.model" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="序列号" prop="office_asset.serial_number">
          <el-input v-model="formData.office_asset.serial_number" />
        </el-form-item>
      </div>

      <!-- 通用信息 -->
      <el-divider>通用信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="采购价格" prop="purchase_price">
            <el-input-number
              v-model="formData.purchase_price"
              :precision="2"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="采购日期" prop="purchase_date">
            <el-date-picker
              v-model="formData.purchase_date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="使用部门" prop="department_id">
            <el-select v-model="formData.department_id" placeholder="请选择" style="width: 100%">
              <!-- 这里需要从API获取部门列表 -->
              <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商" prop="supplier_id">
            <el-select v-model="formData.supplier_id" placeholder="请选择" style="width: 100%">
              <!-- 这里需要从API获取供应商列表 -->
              <el-option v-for="spl in suppliers" :key="spl.id" :label="spl.name" :value="spl.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="存放位置" prop="location">
        <el-input v-model="formData.location" />
      </el-form-item>

      <el-form-item label="资产描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        v-if="mode !== 'view'"
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
      >
        {{ mode === 'create' ? '创建' : '更新' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAssetStore } from '@/store/asset'
import { getDepartments } from '@/api/department'
import { getSuppliers } from '@/api/supplier'

const props = defineProps({
  modelValue: Boolean,
  mode: String, // 'create' | 'edit' | 'view'
  data: Object
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const assetStore = useAssetStore()
const submitting = ref(false)
const departments = ref([])
const suppliers = ref([])

const formData = reactive({
  asset_type: 'server',
  asset_name: '',
  asset_category_id: '',
  purchase_price: null,
  purchase_date: null,
  department_id: '',
  supplier_id: '',
  location: '',
  description: '',
  server_asset: {
    source_type: 'cloud',
    cloud_provider: '',
    private_ip: '',
    hostname: '',
    cpu_cores: null,
    memory_gb: null
  },
  office_asset: {
    brand: '',
    model: '',
    serial_number: ''
  }
})

const formRules = {
  asset_type: [{ required: true, message: '请选择资产类型', trigger: 'change' }],
  asset_name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
  asset_category_id: [{ required: true, message: '请选择资产分类', trigger: 'change' }]
}

const dialogTitle = computed(() => {
  const titles = {
    create: '新增资产',
    edit: '编辑资产',
    view: '资产详情'
  }
  return titles[props.mode] || '资产信息'
})

// 处理资产类型变化
const handleTypeChange = (type) => {
  // 重置特有字段
  if (type === 'server') {
    formData.office_asset = { brand: '', model: '', serial_number: '' }
  } else {
    formData.server_asset = { source_type: 'cloud', cloud_provider: '', private_ip: '', hostname: '' }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true

    // 清理空值
    const submitData = JSON.parse(JSON.stringify(formData))
    
    if (props.mode === 'create') {
      await assetStore.createNewAsset(submitData)
      ElMessage.success('创建成功')
    } else {
      await assetStore.updateExistingAsset(props.data.id, submitData)
      ElMessage.success('更新成功')
    }

    emit('success')
    visible.value = false
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.clearValidate()
}

onMounted(async () => {
  // 获取部门列表
  const deptResponse = await getDepartments()
  departments.value = deptResponse.data

  // 获取供应商列表
  const suppResponse = await getSuppliers()
  suppliers.value = suppResponse.data
})

// 监听数据变化
// watch(() => props.data, (newData) => {
//   if (newData) {
//     Object.keys(formData).forEach(key => {
//       if (newData[key] !== undefined) {
//         formData[key] = newData[key]
//       }
//     })
//     // 处理嵌套对象
//     if (newData.server_asset) {
//       formData.server_asset = { ...formData.server_asset, ...newData.server_asset }
//     }
//     if (newData.office_asset) {
//       formData.office_asset = { ...formData.office_asset, ...newData.office_asset }
//     }
//   } else {
//     // 重置表单
//     Object.keys(formData).forEach(key => {
//       if (typeof formData[key] === 'string') {
//         formData[key] = ''
//       } else if (typeof formData[key] === 'number') {
//         formData[key] = null
//       } else if (Array.isArray(formData[key])) {
//         formData[key] = []
//       } else if (typeof formData[key] === 'object' && formData[key] !== null) {
//         // 保留对象结构，但清空值
//         Object.keys(formData[key]).forEach(subKey => {
//           if (typeof formData[key][subKey] === 'string') {
//             formData[key][subKey] = ''
//           } else {
//             formData[key][subKey] = null
//           }
//         })
//       }
//     })
//     formData.asset_type = 'server'
//     formData.server_asset.source_type = 'cloud'
//   }
// }, { immediate: true })


const defaultFormTemplate = {
  asset_type: 'server',
  asset_name: '',
  asset_category_id: '',
  purchase_price: null,
  purchase_date: null,
  department_id: '',
  supplier_id: '',
  location: '',
  description: '',
  server_asset: {
    source_type: 'cloud',
    cloud_provider: '',
    private_ip: '',
    hostname: '',
    cpu_cores: null,
    memory_gb: null
  },
  office_asset: {
    brand: '',
    model: '',
    serial_number: ''
  }
}

// 深度就地合并：保留 target 的对象引用，递归覆盖其字段
function deepAssign(target, source) {
  if (!source) return
  // copy properties that exist on target first (preserve structure)
  for (const key of Object.keys(target)) {
    if (!(key in source)) continue
    const srcVal = source[key]
    const tgtVal = target[key]
    // 如果后端明确返回 null，不覆盖嵌套对象，保留现有默认结构
    if (srcVal === null) {
      // 保留 target 的值（避免把对象置为 null）
      continue
    }
    if (Array.isArray(tgtVal)) {
      target[key] = Array.isArray(srcVal) ? srcVal.slice() : []
    } else if (
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal) &&
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal)
    ) {
      // 就地递归赋值
      deepAssign(tgtVal, srcVal)
    } else {
      // 原子值直接赋值
      target[key] = srcVal
    }
    }
  // 处理 source 中 target 没有但需要新增的字段
  for (const key of Object.keys(source)) {
    if (target[key] === undefined) {
      const srcVal = source[key]
      if (srcVal === null) {
        // 如果后端返回 null，跳过创建，让默认模板或现有值保留
        continue
      }
      target[key] = Array.isArray(srcVal) ? srcVal.slice() :
                    (srcVal !== null && typeof srcVal === 'object' ? { ...srcVal } : srcVal)
    }
  }
}

function resetFormToDefault() {
  // 就地恢复默认模板，保留 reactive 对象引用
  deepAssign(formData, defaultFormTemplate)
  // ensure asset_type and server_asset defaults in case default template missing
  if (!formData.asset_type) formData.asset_type = 'server'
  if (!formData.server_asset) formData.server_asset = { source_type: 'cloud', cloud_provider: '', private_ip: '', hostname: '', cpu_cores: null, memory_gb: null }
}

function ensureNestedStructures() {
  if (!formData.server_asset || typeof formData.server_asset !== 'object') {
    formData.server_asset = { ...defaultFormTemplate.server_asset }
  }
  if (!formData.office_asset || typeof formData.office_asset !== 'object') {
    formData.office_asset = { ...defaultFormTemplate.office_asset }
  }
}

// watch props.data safely
watch(() => props.data, (newData) => {
  if (newData && Object.keys(newData).length) {
    deepAssign(formData, newData)
  } else {
    resetFormToDefault()
  }
  // 确保嵌套结构存在并根据类型调整特有字段
  ensureNestedStructures()
  handleTypeChange(formData.asset_type)
}, { immediate: true })
</script>
