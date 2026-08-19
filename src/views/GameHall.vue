<template>
  <div class="game-hall">
    <div class="hall-header">
      <h2 class="hall-title">游戏大厅</h2>
    </div>

    <!-- 分类筛选导航 -->
    <div class="category-nav">
      <div
        class="category-item"
        :class="{ active: activeCategory === null }"
        @click="switchCategory(null)"
      >全部</div>
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="category-item"
        :class="{ active: activeCategory === cat.id }"
        @click="switchCategory(cat.id)"
      >{{ cat.name }}</div>
    </div>

    <!-- 游戏卡片网格 -->
    <div v-loading="loading" class="game-grid-wrap">
      <div v-if="!loading && games.length === 0" class="empty-wrap">
        <el-empty description="暂无游戏" />
      </div>
      <div v-else class="game-grid">
        <div v-for="(game, index) in games" :key="game.id" class="game-card">
          <div class="game-icon" :style="iconStyle(index, game)">
            <img v-if="game.iconUrl" :src="game.iconUrl" alt="游戏图标" />
            <span v-else class="icon-placeholder">{{ placeholderText(game) }}</span>
          </div>
          <div class="game-name">
            <div class="name-zh">{{ game.gameNameZhCn || game.gameName || '-' }}</div>
            <div class="name-en">{{ game.gameName || '' }}</div>
          </div>
          <div class="game-footer">
            <span class="game-version">v{{ game.version || '-' }}</span>
            <a
              v-if="game.playUrl"
              class="play-btn"
              :href="game.playUrl"
              target="_blank"
            >开始游戏</a>
            <el-button v-else size="small" disabled class="play-btn">无试玩地址</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getGameList } from '@/api/game'
import { getCategoryList } from '@/api/category'

const loading = ref(false)
const categories = ref([])
const activeCategory = ref(null)
const games = ref([])

/** 渐变背景色池：无图标时按卡片序号循环取色 */
const gradientPool = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
]

function iconStyle(index, game) {
  if (game.iconUrl) return {}
  return { background: gradientPool[index % gradientPool.length] }
}

/** 无图标占位文字：中文名，两字名中间加空格更协调 */
function placeholderText(game) {
  const name = game.gameNameZhCn || game.gameName || ''
  if (name.length === 2) return name.split('').join(' ')
  return name
}

async function loadCategories() {
  try {
    const res = await getCategoryList()
    categories.value = res.data || []
  } catch {
    categories.value = []
  }
}

async function loadGames() {
  loading.value = true
  try {
    const params = { pageSize: 500, status: 1 }
    if (activeCategory.value !== null) {
      params.gameType = activeCategory.value
    }
    const res = await getGameList(params)
    games.value = (res.data && res.data.records) || []
  } catch {
    games.value = []
  } finally {
    loading.value = false
  }
}

function switchCategory(id) {
  if (activeCategory.value === id) return
  activeCategory.value = id
  loadGames()
}

onMounted(() => {
  loadCategories()
  loadGames()
})
</script>

<style scoped>
.game-hall {
  padding: 16px 20px;
}

.hall-header {
  margin-bottom: 16px;
}

.hall-title {
  margin: 0;
  font-size: 22px;
  color: var(--el-text-color-primary);
}

/* 分类导航 */
.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.category-item {
  padding: 6px 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.category-item:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.category-item.active {
  color: #fff;
  background: var(--el-color-primary);
  font-weight: 600;
}

/* 卡片网格 */
.game-grid-wrap {
  min-height: 300px;
}

.empty-wrap {
  padding: 40px 0;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

@media (max-width: 1200px) {
  .game-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.game-card {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.25s, transform 0.25s;
}

.game-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

/* 图标区 */
.game-icon {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 16px auto 0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-icon img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  display: block;
}

.icon-placeholder {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 名称区 */
.game-name {
  padding: 10px 12px 6px;
  text-align: center;
}

.name-zh {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-en {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部操作 */
.game-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 12px;
  margin-top: auto;
}

.game-version {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.play-btn {
  font-size: 13px;
}

a.play-btn {
  padding: 6px 14px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 6px;
  text-decoration: none;
  transition: opacity 0.2s;
}

a.play-btn:hover {
  opacity: 0.85;
}
</style>
