<template>
  <div class="asset-category-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>资产分类管理</span>
          <div>
            <el-button @click="handleExpandAll">展开全部</el-button>
            <el-button @click="handleCollapseAll">折叠全部</el-button>
            <el-button type="primary" @click="handleCreate">新增分类</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-container">
        <el-form :model="searchForm" inline>
          <el-form-item label="分类名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入分类名称"
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
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column label="父分类" width="120">
          <template #default="scope">
            {{ scope.row.parent_id ? getParentName(scope.row.parent_id) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
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
              type="success"
              link
              @click="handleAddChild(scope.row)"
            >
              添加子分类
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
      <div class="pagination-container" v-if="!isTreeView">
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

    <!-- 资产分类表单对话框 -->
    <AssetCategoryFormDialog
      v-model:visible="dialogVisible"
      :form-data="currentCategory"
      :is-edit="isEdit"
      :parent-category="parentCategory"
      :category-tree="categoryTree"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AssetCategoryFormDialog from './CategoryForm.vue'
import {
  getAssetCategories,
  getAssetCategoryTree,
  deleteAssetCategory
} from '@/api/assetCategory'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const isTreeView = ref(true)
const currentCategory = ref({})
const parentCategory = ref({})
const categoryTree = ref([])

const searchForm = reactive({ name: '' })

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const tableData = ref([])

// 方法
const fetchCategories = async () => {
  loading.value = true
  try {
    let response
    if (isTreeView.value) {
      response = await getAssetCategoryTree()
      // guard against null/undefined
      tableData.value = Array.isArray(response?.data) ? response.data : []
    } else {
      const params = {
        page: pagination.current,
        size: pagination.size,
        ...searchForm
      }
      response = await getAssetCategories(params)
      tableData.value = Array.isArray(response?.data?.items) ? response.data.items : []
      pagination.total = Number(response?.data?.total) || 0
    }
  } catch (error) {
    ElMessage.error('获取资产分类列表失败')
    console.error('获取资产分类列表失败:', error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const getParentName = (parentId) => {
  const findParent = (categories) => {
    for (const category of categories) {
      if (category.id === parentId) return category.name
      if (category.children) {
        const found = findParent(category.children)
        if (found) return found
      }
    }
    return null
  }
  return findParent(tableData.value) || '-'
}

const handleSearch = () => {
  if (!isTreeView.value) {
    pagination.current = 1
  }
  fetchCategories()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: ''
  })
  if (!isTreeView.value) {
    pagination.current = 1
  }
  fetchCategories()
}

const handleCreate = () => {
  isEdit.value = false
  currentCategory.value = {}
  parentCategory.value = {}
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentCategory.value = { ...row }
  parentCategory.value = {}
  dialogVisible.value = true
}

const handleAddChild = (row) => {
  isEdit.value = false
  currentCategory.value = {
    parent_id: row.id
  }
  parentCategory.value = row
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${row.name}" 吗？此操作可能会同时删除其子分类。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    
    await deleteAssetCategory(row.id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除资产分类失败:', error)
    }
  }
}

const handleFormSuccess = () => {
  dialogVisible.value = false
  fetchCategories()
}

const handleSizeChange = (newSize) => {
  pagination.size = newSize
  pagination.current = 1
  fetchCategories()
}

const handleCurrentChange = (newPage) => {
  pagination.current = newPage
  fetchCategories()
}

const handleExpandAll = () => {
  // 这里需要实现展开所有行的逻辑
  ElMessage.info('已展开所有分类')
}

const handleCollapseAll = () => {
  // 这里需要实现折叠所有行的逻辑
  ElMessage.info('已折叠所有分类')
}

// 获取分类树数据
const fetchCategoryTree = async () => {
  try {
    const response = await getAssetCategoryTree()
    categoryTree.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    console.error('获取分类树失败:', error)
    categoryTree.value = []
  }
}

// 生命周期
onMounted(() => {
  // load tree first (optional), ensure safe defaults before rendering
  fetchCategoryTree().finally(() => fetchCategories())
})
</script>

<style scoped>
.asset-category-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
