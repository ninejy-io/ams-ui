<template>
  <div class="role-management">
    <div class="operation-container">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
    >
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="角色名称" prop="name" />
      <el-table-column label="描述" prop="description" />
      <el-table-column label="创建时间" prop="created_at" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button 
            type="danger" 
            size="small"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getRoles, createRole, updateRole, deleteRole } from '@/api/user'

const list = ref([])
const listLoading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isCreate = ref(false)
const currentRoleId = ref(null)

const roleFormRef = ref()

const roleForm = reactive({
  name: '',
  description: ''
})

const dialogTitle = computed(() => {
  return isCreate.value ? '新增角色' : '编辑角色'
})

const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getList = async () => {
  listLoading.value = true
  try {
    const response = await getRoles()
    list.value = response.data
  } catch (error) {
    console.error('获取角色列表失败:', error)
  } finally {
    listLoading.value = false
  }
}

const handleCreate = () => {
  isCreate.value = true
  dialogVisible.value = true
  resetForm()
}

const handleEdit = (row) => {
  isCreate.value = false
  dialogVisible.value = true
  currentRoleId.value = row.id
  Object.assign(roleForm, {
    name: row.name,
    description: row.description
  })
}

const handleSubmit = async () => {
  if (!roleFormRef.value) return
  const valid = await roleFormRef.value.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    if (isCreate.value) {
      await createRole(roleForm)
      ElMessage.success('创建角色成功')
    } else {
      await updateRole(currentRoleId.value, roleForm)
      ElMessage.success('更新角色成功')
    }
    
    dialogVisible.value = false
    getList()
  } catch (error) {
    console.error('保存角色失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该角色吗？', '提示', {
      type: 'warning'
    })
    await deleteRole(id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error === 'cancel') {
      return
    }
    ElMessage.error('删除失败')
  }
}

const resetForm = () => {
  if (roleFormRef.value) {
    roleFormRef.value.resetFields()
  }
  Object.assign(roleForm, {
    name: '',
    description: ''
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.operation-container {
  margin-bottom: 20px;
}
</style>
