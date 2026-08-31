<template>
  <div class="file-page">
    <div class="page-header">
      <h2 class="page-title">文件管理</h2>
    </div>

    <!-- 筛选栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="文件名">
          <el-input
            v-model="query.fileName"
            placeholder="请输入文件名"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="query.bizType" placeholder="请选择" clearable filterable style="width: 180px" @change="handleSearch">
            <el-option label="游戏包" value="game_pkg" />
            <el-option label="游戏图标" value="game_icon" />
            <el-option label="用户头像" value="user_avatar" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文件列表 -->
    <el-card class="table-card">
      <el-table :data="list" v-loading="listLoading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column label="缩略图" width="100">
          <template #default="{ row }">
            <el-image
              v-if="isImage(row)"
              :src="fileViewUrl(row.id)"
              :preview-src-list="[fileViewUrl(row.id)]"
              :initial-index="0"
              fit="cover"
              preview-teleported
              class="thumb"
            />
            <span v-else class="file-type-badge">文件</span>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="100">
          <template #default="{ row }">
            {{ formatSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="mimeType" label="MIME" width="160" show-overflow-tooltip />
        <el-table-column label="业务类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="bizTypeTag(row.bizType)">{{ bizTypeText(row.bizType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="md5Str" label="MD5" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="上传时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isImage(row)" link type="primary" size="small" @click="handlePreview(row)">预览</el-button>
            <a :href="fileDownloadUrl(row.id)" class="download-link">
              <el-button link type="primary" size="small">下载</el-button>
            </a>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getFilePage, fileViewUrl, fileDownloadUrl } from '@/api/file'

const list = ref([])
const listLoading = ref(false)
const total = ref(0)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  fileName: '',
  bizType: ''
})

const BIZ_MAP = {
  game_pkg: '游戏包',
  game_icon: '游戏图标',
  user_avatar: '用户头像'
}

function bizTypeText(bizType) {
  return BIZ_MAP[bizType] || bizType || '-'
}

function bizTypeTag(bizType) {
  if (bizType === 'game_pkg') return 'warning'
  if (bizType === 'game_icon') return 'success'
  if (bizType === 'user_avatar') return 'info'
  return 'primary'
}

function isImage(row) {
  return row.mimeType && String(row.mimeType).startsWith('image/')
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function fetchList() {
  listLoading.value = true
  try {
    const params = {
      page: query.pageNum,
      pageSize: query.pageSize,
      fileName: query.fileName,
      bizType: query.bizType
    }
    const res = await getFilePage(params)
    list.value = res.data.records || res.data.list || []
    total.value = res.data.total || 0
  } finally {
    listLoading.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  fetchList()
}

function handleReset() {
  query.fileName = ''
  query.bizType = ''
  query.pageNum = 1
  fetchList()
}

function handlePreview(row) {
  // el-image 预览通过 preview-src-list 已可触发；这里直接唤起大图预览
  const img = new Image()
  img.src = fileViewUrl(row.id)
  img.style.position = 'fixed'
  img.style.inset = '0'
  img.style.margin = 'auto'
  img.style.maxWidth = '90vw'
  img.style.maxHeight = '90vh'
  img.style.zIndex = '3000'
  img.style.background = 'rgba(0,0,0,0.6)'
  img.style.padding = '16px'
  img.style.borderRadius = '4px'
  img.onclick = () => img.remove()
  document.body.appendChild(img)
}

onMounted(fetchList)
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
.thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  cursor: pointer;
}
.file-type-badge {
  font-size: 12px;
  color: #909399;
}
.download-link {
  text-decoration: none;
}
</style>
