import request from '@/utils/request'

/**
 * 部署历史列表（按游戏名称查询）
 */
export function getDeployHistoryList(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/gameInfo/history',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
  })
}

/**
 * 上传并部署游戏构建包（仅 .tar.gz）
 * @param {Object} data - 上传表单数据
 * @param {string} data.gameName - 游戏名称（唯一目录名）
 * @param {string} data.gameNameZhCn - 游戏中文名（新游戏部署时用于自动创建）
 * @param {string} data.icon - 游戏图标地址
 * @param {string} data.description - 游戏描述
 * @param {string} data.version - 版本号（后端生成并回显的 x.y.z）
 * @param {Array<number>} data.categoryIds - 游戏分类ID列表
 * @param {File} data.file - dist.tar.gz 文件
 */
export function uploadDeploy({ gameName, gameNameZhCn, icon, description, version, categoryIds = [], file }) {
  const formData = new FormData()
  formData.append('gameName', gameName)
  formData.append('gameNameZhCn', gameNameZhCn || '')
  formData.append('icon', icon || '')
  formData.append('description', description || '')
  formData.append('version', version)
  categoryIds.forEach(id => formData.append('categoryIds', id))
  formData.append('file', file)
  return request({
    url: '/gameInfo/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 下载指定版本的构建包
 */
export function downloadDeploy(data) {
  return request({
    url: '/gameInfo/download',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

/**
 * 获取当前部署版本信息
 */
export function getCurrentDeploy(data) {
  return request({
    url: '/gameInfo/current',
    method: 'post',
    data
  })
}

/**
 * 获取部署历史详情
 */
export function getDeployDetail(id) {
  return request({
    url: `/gameInfo/history/${id}`,
    method: 'get'
  })
}

/**
 * 删除部署历史记录
 */
export function deleteDeploy(id) {
  return request({
    url: `/gameInfo/history/${id}`,
    method: 'delete'
  })
}