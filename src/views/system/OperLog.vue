<template>
  <div class="oper-log-page">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-form :inline="true" :model="query" @submit.prevent>
          <el-form-item label="模块">
            <el-input
              v-model="query.module"
              placeholder="业务模块"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="操作人">
            <el-input
              v-model="query.operatorName"
              placeholder="操作人用户名"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="danger" plain :icon="Delete" @click="handleClear">清空日志</el-button>
      </div>

      <!-- 日志表格 -->
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作" min-width="160" show-overflow-tooltip />
        <el-table-column prop="method" label="方法" min-width="180" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="110" />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="consumeTime" label="耗时(ms)" width="100" align="right" />
        <el-table-column prop="createTime" label="操作时间" width="180" />
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="query.page.current"
        v-model:page-size="query.page.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="load"
        @current-change="load"
      />
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="操作日志详情" width="720px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="ID">{{ current.id }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ current.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ current.action }}</el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ current.requestMethod }} {{ current.url }}</el-descriptions-item>
        <el-descriptions-item label="方法">{{ current.method }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ current.operatorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ current.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ current.consumeTime }} ms</el-descriptions-item>
        <el-descriptions-item label="结果">
          <el-tag :type="current.status === 1 ? 'success' : 'danger'" size="small">
            {{ current.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数">
          <pre class="detail-pre">{{ current.params || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="current.errorMsg" label="异常信息">
          <pre class="detail-pre error">{{ current.errorMsg }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ current.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Refresh, Search } from '@element-plus/icons-vue'
import { clearOperLogs, listOperLogs } from '@/api/operLog'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const detailVisible = ref(false)
const current = ref(null)

const query = reactive({
  module: '',
  operatorName: '',
  page: {
    current: 1,
    size: 10
  }
})

async function load() {
  loading.value = true
  try {
    const res = await listOperLogs(query)
    list.value = res.data?.records || []
    total.value = Number(res.data?.total || 0)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page.current = 1
  load()
}

function handleReset() {
  query.module = ''
  query.operatorName = ''
  query.page.current = 1
  load()
}

function handleDetail(row) {
  current.value = row
  detailVisible.value = true
}

function handleClear() {
  ElMessageBox.confirm('确定要清空全部操作日志吗？该操作不可恢复！', '清空日志', {
    type: 'warning',
    confirmButtonText: '确认清空',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await clearOperLogs()
      ElMessage.success('操作日志已清空')
      load()
    })
    .catch(() => {})
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.detail-pre {
  margin: 0;
  padding: 8px;
  max-height: 240px;
  overflow: auto;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
.detail-pre.error {
  color: var(--el-color-danger);
}
</style>
