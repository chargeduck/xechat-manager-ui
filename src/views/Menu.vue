<template>
  <div class="menu-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-title">
          <el-button type="primary" :icon="Plus" @click="handleAdd(null)">新增顶级菜单</el-button>
          <el-button :icon="Refresh" @click="load">刷新</el-button>
        </div>
      </div>

      <!-- 菜单树形表格 -->
      <el-table
        v-loading="loading"
        :data="menuTree"
        row-key="id"
        stripe
        border
        :tree-props="{ children: 'children' }"
        default-expand-all
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="90" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="140" show-overflow-tooltip />
        <el-table-column prop="component" label="组件" min-width="160" show-overflow-tooltip />
        <el-table-column prop="permission" label="权限标识" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)" size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="可见" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible === 1 ? 'success' : 'info'" size="small">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleAdd(row)">新增子菜单</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="父级菜单" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="{ label: 'menuName', children: 'children' }"
            node-key="id"
            check-strictly
            default-expand-all
            placeholder="选择父级菜单（默认顶级）"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如 /role" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="如 views/Role.vue" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="Element Plus 图标名，如 User" />
        </el-form-item>
        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="form.permission" placeholder="如 system:role" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">目录</el-radio>
            <el-radio :value="2">菜单</el-radio>
            <el-radio :value="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="可见" prop="visible">
          <el-radio-group v-model="form.visible">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { createMenu, deleteMenu, getMenuTree, updateMenu } from '@/api/menu'

const loading = ref(false)
const menuTree = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  parentId: 0,
  menuName: '',
  path: '',
  component: '',
  icon: '',
  permission: '',
  type: 2,
  sort: 0,
  visible: 1
})

const formRules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => (form.id ? '编辑菜单' : '新增菜单'))

/* 父级下拉：在完整树前加一个「顶级菜单」虚拟节点 */
const parentOptions = computed(() => [
  { id: 0, menuName: '顶级菜单', children: menuTree.value }
])

function typeText(type) {
  return { 1: '目录', 2: '菜单', 3: '按钮' }[type] || '未知'
}

function typeTagType(type) {
  return { 1: 'warning', 2: 'primary', 3: 'info' }[type] || 'info'
}

async function load() {
  loading.value = true
  try {
    const res = await getMenuTree()
    menuTree.value = res.data || []
  } finally {
    loading.value = false
  }
}

function handleAdd(parentRow) {
  form.id = null
  form.parentId = parentRow ? parentRow.id : 0
  form.menuName = ''
  form.path = ''
  form.component = ''
  form.icon = ''
  form.permission = ''
  form.type = 2
  form.sort = 0
  form.visible = 1
  dialogVisible.value = true
}

function handleEdit(row) {
  form.id = row.id
  form.parentId = row.parentId ?? 0
  form.menuName = row.menuName
  form.path = row.path || ''
  form.component = row.component || ''
  form.icon = row.icon || ''
  form.permission = row.permission || ''
  form.type = row.type ?? 2
  form.sort = row.sort ?? 0
  form.visible = row.visible ?? 1
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const payload = {
      id: form.id || null,
      parentId: form.parentId ?? 0,
      menuName: form.menuName,
      path: form.path,
      component: form.component,
      icon: form.icon,
      permission: form.permission,
      type: form.type ?? 2,
      sort: form.sort ?? 0,
      visible: form.visible ?? 1
    }
    if (form.id) {
      await updateMenu(payload)
      ElMessage.success('更新成功')
    } else {
      await createMenu(payload)
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
    await ElMessageBox.confirm(`确定删除菜单「${row.menuName}」？其子孙菜单及角色关联将一并删除。`, '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteMenu(row.id)
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
</style>
