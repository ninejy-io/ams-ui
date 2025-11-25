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
        <el-form-item label="借用人" prop="borrowerId">
          <el-select v-model="queryParams.borrowerId" placeholder="请选择借用人" clearable>
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
            <el-option label="借出中" value="lent" />
            <el-option label="已归还" value="returned" />
            <el-option label="逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table v-loading="loading" :data="recordList" border>
      <el-table-column label="资产编号" align="center" prop="assetNumber" />
      <el-table-column label="资产名称" align="center" prop="assetName" />
      <el-table-column label="借用人" align="center" prop="borrowerName" />
      <el-table-column label="借用部门" align="center" prop="departmentName" />
      <el-table-column label="借出日期" align="center" prop="lendDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lendDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计归还" align="center" prop="expectedReturn" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expectedReturn, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际归还" align="center" prop="actualReturn" width="180">
        <template #default="scope">
          <span>{{ scope.row.actualReturn ? parseTime(scope.row.actualReturn, '{y}-{m}-{d}') : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'lent' ? 'warning' : 'success'">
            {{ scope.row.status === 'lent' ? '借出中' : '已归还' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 'lent'"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleReturn(scope.row)"
          >归还</el-button>
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

    <!-- 归还资产对话框 -->
    <el-dialog title="归还资产" v-model="returnDialogVisible" width="500px">
      <el-form ref="returnForm" :model="returnForm" :rules="returnRules" label-width="100px">
        <el-form-item label="归还日期" prop="returnDate">
          <el-date-picker
            v-model="returnForm.returnDate"
            type="date"
            placeholder="选择归还日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="returnForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReturn">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listLendRecords, returnAsset } from '@/api/asset/lend'
import { getUsers } from '@/api/user'
import { parseTime } from '@/utils'

const loading = ref(true)
const recordList = ref([])
const total = ref(0)
const userList = ref([])

const queryParams = ref({
  page: 1,
  pageSize: 20,
  assetNumber: undefined,
  borrowerId: undefined,
  status: undefined
})

const returnDialogVisible = ref(false)
const returnForm = ref({
  recordId: undefined,
  returnDate: '',
  notes: ''
})
const returnRules = ref({
  returnDate: [{ required: true, message: '请选择归还日期', trigger: 'change' }]
})

/** 查询借出记录列表 */
function getList() {
  loading.value = true
  listLendRecords(queryParams.value).then(response => {
    recordList.value = response.data.items
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
    borrowerId: undefined,
    status: undefined
  }
  handleQuery()
}

/** 归还按钮操作 */
function handleReturn(row) {
  returnForm.value = {
    recordId: row.id,
    returnDate: parseTime(new Date(), '{y}-{m}-{d}'),
    notes: ''
  }
  returnDialogVisible.value = true
}

/** 提交归还 */
function submitReturn() {
  returnAsset(returnForm.value).then(() => {
    ElMessage.success('归还成功')
    returnDialogVisible.value = false
    getList()
  })
}

/** 查看详情 */
function handleView(row) {
  // 实现详情查看逻辑
  console.log('查看详情:', row)
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
