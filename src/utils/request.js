import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.satoken = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 跳转登录页（避免已在登录页时重复跳转）
function redirectToLogin(msg) {
  localStorage.removeItem('token')
  ElMessage.error(msg)
  if (!window.location.pathname.endsWith('/login')) {
    window.location.href = '/login'
  }
}

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 根据后端统一响应格式判断
    // code 为 200 表示成功
    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  error => {
    // userinfo 请求失败（401/5xx/网络错误/超时）一律视为登录态失效，跳登录页
    const isUserInfoRequest = error.config?.url?.includes('/user/userInfo')
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        redirectToLogin('登录已过期，请重新登录')
      } else if (isUserInfoRequest) {
        redirectToLogin('获取用户信息失败，请重新登录')
      } else {
        ElMessage.error(error.response.data?.message || error.response.data?.msg || '网络错误')
      }
    } else {
      if (isUserInfoRequest) {
        redirectToLogin('获取用户信息失败，请重新登录')
      } else {
        ElMessage.error('网络连接异常')
      }
    }
    return Promise.reject(error)
  }
)

export default service
