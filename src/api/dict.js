import request from '@/utils/request'

/* ==================== 对外查询（POST） ==================== */

/** 获取已启用的字典类型列表 */
export function getDictTypes() {
  return request({ url: '/dict/types', method: 'post' })
}

/* ==================== 字典类型管理（admin） ==================== */

/** 分页查询字典类型 */
export function listDictTypes(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/dict/types/list',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
  })
}

/** 新增字典类型 */
export function createDictType(data) {
  return request({ url: '/dict/type', method: 'post', data })
}

/** 修改字典类型 */
export function updateDictType(data) {
  return request({ url: '/dict/type/update', method: 'post', data })
}

/** 删除字典类型 */
export function deleteDictType(id) {
  return request({ url: `/dict/type/${id}`, method: 'delete' })
}

/* ==================== 字典项管理（admin） ==================== */

/** 分页获取某类型下的字典项（含禁用），可按条目值（dictValue）过滤 */
export function getDictItemsByTypeId(dictType, dictName, page, pageSize) {
  return request({
    url: '/dict/items/type',
    method: 'post',
    data: { dictType, dictName, page: { current: page, size: pageSize } }
  })
}

/** 新增字典项 */
export function createDictItem(data) {
  return request({ url: '/dict/item', method: 'post', data })
}

/** 修改字典项 */
export function updateDictItem(data) {
  return request({ url: '/dict/item/update', method: 'post', data })
}

/** 删除字典项 */
export function deleteDictItem(id) {
  return request({ url: `/dict/item/${id}`, method: 'delete' })
}
