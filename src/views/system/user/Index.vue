<template>
  <div class="user-management">
    <div class="filter-container">
      <el-form :model="listQuery" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="listQuery.username"
            placeholder="用户名"
            clearable
          />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input
            v-model="listQuery.real_name"
            placeholder="真实姓名"
            clearable
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="listQuery.email"
            placeholder="邮箱"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="listQuery.status" placeholder="状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="operation-container">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
      <el-button 
        :disabled="multipleSelection.length === 0"
        @click="handleBulkEnable"
      >
        <el-icon><Check /></el-icon>
        批量启用
      </el-button>
      <el-button 
        :disabled="multipleSelection.length === 0"
        @click="handleBulkDisable"
      >
        <el-icon><Close /></el-icon>
        批量禁用
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="用户名" prop="username" />
      <el-table-column label="真实姓名" prop="real_name" />
      <el-table-column label="邮箱" prop="email" />
      <el-table-column label="部门" prop="department.name" />
      <el-table-column label="角色" prop="role.name" />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后登录" prop="last_login" width="180">
        <template #default="{ row }">
          {{ formatDate(row.last_login) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="created_at" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button 
            v-if="row.status === 'active'" 
            type="warning" 
            size="small"
            @click="handleDisable(row.id)"
          >
            禁用
          </el-button>
          <el-button 
            v-else 
            type="success" 
            size="small"
            @click="handleEnable(row.id)"
          >
            启用
          </el-button>
          <el-button 
            type="info" 
            size="small"
            @click="handleResetPassword(row)"
          >
            重置密码
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

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.page_size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
      />
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="部门" prop="department_id">
          <el-select 
            v-model="userForm.department_id" 
            placeholder="请选择部门"
            style="width: 100%"
          >
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select 
            v-model="userForm.role_id" 
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="isCreate" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item v-if="isCreate" label="确认密码" prop="confirmPassword">
          <el-input
            v-model="userForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            show-password
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

    <!-- 重置密码对话框 -->
    <el-dialog
      title="重置密码"
      v-model="resetPasswordDialogVisible"
      width="400px"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="resetPasswordForm.new_password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input
            v-model="resetPasswordForm.confirm_password"
            type="password"
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="resetPasswordLoading"
          @click="handleResetPasswordSubmit"
        >
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
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  updateUserStatus,
  resetPassword,
  getRoles 
} from '@/api/user'
import { getDepartments } from '@/api/asset'

const list = ref([])
const total = ref(0)
const listLoading = ref(false)
const multipleSelection = ref([])
const departments = ref([])
const roles = ref([])

const listQuery = reactive({
  page: 1,
  page_size: 10,
  username: '',
  real_name: '',
  email: '',
  status: ''
})

const dialogVisible = ref(false)
const resetPasswordDialogVisible = ref(false)
const submitLoading = ref(false)
const resetPasswordLoading = ref(false)
const isCreate = ref(false)
const currentUserId = ref(null)

const userFormRef = ref()
const resetPasswordFormRef = ref()

const userForm = reactive({
  username: '',
  real_name: '',
  email: '',
  phone: '',
  department_id: null,
  role_id: null,
  status: 'active',
  password: '',
  confirmPassword: ''
})

const resetPasswordForm = reactive({
  new_password: '',
  confirm_password: ''
})

const dialogTitle = computed(() => {
  return isCreate.value ? '新增用户' : '编辑用户'
})

const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  department_id: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  role_id: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const resetPasswordRules = {
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.new_password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getList = async () => {
  listLoading.value = true
  try {
    const response = await getUsers(listQuery)
    list.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    listLoading.value = false
  }
}

const getDepartmentsList = async () => {
  try {
    const response = await getDepartments()
    departments.value = response.data
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const getRolesList = async () => {
  try {
    const response = await getRoles()
    roles.value = response.data
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

const resetFilter = () => {
  Object.assign(listQuery, {
    page: 1,
    page_size: 10,
    username: '',
    real_name: '',
    email: '',
    status: ''
  })
  getList()
}

const handleSelectionChange = (selection) => {
  multipleSelection.value = selection
}

const handleCreate = () => {
  isCreate.value = true
  dialogVisible.value = true
  resetForm()
}

const handleEdit = (row) => {
  isCreate.value = false
  dialogVisible.value = true
  currentUserId.value = row.id
  Object.assign(userForm, {
    username: row.username,
    real_name: row.real_name,
    email: row.email,
    phone: row.phone || '',
    department_id: row.department_id,
    role_id: row.role_id,
    status: row.status,
    password: '',
    confirmPassword: ''
  })
}

const handleSubmit = async () => {
  if (!userFormRef.value) return
  const valid = await userFormRef.value.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    const formData = { ...userForm }
    // 移除确认密码字段
    delete formData.confirmPassword

    if (isCreate.value) {
      await createUser(formData)
      ElMessage.success('创建用户成功')
    } else {
      // 编辑时不需要密码字段
      delete formData.password
      await updateUser(currentUserId.value, formData)
      ElMessage.success('更新用户成功')
    }
    
    dialogVisible.value = false
    getList()
  } catch (error) {
    console.error('保存用户失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleEnable = async (id) => {
  try {
    await updateUserStatus(id, 'active')
    ElMessage.success('启用用户成功')
    getList()
  } catch (error) {
    console.error('启用用户失败:', error)
  }
}

const handleDisable = async (id) => {
  try {
    await updateUserStatus(id, 'inactive')
    ElMessage.success('禁用用户成功')
    getList()
  } catch (error) {
    console.error('禁用用户失败:', error)
  }
}

const handleBulkEnable = async () => {
  try {
    const userIds = multipleSelection.value.map(user => user.id)
    await bulkUpdateUserStatus({ user_ids: userIds, status: 'active' })
    ElMessage.success('批量启用成功')
    getList()
    multipleSelection.value = []
  } catch (error) {
    console.error('批量启用失败:', error)
  }
}

const handleBulkDisable = async () => {
  try {
    const userIds = multipleSelection.value.map(user => user.id)
    await bulkUpdateUserStatus({ user_ids: userIds, status: 'inactive' })
    ElMessage.success('批量禁用成功')
    getList()
    multipleSelection.value = []
  } catch (error) {
    console.error('批量禁用失败:', error)
  }
}

const handleResetPassword = (row) => {
  currentUserId.value = row.id
  resetPasswordDialogVisible.value = true
  resetPasswordForm.new_password = ''
  resetPasswordForm.confirm_password = ''
}

const handleResetPasswordSubmit = async () => {
  if (!resetPasswordFormRef.value) return
  const valid = await resetPasswordFormRef.value.validate()
  if (!valid) return

  resetPasswordLoading.value = true
  try {
    await resetPassword(currentUserId.value, {
      new_password: resetPasswordForm.new_password
    })
    ElMessage.success('重置密码成功')
    resetPasswordDialogVisible.value = false
  } catch (error) {
    console.error('重置密码失败:', error)
  } finally {
    resetPasswordLoading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该用户吗？', '提示', {
      type: 'warning'
    })
    await deleteUser(id)
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
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
  Object.assign(userForm, {
    username: '',
    real_name: '',
    email: '',
    phone: '',
    department_id: null,
    role_id: null,
    status: 'active',
    password: '',
    confirmPassword: ''
  })
}

onMounted(() => {
  getList()
  getDepartmentsList()
  getRolesList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 10px;
}
.operation-container {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
