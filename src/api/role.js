import request from '@/utils/request'

/* ==================== 角色管理（admin） ==================== */

/** 分页查询角色 */
export function listRolePage(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/role/page',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
  })
}

/** 全部角色列表（供下拉/分配角色使用） */
export function listAllRoles() {
  return request({ url: '/role/list', method: 'get' })
}

/** 新增角色 */
export function createRole(data) {
  return request({ url: '/role', method: 'post', data })
}

/** 修改角色 */
export function updateRole(data) {
  return request({ url: '/role/update', method: 'post', data })
}

/** 删除角色（逻辑删除，同时清空关联） */
export function deleteRole(id) {
  return request({ url: `/role/${id}`, method: 'delete' })
}
