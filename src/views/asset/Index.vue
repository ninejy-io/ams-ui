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
      <el-button @click="handleImport">
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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleDetail(row.id)">
            详情
          </el-button>
          <el-button type="warning" size="small" @click="handleEdit(row.id)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row.id)">
            删除
          </el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAssetList, deleteAsset } from '@/api/asset'

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
    list.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取资产列表失败:', error)
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

const handleCreate = () => {
  router.push('/assets/create')
}

const handleImport = () => {
  // 实现导入逻辑
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
    if (error === 'cancel') {
      return
    }
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}
.operation-container {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
