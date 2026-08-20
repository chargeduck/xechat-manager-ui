import request from '@/utils/request'

// 操作日志分页查询
export function listOperLogs(data) {
  return request({
    url: '/operLog/list',
    method: 'post',
    data
  })
}

// 清空操作日志（物理删除）
export function clearOperLogs() {
  return request({
    url: '/operLog/clear',
    method: 'delete'
  })
}
