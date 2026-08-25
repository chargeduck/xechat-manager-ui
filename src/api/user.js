import request from '@/utils/request'

// 后端暂无用户管理 CRUD 接口，以下均为预留占位函数

/**
 * 用户分页列表 (POST /user/list)
 */
export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'post',
    data: { page: { current: params.page, size: params.pageSize } }
  })
}

/**
 * 用户详情（后端暂无此接口，预留占位）
 */
export function getUserDetail(id) {
  return request({
    url: `/sys/user/${id}`,
    method: 'get'
  })
}

/**
 * 新增用户（后端暂无此接口，预留占位）
 */
export function createUser(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

/**
 * 更新用户（后端暂无此接口，预留占位）
 */
export function updateUser(id, data) {
  return request({
    url: `/user/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除用户（后端暂无此接口，预留占位）
 */
export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}

/**
 * 修改用户状态（后端暂无此接口，预留占位）
 */
export function updateUserStatus(id, status) {
  return request({
    url: `/user/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 修改密码（当前登录用户） (POST /user/changePassword)
 */
export function changePassword(data) {
  return request({
    url: '/user/changePassword',
    method: 'post',
    data
  })
}

/**
 * 忘记密码（校验用户名+邮箱） (POST /user/forgotPassword)
 */
export function forgotPassword(data) {
  return request({
    url: '/user/forgotPassword',
    method: 'post',
    data
  })
}

/**
 * 管理员强制重置密码（newPassword 为空自动生成） (POST /user/resetPassword/{userId})
 */
export function resetUserPassword(userId, data) {
  return request({
    url: `/user/resetPassword/${userId}`,
    method: 'post',
    data
  })
}

/**
 * 按用户查询角色列表 (GET /user/roles/{userId})
 */
export function getUserRoles(userId) {
  return request({
    url: `/user/roles/${userId}`,
    method: 'get'
  })
}

/**
 * 给用户分配角色（全量覆盖） (POST /user/roles)
 */
export function assignUserRoles(data) {
  return request({
    url: '/user/roles',
    method: 'post',
    data
  })
}
