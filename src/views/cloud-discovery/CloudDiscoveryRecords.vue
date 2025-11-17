<template>
  <div class="cloud-discovery-records">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>云发现记录</span>
          <el-button type="primary" @click="showDiscoverDialog = true">
            <el-icon><Plus /></el-icon>
            发起云发现
          </el-button>
        </div>
      </template>

      <!-- 搜索条件 -->
      <el-form :model="queryParams" inline>
        <el-form-item label="云厂商">
          <el-select v-model="queryParams.provider" placeholder="选择云厂商" clearable>
            <el-option label="AWS" value="aws" />
            <el-option label="阿里云" value="aliyun" />
            <el-option label="腾讯云" value="tencent" />
            <el-option label="Azure" value="azure" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="queryParams.region" placeholder="输入区域" clearable />
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
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="cloud_provider" label="云厂商" width="120">
          <template #default="{ row }">
            <el-tag :type="getProviderTagType(row.cloud_provider)">
              {{ getProviderText(row.cloud_provider) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="区域" width="150" />
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
        <el-table-column prop="instances_found" label="发现实例" width="100" align="center" />
        <el-table-column prop="new_assets" label="新增资产" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #67C23A;">{{ row.new_assets }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updated_assets" label="更新资产" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #E6A23C;">{{ row.updated_assets }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.error_message" style="color: #F56C6C;">
              {{ row.error_message }}
            </span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetails(row)">
              详情
            </el-button>
            <el-button 
              v-if="row.status === 'running'" 
              link 
              type="warning" 
              @click="stopDiscovery(row)"
            >
              停止
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 发起云发现对话框 -->
    <el-dialog v-model="showDiscoverDialog" title="发起云发现" width="500px">
      <el-form :model="discoverForm" label-width="100px">
        <el-form-item label="云厂商" required>
          <el-select v-model="discoverForm.cloud_provider" placeholder="选择云厂商">
            <el-option label="AWS" value="aws" />
            <el-option label="阿里云" value="aliyun" />
            <el-option label="腾讯云" value="tencent" />
            <el-option label="Azure" value="azure" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域" required>
          <el-input v-model="discoverForm.region" placeholder="例如：us-east-1" />
        </el-form-item>
        <el-form-item label="Access Key" required>
          <el-input v-model="discoverForm.access_key" placeholder="输入Access Key" />
        </el-form-item>
        <el-form-item label="Secret Key" required>
          <el-input 
            v-model="discoverForm.secret_key" 
            type="password" 
            placeholder="输入Secret Key" 
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDiscoverDialog = false">取消</el-button>
        <el-button type="primary" :loading="discoverLoading" @click="startDiscovery">
          开始发现
        </el-button>
      </template>
    </el-dialog>

    <!-- 记录详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="发现记录详情" width="700px">
      <record-detail :record="currentRecord" v-if="showDetailDialog && currentRecord" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import RecordDetail from './RecordDetail.vue'
import { getDiscoveryRecords, discoverCloudAssets, deleteDsicoveryRecord } from '@/api/cloudDiscovery'

const loading = ref(false)
const discoverLoading = ref(false)
const showDiscoverDialog = ref(false)
const showDetailDialog = ref(false)
const currentRecord = ref(null)

const tableData = ref([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  provider: '',
  region: '',
  status: ''
})

const discoverForm = reactive({
  cloud_provider: '',
  region: '',
  access_key: '',
  secret_key: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await getDiscoveryRecords(queryParams)
    tableData.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    ElMessage.error('获取发现记录失败')
    console.error('获取发现记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 发起发现
const startDiscovery = async () => {
  if (!discoverForm.provider || !discoverForm.region || 
      !discoverForm.access_key || !discoverForm.secret_key) {
    ElMessage.warning('请填写完整信息')
    return
  }

  discoverLoading.value = true
  try {
    await discoverCloudAssets(discoverForm)
    ElMessage.success('云发现任务已开始')
    showDiscoverDialog.value = false
    resetDiscoverForm()
    loadData() // 重新加载列表
  } catch (error) {
    ElMessage.error('发起发现失败')
    console.error('发起发现失败:', error)
  } finally {
    discoverLoading.value = false
  }
}

// 查看详情
const viewDetails = (row) => {
  currentRecord.value = row
  showDetailDialog.value = true
}

// 停止发现（模拟功能）
const stopDiscovery = async (row) => {
  try {
    await ElMessageBox.confirm('确定要停止这个发现任务吗？', '提示', {
      type: 'warning'
    })
    ElMessage.info('停止功能待实现')
    // 这里可以调用停止发现的API
  } catch (error) {
    // 用户取消
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除云发现记录 "${row.id}" 吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    
    await deleteDsicoveryRecord(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除云发现记录失败:', error)
    }
  }
}

// 重置搜索条件
const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    pageSize: 20,
    provider: '',
    region: '',
    status: ''
  })
  loadData()
}

// 重置发现表单
const resetDiscoverForm = () => {
  Object.assign(discoverForm, {
    provider: '',
    region: '',
    access_key: '',
    secret_key: ''
  })
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

// 获取云厂商标签类型
const getProviderTagType = (provider) => {
  const types = {
    aws: 'success',
    aliyun: 'primary',
    tencent: 'warning',
    azure: 'info'
  }
  return types[provider] || 'info'
}

// 获取云厂商显示文本
const getProviderText = (provider) => {
  const texts = {
    aws: 'AWS',
    aliyun: '阿里云',
    tencent: '腾讯云',
    azure: 'Azure'
  }
  return texts[provider] || provider
}

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    running: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态显示文本
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
})
</script>

<style scoped>
.cloud-discovery-records {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
