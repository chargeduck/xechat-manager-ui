import { defineStore } from 'pinia'
import { login, register, getUserInfo } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null
  }),

  actions: {
    async doLogin(username, password) {
      const res = await login({ username, password })
      this.token = res.data.token
      localStorage.setItem('token', this.token)
      await this.fetchUserInfo()
      ElMessage.success('登录成功')
      return res
    },

    async doRegister(data) {
      const res = await register(data)
      ElMessage.success('注册成功')
      return res
    },

    async fetchUserInfo() {
      const res = await getUserInfo()
      this.userInfo = res.data
    },

    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      ElMessage.success('已退出登录')
    }
  }
})
