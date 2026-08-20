<template>
  <div class="role-page">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-form :inline="true" :model="query" @submit.prevent>
          <el-form-item label="角色编码">
            <el-input
              v-model="query.roleCode"
              placeholder="角色编码"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="角色名称">
            <el-input
              v-model="query.roleName"
              placeholder="角色名称"
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
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
      </div>

      <!-- 角色表格 -->
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="roleCode" label="角色编码" min-width="120" show-overflow-tooltip />
        <el-table-column prop="roleName" label="角色名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="handleAssignMenu(row)">分配菜单</el-button>
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
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" placeholder="如 super_admin / admin" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单弹窗 -->
    <el-dialog v-model="menuDialogVisible" title="分配菜单" width="480px" destroy-on-close>
      <div v-loading="menuLoading" class="menu-tree-wrap">
        <el-tree
          ref="menuTreeRef"
          :data="menuTree"
          node-key="id"
          show-checkbox
          :props="{ label: 'menuName', children: 'children' }"
          default-expand-all
        />
      </div>
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="menuSaving" @click="handleSaveMenus">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { createRole, deleteRole, listRolePage, updateRole } from '@/api/role'
import { assignMenus, getMenuTree, getRoleMenus } from '@/api/menu'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const query = reactive({
  page: 1,
  pageSize: 10,
  roleCode: '',
  roleName: ''
})

const form = reactive({
  id: null,
  roleCode: '',
  roleName: '',
  description: '',
  sort: 0,
  status: 1
})

const formRules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => (form.id ? '编辑角色' : '新增角色'))

/* ---------------- 列表 ---------------- */

async function load() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.roleCode) params.roleCode = query.roleCode
    if (query.roleName) params.roleName = query.roleName
    const res = await listRolePage(params)
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
  query.roleCode = ''
  query.roleName = ''
  query.page = 1
  load()
}

/* ---------------- 新增 / 编辑 / 删除 ---------------- */

function handleAdd() {
  form.id = null
  form.roleCode = ''
  form.roleName = ''
  form.description = ''
  form.sort = 0
  form.status = 1
  dialogVisible.value = true
}

function handleEdit(row) {
  form.id = row.id
  form.roleCode = row.roleCode
  form.roleName = row.roleName
  form.description = row.description || ''
  form.sort = row.sort ?? 0
  form.status = row.status ?? 1
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const payload = {
      id: form.id || null,
      roleCode: form.roleCode,
      roleName: form.roleName,
      description: form.description,
      sort: form.sort ?? 0,
      status: form.status ?? 1
    }
    if (form.id) {
      await updateRole(payload)
      ElMessage.success('更新成功')
    } else {
      await createRole(payload)
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
    await ElMessageBox.confirm(`确定删除角色「${row.roleName}」？删除后其用户关联与菜单关联将一并清除。`, '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    load()
  } catch { /* 取消 */ }
}

/* ---------------- 分配菜单 ---------------- */

const menuDialogVisible = ref(false)
const menuLoading = ref(false)
const menuSaving = ref(false)
const menuTree = ref([])
const menuTreeRef = ref(null)
const currentRole = ref(null)

async function handleAssignMenu(row) {
  currentRole.value = row
  menuDialogVisible.value = true
  menuLoading.value = true
  try {
    const [treeRes, roleMenuRes] = await Promise.all([getMenuTree(), getRoleMenus(row.id)])
    menuTree.value = treeRes.data || []
    const checkedIds = roleMenuRes.data || []
    // 等树渲染后回显已选菜单
    await nextTick()
    menuTreeRef.value?.setCheckedKeys(checkedIds)
  } finally {
    menuLoading.value = false
  }
}

async function handleSaveMenus() {
  if (!currentRole.value) return
  menuSaving.value = true
  try {
    const tree = menuTreeRef.value
    const checkedIds = [...(tree?.getCheckedKeys() || []), ...(tree?.getHalfCheckedKeys() || [])]
    await assignMenus({ roleId: currentRole.value.id, menuIds: checkedIds })
    ElMessage.success('菜单分配成功')
    menuDialogVisible.value = false
  } finally {
    menuSaving.value = false
  }
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
.menu-tree-wrap {
  max-height: 420px;
  overflow-y: auto;
}
</style>
