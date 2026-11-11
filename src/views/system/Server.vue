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
        <el-table-column label="操作" width="210" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="canManageTokens" link type="primary" @click="openTokens(row)">管理员令牌</el-button>
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

    <!-- 管理员令牌抽屉 -->
    <el-drawer v-model="tokenDrawerVisible" :title="`管理员令牌 - ${currentServer?.name || ''}`" size="720px" destroy-on-close>
      <div class="token-toolbar">
        <span class="token-tip">一台服务器可配置多枚令牌；过期后自动失效，server 每 10 分钟拉取一次。yml 上报的令牌由服务器配置维护，不可停用/删除。</span>
        <el-button type="primary" :icon="Plus" @click="handleTokenAdd">新增令牌</el-button>
      </div>

      <el-table v-loading="tokenLoading" :data="tokenList" stripe border size="small">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="token" label="令牌" min-width="180" show-overflow-tooltip />
        <el-table-column label="来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.source === 1 ? 'warning' : 'info'" size="small">
              {{ row.source === 1 ? 'yml 上报' : '管理端' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设置时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.setTime) }}</template>
        </el-table-column>
        <el-table-column label="过期时间" width="160">
          <template #default="{ row }">
            <span v-if="!row.expireTime" class="token-forever">永不过期</span>
            <span v-else :class="{ 'token-expired': isExpired(row.expireTime) }">
              {{ formatDateTime(row.expireTime) }}
              <el-tag v-if="isExpired(row.expireTime)" type="info" size="small">已过期</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 && !isExpired(row.expireTime) ? 'success' : 'info'" size="small">
              {{ row.status === 1 && !isExpired(row.expireTime) ? '有效' : '失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleTokenEdit(row)">编辑</el-button>
            <el-tooltip v-if="row.source === 1" content="yml 上报的令牌请在鱼塘 application.yml 中修改" placement="top">
              <span class="token-readonly">不可删除</span>
            </el-tooltip>
            <el-button v-else link type="danger" @click="handleTokenDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="tokenQuery.page"
        v-model:page-size="tokenQuery.pageSize"
        :total="tokenTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @change="loadTokens"
      />

      <!-- 令牌新增 / 编辑弹窗（嵌套在抽屉内） -->
      <el-dialog v-model="tokenDialogVisible" :title="tokenForm.id ? '编辑令牌' : '新增令牌'" width="480px" append-to-body destroy-on-close>
        <el-alert
          v-if="editingYmlToken"
          type="warning"
          :closable="false"
          show-icon
          title="该令牌由鱼塘 application.yml 上报"
          description="不能停用、不能删除、不能改令牌值；如需撤销请修改鱼塘配置后重启。可调整过期时间与备注。"
          class="token-yml-alert"
        />
        <el-form ref="tokenFormRef" :model="tokenForm" :rules="tokenFormRules" label-width="100px">
          <el-form-item label="令牌" prop="token">
            <el-input v-model="tokenForm.token" :disabled="editingYmlToken" placeholder="插件端「管理员令牌」里填的字符串" />
          </el-form-item>
          <el-form-item label="设置时间" prop="setTime">
            <el-date-picker v-model="tokenForm.setTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="留空取当前时间" style="width: 100%" />
          </el-form-item>
          <el-form-item label="过期时间" prop="expireTime">
            <el-date-picker v-model="tokenForm.expireTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="留空表示永不过期" style="width: 100%" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="tokenForm.status" :disabled="editingYmlToken">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">停用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="tokenForm.remark" placeholder="可选" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="tokenDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="tokenSubmitLoading" @click="handleTokenSubmit">确定</el-button>
        </template>
      </el-dialog>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { createServer, deleteServer, listServerPage, updateServer } from '@/api/server'
import { listAdminTokens, createAdminToken, updateAdminToken, deleteAdminToken } from '@/api/serverAdminToken'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
/** 只有超管与鱼塘管理员能管理管理员令牌（后端同样做强校验） */
const canManageTokens = computed(() => {
  const roles = userStore.userInfo?.roles || []
  return roles.includes('super_admin') || roles.includes('pond_admin')
})

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

/* ==================== 管理员令牌 ==================== */

const tokenDrawerVisible = ref(false)
const tokenDialogVisible = ref(false)
const tokenLoading = ref(false)
const tokenSubmitLoading = ref(false)
const tokenFormRef = ref(null)
/** 当前编辑的是否为 yml 上报令牌（只读保护） */
const editingYmlToken = ref(false)
const currentServer = ref(null)
const tokenList = ref([])
const tokenTotal = ref(0)

const tokenQuery = reactive({ page: 1, pageSize: 10 })

const tokenForm = reactive({
  id: null,
  serverId: null,
  token: '',
  setTime: null,
  expireTime: null,
  status: 1,
  remark: ''
})

const tokenFormRules = {
  token: [{ required: true, message: '请输入令牌', trigger: 'blur' }]
}

/** 后端返回 LocalDateTime，前端只做展示格式化 */
function formatDateTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

function isExpired(value) {
  if (!value) return false
  return new Date(String(value).replace('T', ' ').replace(/-/g, '/')).getTime() < Date.now()
}

async function loadTokens() {
  if (!currentServer.value) return
  tokenLoading.value = true
  try {
    const res = await listAdminTokens({
      page: tokenQuery.page,
      pageSize: tokenQuery.pageSize,
      serverId: currentServer.value.id
    })
    tokenList.value = res.data?.records || []
    tokenTotal.value = Number(res.data?.total || 0)
  } finally {
    tokenLoading.value = false
  }
}

function openTokens(row) {
  currentServer.value = row
  tokenQuery.page = 1
  tokenDrawerVisible.value = true
  loadTokens()
}

function handleTokenAdd() {
  editingYmlToken.value = false
  tokenForm.id = null
  tokenForm.serverId = currentServer.value?.id ?? null
  tokenForm.token = ''
  tokenForm.setTime = null
  tokenForm.expireTime = null
  tokenForm.status = 1
  tokenForm.remark = ''
  tokenDialogVisible.value = true
}

function handleTokenEdit(row) {
  editingYmlToken.value = row.source === 1
  tokenForm.id = row.id
  tokenForm.serverId = row.serverId
  tokenForm.token = row.token
  tokenForm.setTime = row.setTime || null
  tokenForm.expireTime = row.expireTime || null
  tokenForm.status = row.source === 1 ? 1 : (row.status ?? 1)
  tokenForm.remark = row.remark || ''
  tokenDialogVisible.value = true
}

async function handleTokenSubmit() {
  const valid = await tokenFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (tokenForm.expireTime && tokenForm.setTime &&
      new Date(tokenForm.expireTime) <= new Date(tokenForm.setTime)) {
    ElMessage.warning('过期时间必须晚于设置时间')
    return
  }
  tokenSubmitLoading.value = true
  try {
    const payload = {
      id: tokenForm.id || null,
      serverId: tokenForm.serverId,
      token: tokenForm.token,
      setTime: tokenForm.setTime || null,
      expireTime: tokenForm.expireTime || null,
      // yml 上报令牌强制保持启用，后端也会再校验一次
      status: editingYmlToken.value ? 1 : tokenForm.status,
      remark: tokenForm.remark || null
    }
    if (tokenForm.id) {
      await updateAdminToken(payload)
      ElMessage.success('更新成功')
    } else {
      await createAdminToken(payload)
      ElMessage.success('新增成功')
    }
    tokenDialogVisible.value = false
    loadTokens()
  } finally {
    tokenSubmitLoading.value = false
  }
}

async function handleTokenDelete(row) {
  if (row.source === 1) {
    ElMessage.warning('yml 上报的令牌不能删除，请修改鱼塘 application.yml')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除令牌「${row.token}」？删除后 server 下次拉取即不再下发。`, '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteAdminToken(row.id)
    ElMessage.success('删除成功')
    loadTokens()
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
.token-readonly {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: not-allowed;
}
.token-yml-alert {
  margin-bottom: 16px;
}
</style>
