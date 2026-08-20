<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <h2>Xechat 管理后台</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        :default-openeds="openedMenus"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <template v-if="menus.length">
          <MenuTree :menus="menus" />
        </template>
        <div v-else class="no-permission">无权限</div>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-right">
          <el-tooltip :content="isDark ? '切换为亮色模式' : '切换为暗色模式'" placement="bottom">
            <el-icon class="theme-toggle" @click="toggleDark">
              <Moon v-if="isDark" />
              <Sunny v-else />
            </el-icon>
          </el-tooltip>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, h, defineComponent, resolveComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark } from '@vueuse/core'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const isDark = useDark()
const toggleDark = () => {
  isDark.value = !isDark.value
}
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

/** 当前用户可见菜单树（来自 userInfo.menus） */
const menus = computed(() => userStore.userInfo?.menus || [])

/** 默认展开顶级目录 */
const openedMenus = computed(() =>
  menus.value.filter(m => m.children && m.children.length).map(m => String(m.id))
)

/** 递归渲染菜单树：目录(el-sub-menu) / 菜单(el-menu-item)，图标按 icon 名动态解析（main.js 已全局注册 ElementPlusIconsVue） */
const MenuTree = defineComponent({
  name: 'MenuTree',
  props: {
    menus: { type: Array, default: () => [] }
  },
  setup(props) {
    const ElSubMenu = resolveComponent('el-sub-menu')
    const ElMenuItem = resolveComponent('el-menu-item')
    const ElIcon = resolveComponent('el-icon')

    const renderMenu = (items) => items.map((menu) => {
      const children = (menu.children || []).filter(c => c && c.path)
      const icon = menu.icon ? h(resolveComponent(menu.icon)) : null
      if (children.length) {
        return h(
          ElSubMenu,
          { index: String(menu.id) },
          {
            title: () => [icon ? h(ElIcon, [icon]) : null, h('span', menu.menuName)],
            default: () => renderMenu(children)
          }
        )
      }
      return h(
        ElMenuItem,
        { index: menu.path },
        { default: () => [icon ? h(ElIcon, [icon]) : null, h('span', menu.menuName)] }
      )
    })

    return () => renderMenu(props.menus)
  }
})

function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  if (!userStore.userInfo) {
    userStore.fetchUserInfo().catch(() => {})
  }
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}
.sidebar {
  background-color: #304156;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}
.logo h2 {
  color: #fff;
  font-size: 16px;
  white-space: nowrap;
}
.header {
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
}
.header-right {
  display: flex;
  align-items: center;
}
.theme-toggle {
  font-size: 18px;
  cursor: pointer;
  color: var(--el-text-color-primary);
  margin-right: 16px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.main-content {
  background: var(--el-bg-color-page);
  padding: 20px;
  overflow-y: auto;
}
.no-permission {
  color: #bfcbd9;
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
}
</style>
