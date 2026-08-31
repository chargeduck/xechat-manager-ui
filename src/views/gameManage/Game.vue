<template>
  <div class="game-page">
    <div class="page-header">
      <h2 class="page-title">游戏管理</h2>
      <el-button type="primary" @click="handleAdd">新增游戏</el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="游戏名称">
          <el-input v-model="searchForm.gameName" placeholder="请输入游戏名称" clearable />
        </el-form-item>
        <el-form-item label="游戏类型">
          <el-select v-model="searchForm.gameType" filterable placeholder="请选择" clearable>
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" filterable clearable>
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
            <el-option label="维护" :value="2" />
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
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="gameName" label="游戏名称" min-width="120" >
          <template #default="{ row }">
            <el-link v-if="row.playUrl" type="primary" :href="row.playUrl" target="_blank">{{ row.gameName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="gameNameZhCn" label="中文名" min-width="120" >
          <template #default="{ row }">
            <el-link v-if="row.playUrl" type="primary" :href="row.playUrl" target="_blank">{{ row.gameNameZhCn }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="当前版本" width="100" />
        <el-table-column label="后端" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.needBackend" type="warning" size="small">需要</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="游戏类型" min-width="140">
          <template #default="{ row }">
            <template v-if="row.categoryNames && row.categoryNames.length">
              <el-tag
                v-for="name in row.categoryNames"
                :key="name"
                size="small"
                class="category-tag"
              >{{ name }}</el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="包大小" width="100">
          <template #default="{ row }">
            <span v-if="row.fileSize">{{ formatSize(row.fileSize) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="deployTime" label="最近部署" width="200" />
        <el-table-column prop="createTime" label="创建时间" width="200" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="cmd => handleCommand(cmd, row)">
              <el-button size="small" link type="primary">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">详情</el-dropdown-item>
                  <el-dropdown-item command="edit">基础编辑</el-dropdown-item>
                  <el-dropdown-item command="update">游戏更新</el-dropdown-item>
                  <el-dropdown-item command="backend">上传后端jar</el-dropdown-item>
                  <el-dropdown-item v-if="row.status !== 1" command="status">上架</el-dropdown-item>
                  <el-dropdown-item v-else command="status">下架</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <!-- el-drawer：详情 / 编辑 / 新增 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="560px" destroy-on-close direction="rtl">
      <!-- 查看详情模式 -->
      <template v-if="drawerMode === 'view'">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="基本信息" name="info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="游戏名称">{{ detailData.gameName }}</el-descriptions-item>
              <el-descriptions-item label="中文名">{{ detailData.gameNameZhCn || '-' }}</el-descriptions-item>
              <el-descriptions-item label="游戏类型">
                <template v-if="detailData.categoryNames && detailData.categoryNames.length">
                  <el-tag
                    v-for="name in detailData.categoryNames"
                    :key="name"
                    size="small"
                    class="category-tag"
                  >{{ name }}</el-tag>
                </template>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="版本号">{{ detailData.version || '-' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="statusTag(detailData.status)">{{ statusText(detailData.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="包大小">{{ detailData.fileSize ? formatSize(detailData.fileSize) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="图标URL">{{ detailData.iconUrl || detailData.icon || '-' }}</el-descriptions-item>
              <el-descriptions-item label="部署包文件">{{ detailData.pkgFileName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="下载地址">
                <el-link v-if="detailData.downloadUrl" type="primary" :href="detailData.downloadUrl" target="_blank">{{ detailData.downloadUrl }}</el-link>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="简介">{{ detailData.description || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="部署历史" name="history">
            <el-table :data="historyList" v-loading="historyLoading" stripe max-height="400">
              <el-table-column prop="version" label="版本号" width="100" />
              <el-table-column prop="versionTime" label="版本时间" width="160" />
              <el-table-column prop="deployTime" label="部署时间" width="170" />
              <el-table-column label="包大小" width="100">
                <template #default="{ row }">
                  {{ row.fileSize ? formatSize(row.fileSize) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="uploadUserId" label="上传者ID" width="100" />
              <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
              <el-table-column prop="filePath" label="文件路径" min-width="200" show-overflow-tooltip />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>

      <!-- 编辑 / 新增 / 更新模式 -->
      <template v-if="drawerMode === 'edit' || drawerMode === 'create' || drawerMode === 'update'">
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
          <el-form-item label="游戏名称" prop="gameName">
            <el-input
              v-model="form.gameName"
              :disabled="drawerMode !== 'create'"
              placeholder="请输入游戏名称（唯一标识，同时为服务器目录名）"
            />
          </el-form-item>
          <el-form-item label="中文名" prop="gameNameZhCn">
            <el-input v-model="form.gameNameZhCn" placeholder="请输入中文名" />
          </el-form-item>
          <el-form-item label="游戏类型" prop="categoryIds">
            <el-cascader
              v-model="form.categoryIds"
              :options="categoryTreeOptions"
              :props="{ multiple: true, emitPath: false, checkStrictly: true }"
              filterable
              clearable
              placeholder="请选择游戏类型（可多选）"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item v-if="drawerMode !== 'edit'" label="版本更新" prop="versionLevel">
            <el-radio-group v-model="form.versionLevel" @change="handleVersionChange">
              <el-radio-button value="major">大版本更新</el-radio-button>
              <el-radio-button value="minor">新增功能</el-radio-button>
              <el-radio-button value="patch">BUG修复</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="版本号" prop="version">
            <el-input v-model="form.version" placeholder="选择更新维度后自动生成" disabled />
            <div class="version-tip">{{ drawerMode === 'edit' ? '当前版本号，不可修改' : '新版本号由系统根据当前版本自动生成，不可手动修改' }}</div>
          </el-form-item>
          <el-form-item label="游戏图标" prop="icon">
            <div class="icon-upload-wrap">
              <el-upload
                :show-file-list="false"
                accept="image/*"
                :before-upload="beforeIconUpload"
                :http-request="handleIconUpload"
              >
                <el-button :loading="iconUploading">上传图标</el-button>
              </el-upload>
              <el-image
                v-if="form.icon"
                :src="resolveIconUrl(form.icon)"
                fit="contain"
                class="icon-preview"
              />
              <span v-else class="icon-placeholder">未上传图标</span>
              <div class="upload-tip">上传后自动保存为文件ID，回显走 /file/view/{id}</div>
            </div>
          </el-form-item>
          <el-form-item v-if="drawerMode !== 'edit'" label="游戏包" prop="packageFileId">
            <div class="icon-upload-wrap">
              <el-upload
                :show-file-list="false"
                accept=".tar.gz"
                :before-upload="beforePkgUpload"
                :http-request="handlePkgUpload"
              >
                <el-button :loading="pkgUploading">上传游戏包</el-button>
              </el-upload>
              <span class="pkg-name" :class="{ 'has-file': pkgFileName }">
                {{ pkgFileName ? '已上传：' + pkgFileName : '仅支持 .tar.gz，上传后部署时直接复用该文件' }}
              </span>
              <el-progress
                v-if="pkgUploading"
                class="upload-progress"
                :percentage="pkgUploadProgress"
                :stroke-width="8"
                :status="pkgUploadProgress >= 100 ? 'success' : undefined"
              />
            </div>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio :value="0">下架</el-radio>
              <el-radio :value="1">上架</el-radio>
              <el-radio :value="2">维护</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="简介" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入游戏简介" />
          </el-form-item>
        </el-form>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- el-dialog：上传后端 jar / 后端信息 -->
    <el-dialog v-model="backendVisible" title="后端 jar 托管" width="560px" destroy-on-close>
      <el-descriptions v-if="backendInfo" :column="1" border size="small" class="backend-info">
        <el-descriptions-item label="游戏名称">{{ backendInfo.gameName }}</el-descriptions-item>
        <el-descriptions-item label="jar 文件">{{ backendInfo.fileName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{ backendInfo.version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ backendInfo.fileSize ? formatSize(backendInfo.fileSize) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="SHA-256">
          <span class="sha256-text">{{ backendInfo.sha256 || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="部署时间">{{ backendInfo.deployTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上传者ID">{{ backendInfo.uploadUserId || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else :image-size="60" description="尚未上传后端 jar" />

      <el-divider>上传新版本</el-divider>
      <el-form :model="backendForm" label-width="90px">
        <el-form-item label="游戏名称">
          <el-input :model-value="backendForm.gameName" disabled />
        </el-form-item>
        <el-form-item label="中文名">
          <el-input v-model="backendForm.gameNameZhCn" placeholder="游戏中文名（游戏不存在时自动登记）" />
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="backendForm.version" placeholder="如 1.0.0（留空默认 1.0.0）" />
        </el-form-item>
        <el-form-item label="后端 jar">
          <el-upload
            :show-file-list="false"
            accept=".jar"
            :before-upload="beforeBackendJarUpload"
            :http-request="handleBackendJarUpload"
          >
            <el-button :loading="backendUploading">选择 jar 文件</el-button>
          </el-upload>
          <div class="upload-tip">仅支持 .jar，上限 200MB；上传成功后将触发 launcher reload</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="backendVisible = false">关闭</el-button>
        <el-popconfirm
          v-if="backendInfo"
          title="确定下架当前后端 jar？"
          confirm-button-text="下架"
          cancel-button-text="取消"
          @confirm="handleBackendRemove"
        >
          <template #reference>
            <el-button type="danger" plain :loading="backendRemoving">下架后端</el-button>
          </template>
        </el-popconfirm>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { getGameList, getGameDetail, getNextVersion, createGame, updateGame, deployGame, deleteGame, updateGameStatus } from '@/api/game'
import { getDeployHistoryList } from '@/api/deploy'
import { getCategoryList, getCategoryTree } from '@/api/category'
import { uploadFile, fileViewUrl } from '@/api/file'

const loading = ref(false)
const tableData = ref([])
const submitLoading = ref(false)
const formRef = ref(null)

const categoryOptions = ref([])
/** 分类树（级联选择器 options）：value=id, label=name, children */
const categoryTreeOptions = ref([])

/** 将后端分类树（{id,parentId,name,children}）递归转换为 el-cascader options */
function buildCascaderOptions(list) {
  return (list || []).map(node => ({
    value: node.id,
    label: node.name,
    children: node.children && node.children.length ? buildCascaderOptions(node.children) : undefined
  }))
}

const searchForm = reactive({
  gameName: '',
  gameType: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

/* ==================== drawer 公共状态 ==================== */

const drawerVisible = ref(false)
const drawerMode = ref('view') // 'view' | 'edit' | 'create' | 'update'

const drawerTitle = computed(() => {
  if (drawerMode.value === 'view') return '游戏详情'
  if (drawerMode.value === 'update') return '游戏更新'
  if (drawerMode.value === 'edit') return '基础信息编辑'
  return '新增游戏'
})

/* ==================== 详情模式 ==================== */

const detailData = reactive({})
const detailTab = ref('info')
const historyLoading = ref(false)
const historyList = ref([])

async function handleDetail(row) {
  drawerMode.value = 'view'
  detailTab.value = 'info'
  Object.assign(detailData, row)
  drawerVisible.value = true

  // 异步拉取详情覆盖列表字段（列表可能缺失包大小/图标URL/简介/下载地址）
  try {
    const res = await getGameDetail(row.id)
    if (res.data) Object.assign(detailData, res.data)
  } catch {
    // 失败保持 row 数据兜底
  }

  // 加载部署历史
  historyLoading.value = true
  try {
    const res = await getDeployHistoryList({ gameName: row.gameName })
    historyList.value = res.data || []
  } catch {
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

/* ==================== 编辑 / 新增模式 ==================== */

const editGameId = ref(null)

const form = ref({
  gameName: '',
  gameNameZhCn: '',
  version: '',
  versionLevel: '',
  categoryIds: [],
  icon: '',
  status: 1,
  description: '',
  packageFileId: ''
})

const formRules = computed(() => {
  const rules = {
    gameName: [{ required: true, message: '请输入游戏名称', trigger: 'blur' }]
  }
  // packageFileId 仅新增/更新模式必填；基础编辑模式去掉该校验，避免 required 拦死编辑提交
  if (drawerMode.value === 'create' || drawerMode.value === 'update') {
    rules.packageFileId = [{ required: true, message: '请上传游戏包（.tar.gz）', trigger: 'change' }]
  }
  return rules
})

function resetForm() {
  form.value = {
    gameName: '',
    gameNameZhCn: '',
    version: '',
    versionLevel: '',
    categoryIds: [],
    icon: '',
    status: 1,
    description: '',
    packageFileId: ''
  }
  pkgFileName.value = ''
}

function handleAdd() {
  drawerMode.value = 'create'
  editGameId.value = null
  resetForm()
  // 新增游戏只能从大版本开始：默认选中并回显 1.0.0
  form.value.versionLevel = 'major'
  handleVersionChange('major')
  drawerVisible.value = true
}

async function handleEdit(row) {
  drawerMode.value = 'edit'
  editGameId.value = row.id
  form.value = {
    gameName: row.gameName || '',
    gameNameZhCn: row.gameNameZhCn || '',
    version: row.version || '',
    versionLevel: '',
    categoryIds: row.categoryIds || [],
    icon: row.icon || '',
    status: row.status ?? 1,
    description: row.description || '',
    packageFileId: null
  }
  drawerVisible.value = true

  // 异步拉取详情刷新表单（icon/description/categoryIds/version 等用接口返回覆盖，gameName 保持原值）
  try {
    const res = await getGameDetail(row.id)
    const data = res.data || {}
    form.value.gameNameZhCn = data.gameNameZhCn ?? form.value.gameNameZhCn
    form.value.version = data.version ?? form.value.version
    form.value.categoryIds = data.categoryIds ?? form.value.categoryIds
    form.value.icon = data.icon ?? form.value.icon
    form.value.status = data.status ?? form.value.status
    form.value.description = data.description ?? form.value.description
  } catch {
    // 失败保持 row 数据兜底
  }
}

/**
 * 游戏更新：复用已上传部署包走部署接口，不重新上传；
 * 默认选择 major 维度生成新版本号回显，packageFileId 置空等待用户上传新包
 */
async function handleUpdate(row) {
  drawerMode.value = 'update'
  editGameId.value = row.id
  form.value = {
    gameName: row.gameName || '',
    gameNameZhCn: row.gameNameZhCn || '',
    version: row.version || '',
    versionLevel: 'major',
    categoryIds: row.categoryIds || [],
    icon: row.icon || '',
    status: row.status ?? 1,
    description: row.description || '',
    packageFileId: null
  }
  pkgFileName.value = ''
  drawerVisible.value = true

  // 异步拉取详情刷新表单，再用后端生成的新版本号覆盖 version
  try {
    const res = await getGameDetail(row.id)
    const data = res.data || {}
    form.value.gameNameZhCn = data.gameNameZhCn ?? form.value.gameNameZhCn
    form.value.version = data.version ?? form.value.version
    form.value.categoryIds = data.categoryIds ?? form.value.categoryIds
    form.value.icon = data.icon ?? form.value.icon
    form.value.status = data.status ?? form.value.status
    form.value.description = data.description ?? form.value.description
  } catch {
    // 失败保持 row 数据兜底
  }
  await handleVersionChange('major')
}

/* ==================== 文件上传（图标 / 游戏包） ==================== */

const iconUploading = ref(false)
const pkgUploading = ref(false)
const pkgFileName = ref('')
const pkgUploadProgress = ref(0)

/**
 * 图标回显地址：icon 为纯数字（file_id）时拼接文件访问接口；否则视为外部 URL 原样使用
 */
function resolveIconUrl(icon) {
  if (!icon) return ''
  if (/^\d+$/.test(String(icon))) {
    return fileViewUrl(icon)
  }
  return icon
}

function beforeIconUpload(file) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('仅支持上传图片格式（jpg/png/webp 等）')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图标大小不能超过 5MB')
    return false
  }
  return true
}

async function handleIconUpload(options) {
  iconUploading.value = true
  try {
    const res = await uploadFile(options.file, 'game_icon')
    form.value.icon = String(res.data.id)
    ElMessage.success('图标上传成功')
  } catch {
    // 错误提示由拦截器统一弹出
  } finally {
    iconUploading.value = false
  }
}

function beforePkgUpload(file) {
  const name = file.name || ''
  if (!name.toLowerCase().endsWith('.tar.gz')) {
    ElMessage.warning('仅支持 .tar.gz 格式的部署包')
    return false
  }
  if (file.size > 1024 * 1024 * 1024) {
    ElMessage.warning('游戏包不能超过 1GB')
    return false
  }
  return true
}

async function handlePkgUpload(options) {
  pkgUploading.value = true
  pkgUploadProgress.value = 0
  try {
    const res = await uploadFile(options.file, 'game_pkg', undefined,
      form.value.gameName, form.value.version, (percent) => {
        pkgUploadProgress.value = percent
      })
    form.value.packageFileId = res.data.id
    pkgFileName.value = options.file.name || ''
    ElMessage.success('游戏包上传成功')
  } catch {
    // 错误提示由拦截器统一弹出
  } finally {
    pkgUploading.value = false
    pkgUploadProgress.value = 0
  }
}

/**
 * 用户选择更新维度后，调用后端生成并回显新版本号（只读不可修改）
 */
async function handleVersionChange(level) {
  if (!level) return
  try {
    const res = await getNextVersion(editGameId.value, level)
    form.value.version = res.data || ''
  } catch {
    form.value.versionLevel = ''
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const payload = { ...form.value }
    if (drawerMode.value === 'create') {
      // 新增：携带 packageFileId 自动部署
      await createGame(payload)
      ElMessage.success('新增成功')
    } else if (drawerMode.value === 'update') {
      // 更新：需已上传新包，走部署接口复用 fileId，不重新上传
      if (!payload.packageFileId) {
        ElMessage.warning('请先上传新的游戏包（.tar.gz）')
        return
      }
      await deployGame({
        gameName: payload.gameName,
        gameNameZhCn: payload.gameNameZhCn,
        icon: payload.icon,
        description: payload.description,
        version: payload.version,
        categoryIds: payload.categoryIds,
        fileId: payload.packageFileId
      })
      ElMessage.success('游戏更新部署成功')
    } else {
      // 基础编辑：不重新部署，packageFileId 传 null，避免空字符串绑 Long 报错
      payload.packageFileId = null
      await updateGame(payload)
      ElMessage.success('编辑成功')
    }
    drawerVisible.value = false
    fetchData()
  } catch (e) {
    // 后端返回的提示（如"游戏名重复"）已由拦截器弹出，这里不重复提示
  } finally {
    submitLoading.value = false
  }
}

/* ==================== 表格通用逻辑 ==================== */

/**
 * 操作列下拉菜单命令分发：命令与 handle 函数一一对应，保持原有函数签名（均按 row 传参）
 */
function handleCommand(cmd, row) {
  if (cmd === 'detail') handleDetail(row)
  else if (cmd === 'edit') handleEdit(row)
  else if (cmd === 'update') handleUpdate(row)
  else if (cmd === 'backend') handleBackend(row)
  else if (cmd === 'status') handleStatus(row)
  else if (cmd === 'delete') handleDelete(row)
}

function statusTag(status) {
  return status === 1 ? 'success' : status === 2 ? 'warning' : 'info'
}

function statusText(status) {
  return status === 1 ? '上架' : status === 2 ? '维护' : '下架'
}

function formatSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.gameName) params.gameName = searchForm.gameName
    if (searchForm.categoryId !== '') params.categoryId = searchForm.categoryId
    if (searchForm.status !== '') params.status = searchForm.status
    const res = await getGameList(params)
    tableData.value = res.data.records || res.data.list || []
    pagination.total = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.gameName = ''
  searchForm.gameType = ''
  searchForm.status = ''
  pagination.page = 1
  fetchData()
}

async function handleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const text = newStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定${text}该游戏？`, '提示', { type: 'warning' })
    await updateGameStatus(row.gameName, newStatus)
    ElMessage.success(`${text}成功`)
    fetchData()
  } catch { /* 取消 */ }
}

/* ==================== 后端 jar 托管 ==================== */

const backendVisible = ref(false)
const backendUploading = ref(false)
const backendRemoving = ref(false)
const backendInfo = ref(null)
const backendForm = ref({ gameName: '', gameNameZhCn: '', version: '' })

async function handleBackend(row) {
  backendForm.value = {
    gameName: row.gameName || '',
    gameNameZhCn: row.gameNameZhCn || '',
    version: row.version || ''
  }
  backendInfo.value = null
  backendVisible.value = true
  // 拉取已部署信息
  try {
    const res = await getGameBackendInfo(row.gameName)
    backendInfo.value = res.data || null
  } catch {
    backendInfo.value = null
  }
}

function beforeBackendJarUpload(file) {
  const name = file.name || ''
  if (!name.toLowerCase().endsWith('.jar')) {
    ElMessage.warning('仅支持 .jar 格式')
    return false
  }
  if (file.size > 200 * 1024 * 1024) {
    ElMessage.warning('jar 文件不能超过 200MB')
    return false
  }
  return true
}

async function handleBackendJarUpload(options) {
  backendUploading.value = true
  try {
    const formData = new FormData()
    formData.append('gameName', backendForm.value.gameName)
    formData.append('gameNameZhCn', backendForm.value.gameNameZhCn)
    formData.append('version', backendForm.value.version)
    formData.append('jar', options.file)
    const res = await deployGameBackend(formData)
    backendInfo.value = res.data || null
    ElMessage.success('后端 jar 上传成功')
    fetchData()
  } catch {
    // 错误提示由拦截器统一弹出
  } finally {
    backendUploading.value = false
  }
}

async function handleBackendRemove() {
  backendRemoving.value = true
  try {
    await removeGameBackend(backendForm.value.gameName)
    backendInfo.value = null
    ElMessage.success('后端已下架')
    fetchData()
  } catch {
    // 错误提示由拦截器统一弹出
  } finally {
    backendRemoving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除游戏「${row.gameName}」？`, '警告', { type: 'error' })
    await deleteGame(row.gameName)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* 取消 */ }
}

onMounted(async () => {
  fetchData()
  try {
    const res = await getCategoryList()
    categoryOptions.value = res.data || []
  } catch {
    categoryOptions.value = []
  }
  try {
    const res = await getCategoryTree()
    categoryTreeOptions.value = buildCascaderOptions(res.data)
  } catch {
    categoryTreeOptions.value = []
  }
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
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
.category-tag {
  margin-right: 6px;
}
.version-tip {
  width: 100%;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.icon-upload-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}
.icon-preview {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  background: #fafafa;
}
.icon-placeholder {
  font-size: 12px;
  color: #909399;
}
.upload-tip {
  width: 100%;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.pkg-name {
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}
.pkg-name.has-file {
  color: #67c23a;
}
.upload-progress {
  width: 100%;
  margin-top: 4px;
}
.sha256-text {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}
.backend-info {
  margin-bottom: 8px;
}
</style>
