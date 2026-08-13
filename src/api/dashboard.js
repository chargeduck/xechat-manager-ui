import request from '@/utils/request'

/**
 * 仪表盘统计指标
 */
export function getDashboardStats() {
  return request({
    url: '/dashboard/stats',
    method: 'post'
  })
}
