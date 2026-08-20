import request from '@/utils/request'

/* ==================== 菜单管理（admin） ==================== */

/** 获取菜单树 */
export function getMenuTree() {
  return request({ url: '/menu/tree', method: 'get' })
}

/** 新增菜单 */
export function createMenu(data) {
  return request({ url: '/menu', method: 'post', data })
}

/** 修改菜单 */
export function updateMenu(data) {
  return request({ url: '/menu/update', method: 'post', data })
}

/** 删除菜单（递归逻辑删除子孙菜单并清关联） */
export function deleteMenu(id) {
  return request({ url: `/menu/${id}`, method: 'delete' })
}

/** 按角色查询已关联菜单 id 列表 */
export function getRoleMenus(roleId) {
  return request({ url: '/menu/roleMenus', method: 'get', params: { roleId } })
}

/** 保存角色菜单关联（全量覆盖） */
export function assignMenus(data) {
  return request({ url: '/menu/assignMenus', method: 'post', data })
}
