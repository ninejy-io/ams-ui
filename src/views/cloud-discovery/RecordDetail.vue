<template>
  <div class="record-detail">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="记录ID">
        {{ record.id }}
      </el-descriptions-item>
      <el-descriptions-item label="云厂商">
        <el-tag :type="getProviderTagType(record.cloud_provider)">
          {{ getProviderText(record.cloud_provider) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="区域">
        {{ record.region }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(record.status)">
          {{ getStatusText(record.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="开始时间">
        {{ formatTime(record.start_time) }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ formatTime(record.end_time) }}
      </el-descriptions-item>
      <el-descriptions-item label="发现实例数" :span="2">
        <span class="number">{{ record.instances_found }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="新增资产数">
        <span class="number success">{{ record.new_assets }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="更新资产数">
        <span class="number warning">{{ record.updated_assets }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="错误信息" :span="2" v-if="record.error_message">
        <div class="error-message">
          {{ record.error_message }}
        </div>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 统计信息卡片 -->
    <div class="stats-cards" style="margin-top: 20px;">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-statistic title="发现实例" :value="record.instances_found" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="新增资产" :value="record.new_assets" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="更新资产" :value="record.updated_assets" />
        </el-col>
      </el-row>
    </div>

    <!-- 执行时间 -->
    <div class="duration" style="margin-top: 20px; text-align: center;">
      <el-text type="info">
        执行时长: {{ getDuration() }}
      </el-text>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
})

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

// 计算执行时长
const getDuration = () => {
  const { start_time, end_time, status } = props.record
  
  if (!start_time) return '-'
  
  const start = new Date(start_time)
  let end = status === 'running' ? new Date() : new Date(end_time)
  
  const duration = end - start
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟 ${seconds % 60}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}
</script>

<style scoped>
.record-detail {
  padding: 0;
}

.number {
  font-weight: bold;
  font-size: 16px;
}

.number.success {
  color: #67C23A;
}

.number.warning {
  color: #E6A23C;
}

.error-message {
  color: #F56C6C;
  background: #FEF0F0;
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
}
</style>
