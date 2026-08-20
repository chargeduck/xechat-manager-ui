<template>
  <div class="server-page">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-form :inline="true" :model="query" @submit.prevent>
          <el-form-item label="服务器名称">
            <el-input
              v-model="query.name"
              placeholder="服务器名称"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="IP / 域名">
            <el-input
              v-model="query.ip"
              placeholder="IP / 域名"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增服务器</el-button>
      </div>

      <!-- 服务器表格 -->
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP / 域名" min-width="150" show-overflow-tooltip />
        <el-table-column prop="port" label="端口" width="80" align="center" />
        <el-table-column prop="version" label="版本" width="100" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="load"
      />
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入服务器名称" />
        </el-form-item>
        <el-form-item label="IP / 域名" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入 IP / 域名" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { createServer, deleteServer, listServerPage, updateServer } from '@/api/server'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const query = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  ip: ''
})

const form = reactive({
  id: null,
  name: '',
  ip: '',
  port: 8080,
  version: '',
  status: 1,
  sort: 0,
  remark: ''
})

const formRules = {
  name: [{ required: true, message: '请输入服务器名称', trigger: 'blur' }],
  ip: [{ required: true, message: '请输入 IP / 域名', trigger: 'blur' }]
}

const dialogTitle = computed(() => (form.id ? '编辑服务器' : '新增服务器'))

async function load() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.name) params.name = query.name
    if (query.ip) params.ip = query.ip
    const res = await listServerPage(params)
    list.value = res.data?.records || []
    total.value = Number(res.data?.total || 0)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  load()
}

function handleReset() {
  query.name = ''
  query.ip = ''
  query.page = 1
  load()
}

function handleAdd() {
  form.id = null
  form.name = ''
  form.ip = ''
  form.port = 8080
  form.version = ''
  form.status = 1
  form.sort = 0
  form.remark = ''
  dialogVisible.value = true
}

function handleEdit(row) {
  form.id = row.id
  form.name = row.name
  form.ip = row.ip
  form.port = row.port ?? 8080
  form.version = row.version || ''
  form.status = row.status ?? 1
  form.sort = row.sort ?? 0
  form.remark = row.remark || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const payload = {
      id: form.id || null,
      name: form.name,
      ip: form.ip,
      port: form.port,
      version: form.version,
      status: form.status ?? 1,
      sort: form.sort ?? 0,
      remark: form.remark
    }
    if (form.id) {
      await updateServer(payload)
      ElMessage.success('更新成功')
    } else {
      await createServer(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    load()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除服务器「${row.name}」？`, '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteServer(row.id)
    ElMessage.success('删除成功')
    load()
  } catch { /* 取消 */ }
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
</style>
