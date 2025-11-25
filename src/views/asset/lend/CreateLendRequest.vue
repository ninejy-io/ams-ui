<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新建资产借出申请</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="资产" prop="assetId">
          <el-select
            v-model="form.assetId"
            placeholder="请选择资产"
            filterable
            @change="handleAssetChange"
            style="width: 100%"
          >
            <el-option
              v-for="asset in assetList"
              :key="asset.id"
              :label="`${asset.assetNumber} - ${asset.assetName}`"
              :value="asset.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="借用人" prop="borrowerId">
          <el-select
            v-model="form.borrowerId"
            placeholder="请选择借用人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="借用部门" prop="departmentId">
          <el-select
            v-model="form.departmentId"
            placeholder="请选择借用部门"
            style="width: 100%"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预计借出日期" prop="expectedLendDate">
          <el-date-picker
            v-model="form.expectedLendDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="预计归还日期" prop="expectedReturn">
          <el-date-picker
            v-model="form.expectedReturn"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="借用用途" prop="purpose">
          <el-input
            v-model="form.purpose"
            type="textarea"
            :rows="3"
            placeholder="请输入借用用途"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">提交申请</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { createLendRequest } from '@/api/lend'
import { getAssets } from '@/api/asset'
import { getUsers } from '@/api/user'
import { getDepartments } from '@/api/department'

const router = useRouter()

const formRef = ref()
const form = ref({
  assetId: undefined,
  borrowerId: undefined,
  departmentId: undefined,
  expectedLendDate: '',
  expectedReturn: '',
  purpose: ''
})

const rules = ref({
  assetId: [{ required: true, message: '请选择资产', trigger: 'change' }],
  borrowerId: [{ required: true, message: '请选择借用人', trigger: 'change' }],
  departmentId: [{ required: true, message: '请选择借用部门', trigger: 'change' }],
  expectedLendDate: [{ required: true, message: '请选择预计借出日期', trigger: 'change' }],
  expectedReturn: [{ required: true, message: '请选择预计归还日期', trigger: 'change' }],
  purpose: [{ required: true, message: '请输入借用用途', trigger: 'blur' }]
})

const assetList = ref([])
const userList = ref([])
const departmentList = ref([])

/** 获取资产列表 */
function getAssetList() {
  getAssets({ status: 'in_stock' }).then(response => {
    assetList.value = response.data.items
  })
}

/** 获取用户列表 */
function getUserList() {
  getUsers().then(response => {
    userList.value = response.data.items
  })
}

/** 获取部门列表 */
function getDepartmentList() {
  getDepartments().then(response => {
    departmentList.value = response.data.items
  })
}

/** 资产选择变化 */
function handleAssetChange(assetId) {
  const asset = assetList.value.find(item => item.id === assetId)
  if (asset) {
    // 可以在这里设置一些默认值，比如部门
  }
}

/** 提交表单 */
function submitForm() {
  formRef.value.validate(valid => {
    if (valid) {
      createLendRequest(form.value).then(() => {
        ElMessage.success('提交成功')
        router.push('/asset/lend-request')
      })
    }
  })
}

/** 取消 */
function cancel() {
  router.push('/asset/lend-request')
}

onMounted(() => {
  getAssetList()
  getUserList()
  getDepartmentList()
})
</script>
