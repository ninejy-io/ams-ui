<template>
  <div class="supplier-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>供应商管理</span>
          <el-button type="primary" @click="handleCreate">新增供应商</el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-container">
        <el-form :model="searchForm" inline>
          <el-form-item label="供应商名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入供应商名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="联系人">
            <el-input
              v-model="searchForm.contact"
              placeholder="请输入联系人"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input
              v-model="searchForm.phone"
              placeholder="请输入联系电话"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="供应商名称" min-width="200" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              link
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              link
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 供应商表单对话框 -->
    <SupplierFormDialog
      v-model:visible="dialogVisible"
      :form-data="currentSupplier"
      :is-edit="isEdit"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SupplierFormDialog from './SupplierForm.vue'
import { getSuppliers, deleteSupplier } from '@/api/supplier'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentSupplier = ref({})

const searchForm = reactive({
  name: '',
  contact: '',
  phone: ''
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const tableData = ref([])

// 方法
const fetchSuppliers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      size: pagination.size,
      ...searchForm
    }
    const response = await getSuppliers(params)
    tableData.value = response.data
    pagination.total = 10
  } catch (error) {
    ElMessage.error('获取供应商列表失败')
    console.error('获取供应商列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchSuppliers()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    contact: '',
    phone: ''
  })
  pagination.current = 1
  fetchSuppliers()
}

const handleCreate = () => {
  isEdit.value = false
  currentSupplier.value = {}
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentSupplier.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除供应商 "${row.name}" 吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    
    await deleteSupplier(row.id)
    ElMessage.success('删除成功')
    fetchSuppliers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除供应商失败:', error)
    }
  }
}

const handleFormSuccess = () => {
  dialogVisible.value = false
  fetchSuppliers()
}

const handleSizeChange = (newSize) => {
  pagination.size = newSize
  pagination.current = 1
  fetchSuppliers()
}

const handleCurrentChange = (newPage) => {
  pagination.current = newPage
  fetchSuppliers()
}

// 生命周期
onMounted(() => {
  fetchSuppliers()
})
</script>

<style scoped>
.supplier-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin-bottom: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
