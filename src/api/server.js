import request from '@/utils/request'

/* ==================== 对外查询（公开） ==================== */

/** 获取启用中的服务器列表（供插件拉取） */
export function listEnabledServers() {
  return request({ url: '/server/list', method: 'get' })
}

/* ==================== 服务器管理（admin） ==================== */

/** 分页查询服务器 */
export function listServerPage(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/server/page',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
  })
}

/** 新增服务器 */
export function createServer(data) {
  return request({ url: '/server', method: 'post', data })
}

/** 修改服务器 */
export function updateServer(data) {
  return request({ url: '/server/update', method: 'post', data })
}

/** 删除服务器（逻辑删除） */
export function deleteServer(id) {
  return request({ url: `/server/${id}`, method: 'delete' })
}
