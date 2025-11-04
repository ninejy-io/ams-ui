<template>
  <div class="department-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>部门管理</span>
          <div>
            <el-button @click="handleExpandAll">展开全部</el-button>
            <el-button @click="handleCollapseAll">折叠全部</el-button>
            <el-button type="primary" @click="handleCreate">新增部门</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-container">
        <el-form :model="searchForm" inline>
          <el-form-item label="部门名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入部门名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="部门编码">
            <el-input
              v-model="searchForm.code"
              placeholder="请输入部门编码"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="code" label="部门编码" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="父部门" width="120">
          <template #default="scope">
            {{ scope.row.parent_id ? getParentName(scope.row.parent_id) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="120">
          <template #default="scope">
            {{ getManagerName(scope.row.manager_id) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              link
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="success"
              link
              @click="handleAddChild(scope.row)"
            >
              添加子部门
            </el-button>
            <el-button
              size="small"
              type="danger"
              link
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="!isTreeView">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 部门表单对话框（合并自 DepartmentForm.vue） -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleClose"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="localForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="父部门" v-if="parentDepartment.name">
          <el-input :model-value="parentDepartment.name" disabled />
        </el-form-item>

        <el-form-item label="部门名称" prop="name">
          <el-input
            v-model="localForm.name"
            placeholder="请输入部门名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="部门编码" prop="code">
          <el-input
            v-model="localForm.code"
            placeholder="请输入部门编码"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="父部门" prop="parent_id" v-if="!parentDepartment.name">
          <el-tree-select
            v-model="localForm.parent_id"
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
            v-model="localForm.manager_id"
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
            v-model="localForm.description"
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
          <el-button type="primary" :loading="loadingForm" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, toRaw, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDepartments,
  getDepartmentTree,
  deleteDepartment,
  createDepartment,
  updateDepartment
} from '@/api/department'
import { getUsers } from '@/api/user'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const isTreeView = ref(true) // 默认树形视图
const currentDepartment = ref({})
const parentDepartment = ref({})
const departmentTree = ref([])
const userList = ref([])
const isUsersLoaded = ref(false)
const userLoadError = ref(false)

const searchForm = reactive({
  name: '',
  code: ''
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const tableData = ref([])

// ---------------------- form/dialog local state (merged) ----------------------
const formRef = ref(null)
const loadingForm = ref(false)
const localForm = reactive({}) // will be initialized from currentDepartment when opening

const treeProps = {
  value: 'id',
  label: 'name',
  children: 'children'
}

const formRules = reactive({
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入部门编码', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  manager_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  description: [{ max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }]
})

const dialogTitle = computed(() => {
  if (parentDepartment.value?.name) {
    return `在"${parentDepartment.value.name}"下新增子部门`
  }
  return isEdit.value ? '编辑部门' : '新增部门'
})

// manager list for select
const managerList = computed(() => {
  if (!isUsersLoaded.value || userLoadError.value) {
    return []
  }
  return (userList.value || [])
    .filter(user => user?.id && user?.username)
    .map(user => ({
      value: user.id,
      label: user.username || `用户${user.id}`
    }))
})
// ---------------------- end form/dialog state ----------------------

// Methods
const fetchDepartments = async () => {
  loading.value = true
  try {
    let response
    if (isTreeView.value) {
      response = await getDepartmentTree()
      // protect against null response.data
      tableData.value = Array.isArray(response?.data) ? response.data : []
    } else {
      const params = {
        page: pagination.current,
        size: pagination.size,
        ...searchForm
      }
      response = await getDepartments(params)
      tableData.value = Array.isArray(response?.data?.list) ? response.data.list : []
      pagination.total = Number(response?.data?.total) || 0
    }
  } catch (error) {
    ElMessage.error('Failed to load departments')
    console.error('fetchDepartments error:', error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await getUsers({ page: 1, size: 1000 })
    // console.log('fetchUsers response:', response) // debug log
    if (response?.data?.items && Array.isArray(response.data.items)) {
      userList.value = response.data.items
      userLoadError.value = false
    } else {
      userList.value = []
      userLoadError.value = true
      console.warn('用户数据格式不正确')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    userList.value = []
    userLoadError.value = true
    ElMessage.error('获取用户列表失败')
  } finally {
    isUsersLoaded.value = true
  }
}

const getParentName = (parentId) => {
  const findParent = (departments) => {
    for (const dept of departments) {
      if (dept.id === parentId) return dept.name
      if (dept.children) {
        const found = findParent(dept.children)
        if (found) return found
      }
    }
    return null
  }
  return findParent(tableData.value) || '-'
}

const getManagerName = (managerId) => {
  const manager = userList.value.find(user => user.id === managerId)
  return manager ? manager.name : ''
}

const handleSearch = () => {
  if (!isTreeView.value) {
    pagination.current = 1
  }
  fetchDepartments()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    code: ''
  })
  if (!isTreeView.value) {
    pagination.current = 1
  }
  fetchDepartments()
}

const initLocalForm = () => {
  // reset localForm fields then copy currentDepartment
  Object.keys(localForm).forEach((k) => delete localForm[k])
  Object.assign(localForm, toRaw(currentDepartment.value) || {})
}

const handleCreate = () => {
  // console.log('[Department] handleCreate clicked') // debug log
  isEdit.value = false
  currentDepartment.value = {}
  parentDepartment.value = {}
  initLocalForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentDepartment.value = { ...row }
  parentDepartment.value = {}
  initLocalForm()
  dialogVisible.value = true
}

const handleAddChild = (row) => {
  isEdit.value = false
  currentDepartment.value = {
    parent_id: row.id
  }
  parentDepartment.value = row
  initLocalForm()
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门 "${row.name}" 吗？此操作可能会同时删除其子部门。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    await deleteDepartment(row.id)
    ElMessage.success('删除成功')
    fetchDepartments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除部门失败:', error)
    }
  }
}

const handleFormSuccess = () => {
  dialogVisible.value = false
  fetchDepartments()
}

const handleSizeChange = (newSize) => {
  pagination.size = newSize
  pagination.current = 1
  fetchDepartments()
}

const handleCurrentChange = (newPage) => {
  pagination.current = newPage
  fetchDepartments()
}

const handleExpandAll = () => {
  ElMessage.info('已展开所有部门')
}

const handleCollapseAll = () => {
  ElMessage.info('已折叠所有部门')
}

const handleClose = async () => {
  dialogVisible.value = false
  await nextTick()
  formRef.value?.resetFields()
  initLocalForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loadingForm.value = true
  try {
    const submitData = {
      ...toRaw(localForm),
      parent_id: parentDepartment.value?.id || localForm.parent_id || null
    }

    if (isEdit.value) {
      await updateDepartment(submitData.id || currentDepartment.value.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createDepartment(submitData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchDepartments()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error('Operation failed:', error)
  } finally {
    loadingForm.value = false
  }
}

// 获取部门树数据
const fetchDepartmentTree = async () => {
  try {
    const response = await getDepartmentTree()
    // ensure departmentTree is always an array
    departmentTree.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    console.error('fetchDepartmentTree error:', error)
    departmentTree.value = []
  }
}

// 生命周期
onMounted(() => {
  fetchDepartments()
  fetchUsers()
  fetchDepartmentTree()
})
</script>

<style scoped>
.department-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin-bottom: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
