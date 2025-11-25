<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="80px">
        <el-form-item label="资产编号" prop="assetNumber">
          <el-input
            v-model="queryParams.assetNumber"
            placeholder="请输入资产编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="申请人" prop="requesterId">
          <el-select v-model="queryParams.requesterId" placeholder="请选择申请人" clearable>
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleCreate">新建申请</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table v-loading="loading" :data="requestList" border>
      <el-table-column label="资产编号" align="center" prop="assetNumber" />
      <el-table-column label="资产名称" align="center" prop="assetName" />
      <el-table-column label="申请人" align="center" prop="requesterName" />
      <el-table-column label="借用人" align="center" prop="borrowerName" />
      <el-table-column label="借用部门" align="center" prop="departmentName" />
      <el-table-column label="预计借出日期" align="center" prop="expectedLendDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expectedLendDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计归还日期" align="center" prop="expectedReturn" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expectedReturn, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">
            {{ statusFilter(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            v-if="hasPermission('asset:lend:approve') && scope.row.status === 'pending'"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleApprove(scope.row)"
          >审批</el-button>
          <el-button
            v-if="scope.row.requesterId === currentUser.id && scope.row.status === 'pending'"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleCancel(scope.row)"
          >取消</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
          >详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.page"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 审批对话框 -->
    <el-dialog title="审批借出申请" v-model="approveDialogVisible" width="500px">
      <el-form ref="approveForm" :model="approveForm" :rules="approveRules" label-width="100px">
        <el-form-item label="审批操作" prop="action">
          <el-radio-group v-model="approveForm.action">
            <el-radio label="approve">批准</el-radio>
            <el-radio label="reject">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="approveForm.action === 'reject'" label="拒绝原因" prop="reason">
          <el-input
            v-model="approveForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listLendRequests, approveLendRequest, cancelLendRequest } from '@/api/asset/lend'
import { getUsers } from '@/api/user'
import { parseTime } from '@/utils'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const currentUser = userStore.user

const loading = ref(true)
const requestList = ref([])
const total = ref(0)
const userList = ref([])

const queryParams = ref({
  page: 1,
  pageSize: 20,
  assetNumber: undefined,
  requesterId: undefined,
  status: undefined
})

const approveDialogVisible = ref(false)
const approveForm = ref({
  requestId: undefined,
  action: 'approve',
  reason: ''
})
const approveRules = ref({
  action: [{ required: true, message: '请选择审批操作', trigger: 'change' }]
})

// 状态过滤
function statusFilter(status) {
  const statusMap = {
    'pending': '待审批',
    'approved': '已批准',
    'rejected': '已拒绝',
    'cancelled': '已取消'
  }
  return statusMap[status]
}

// 状态标签类型
function statusTagType(status) {
  const typeMap = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'cancelled': 'info'
  }
  return typeMap[status]
}

/** 查询借出申请列表 */
function getList() {
  loading.value = true
  listLendRequests(queryParams.value).then(response => {
    requestList.value = response.data.items
    total.value = response.data.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.page = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value = {
    page: 1,
    pageSize: 20,
    assetNumber: undefined,
    requesterId: undefined,
    status: undefined
  }
  handleQuery()
}

/** 新建申请 */
function handleCreate() {
  // 跳转到创建申请页面
  this.$router.push('/asset/lend-request/create')
}

/** 审批按钮操作 */
function handleApprove(row) {
  approveForm.value = {
    requestId: row.id,
    action: 'approve',
    reason: ''
  }
  approveDialogVisible.value = true
}

/** 取消按钮操作 */
function handleCancel(row) {
  ElMessageBox.confirm('确认取消该借出申请吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    cancelLendRequest(row.id).then(() => {
      ElMessage.success('取消成功')
      getList()
    })
  })
}

/** 提交审批 */
function submitApprove() {
  approveLendRequest(approveForm.value).then(() => {
    ElMessage.success('审批成功')
    approveDialogVisible.value = false
    getList()
  })
}

/** 查看详情 */
function handleView(row) {
  // 实现详情查看逻辑
  console.log('查看详情:', row)
}

// 权限检查
function hasPermission(permission) {
  // 实现权限检查逻辑
  return true
}

// 获取用户列表
function getUserList() {
  getUsers().then(response => {
    userList.value = response.data.items
  })
}

onMounted(() => {
  getList()
  getUserList()
})
</script>
