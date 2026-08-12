import request from '@/utils/request'

/**
 * 部署历史列表（按 gameName 查询）
 */
export function getDeployHistoryList(params) {
  return request({
    url: '/game-info/history',
    method: 'get',
    params
  })
}

/**
 * 按游戏查询部署历史
 */
export function getDeployHistoryByGame(gameName, params) {
  return request({
    url: '/game-info/history',
    method: 'get',
    params: { gameName, ...params }
  })
}

/**
 * 上传并部署游戏构建包
 * @param {string} gameName - 游戏名称
 * @param {File} file - build.tar.gz 文件
 */
export function uploadDeploy(gameName, file) {
  const formData = new FormData()
  formData.append('gameName', gameName)
  formData.append('file', file)
  return request({
    url: '/game-info/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 下载指定版本的构建包
 */
export function downloadDeploy(params) {
  return request({
    url: '/game-info/download',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 获取当前部署版本信息
 */
export function getCurrentDeploy(gameName) {
  return request({
    url: '/game-info/current',
    method: 'get',
    params: { gameName }
  })
}
