<template>
  <div class="category-page">
    <div class="page-header">
      <h2 class="page-title">游戏分类管理</h2>
      <el-button type="primary" @click="handleAdd(null)">新增顶级分类</el-button>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：分类树 -->
      <el-col :span="9">
        <el-card shadow="never" class="tree-card">
          <template #header>
            <div class="card-header">
              <span>分类树</span>
              <el-button link type="primary" @click="fetchTree">刷新</el-button>
            </div>
          </template>
          <el-tree
            :data="treeData"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            v-loading="treeLoading"
            empty-text="暂无分类数据"
          >
            <template #default="{ data }">
              <span class="tree-node">
                <span class="tree-label">{{ data.name }}</span>
                <el-tag :type="data.status === 1 ? 'success' : 'info'" size="small">
                  {{ data.status === 1 ? '启用' : '禁用' }}
                </el-tag>
                <el-button link type="primary" size="small" @click.stop="handleAdd(data)">子类</el-button>
                <el-button link type="primary" size="small" @click.stop="handleEdit(data)">编辑</el-button>
                <el-button link type="danger" size="small" @click.stop="handleDelete(data)">删除</el-button>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧：分页列表 -->
      <el-col :span="15">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>分类列表</span>
            </div>
          </template>
          <div class="search-row">
            <el-input
              v-model="query.name"
              placeholder="分类名称"
              clearable
              class="search-input"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
            <el-select v-model="query.status" placeholder="状态" clearable filterable class="search-select" @change="handleSearch">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>

          <el-table :data="list" v-loading="listLoading" border stripe max-height="520">
            <el-table-column type="index" label="序号"  width="80"/>
            <el-table-column prop="name" label="分类名称" min-width="140" />
            <el-table-column prop="parentId" label="父分类ID" width="90" />
            <el-table-column prop="sort" label="排序" width="70" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="query.page"
              v-model:page-size="query.pageSize"
              :total="total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @change="fetchList"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="父分类" prop="parentId">
          <el-select v-model="form.parentId" placeholder="请选择父分类" filterable clearable style="width: 100%">
            <el-option label="顶级分类" :value="0" />
            <el-option
              v-for="c in categoryOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
              :disabled="c.id === form.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCategoryTree,
  getCategoryList,
  listCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/category'

const treeData = ref([])
const treeLoading = ref(false)
const list = ref([])
const listLoading = ref(false)
const total = ref(0)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const categoryOptions = ref([])

const query = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  status: ''
})

const form = reactive({
  id: null,
  parentId: 0,
  name: '',
  sort: 0,
  status: 1
})

const formRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => (form.id ? '编辑分类' : '新增分类'))

async function fetchTree() {
  treeLoading.value = true
  try {
    const res = await getCategoryTree()
    treeData.value = res.data || []
  } finally {
    treeLoading.value = false
  }
}

async function fetchOptions() {
  const res = await getCategoryList()
  categoryOptions.value = res.data || []
}

async function fetchList() {
  listLoading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.name) params.name = query.name
    if (query.status !== '') params.status = query.status
    const res = await listCategory(params)
    list.value = res.data.records || res.data.list || []
    total.value = res.data.total || 0
  } finally {
    listLoading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.name = ''
  query.status = ''
  query.page = 1
  fetchList()
}

function handleAdd(parent) {
  form.id = null
  form.parentId = parent ? parent.id : 0
  form.name = ''
  form.sort = 0
  form.status = 1
  dialogVisible.value = true
}

function handleEdit(row) {
  form.id = row.id
  form.parentId = row.parentId ?? 0
  form.name = row.name
  form.sort = row.sort ?? 0
  form.status = row.status ?? 1
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const parentId = Number(form.parentId) || 0
    const payload = {
      id: form.id || null,
      parentId,
      name: form.name,
      sort: form.sort ?? 0,
      status: form.status ?? 1
    }
    if (form.id) {
      await updateCategory(payload)
      ElMessage.success('更新成功')
    } else {
      await createCategory(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await Promise.all([fetchTree(), fetchOptions(), fetchList()])
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除分类「${row.name}」？其子分类也将一并禁用。`,
      '警告',
      { type: 'error', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    await Promise.all([fetchTree(), fetchOptions(), fetchList()])
  } catch { /* 取消 */ }
}

onMounted(() => {
  fetchTree()
  fetchOptions()
  fetchList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title {
  font-size: 20px;
  margin: 0;
}
.tree-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding-right: 4px;
}
.tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input {
  width: 200px;
}
.search-select {
  width: 120px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
