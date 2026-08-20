<template>
  <div class="user-page">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="searchForm.nickname" placeholder="请输入昵称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" filterable clearable>
            <el-option label="全部" value="" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <template v-if="roleMap[row.id] && roleMap[row.id].length">
              <el-tag
                v-for="r in roleMap[row.id]"
                :key="r.id"
                :type="roleTagType(r.roleCode)"
                size="small"
                class="role-tag"
              >
                {{ r.roleName }}
              </el-tag>
            </template>
            <span v-else class="no-role">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最近登录" width="170" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 1" size="small" type="warning" @click="handleToggleStatus(row)">禁用</el-button>
            <el-button v-else size="small" type="success" @click="handleToggleStatus(row)">启用</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item v-if="isEdit" label="分配角色">
          <el-select v-model="form.roleIds" multiple filterable placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="r in roleOptions"
              :key="r.id"
              :label="`${r.roleName}（${r.roleCode}）`"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
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
import { getUserList, createUser, updateUser, deleteUser, updateUserStatus, getUserRoles, assignUserRoles } from '@/api/user'
import { listAllRoles } from '@/api/role'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

/* userId -> 角色列表（含 id/roleCode/roleName），用于表格角色列标签 */
const roleMap = reactive({})
/* 分配角色下拉数据（GET /role/list） */
const roleOptions = ref([])

const searchForm = reactive({
  username: '',
  nickname: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  role: 'user',
  roleIds: [],
  status: 1
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

function roleTagType(code) {
  if (code === 'super_admin') return 'danger'
  if (code === 'admin') return 'warning'
  if (code === 'developer') return 'primary'
  return 'info'
}

/** 批量加载当前页用户的角色列表（GET /user/roles/{userId}） */
async function fetchRolesForRows(rows) {
  const ids = rows.map(r => r.id).filter(Boolean)
  if (!ids.length) return
  await Promise.all(ids.map(async (id) => {
    try {
      const res = await getUserRoles(id)
      roleMap[id] = res.data || []
    } catch { /* 单行失败不影响整体 */ }
  }))
}

/** 加载角色下拉（GET /role/list） */
async function loadRoleOptions() {
  if (roleOptions.value.length) return
  try {
    const res = await listAllRoles()
    roleOptions.value = res.data || []
  } catch { /* 忽略 */ }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.nickname) params.nickname = searchForm.nickname
    if (searchForm.status !== '') params.status = searchForm.status
    const res = await getUserList(params)
    const records = res.data.records || res.data.list || []
    tableData.value = records
    pagination.total = res.data.total || 0
    await fetchRolesForRows(records)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.username = ''
  searchForm.nickname = ''
  searchForm.status = ''
  pagination.page = 1
  fetchData()
}

function handleAdd() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    username: '', password: '', nickname: '', email: '', phone: '', role: 'user', roleIds: [], status: 1
  })
  dialogVisible.value = true
}

async function handleEdit(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    username: row.username || '',
    password: '',
    nickname: row.nickname || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role || 'user',
    roleIds: [],
    status: row.status ?? 1
  })
  dialogVisible.value = true
  await loadRoleOptions()
  try {
    const res = await getUserRoles(row.id)
    form.roleIds = (res.data || []).map(r => r.id)
  } catch { /* 忽略 */ }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      const data = { nickname: form.nickname, email: form.email, phone: form.phone, role: form.role, status: form.status }
      await updateUser(editId.value, data)
      if (form.roleIds && form.roleIds.length) {
        await assignUserRoles(editId.value, { roleIds: form.roleIds })
      }
      ElMessage.success('编辑成功')
    } else {
      await createUser({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } finally {
    submitLoading.value = false
  }
}

async function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const text = newStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${text}用户「${row.username}」？`, '提示', { type: 'warning' })
    await updateUserStatus(row.id, newStatus)
    ElMessage.success(`${text}成功`)
    fetchData()
  } catch { /* 取消 */ }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.username}」？`, '警告', { type: 'error' })
    await deleteUser(row.id)
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
.role-tag {
  margin-right: 4px;
}
.no-role {
  color: #909399;
}
</style>
