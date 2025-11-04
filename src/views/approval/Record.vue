<template>
  <div class="approval-records">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>审批记录</span>
          <div>
            <el-button type="primary" @click="fetchRecords">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="filter-row" style="margin:12px 0; display:flex; gap:8px; align-items:center;">
        <el-input v-model="filters.applicant" placeholder="申请人" size="small" clearable />
        <el-select v-model="filters.process_id" placeholder="流程" size="small" clearable style="width:200px">
          <el-option v-for="p in processes" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" size="small" clearable style="width:160px">
          <el-option label="待处理" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-date-picker
          v-model="filters.created_at_range"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          value-format="yyyy-MM-dd"
        />
        <el-button type="primary" size="small" @click="onSearch">查询</el-button>
        <el-button size="small" @click="onReset">重置</el-button>
      </div>

      <el-table :data="records" v-loading="loading" stripe style="width:100%">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="process.name" label="流程名称" min-width="180" />
        <el-table-column prop="applicant.name" label="申请人" width="140" />
        <el-table-column prop="asset.name" label="资产" min-width="150" />
        <el-table-column prop="current_step" label="当前步骤" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">{{ statusText(row.status) }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDetail(row)">查看</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="warning"
              size="small"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" style="margin-top:12px; text-align:right">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10,20,50]"
          @current-change="fetchRecords"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <!-- Detail Dialog -->
    <el-dialog title="审批记录详情" v-model="detailVisible" width="720px" append-to-body>
      <div v-if="detailLoading" class="detail-loading">
        <div class="spinner"></div>
      </div>
      <div v-else>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="序号">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="流程">{{ detail.process?.name }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ detail.applicant?.name }}</el-descriptions-item>
          <el-descriptions-item label="资产">{{ detail.asset?.name }}</el-descriptions-item>
          <el-descriptions-item label="当前步骤">{{ detail.current_step }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.remark }}</el-descriptions-item>
          <el-descriptions-item label="步骤配置">
            <pre class="code-block">{{ prettySteps(detail.steps) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getApprovalRecords,
  getApprovalRecordDetail,
  approveApprovalRecord,
  rejectApprovalRecord,
  getApprovalProcesses
} from '@/api/approval'

// state
const loading = ref(false)
const records = ref([])
const page = reactive({ current: 1, size: 10, total: 0 })

const filters = reactive({
  applicant: '',
  process_id: null,
  status: '',
  created_at_range: null
})

const processes = ref([])

// detail dialog
const detailVisible = ref(false)
const detail = ref({})
const detailLoading = ref(false)

const statusText = (s) => {
  if (!s) return '-'
  const map = { pending: '待处理', approved: '已通过', rejected: '已拒绝' }
  return map[s] || s
}

const prettySteps = (steps) => {
  try {
    if (!steps) return ''
    const v = typeof steps === 'string' ? JSON.parse(steps) : steps
    return JSON.stringify(v, null, 2)
  } catch {
    return String(steps)
  }
}

const fetchProcesses = async () => {
  try {
    const resp = await getApprovalProcesses({ page: 1, size: 100 })
    processes.value = Array.isArray(resp?.data?.items) ? resp.data.items : []
  } catch (e) {
    console.error('fetchProcesses error', e)
    processes.value = []
  }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: page.current,
      size: page.size,
      applicant: filters.applicant || undefined,
      process_id: filters.process_id || undefined,
      status: filters.status || undefined,
      start_date: filters.created_at_range?.[0] || undefined,
      end_date: filters.created_at_range?.[1] || undefined
    }
    const resp = await getApprovalRecords(params)
    records.value = Array.isArray(resp?.data?.items) ? resp.data.items : []
    page.total = Number(resp?.data?.total) || 0
  } catch (e) {
    console.error('fetchRecords error', e)
    records.value = []
    page.total = 0
    ElMessage.error('获取审批记录失败')
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  page.current = 1
  fetchRecords()
}
const onReset = () => {
  filters.applicant = ''
  filters.process_id = null
  filters.status = ''
  filters.created_at_range = null
  page.current = 1
  fetchRecords()
}
const onSizeChange = (size) => {
  page.size = size
  page.current = 1
  fetchRecords()
}

const openDetail = async (row) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const resp = await getApprovalRecordDetail(row.id)
    detail.value = resp?.data || {}
  } catch (e) {
    console.error('openDetail error', e)
    ElMessage.error('获取详情失败')
    detail.value = {}
  } finally {
    detailLoading.value = false
  }
}

const handleApprove = async (row) => {
  try {
    const reason = await ElMessageBox.prompt('请输入审批意见（可选）', '审批通过', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      inputPlaceholder: '审批意见'
    })
    const payload = { remark: reason.value || '' }
    await approveApprovalRecord(row.id, payload)
    ElMessage.success('已通过')
    fetchRecords()
  } catch (e) {
    if (e === 'cancel') return
    console.error('approve error', e)
    ElMessage.error('审批操作失败')
  }
}

const handleReject = async (row) => {
  try {
    const reason = await ElMessageBox.prompt('请输入拒绝理由', '审批拒绝', {
      confirmButtonText: '拒绝',
      cancelButtonText: '取消',
      inputPlaceholder: '拒绝理由'
    })
    if (!reason.value) {
      ElMessage.warning('请填写拒绝理由')
      return
    }
    const payload = { remark: reason.value }
    await rejectApprovalRecord(row.id, payload)
    ElMessage.success('已拒绝')
    fetchRecords()
  } catch (e) {
    if (e === 'cancel') return
    console.error('reject error', e)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchProcesses()
  fetchRecords()
})
</script>

<style scoped>
.approval-records .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-row {
  gap: 8px;
}

.detail-loading {
  text-align: center;
  padding: 20px;
}

.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 4px solid rgba(0,0,0,0.12);
  border-top-color: #409EFF;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.code-block {
  white-space: pre-wrap;
  word-break: break-word;
  background: #f5f7fa;
  border: 1px solid #e6e6e6;
  padding: 12px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace;
  font-size: 13px;
  color: #2d3a45;
  margin: 0;
}

.pagination {
  margin-top: 12px;
}
</style>
