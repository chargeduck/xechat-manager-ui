<template>
  <div class="ip-ban-rule-page">
    <div class="page-header">
      <h2 class="page-title">IP限流规则</h2>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>限流规则配置（保存后立即生效，无需重启）</span>
          <el-button type="primary" size="small" @click="handleAdd">新增规则</el-button>
        </div>
      </template>

      <el-table :data="ruleList" v-loading="loading" stripe>
        <el-table-column prop="ruleKey" label="规则键" min-width="180" show-overflow-tooltip />
        <el-table-column prop="ruleValue" label="规则值" width="120" />
        <el-table-column prop="remark" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
        <el-form-item label="规则键" prop="ruleKey">
          <el-input v-model="form.ruleKey" placeholder="如 per.second.limit" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="规则值" prop="ruleValue">
          <el-input-number v-model="form.ruleValue" :min="0" :max="999999" style="width: 200px" />
        </el-form-item>
        <el-form-item label="说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="规则说明" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listBanRules, saveBanRule, deleteBanRule } from '@/api/ipBan'

const loading = ref(false)
const ruleList = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  ruleKey: '',
  ruleValue: 5,
  remark: ''
})

const formRules = {
  ruleKey: [{ required: true, message: '请输入规则键', trigger: 'blur' }],
  ruleValue: [{ required: true, message: '请输入规则值', trigger: 'blur' }]
}

const dialogTitle = computed(() => (isEdit.value ? '编辑限流规则' : '新增限流规则'))

async function fetchList() {
  loading.value = true
  try {
    const res = await listBanRules()
    ruleList.value = res.data || []
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  Object.assign(form, { id: null, ruleKey: '', ruleValue: 5, remark: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, { id: row.id, ruleKey: row.ruleKey, ruleValue: row.ruleValue, remark: row.remark })
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await saveBanRule({ ...form })
    ElMessage.success('保存成功，限流规则已生效')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除规则「${row.ruleKey}」？删除后立即生效。`, '提示', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    await deleteBanRule(row.id)
    ElMessage.success('删除成功，限流规则已生效')
    fetchList()
  }).catch(() => {})
}

onMounted(fetchList)
</script>
