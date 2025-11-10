<!-- src/components/ScanDetail.vue -->
<template>
  <div class="scan-detail">
    <el-card>
      <template #header>
        <span>扫描详情 - 记录ID: {{ recordId }}</span>
      </template>

      <el-table :data="detailData" v-loading="loading">
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="hostname" label="主机名" min-width="150" />
        <el-table-column prop="os_type" label="操作系统" width="120" />
        <el-table-column prop="cpu_cores" label="CPU核心" width="100" />
        <el-table-column prop="memory_gb" label="内存(GB)" width="100" />
        <el-table-column prop="disk_gb" label="磁盘(GB)" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'" size="small">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scanned_at" label="扫描时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.scanned_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="asset_id" label="关联资产" width="120">
          <template #default="{ row }">
            <el-button v-if="row.asset_id" link type="primary" @click="viewAsset(row.asset_id)">
              查看资产
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getScanRecordDetail } from '@/api/scan'

const props = defineProps({
  recordId: {
    type: Number,
    required: true
  }
})

const router = useRouter()
const loading = ref(false)
const detailData = ref([])

const loadDetail = async () => {
  if (!props.recordId) return
  
  loading.value = true
  try {
    const response = await getScanRecordDetail(props.recordId)
    detailData.value = response.data.scan_details || []
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const viewAsset = (assetId) => {
  router.push(`/assets/detail/${assetId}`)
}

watch(() => props.recordId, loadDetail, { immediate: true })
</script>

<style scoped>
.scan-detail {
  padding: 0;
}
</style>
