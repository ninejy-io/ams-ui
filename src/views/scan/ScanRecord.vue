<template>
  <div class="scan-record">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>网络扫描</span>
          <el-button type="primary" @click="showScanDialog = true">
            <el-icon><Plus /></el-icon>
            新建扫描
          </el-button>
        </div>
      </template>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-statistic title="总扫描次数" :value="stats.total_scan_records" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="完成扫描" :value="stats.completed_scans" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="发现主机" :value="stats.total_discovered" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="新增资产" :value="stats.total_new_assets" />
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>扫描记录</span>
      </template>

      <!-- 搜索条件 -->
      <el-form :model="queryParams" inline>
        <el-form-item label="网段">
          <el-input v-model="queryParams.subnet" placeholder="输入网段" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="选择状态" clearable>
            <el-option label="运行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="subnet" label="扫描网段" min-width="150" />
        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="discovered_hosts" label="发现主机" width="100" />
        <el-table-column prop="new_assets" label="新增资产" width="100" />
        <el-table-column prop="updated_assets" label="更新资产" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 扫描对话框 -->
    <el-dialog v-model="showScanDialog" title="开始扫描" width="500px">
      <el-form :model="scanForm" label-width="100px">
        <el-form-item label="扫描网段" required>
          <el-input v-model="scanForm.subnet" placeholder="例如：192.168.1.0/24" />
          <div class="form-tip">请输入CIDR格式的网段</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showScanDialog = false">取消</el-button>
        <el-button type="primary" :loading="scanLoading" @click="NewStartScan">
          开始扫描
        </el-button>
      </template>
    </el-dialog>

    <!-- 扫描详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="扫描详情" width="90%" top="5vh">
      <scan-detail :record-id="currentRecordId" v-if="showDetailDialog" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, compile } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ScanDetail from './ScanDetail.vue'
import { getScanRecords, startScan, getScanStats } from '@/api/scan'

const loading = ref(false)
const scanLoading = ref(false)
const showScanDialog = ref(false)
const showDetailDialog = ref(false)
const currentRecordId = ref(null)

const stats = ref({
  total_scan_records: 0,
  completed_scans: 0,
  runningScans: 0,
  total_discovered: 0,
  total_new_assets: 0
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  subnet: '',
  status: ''
})

const tableData = ref([])
const total = ref(0)

const scanForm = reactive({
  subnet: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const response = await getScanRecords(queryParams)
    tableData.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await getScanStats()
    stats.value = response.data
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

const NewStartScan = async () => {
  if (!scanForm.subnet) {
    ElMessage.warning('请输入扫描网段')
    return
  }

  scanLoading.value = true
  try {
    await startScan(scanForm)
    ElMessage.success('扫描任务已开始')
    showScanDialog.value = false
    scanForm.subnet = ''
    loadData()
    loadStats()
  } catch (error) {
    ElMessage.error('开始扫描失败')
  } finally {
    scanLoading.value = false
  }
}

const showDetail = (row) => {
  currentRecordId.value = row.id
  showDetailDialog.value = true
}

const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    pageSize: 20,
    subnet: '',
    status: ''
  })
  loadData()
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const getStatusType = (status) => {
  const types = {
    running: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || status
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.scan-record {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
