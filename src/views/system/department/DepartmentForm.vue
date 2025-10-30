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
      <el-form-item label="父部门" v-if="parentDepartment.name">
        <el-input :model-value="parentDepartment.name" disabled />
      </el-form-item>

      <el-form-item label="部门名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入部门名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="部门编码" prop="code">
        <el-input
          v-model="formData.code"
          placeholder="请输入部门编码"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="父部门" prop="parent_id" v-if="!parentDepartment.name">
        <el-tree-select
          v-model="formData.parent_id"
          :data="departmentTree"
          :props="treeProps"
          check-strictly
          placeholder="请选择父部门"
          clearable
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="负责人" prop="manager_id">
        <el-select
          v-model="formData.manager_id"
          placeholder="请选择负责人"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="user in managerList"
            :key="user.value"
            :label="user.label"
            :value="user.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入部门描述"
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
import { createDepartment, updateDepartment } from '@/api/department'

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
  parentDepartment: {
    type: Object,
    default: () => ({})
  },
  managerList: {
    type: Array,
    default: () => []
  },
  departmentTree: {
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
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入部门编码', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  manager_id: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ],
  description: [
    { max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }
  ]
})

// 计算属性
const dialogTitle = computed(() => {
  if (props.parentDepartment.name) {
    return `在"${props.parentDepartment.name}"下新增子部门`
  }
  return props.isEdit ? '编辑部门' : '新增部门'
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
    // 处理父部门ID
    const submitData = {
      ...props.formData,
      parent_id: props.parentDepartment.id || props.formData.parent_id || null
    }

    if (props.isEdit) {
      await updateDepartment(props.formData.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createDepartment(submitData)
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
      // 下次 DOM 更新后重置表单
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
