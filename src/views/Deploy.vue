<template>
  <div class="deploy-page">
    <div class="page-header">
      <h2 class="page-title">部署管理</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="游戏ID">
          <el-input v-model="searchForm.gameInfoId" placeholder="请输入游戏ID" clearable />
        </el-form-item>
        <el-form-item label="版本时间戳">
          <el-input v-model="searchForm.versionTime" placeholder="yyyyMMddHHmmss" clearable />
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
        <el-table-column prop="gameInfoId" label="游戏ID" width="100" />
        <el-table-column prop="versionTime" label="版本时间戳" width="180" />
        <el-table-column prop="deployTime" label="部署时间" width="170" />
        <el-table-column label="文件大小" width="100">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="filePath" label="构建包路径" min-width="250" show-overflow-tooltip />
        <el-table-column prop="extractPath" label="解压目录" min-width="250" show-overflow-tooltip />
        <el-table-column prop="uploadUserId" label="上传者" width="100" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleDetail(row)">详情</el-button>
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="部署详情" width="560px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="游戏ID">{{ detailData.gameInfoId }}</el-descriptions-item>
        <el-descriptions-item label="版本时间戳" :span="2">{{ detailData.versionTime }}</el-descriptions-item>
        <el-descriptions-item label="部署时间" :span="2">{{ detailData.deployTime }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatSize(detailData.fileSize) }}</el-descriptions-item>
        <el-descriptions-item label="上传者ID">{{ detailData.uploadUserId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="构建包路径" :span="2">{{ detailData.filePath }}</el-descriptions-item>
        <el-descriptions-item label="解压目录" :span="2">{{ detailData.extractPath }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailData.updateTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeployHistoryList, getDeployDetail, deleteDeploy } from '@/api/deploy'

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const detailData = ref(null)

const searchForm = reactive({
  gameInfoId: '',
  versionTime: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

function formatSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.gameInfoId) params.gameInfoId = searchForm.gameInfoId
    if (searchForm.versionTime) params.versionTime = searchForm.versionTime
    const res = await getDeployHistoryList(params)
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
  searchForm.gameInfoId = ''
  searchForm.versionTime = ''
  pagination.page = 1
  fetchData()
}

async function handleDetail(row) {
  try {
    const res = await getDeployDetail(row.id)
    detailData.value = res.data
    detailVisible.value = true
  } catch { /* ignore */ }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除部署记录 #${row.id}？`, '警告', { type: 'error' })
    await deleteDeploy(row.id)
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
