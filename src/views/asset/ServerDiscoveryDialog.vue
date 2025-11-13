<template>
  <el-dialog
    v-model="visible"
    title="服务器发现"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab">
      <!-- 云资产发现 -->
      <el-tab-pane label="云资产发现" name="cloud">
        <el-form :model="cloudForm" :rules="cloudRules" label-width="100px">
          <el-form-item label="云厂商" prop="cloud_provider">
            <el-select v-model="cloudForm.cloud_provider" placeholder="请选择">
              <el-option label="阿里云" value="aliyun" />
              <el-option label="腾讯云" value="tencent" />
              <el-option label="AWS" value="aws" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Access Key" prop="access_key">
            <el-input v-model="cloudForm.access_key" type="password" show-password />
          </el-form-item>
          
          <el-form-item label="Secret Key" prop="secret_key">
            <el-input v-model="cloudForm.secret_key" type="password" show-password />
          </el-form-item>
          
          <el-form-item label="区域" prop="region">
            <el-input v-model="cloudForm.region" placeholder="如: cn-beijing" />
          </el-form-item>
        </el-form>
        
        <div style="text-align: center; margin-top: 20px;">
          <el-button type="primary" @click="handleCloudDiscovery" :loading="loading">
            开始发现
          </el-button>
        </div>
      </el-tab-pane>

      <!-- 内网扫描 -->
      <el-tab-pane label="内网扫描" name="internal">
        <el-form :model="internalForm" label-width="100px">
          <el-form-item label="网络段" prop="network_cidr">
            <el-input v-model="internalForm.subnet" placeholder="如: 192.168.1.0/24" />
          </el-form-item>
          
          <el-form-item label="端口范围">
            <el-input v-model="internalForm.ports" placeholder="如: 22,80,443,3306" />
          </el-form-item>
        </el-form>
        
        <div style="text-align: center; margin-top: 20px;">
          <el-button type="primary" @click="handleInternalScan" :loading="loading">
            开始扫描
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 发现结果 -->
    <div v-if="discoveryResult" style="margin-top: 20px;">
      <el-alert
        :title="`发现完成: 总共 ${discoveryResult.total_discovered} 个资产, 新增 ${discoveryResult.new_assets} 个, 更新 ${discoveryResult.updated_assets} 个`"
        type="success"
        show-icon
        :closable="false"
      />
      
      <div v-if="discoveryResult.errors && discoveryResult.errors.length" style="margin-top: 10px;">
        <el-alert
          title="发现过程中的错误"
          type="warning"
          show-icon
        >
          <ul>
            <li v-for="(error, index) in discoveryResult.errors" :key="index">
              {{ error }}
            </li>
          </ul>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { discoverCloudAssets } from '@/api/cloudDiscovery'
import { startScan } from '@/api/scan'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('cloud')
const loading = ref(false)
const discoveryResult = ref(null)

const cloudForm = reactive({
  cloud_provider: 'aws',
  access_key: '',
  secret_key: '',
  region: 'us-east-1'
})

const internalForm = reactive({
  subnet: '192.168.1.0/24',
  ports: '22'
})

const cloudRules = {
  cloud_provider: [{ required: true, message: '请选择云厂商', trigger: 'change' }],
  access_key: [{ required: true, message: '请输入Access Key', trigger: 'blur' }],
  secret_key: [{ required: true, message: '请输入Secret Key', trigger: 'blur' }],
  region: [{ required: true, message: '请输入区域', trigger: 'blur' }]
}

// 云资产发现
const handleCloudDiscovery = async () => {
  loading.value = true
  try {
    const response = await discoverCloudAssets(cloudForm)
    discoveryResult.value = response.data
    ElMessage.success('云资产发现开始')
    emit('success')
  } catch (error) {
    ElMessage.error(error.message || '发现失败')
  } finally {
    loading.value = false
  }
}

// 内网扫描
const handleInternalScan = async () => {
  loading.value = true
  try {
    await startScan(internalForm)
    ElMessage.success('内网扫描任务已开始，请稍后查看结果')
    emit('success')
  } catch (error) {
    ElMessage.error(error.message || '扫描失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
watch(visible, (newVal) => {
  if (!newVal) {
    discoveryResult.value = null
    Object.keys(cloudForm).forEach(key => {
      if (key !== 'cloud_provider') {
        cloudForm[key] = ''
      }
    })
    cloudForm.cloud_provider = 'aliyun'
    cloudForm.region = 'cn-beijing'
  }
})
</script>
