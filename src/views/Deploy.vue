<template>
  <div class="deploy-page">
    <div class="page-header">
      <h2 class="page-title">部署管理</h2>
      <el-button type="primary" @click="handleUploadOpen">上传部署</el-button>
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
        <el-table-column prop="version" label="版本号" width="100" />
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

    <!-- 上传部署对话框 -->
    <el-dialog v-model="uploadVisible" title="上传部署" width="560px" destroy-on-close>
      <el-form :model="uploadForm" label-width="110px">
        <el-form-item label="选择游戏" required>
          <el-select
            v-model="uploadForm.gameName"
            filterable
            allow-create
            placeholder="选择已有游戏，或输入新游戏名直接部署"
            style="width: 100%"
            @change="handleGameChange"
          >
            <el-option
              v-for="game in gameOptions"
              :key="game.gameName"
              :label="`${game.gameName}（${game.gameNameZhCN || game.gameNameZhCn || '-'}）当前 v${game.version || '-'}`"
              :value="game.gameName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="中文名">
          <el-input v-model="uploadForm.gameNameZhCn" placeholder="游戏中文名（新游戏部署时必填，用于自动创建）" />
        </el-form-item>
        <el-form-item label="图标地址">
          <el-input v-model="uploadForm.icon" placeholder="游戏图标 URL（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="2" placeholder="游戏描述（可选）" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="uploadForm.categoryIds" multiple filterable placeholder="选择游戏分类" style="width: 100%">
            <el-option v-for="c in categoryOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本更新" required>
          <el-radio-group v-model="uploadForm.versionLevel" @change="handleVersionChange">
            <el-radio-button value="major">大版本更新</el-radio-button>
            <el-radio-button value="minor">新增功能</el-radio-button>
            <el-radio-button value="patch">BUG修复</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="新版本号" required>
          <el-input v-model="uploadForm.version" placeholder="选择版本更新后自动生成" disabled />
        </el-form-item>
        <el-form-item label="构建包" required>
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept=".tar.gz"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            drag
            style="width: 100%"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将 dist.tar.gz 拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">仅支持 .tar.gz 格式的构建包</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUploadSubmit">开始部署</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="部署详情" width="560px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="游戏ID">{{ detailData.gameInfoId }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{ detailData.version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="版本时间戳">{{ detailData.versionTime }}</el-descriptions-item>
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
import { UploadFilled } from '@element-plus/icons-vue'
import { getDeployHistoryList, uploadDeploy, getDeployDetail, deleteDeploy } from '@/api/deploy'
import { getGameList, getNextVersion } from '@/api/game'
import { getCategoryList } from '@/api/category'

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

/* ==================== 上传部署 ==================== */

const uploadVisible = ref(false)
const uploading = ref(false)
const gameOptions = ref([])
const categoryOptions = ref([])
const selectedFile = ref(null)
const gameIdMap = reactive({})

const uploadForm = reactive({
  gameName: '',
  gameId: '',
  gameNameZhCn: '',
  icon: '',
  description: '',
  categoryIds: [],
  versionLevel: '',
  version: ''
})

async function handleUploadOpen() {
  uploadVisible.value = true
  uploadForm.gameName = ''
  uploadForm.gameId = ''
  uploadForm.gameNameZhCn = ''
  uploadForm.icon = ''
  uploadForm.description = ''
  uploadForm.categoryIds = []
  uploadForm.versionLevel = ''
  uploadForm.version = ''
  selectedFile.value = null
  if (!gameOptions.value.length) {
    try {
      const res = await getGameList({ page: 1, pageSize: 100 })
      const list = res.data.records || res.data.list || []
      gameOptions.value = list
      list.forEach(item => {
        gameIdMap[item.gameName] = item.id
      })
    } catch {
      gameOptions.value = []
    }
  }
  if (!categoryOptions.value.length) {
    try {
      const res = await getCategoryList()
      categoryOptions.value = res.data || []
    } catch {
      categoryOptions.value = []
    }
  }
}

function handleGameChange(gameName) {
  const game = gameOptions.value.find(g => g.gameName === gameName)
  uploadForm.gameId = game ? game.id : ''
  uploadForm.versionLevel = ''
  uploadForm.version = ''
  uploadForm.gameNameZhCn = game ? (game.gameNameZhCN || game.gameNameZhCn || '') : ''
  uploadForm.icon = game ? (game.icon || '') : ''
  uploadForm.description = game ? (game.description || '') : ''
  uploadForm.categoryIds = game && game.categoryIds ? [...game.categoryIds] : []
}

async function handleVersionChange(level) {
  if (!level) {
    return
  }
  try {
    const res = await getNextVersion(uploadForm.gameId || null, level)
    uploadForm.version = res.data || ''
  } catch {
    uploadForm.versionLevel = ''
  }
}

function handleFileChange(file) {
  const fileName = (file.name || '').toLowerCase()
  if (!fileName.endsWith('.tar.gz')) {
    ElMessage.error('仅支持 .tar.gz 格式的构建包')
    selectedFile.value = null
    return
  }
  selectedFile.value = file.raw
}

function handleFileRemove() {
  selectedFile.value = null
}

async function handleUploadSubmit() {
  if (!uploadForm.gameName) {
    ElMessage.warning('请选择游戏')
    return
  }
  if (!uploadForm.version) {
    ElMessage.warning('请选择版本更新维度以生成版本号')
    return
  }
  if (!selectedFile.value) {
    ElMessage.warning('请选择 .tar.gz 构建包')
    return
  }
  uploading.value = true
  try {
    await uploadDeploy({
      gameName: uploadForm.gameName,
      gameNameZhCn: uploadForm.gameNameZhCn,
      icon: uploadForm.icon,
      description: uploadForm.description,
      version: uploadForm.version,
      categoryIds: uploadForm.categoryIds,
      file: selectedFile.value
    })
    ElMessage.success('部署成功')
    uploadVisible.value = false
    fetchData()
  } catch {
    // 后端提示已由拦截器弹出
  } finally {
    uploading.value = false
  }
}

/* ==================== 列表与详情 ==================== */

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
