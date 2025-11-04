<template>
  <div class="approval-process">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>审批流程</span>
          <div>
            <el-button type="primary" @click="handleCreate">新增流程</el-button>
          </div>
        </div>
      </template>

      <div class="filter-row" style="margin: 20px 0;">
        <el-input v-model="search.name" placeholder="名称" style="width:240px" clearable />
        <el-select v-model="search.type" placeholder="流程类型" style="width:160px; margin-left:8px" clearable>
          <el-option label="借用" value="borrow" />
          <el-option label="调拨" value="transfer" />
          <el-option label="报废" value="scrap" />
        </el-select>
        <el-button type="primary" @click="fetchProcesses" style="margin-left:8px">查询</el-button>
        <el-button @click="resetSearch" style="margin-left:6px">重置</el-button>
      </div>

      <el-table :data="processes" v-loading="loading" stripe style="width:100%">
        <el-table-column prop="id" label="序号" width="80" />
        <el-table-column prop="name" label="流程名称" min-width="200" />
        <el-table-column prop="type" label="流程类型" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            <el-button type="info" size="small" @click="openRecords(scope.row)">审批记录</el-button>
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
          @current-change="fetchProcesses"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <!-- Create / Edit Dialog -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="720px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="200" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择流程类型">
            <el-option label="借用" value="borrow" />
            <el-option label="调拨" value="transfer" />
            <el-option label="报废" value="scrap" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="状态">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" :rows="3" />
        </el-form-item>

        <el-form-item label="步骤（JSON）" prop="steps">
          <el-input type="textarea" v-model="form.steps" :rows="8" placeholder='JSON 数组，例如：[{"role":"manager","approver_type":"single"}]'/>
          <div style="margin-top:6px;color:#909399;font-size:12px">
            步骤以 JSON 数组保存。每一步示例：{"role":"manager","approver_type":"single"}
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getApprovalProcesses,
  createApprovalProcess,
  updateApprovalProcess,
  deleteApprovalProcess
} from '@/api/approval'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref(false)

const processes = ref([])
const page = reactive({ current: 1, size: 10, total: 0 })

const search = reactive({ name: '', type: '' })

const formRef = ref(null)
const form = reactive({
  id: null,
  name: '',
  type: '',
  description: '',
  steps: '[]',
  status: 'active'
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  steps: [
    {
      validator(_, value, callback) {
        try {
          const v = typeof value === 'string' ? JSON.parse(value) : value
          if (!Array.isArray(v)) return callback(new Error('步骤必须为 JSON 数组'))
          callback()
        } catch (e) {
          callback(new Error('步骤 JSON 格式不正确'))
        }
      },
      trigger: 'blur'
    }
  ]
}

const dialogTitle = computed(() => (editing.value ? '编辑审批流程' : '新建审批流程'))

const fetchProcesses = async () => {
  loading.value = true
  try {
    const params = { page: page.current, size: page.size, name: search.name, type: search.type }
    const resp = await getApprovalProcesses(params)
    processes.value = Array.isArray(resp?.data?.items) ? resp.data.items : []
    page.total = Number(resp?.data?.total) || 0
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
    processes.value = []
    page.total = 0
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  search.name = ''
  search.type = ''
  page.current = 1
  fetchProcesses()
}

const onSizeChange = (size) => {
  page.size = size
  page.current = 1
  fetchProcesses()
}

const initForm = (item = null) => {
  Object.keys(form).forEach(k => form[k] = null)
  if (!item) {
    form.id = null
    form.name = ''
    form.type = ''
    form.description = ''
    form.steps = '[]'
    form.status = 'active'
  } else {
    form.id = item.id
    form.name = item.name || ''
    form.type = item.type || ''
    form.description = item.description || ''
    form.steps = typeof item.steps === 'string' ? item.steps : JSON.stringify(item.steps || [])
    form.status = item.status || 'active'
  }
  nextTick(() => formRef.value?.clearValidate())
}

const handleCreate = () => {
  editing.value = false
  initForm(null)
  dialogVisible.value = true
}

const handleEdit = (row) => {
  editing.value = true
  initForm(row)
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除流程 "${row.name}" 吗？`, '确认删除', { type: 'warning' })
    await deleteApprovalProcess(row.id)
    ElMessage.success('删除成功')
    fetchProcesses()
  } catch (e) {
    if (e === 'cancel') return
    ElMessage.error('删除失败')
  }
}

const submit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // validate JSON
  let stepsParsed = []
  try {
    stepsParsed = typeof form.steps === 'string' ? JSON.parse(form.steps) : form.steps
    if (!Array.isArray(stepsParsed)) throw new Error()
  } catch {
    ElMessage.error('步骤必须为有效的 JSON 数组')
    return
  }

  saving.value = true
  try {
    const payload = toRaw({
      name: form.name,
      type: form.type,
      description: form.description,
      steps: stepsParsed,
      status: form.status
    })
    if (editing.value && form.id) {
      await updateApprovalProcess(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createApprovalProcess(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchProcesses()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const openRecords = (row) => {
  ElMessage.info(`打开流程 ${row.id} 的审批记录`)
}

onMounted(() => {
  fetchProcesses()
})
</script>

<style scoped>
.approval-process .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-row {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 12px;
}
</style>
