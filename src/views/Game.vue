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
          <el-select v-model="searchForm.gameType" filterable placeholder="请选择" clearable>
            <el-option label="全部" value="" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" filterable clearable>
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
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="info" @click="handleDetail(row)">详情</el-button>
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

    <!-- el-drawer：详情 / 编辑 / 新增 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="560px" destroy-on-close direction="rtl">
      <!-- 查看详情模式 -->
      <template v-if="drawerMode === 'view'">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="基本信息" name="info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="游戏名称">{{ detailData.gameName }}</el-descriptions-item>
              <el-descriptions-item label="英文名">{{ detailData.gameNameEn || '-' }}</el-descriptions-item>
              <el-descriptions-item label="游戏类型">{{ detailData.gameType || '-' }}</el-descriptions-item>
              <el-descriptions-item label="版本号">{{ detailData.version || '-' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="statusTag(detailData.status)">{{ statusText(detailData.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="包大小">{{ detailData.fileSize ? formatSize(detailData.fileSize) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="图标URL">{{ detailData.icon || '-' }}</el-descriptions-item>
              <el-descriptions-item label="简介">{{ detailData.description || '-' }}</el-descriptions-item>
              <el-descriptions-item label="下载地址">{{ detailData.downloadUrl || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最近部署">{{ detailData.deployTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ detailData.createTime || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="部署历史" name="history">
            <el-table :data="historyList" v-loading="historyLoading" stripe max-height="400">
              <el-table-column prop="versionTime" label="版本时间" width="160" />
              <el-table-column prop="deployTime" label="部署时间" width="170" />
              <el-table-column label="包大小" width="100">
                <template #default="{ row }">
                  {{ row.fileSize ? formatSize(row.fileSize) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="uploadUserId" label="上传者ID" width="100" />
              <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
              <el-table-column prop="filePath" label="文件路径" min-width="200" show-overflow-tooltip />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>

      <!-- 编辑 / 新增模式 -->
      <template v-if="drawerMode === 'edit' || drawerMode === 'create'">
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
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGameList, createGame, updateGame, deleteGame, updateGameStatus } from '@/api/game'
import { getDeployHistoryList } from '@/api/deploy'

const loading = ref(false)
const tableData = ref([])
const submitLoading = ref(false)
const formRef = ref(null)

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

/* ==================== drawer 公共状态 ==================== */

const drawerVisible = ref(false)
const drawerMode = ref('view') // 'view' | 'edit' | 'create'

const drawerTitle = computed(() => {
  if (drawerMode.value === 'view') return '游戏详情'
  if (drawerMode.value === 'edit') return '编辑游戏'
  return '新增游戏'
})

/* ==================== 详情模式 ==================== */

const detailData = reactive({})
const detailTab = ref('info')
const historyLoading = ref(false)
const historyList = ref([])

async function handleDetail(row) {
  drawerMode.value = 'view'
  detailTab.value = 'info'
  Object.assign(detailData, row)
  drawerVisible.value = true

  // 加载部署历史
  historyLoading.value = true
  try {
    const res = await getDeployHistoryList({ gameName: row.gameName })
    historyList.value = res.data || []
  } catch {
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

/* ==================== 编辑 / 新增模式 ==================== */

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

function handleAdd() {
  drawerMode.value = 'create'
  Object.assign(form, {
    gameName: '', gameNameEn: '', version: '', gameType: '',
    icon: '', status: 1, description: '', downloadUrl: ''
  })
  drawerVisible.value = true
}

function handleEdit(row) {
  drawerMode.value = 'edit'
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
  drawerVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (drawerMode.value === 'edit') {
      await updateGame(form.gameName, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await createGame({ ...form })
      ElMessage.success('新增成功')
    }
    drawerVisible.value = false
    fetchData()
  } finally {
    submitLoading.value = false
  }
}

/* ==================== 表格通用逻辑 ==================== */

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
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
