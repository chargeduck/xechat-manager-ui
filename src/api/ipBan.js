import request from '@/utils/request'

/* ==================== IP 限流规则（admin） ==================== */

/** 查询限流规则列表 */
export function listBanRules() {
  return request({ url: '/ipBanRule/list', method: 'get' })
}

/** 新增或修改限流规则（id 为空新增，否则更新，保存后自动热重载） */
export function saveBanRule(data) {
  return request({ url: '/ipBanRule/save', method: 'post', data })
}

/** 删除限流规则 */
export function deleteBanRule(id) {
  return request({ url: `/ipBanRule/${id}`, method: 'delete' })
}

/* ==================== IP 黑名单（admin） ==================== */

/** 查询 IP 黑名单列表 */
export function listBlacklist() {
  return request({ url: '/ipBlacklist/list', method: 'get' })
}

/** 手动拉黑 IP（hours 为空按首次封禁规则，permanently=true 永久封禁） */
export function addBlacklist(data) {
  return request({ url: '/ipBlacklist/add', method: 'post', data })
}

/** 解除封禁 */
export function removeBlacklist(ip) {
  return request({ url: `/ipBlacklist/${encodeURIComponent(ip)}`, method: 'delete' })
}
