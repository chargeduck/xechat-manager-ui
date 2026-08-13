import request from '@/utils/request'

/* ==================== 对外查询（POST） ==================== */

/** 获取游戏分类树（仅启用） */
export function getCategoryTree() {
  return request({ url: '/category/tree', method: 'post' })
}

/** 获取游戏分类列表（仅启用，扁平） */
export function getCategoryList() {
  return request({ url: '/category/list', method: 'post' })
}

/* ==================== 分类管理（admin） ==================== */

/** 分页查询游戏分类 */
export function pageCategory(data) {
  return request({ url: '/category/page', method: 'post', data })
}

/** 获取分类详情 */
export function getCategory(id) {
  return request({ url: `/category/${id}`, method: 'get' })
}

/** 新增分类 */
export function createCategory(data) {
  return request({ url: '/category', method: 'post', data })
}

/** 修改分类 */
export function updateCategory(data) {
  return request({ url: '/category/update', method: 'post', data })
}

/** 删除分类 */
export function deleteCategory(id) {
  return request({ url: `/category/${id}`, method: 'delete' })
}
