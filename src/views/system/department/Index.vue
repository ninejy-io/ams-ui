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

    <!-- 部门表单对话框 -->
    <DepartmentFormDialog
      v-model:visible="dialogVisible"
      :form-data="currentDepartment"
      :is-edit="isEdit"
      :parent-department="parentDepartment"
      :manager-list="managerList"
      :department-tree="departmentTree"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DepartmentFormDialog from './DepartmentForm.vue'
import {
  getDepartments,
  getDepartmentTree,
  deleteDepartment
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

// 计算属性 - 安全的数据处理
const managerList = computed(() => {
  // 如果数据未加载或加载出错，返回空数组
  if (!isUsersLoaded.value || userLoadError.value) {
    return []
  }
  
  // 使用可选链和空值合并确保安全
  return (userList.value || [])
    .filter(user => user?.id && user?.name) // 过滤有效数据
    .map(user => ({
      value: user.id,
      label: user.name || `用户${user.id}` // 提供默认显示文本
    }))
})

// 方法
const fetchDepartments = async () => {
  loading.value = true
  try {
    let response
    if (isTreeView.value) {
      response = await getDepartmentTree()
      tableData.value = response.data
    } else {
      const params = {
        page: pagination.current,
        size: pagination.size,
        ...searchForm
      }
      response = await getDepartments(params)
      tableData.value = response.data.list
      pagination.total = response.data.total
    }
  } catch (error) {
    ElMessage.error('获取部门列表失败')
    console.error('获取部门列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await getUsers({ page: 1, size: 1000 })
    // 验证响应数据
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

const handleCreate = () => {
  isEdit.value = false
  currentDepartment.value = {}
  parentDepartment.value = {}
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentDepartment.value = { ...row }
  parentDepartment.value = {}
  dialogVisible.value = true
}

const handleAddChild = (row) => {
  isEdit.value = false
  currentDepartment.value = {
    parent_id: row.id
  }
  parentDepartment.value = row
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
  // 这里需要实现展开所有行的逻辑
  // 由于 Element Plus 的 table 没有直接的方法，可以通过设置默认展开来实现
  ElMessage.info('已展开所有部门')
}

const handleCollapseAll = () => {
  // 这里需要实现折叠所有行的逻辑
  ElMessage.info('已折叠所有部门')
}

// 获取部门树数据
const fetchDepartmentTree = async () => {
  try {
    const response = await getDepartmentTree()
    departmentTree.value = response.data
  } catch (error) {
    console.error('获取部门树失败:', error)
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
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
