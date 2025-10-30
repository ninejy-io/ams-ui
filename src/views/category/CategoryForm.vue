<template>
  <el-dialog
    :visible="visible"
    :title="getDialogTitle()"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="父分类" v-if="parentCategory.name">
        <el-input :model-value="parentCategory.name" disabled />
      </el-form-item>

      <el-form-item label="分类名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入分类名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="父分类" prop="parent_id" v-if="!parentCategory.name">
        <el-tree-select
          v-model="formData.parent_id"
          :data="categoryTree"
          :props="treeProps"
          check-strictly
          placeholder="请选择父分类"
          clearable
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入分类描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createAssetCategory, updateAssetCategory } from '@/api/assetCategory'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  parentCategory: {
    type: Object,
    default: () => ({})
  },
  categoryTree: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'success'])

// 响应式数据
const loading = ref(false)
const formRef = ref()

// 树形选择器配置
const treeProps = {
  value: 'id',
  label: 'name',
  children: 'children'
}

// 表单验证规则
const formRules = reactive({
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }
  ]
})

// 计算属性
const dialogTitle = computed(() => {
  if (props.parentCategory.name) {
    return `在"${props.parentCategory.name}"下新增子分类`
  }
  return props.isEdit ? '编辑分类' : '新增分类'
})

// 方法
const getDialogTitle = () => {
  return dialogTitle.value
}

const handleClose = () => {
  emit('update:visible', false)
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    // 处理父分类ID
    const submitData = {
      ...props.formData,
      parent_id: props.parentCategory.id || props.formData.parent_id || null
    }

    if (props.isEdit) {
      await updateAssetCategory(props.formData.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createAssetCategory(submitData)
      ElMessage.success('创建成功')
    }
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error(props.isEdit ? '更新失败' : '创建失败')
    console.error('操作失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听 visible 变化，重置表单
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && formRef.value) {
      // 下次 DOM 更新后重置表单验证
      setTimeout(() => {
        formRef.value?.clearValidate()
      }, 0)
    }
  }
)
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
