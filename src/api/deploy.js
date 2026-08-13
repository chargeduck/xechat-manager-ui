import request from '@/utils/request'

/**
 * 部署历史列表（按游戏名称查询）
 */
export function getDeployHistoryList(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/deployHistory/list',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
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
    url: '/deployHistory/upload',
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
    url: '/deployHistory/download',
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
    url: '/deployHistory/current',
    method: 'post',
    data
  })
}