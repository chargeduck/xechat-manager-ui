import request from '@/utils/request'

/**
 * 用户列表（分页）
 */
export function getUserList(params) {
  return request({
    url: '/sys/user/page',
    method: 'get',
    params
  })
}

/**
 * 用户详情
 */
export function getUserDetail(id) {
  return request({
    url: `/sys/user/${id}`,
    method: 'get'
  })
}

/**
 * 新增用户
 */
export function createUser(data) {
  return request({
    url: '/sys/user',
    method: 'post',
    data
  })
}

/**
 * 更新用户
 */
export function updateUser(id, data) {
  return request({
    url: `/sys/user/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除用户
 */
export function deleteUser(id) {
  return request({
    url: `/sys/user/${id}`,
    method: 'delete'
  })
}

/**
 * 修改用户状态
 */
export function updateUserStatus(id, status) {
  return request({
    url: `/sys/user/${id}/status`,
    method: 'put',
    data: { status }
  })
}
