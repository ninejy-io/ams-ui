<template>
  <div class="asset-list">
    <div class="filter-container">
      <el-form :model="listQuery" inline>
        <el-form-item label="资产编号">
          <el-input
            v-model="listQuery.asset_number"
            placeholder="资产编号"
            clearable
          />
        </el-form-item>
        <el-form-item label="资产名称">
          <el-input
            v-model="listQuery.name"
            placeholder="资产名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="listQuery.status" placeholder="状态" clearable>
            <el-option label="库存" value="in_stock" />
            <el-option label="在用" value="in_use" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="operation-container">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增资产
      </el-button>
      <el-button @click="openImportDialog">
        <el-icon><Upload /></el-icon>
        批量导入
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
    >
      <el-table-column label="资产编号" prop="asset_number" width="180" />
      <el-table-column label="资产名称" prop="name" />
      <el-table-column label="型号" prop="model" />
      <el-table-column label="分类" prop="category.name" />
      <el-table-column label="部门" prop="department.name" />
      <el-table-column label="责任人" prop="responsible_person" />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTypeMap[row.status]">
            {{ statusMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleDetail(row.id)">
            详情
          </el-button>
          <el-button type="warning" size="small" @click="handleEditRow(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row.id)">
            删除
          </el-button>
          <el-button size="small" @click="cloneRow(row)">复制</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.page_size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
      />
    </div>

    <!-- Create / Edit Dialog -->
    <el-dialog
      :title="formTitle"
      v-model="formVisible"
      width="680px"
      :before-close="() => (formVisible = false)"
    >
      <el-form ref="formRef" :model="assetForm" :rules="formRules" label-width="120px">
        <el-form-item label="资产编号" prop="asset_number">
          <el-input v-model="assetForm.asset_number" placeholder="请输入资产编号" />
        </el-form-item>
        <el-form-item label="资产名称" prop="name">
          <el-input v-model="assetForm.name" placeholder="请输入资产名称" />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="assetForm.model" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-input v-model="assetForm.category_id" placeholder="分类ID（示例）" />
        </el-form-item>
        <el-form-item label="部门" prop="department_id">
          <el-input v-model="assetForm.department_id" placeholder="部门ID（示例）" />
        </el-form-item>
        <el-form-item label="责任人" prop="responsible_person">
          <el-input v-model="assetForm.responsible_person" placeholder="责任人姓名" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="assetForm.status" placeholder="请选择状态">
            <el-option label="库存" value="in_stock" />
            <el-option label="在用" value="in_use" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="assetForm.remark" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSubmitting" @click="submitForm">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Import Dialog -->
    <el-dialog title="批量导入资产" v-model="importVisible" width="520px" :before-close="() => (importVisible = false)">
      <div>
        <el-upload
          ref="uploadRef"
          :action="null"
          :auto-upload="false"
          :show-file-list="true"
          :before-upload="beforeUpload"
          :on-remove="onRemove"
        >
          <el-button size="small" type="primary">选择文件</el-button>
          <div style="margin-top:8px;font-size:12px;color:#999">支持 .xlsx/.xls/.csv，第一行为字段名</div>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="submitImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import {
  getAssetList,
  deleteAsset,
  createAsset,
  updateAsset,
  batchImportAssets
} from '@/api/asset'

const router = useRouter()

const list = ref([])
const total = ref(0)
const listLoading = ref(false)

const listQuery = reactive({
  page: 1,
  page_size: 10,
  asset_number: '',
  name: '',
  status: ''
})

const statusMap = {
  in_stock: '库存',
  in_use: '在用',
  maintenance: '维修中',
  scrapped: '报废'
}

const statusTypeMap = {
  in_stock: 'success',
  in_use: 'primary',
  maintenance: 'warning',
  scrapped: 'danger'
}

const getList = async () => {
  listLoading.value = true
  try {
    const response = await getAssetList(listQuery)
    // guard response
    list.value = Array.isArray(response?.data?.items) ? response.data.items : []
    total.value = Number(response?.data?.total) || 0
  } catch (error) {
    console.error('获取资产列表失败:', error)
    list.value = []
    total.value = 0
  } finally {
    listLoading.value = false
  }
}

const resetFilter = () => {
  Object.assign(listQuery, {
    page: 1,
    page_size: 10,
    asset_number: '',
    name: '',
    status: ''
  })
  getList()
}

// --- Create / Edit form state ---
const formVisible = ref(false)
const formSubmitting = ref(false)
const isEdit = ref(false)
const assetForm = reactive({
  id: null,
  asset_number: '',
  name: '',
  model: '',
  category_id: null,
  department_id: null,
  responsible_person: '',
  status: 'in_stock',
  remark: ''
})
const formRef = ref(null)

const formRules = {
  asset_number: [{ required: true, message: '请输入资产编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }]
}

const formTitle = computed(() => (isEdit.value ? '编辑资产' : '新增资产'))

const handleCreate = () => {
  isEdit.value = false
  Object.assign(assetForm, {
    id: null,
    asset_number: '',
    name: '',
    model: '',
    category_id: null,
    department_id: null,
    responsible_person: '',
    status: 'in_stock',
    remark: ''
  })
  formVisible.value = true
}

const handleEditRow = (row) => {
  isEdit.value = true
  Object.assign(assetForm, {
    id: row.id,
    asset_number: row.asset_number || '',
    name: row.name || '',
    model: row.model || '',
    category_id: row.category?.id || row.category_id || null,
    department_id: row.department?.id || row.department_id || null,
    responsible_person: row.responsible_person || '',
    status: row.status || 'in_stock',
    remark: row.remark || ''
  })
  formVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  formSubmitting.value = true
  try {
    const payload = {
      asset_number: assetForm.asset_number,
      name: assetForm.name,
      model: assetForm.model,
      category_id: assetForm.category_id,
      department_id: assetForm.department_id,
      responsible_person: assetForm.responsible_person,
      status: assetForm.status,
      remark: assetForm.remark
    }

    if (isEdit.value && assetForm.id) {
      await updateAsset(assetForm.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createAsset(payload)
      ElMessage.success('创建成功')
    }
    formVisible.value = false
    getList()
  } catch (error) {
    console.error('submitForm error:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    formSubmitting.value = false
  }
}

const handleDetail = (id) => {
  router.push(`/assets/detail/${id}`)
}

const handleEdit = (id) => {
  router.push(`/assets/edit/${id}`)
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该资产吗？', '提示', {
      type: 'warning'
    })
    await deleteAsset(id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('删除失败')
  }
}

const cloneRow = (row) => {
  isEdit.value = false
  Object.assign(assetForm, {
    id: null,
    asset_number: `${row.asset_number}_copy`,
    name: row.name,
    model: row.model,
    category_id: row.category?.id || row.category_id || null,
    department_id: row.department?.id || row.department_id || null,
    responsible_person: row.responsible_person || '',
    status: row.status || 'in_stock',
    remark: row.remark || ''
  })
  formVisible.value = true
}

// --- Import logic ---
const importVisible = ref(false)
const importLoading = ref(false)
const uploadRef = ref(null)
const selectedFiles = ref([])

const openImportDialog = () => {
  selectedFiles.value = []
  importVisible.value = true
}

const beforeUpload = (file) => {
  // accept xlsx, xls, csv
  const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
  // some browsers may not provide mime; use extension fallback
  const ext = (file.name || '').split('.').pop().toLowerCase()
  if (!allowed.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(ext)) {
    ElMessage.error('Unsupported file type. Please upload xlsx/xls/csv')
    return false
  }
  selectedFiles.value = [file]
  return false // prevent auto upload
}

const onRemove = (file) => {
  selectedFiles.value = selectedFiles.value.filter(f => f.uid !== file.uid && f.name !== file.name)
}

const submitImport = async () => {
  if (!selectedFiles.value.length) {
    ElMessage.warning('Please select a file to import')
    return
  }
  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFiles.value[0])
    // optional: other params
    await batchImportAssets(formData)
    ElMessage.success('Import started / completed')
    importVisible.value = false
    getList()
  } catch (error) {
    console.error('submitImport error:', error)
    ElMessage.error('Import failed')
  } finally {
    importLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 10px;
}
.operation-container {
  margin-bottom: 20px;
  display: flex;
  gap: 8px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
