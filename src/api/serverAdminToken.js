import request from '@/utils/request'

/* ==================== 服务器管理员令牌（超管 / 鱼塘管理员） ==================== */

/** 分页查询某服务器（或全部）的管理员令牌 */
export function listAdminTokens(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/serverAdminToken/page',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
  })
}

/** 新增令牌 */
export function createAdminToken(data) {
  return request({ url: '/serverAdminToken', method: 'post', data })
}

/** 修改令牌 */
export function updateAdminToken(data) {
  return request({ url: '/serverAdminToken/update', method: 'post', data })
}

/** 删除令牌（逻辑删除） */
export function deleteAdminToken(id) {
  return request({ url: `/serverAdminToken/${id}`, method: 'delete' })
}
