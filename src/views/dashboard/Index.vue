<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalAssets }}</div>
              <div class="stat-label">资产总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ statistics.totalValue }}</div>
              <div class="stat-label">资产总值</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.inUseAssets }}</div>
              <div class="stat-label">在用资产</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.maintenanceAssets }}</div>
              <div class="stat-label">维修中</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>资产状态分布</span>
          </template>
          <div ref="statusChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>即将过保资产</span>
          </template>
          <el-table :data="expiringAssets" style="width: 100%">
            <el-table-column prop="assetNumber" label="资产编号" />
            <el-table-column prop="name" label="资产名称" />
            <el-table-column prop="warrantyUntil" label="保修到期" />
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewAsset(row.id)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getAssetStatistics, getExpiringWarrantyAssets } from '@/api/asset'

const router = useRouter()
const statusChart = ref()
const statistics = ref({
  totalAssets: 0,
  totalValue: 0,
  inUseAssets: 0,
  maintenanceAssets: 0
})
const expiringAssets = ref([])

const loadStatistics = async () => {
  try {
    const response = await getAssetStatistics()
    statistics.value = response.data
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadExpiringAssets = async () => {
  try {
    const response = await getExpiringWarrantyAssets({ days: 30 })
    expiringAssets.value = response.data
  } catch (error) {
    console.error('加载即将过保资产失败:', error)
  }
}

const initChart = () => {
  const chart = echarts.init(statusChart.value)
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '资产状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: statistics.value.inUseAssets, name: '在用' },
          { value: statistics.value.inStockAssets, name: '库存' },
          { value: statistics.value.maintenanceAssets, name: '维修中' },
          { value: statistics.value.scrappedAssets, name: '报废' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  chart.setOption(option)
}

const viewAsset = (id) => {
  router.push(`/assets/detail/${id}`)
}

onMounted(async () => {
  await loadStatistics()
  await loadExpiringAssets()
  initChart()
})
</script>

<style scoped>
.stat-card {
  margin-bottom: 20px;
}
.stat-item {
  display: flex;
  align-items: center;
}
.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-right: 15px;
}
.stat-info {
  flex: 1;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>
