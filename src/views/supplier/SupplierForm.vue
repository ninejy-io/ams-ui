<template>
  <el-dialog
    v-model="localVisible"
    :title="isEdit ? '编辑供应商' : '新增供应商'"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="localForm"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="供应商名称" prop="name">
        <el-input
          v-model="localForm.name"
          placeholder="请输入供应商名称"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="联系人" prop="contact">
        <el-input
          v-model="localForm.contact"
          placeholder="请输入联系人"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input
          v-model="localForm.phone"
          placeholder="请输入联系电话"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="localForm.email"
          placeholder="请输入邮箱"
          maxlength="100"
        />
      </el-form-item>

      <el-form-item label="地址" prop="address">
        <el-input
          v-model="localForm.address"
          type="textarea"
          :rows="3"
          placeholder="请输入地址"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="localForm.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
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
import { ref, reactive, watch, toRaw, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { createSupplier, updateSupplier } from '@/api/supplier'

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
  }
})

const emit = defineEmits(['update:visible', 'success'])

// local visible to forward changes to parent
const localVisible = ref(props.visible)
watch(() => props.visible, (v) => (localVisible.value = v))
watch(localVisible, (v) => emit('update:visible', v))

// local form copy to avoid mutating parent prop directly
const localForm = reactive({ ...props.formData })
watch(
  () => props.formData,
  (newVal) => {
    Object.keys(localForm).forEach((k) => delete localForm[k])
    Object.assign(localForm, newVal || {})
  },
  { deep: true, immediate: true }
)

// reactive data
const loading = ref(false)
const formRef = ref()

// validation rules
const formRules = reactive({
  name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  contact: [{ max: 100, message: '长度不能超过 100 个字符', trigger: 'blur' }],
  phone: [{ max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' }],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
    { max: 100, message: '长度不能超过 100 个字符', trigger: 'blur' }
  ],
  address: [{ max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }],
  remark: [{ max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }]
})

// methods
const handleClose = async () => {
  // close dialog and notify parent
  localVisible.value = false
  await nextTick()
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const payload = toRaw(localForm)
    if (props.isEdit) {
      await updateSupplier(props.formData.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createSupplier(payload)
      ElMessage.success('创建成功')
    }
    emit('success')
    localVisible.value = false
  } catch (error) {
    ElMessage.error(props.isEdit ? '更新失败' : '创建失败')
    console.error('操作失败:', error)
  } finally {
    loading.value = false
  }
}

// clear validation on open
watch(
  () => localVisible.value,
  (val) => {
    if (val) {
      // clear validate and ensure form has latest data
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
