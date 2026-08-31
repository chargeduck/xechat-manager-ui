<template>
  <div class="ip-blacklist-page">
    <div class="page-header">
      <h2 class="page-title">IP黑名单</h2>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>被封禁 IP 列表（含永久封禁与限时封禁）</span>
          <el-button type="primary" size="small" @click="handleAdd">拉黑 IP</el-button>
        </div>
      </template>

      <el-table :data="blacklist" v-loading="loading" stripe>
        <el-table-column prop="ip" label="IP 地址" min-width="140" />
        <el-table-column label="封禁类型" width="110">
          <template #default="{ row }">
            <el-tag :type="row.permanently ? 'danger' : 'warning'" size="small">
              {{ row.permanently ? '永久封禁' : '限时封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="解封时间" width="170" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.bannedUntil || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="banCount" label="累计封禁次数" width="120" />
        <el-table-column prop="banReason" label="封禁原因" min-width="180" show-overflow-tooltip />
        <el-table-column prop="lastBanTime" label="最近封禁时间" width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleUnban(row)">解封</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="拉黑 IP" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="IP 地址" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入 IP 地址" />
        </el-form-item>
        <el-form-item label="永久封禁">
          <el-switch v-model="form.permanently" />
        </el-form-item>
        <el-form-item label="封禁时长" prop="hours">
          <el-input-number v-model="form.hours" :min="1" :max="8760" :disabled="form.permanently"
            style="width: 200px" />
          <span class="hours-unit">小时（永久封禁时忽略）</span>
        </el-form-item>
        <el-form-item label="封禁原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="封禁原因（可选）" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listBlacklist, addBlacklist, removeBlacklist } from '@/api/ipBan'

const loading = ref(false)
const blacklist = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = reactive({
  ip: '',
  permanently: false,
  hours: 1,
  reason: ''
})

const formRules = {
  ip: [{ required: true, message: '请输入 IP 地址', trigger: 'blur' }]
}

async function fetchList() {
  loading.value = true
  try {
    const res = await listBlacklist()
    blacklist.value = res.data || []
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  Object.assign(form, { ip: '', permanently: false, hours: 1, reason: '' })
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await addBlacklist({ ...form })
    ElMessage.success('拉黑成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

function handleUnban(row) {
  ElMessageBox.confirm(`确认解除 IP ${row.ip} 的封禁？`, '提示', {
    type: 'warning',
    confirmButtonText: '解封',
    cancelButtonText: '取消'
  }).then(async () => {
    await removeBlacklist(row.ip)
    ElMessage.success('已解除封禁')
    fetchList()
  }).catch(() => {})
}

onMounted(fetchList)
</script>
