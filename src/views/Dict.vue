<template>
  <div class="dict-page">
    <div class="page-header">
      <h2 class="page-title">字典管理</h2>
    </div>

    <el-row :gutter="16" class="dict-container">
      <!-- 左侧：字典类型 -->
      <el-col :span="8">
        <el-card shadow="never" class="dict-card">
          <template #header>
            <div class="card-header">
              <span>字典类型</span>
              <el-button type="primary" size="small" @click="handleAddType">新增</el-button>
            </div>
          </template>

          <el-input v-model="typeKeyword" placeholder="搜索类型编码/名称" clearable class="search-input"
            @input="handleTypeSearch" />

          <el-table :data="typeList" v-loading="typeLoading" highlight-current-row stripe
            @row-click="handleTypeClick" :row-class-name="typeRowClass" max-height="calc(100vh - 320px)">
            <el-table-column prop="dictName" label="类型名称" min-width="100" show-overflow-tooltip />
            <el-table-column prop="dictType" label="类型编码" min-width="100" show-overflow-tooltip />
            <el-table-column prop="remark" label="备注" min-width="80" show-overflow-tooltip />
            <el-table-column label="状态" width="60">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="handleEditType(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click.stop="handleDeleteType(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination v-model:current-page="typePage" v-model:page-size="typePageSize"
              :total="typeTotal" :page-sizes="[10, 20, 50]" layout="total, prev, pager, next" small
              @change="fetchTypeList" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：字典项 -->
      <el-col :span="16">
        <el-card shadow="never" class="dict-card">
          <template #header>
            <div class="card-header">
              <span>
                字典项
                <template v-if="currentType">
                  ：<el-tag>{{ currentType.dictName }}</el-tag>
                  <span class="type-code">({{ currentType.dictType }})</span>
                </template>
                <template v-else>
                  <span class="placeholder-text">请先选择左侧字典类型</span>
                </template>
              </span>
              <el-button type="primary" size="small" :disabled="!currentType" @click="handleAddItem">新增</el-button>
            </div>
          </template>

          <el-table v-if="currentType" :data="itemList" v-loading="itemLoading" stripe
            max-height="calc(100vh - 370px)">
            <el-table-column prop="dictCode" label="字典编码" min-width="120" />
            <el-table-column prop="dictValue" label="字典值" min-width="120" />
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditItem(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDeleteItem(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="请在左侧选择字典类型" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 类型弹窗 -->
    <el-dialog v-model="typeDialogVisible" :title="typeDialogTitle" width="480px" destroy-on-close>
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeFormRules" label-width="100px">
        <el-form-item label="类型名称" prop="dictName">
          <el-input v-model="typeForm.dictName" placeholder="请输入类型名称" />
        </el-form-item>
        <el-form-item label="类型编码" prop="dictType">
          <el-input v-model="typeForm.dictType" placeholder="请输入类型编码（唯一）" :disabled="isTypeEdit" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="typeForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="typeForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="typeSubmitLoading" @click="handleTypeSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字典项弹窗 -->
    <el-dialog v-model="itemDialogVisible" :title="itemDialogTitle" width="480px" destroy-on-close>
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemFormRules" label-width="100px">
        <el-form-item label="字典编码" prop="dictCode">
          <el-input v-model="itemForm.dictCode" placeholder="请输入字典编码" :disabled="isItemEdit" />
        </el-form-item>
        <el-form-item label="字典值" prop="dictValue">
          <el-input v-model="itemForm.dictValue" placeholder="请输入字典值" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="itemForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="itemForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="itemSubmitLoading" @click="handleItemSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  pageDictTypes, createDictType, updateDictType, deleteDictType,
  getDictItemsByTypeId, createDictItem, updateDictItem, deleteDictItem
} from '@/api/modules/dict'

/* ==================== 类型列表 ==================== */

const typeLoading = ref(false)
const typeList = ref([])
const typeKeyword = ref('')
const typePage = ref(1)
const typePageSize = ref(10)
const typeTotal = ref(0)
let typeSearchTimer = null

async function fetchTypeList() {
  typeLoading.value = true
  try {
    const res = await pageDictTypes({
      page: typePage.value,
      pageSize: typePageSize.value,
      keyword: typeKeyword.value || undefined
    })
    typeList.value = res.data.records || []
    typeTotal.value = res.data.total || 0
  } finally {
    typeLoading.value = false
  }
}

function handleTypeSearch() {
  clearTimeout(typeSearchTimer)
  typeSearchTimer = setTimeout(() => {
    typePage.value = 1
    fetchTypeList()
  }, 300)
}

function typeRowClass({ row }) {
  return currentType.value?.id === row.id ? 'current-row' : ''
}

/* ==================== 类型弹窗 ==================== */

const typeDialogVisible = ref(false)
const typeSubmitLoading = ref(false)
const isTypeEdit = ref(false)
const typeFormRef = ref(null)

const typeForm = reactive({
  id: null,
  dictName: '',
  dictType: '',
  status: 1,
  remark: ''
})

const typeFormRules = {
  dictName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入类型编码', trigger: 'blur' }]
}

const typeDialogTitle = computed(() => isTypeEdit.value ? '编辑字典类型' : '新增字典类型')

function handleAddType() {
  isTypeEdit.value = false
  Object.assign(typeForm, { id: null, dictName: '', dictType: '', status: 1, remark: '' })
  typeDialogVisible.value = true
}

function handleEditType(row) {
  isTypeEdit.value = true
  Object.assign(typeForm, {
    id: row.id, dictName: row.dictName, dictType: row.dictType,
    status: row.status, remark: row.remark || ''
  })
  typeDialogVisible.value = true
}

async function handleTypeSubmit() {
  const valid = await typeFormRef.value.validate().catch(() => false)
  if (!valid) return
  typeSubmitLoading.value = true
  try {
    if (isTypeEdit.value) {
      await updateDictType({ ...typeForm })
      ElMessage.success('修改成功')
    } else {
      await createDictType({ ...typeForm })
      ElMessage.success('新增成功')
    }
    typeDialogVisible.value = false
    fetchTypeList()
  } finally {
    typeSubmitLoading.value = false
  }
}

async function handleDeleteType(row) {
  try {
    await ElMessageBox.confirm(`确定删除字典类型「${row.dictName}」？该类型下的所有字典项也将被禁用。`, '警告', { type: 'error' })
    await deleteDictType(row.id)
    ElMessage.success('删除成功')
    if (currentType.value?.id === row.id) {
      currentType.value = null
      itemList.value = []
    }
    fetchTypeList()
  } catch { /* 取消 */ }
}

/* ==================== 右侧选中与字典项 ==================== */

const currentType = ref(null)
const itemLoading = ref(false)
const itemList = ref([])

function handleTypeClick(row) {
  currentType.value = row
  fetchItemList(row.id)
}

async function fetchItemList(typeId) {
  itemLoading.value = true
  try {
    const res = await getDictItemsByTypeId(typeId)
    itemList.value = res.data || []
  } finally {
    itemLoading.value = false
  }
}

/* ==================== 字典项弹窗 ==================== */

const itemDialogVisible = ref(false)
const itemSubmitLoading = ref(false)
const isItemEdit = ref(false)
const itemFormRef = ref(null)

const itemForm = reactive({
  id: null,
  dictTypeId: null,
  dictCode: '',
  dictValue: '',
  sort: 0,
  status: 1
})

const itemFormRules = {
  dictCode: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
}

const itemDialogTitle = computed(() => isItemEdit.value ? '编辑字典项' : '新增字典项')

function handleAddItem() {
  isItemEdit.value = false
  Object.assign(itemForm, { id: null, dictTypeId: currentType.value.id, dictCode: '', dictValue: '', sort: 0, status: 1 })
  itemDialogVisible.value = true
}

function handleEditItem(row) {
  isItemEdit.value = true
  Object.assign(itemForm, {
    id: row.id, dictTypeId: row.dictTypeId, dictCode: row.dictCode,
    dictValue: row.dictValue, sort: row.sort, status: row.status
  })
  itemDialogVisible.value = true
}

async function handleItemSubmit() {
  const valid = await itemFormRef.value.validate().catch(() => false)
  if (!valid) return
  itemSubmitLoading.value = true
  try {
    if (isItemEdit.value) {
      await updateDictItem({ ...itemForm })
      ElMessage.success('修改成功')
    } else {
      await createDictItem({ ...itemForm })
      ElMessage.success('新增成功')
    }
    itemDialogVisible.value = false
    fetchItemList(currentType.value.id)
  } finally {
    itemSubmitLoading.value = false
  }
}

async function handleDeleteItem(row) {
  try {
    await ElMessageBox.confirm(`确定删除字典项「${row.dictCode}」？`, '警告', { type: 'error' })
    await deleteDictItem(row.id)
    ElMessage.success('删除成功')
    fetchItemList(currentType.value.id)
  } catch { /* 取消 */ }
}

onMounted(() => {
  fetchTypeList()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 16px;
}
.page-title {
  font-size: 20px;
  margin: 0;
}
.dict-container {
  height: calc(100vh - 130px);
}
.dict-card {
  height: 100%;
}
.dict-card :deep(.el-card__body) {
  padding: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.type-code {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}
.placeholder-text {
  color: #c0c4cc;
  font-size: 13px;
}
.search-input {
  margin-bottom: 12px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
:deep(.el-table .current-row) {
  background-color: #ecf5ff;
}
</style>
