<template>
  <div class="dashboard">
    <h2 class="page-title">首页仪表盘</h2>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <el-icon :size="36" color="#409eff"><VideoGame /></el-icon>
            <div class="stat-info">
              <p class="stat-value">{{ stats.gameCount }}</p>
              <p class="stat-label">游戏总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <el-icon :size="36" color="#67c23a"><User /></el-icon>
            <div class="stat-info">
              <p class="stat-value">{{ stats.userCount }}</p>
              <p class="stat-label">用户总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <el-icon :size="36" color="#e6a23c"><Upload /></el-icon>
            <div class="stat-info">
              <p class="stat-value">{{ stats.deployCount }}</p>
              <p class="stat-label">部署次数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <el-icon :size="36" color="#f56c6c"><TrophyBase /></el-icon>
            <div class="stat-info">
              <p class="stat-value">{{ stats.onlineGameCount }}</p>
              <p class="stat-label">上架游戏</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card" style="margin-top:20px">
      <template #header>
        <span>欢迎使用 Xechat 管理后台</span>
      </template>
      <p>此管理后台用于管理 xechat 游戏平台的核心业务，包括游戏信息管理、用户管理、游戏部署与版本管理等。</p>
      <p style="margin-top:8px">请通过左侧菜单进入对应功能模块进行操作。</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {getDashboardStats} from '@/api/dashboard.js'
const stats = ref({
  gameCount: 0,
  userCount: 0,
  deployCount: 0,
  onlineGameCount: 0
})

async function loadStats() {
  getDashboardStats().then(resp => {
    stats.value = resp.data
  })
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}
.page-title {
  margin-bottom: 20px;
  font-size: 20px;
}
.stat-card {
  cursor: pointer;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #303133;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 4px 0 0;
}
</style>
