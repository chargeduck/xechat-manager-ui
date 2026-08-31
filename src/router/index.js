import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '首页仪表盘', requiresAuth: true }
      },
      {
        path: 'game',
        name: 'Game',
        component: () => import('@/views/gameManage/Game.vue'),
        meta: { title: '游戏管理', requiresAuth: true }
      },
      {
        path: 'gameHall',
        name: 'GameHall',
        component: () => import('@/views/gameManage/GameHall.vue'),
        meta: { title: '游戏大厅', requiresAuth: true }
      },
      {
        path: 'server',
        name: 'Server',
        component: () => import('@/views/system/Server.vue'),
        meta: { title: '服务器管理', requiresAuth: true }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/system/User.vue'),
        meta: { title: '用户管理', requiresAuth: true }
      },
      {
        path: 'dict',
        name: 'Dict',
        component: () => import('@/views/system/Dict.vue'),
        meta: { title: '字典管理', requiresAuth: true }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/gameManage/Category.vue'),
        meta: { title: '游戏分类管理', requiresAuth: true }
      },
      {
        path: 'file',
        name: 'File',
        component: () => import('@/views/system/File.vue'),
        meta: { title: '文件管理', requiresAuth: true }
      },
      {
        path: 'operLog',
        name: 'OperLog',
        component: () => import('@/views/system/OperLog.vue'),
        meta: { title: '操作日志', requiresAuth: true }
      },
      {
        path: 'ipBanRule',
        name: 'IpBanRule',
        component: () => import('@/views/system/IpBanRule.vue'),
        meta: { title: 'IP限流规则', requiresAuth: true }
      },
      {
        path: 'ipBlacklist',
        name: 'IpBlacklist',
        component: () => import('@/views/system/IpBlacklist.vue'),
        meta: { title: 'IP黑名单', requiresAuth: true }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/Role.vue'),
        meta: { title: '角色管理', requiresAuth: true }
      },
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('@/views/system/Menu.vue'),
        meta: { title: '菜单管理', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/manager/'),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth !== false && !token) {
    ElMessage.warning('请先登录')
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register' || to.path === '/forgot-password') && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
