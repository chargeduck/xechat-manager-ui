import request from '@/utils/request'

/**
 * 部署历史列表
 */
export function getDeployHistoryList(params) {
  return request({
    url: '/game/deploy/page',
    method: 'get',
    params
  })
}

/**
 * 按游戏查询部署历史
 */
export function getDeployHistoryByGame(gameInfoId, params) {
  return request({
    url: `/game/deploy/game/${gameInfoId}`,
    method: 'get',
    params
  })
}

/**
 * 上传并部署游戏构建包
 */
export function uploadDeploy(gameInfoId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: `/game/deploy/upload/${gameInfoId}`,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 部署详情
 */
export function getDeployDetail(id) {
  return request({
    url: `/game/deploy/${id}`,
    method: 'get'
  })
}

/**
 * 删除部署记录
 */
export function deleteDeploy(id) {
  return request({
    url: `/game/deploy/${id}`,
    method: 'delete'
  })
}
