<template>
  <div class="game-page">
    <div class="page-header">
      <h2 class="page-title">游戏管理</h2>
      <el-button type="primary" @click="handleAdd">新增游戏</el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="游戏名称">
          <el-input v-model="searchForm.gameName" placeholder="请输入游戏名称" clearable />
        </el-form-item>
        <el-form-item label="游戏类型">
          <el-select v-model="searchForm.gameType" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
            <el-option label="维护" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="gameName" label="游戏名称" min-width="150" />
        <el-table-column prop="gameNameEn" label="英文名" min-width="120" />
        <el-table-column prop="version" label="当前版本" width="100" />
        <el-table-column prop="gameType" label="游戏类型" width="100" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="包大小" width="100">
          <template #default="{ row }">
            <span v-if="row.fileSize">{{ formatSize(row.fileSize) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="deployTime" label="最近部署" width="170" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleStatus(row)" v-if="row.status !== 1">上架</el-button>
            <el-button size="small" type="warning" @click="handleStatus(row)" v-if="row.status === 1">下架</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="游戏名称" prop="gameName">
          <el-input v-model="form.gameName" placeholder="请输入游戏名称（唯一标识，同时为服务器目录名）" />
        </el-form-item>
        <el-form-item label="英文名" prop="gameNameEn">
          <el-input v-model="form.gameNameEn" placeholder="请输入英文名" />
        </el-form-item>
        <el-form-item label="游戏类型" prop="gameType">
          <el-input v-model="form.gameType" placeholder="请输入游戏类型" />
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="图标URL" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标URL" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">下架</el-radio>
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="2">维护</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入游戏简介" />
        </el-form-item>
        <el-form-item label="下载地址" prop="downloadUrl">
          <el-input v-model="form.downloadUrl" placeholder="请输入下载地址" />
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
import { getGameList, createGame, updateGame, deleteGame, updateGameStatus } from '@/api/modules/game'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

const searchForm = reactive({
  gameName: '',
  gameType: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  gameName: '',
  gameNameEn: '',
  version: '',
  gameType: '',
  icon: '',
  status: 1,
  description: '',
  downloadUrl: ''
})

const formRules = {
  gameName: [{ required: true, message: '请输入游戏名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑游戏' : '新增游戏')

function statusTag(status) {
  return status === 1 ? 'success' : status === 2 ? 'warning' : 'info'
}

function statusText(status) {
  return status === 1 ? '上架' : status === 2 ? '维护' : '下架'
}

function formatSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.gameName) params.gameName = searchForm.gameName
    if (searchForm.gameType) params.gameType = searchForm.gameType
    if (searchForm.status !== '') params.status = searchForm.status
    const res = await getGameList(params)
    tableData.value = res.data.records || res.data.list || []
    pagination.total = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.gameName = ''
  searchForm.gameType = ''
  searchForm.status = ''
  pagination.page = 1
  fetchData()
}

function handleAdd() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    gameName: '', gameNameEn: '', version: '', gameType: '',
    icon: '', status: 1, description: '', downloadUrl: ''
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    gameName: row.gameName || '',
    gameNameEn: row.gameNameEn || '',
    version: row.version || '',
    gameType: row.gameType || '',
    icon: row.icon || '',
    status: row.status ?? 1,
    description: row.description || '',
    downloadUrl: row.downloadUrl || ''
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateGame(editId.value, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await createGame({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } finally {
    submitLoading.value = false
  }
}

async function handleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const text = newStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定${text}该游戏？`, '提示', { type: 'warning' })
    await updateGameStatus(row.id, newStatus)
    ElMessage.success(`${text}成功`)
    fetchData()
  } catch { /* 取消 */ }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除游戏「${row.gameName}」？`, '警告', { type: 'error' })
    await deleteGame(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* 取消 */ }
}

onMounted(() => {
  fetchData()
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
.search-card {
  margin-bottom: 16px;
}
.table-card {
  margin-bottom: 16px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
