import request from '@/utils/request'

/**
 * 上传文件（后端 /file/upload，需登录）。
 * FormData 平铺字段（file/bizType/subDir/gameName/version），后端以 @ModelAttribute 绑定 FileUploadDTO。
 * @param {File} file 文件对象
 * @param {string} bizType 业务类型：game_pkg=游戏包 / game_icon=游戏图标 / user_avatar=用户头像
 * @param {string} [subDir] 可选子目录（如游戏名，按目录归类）
 * @param {string} [gameName] 可选游戏名：bizType=game_pkg 时用于规范化文件名 {gameName}_{version}.tar.gz
 * @param {string} [version] 可选版本号：bizType=game_pkg 时用于规范化文件名 {gameName}_{version}.tar.gz
 * @param {(percent: number) => void} [onUploadProgress] 可选上传进度回调（0-100）
 * @returns {Promise<{code:number,data:object}>} data 为 SysFile 对象（含 id）
 */
export function uploadFile(file, bizType, subDir, gameName, version, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bizType', bizType)
  if (subDir) {
    formData.append('subDir', subDir)
  }
  if (gameName) {
    formData.append('gameName', gameName)
  }
  if (version) {
    formData.append('version', version)
  }
  const config = {}
  if (typeof onUploadProgress === 'function') {
    config.onUploadProgress = (e) => {
      if (e.total > 0) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
  }
  return request({
    url: '/file/upload',
    method: 'post',
    data: formData,
    ...config
  })
}

/**
 * 拼接文件访问地址（免登录 /file/view/{fileId}）。
 * @param {string|number} fileId
 * @returns {string}
 */
export function fileViewUrl(fileId) {
  return `/api/file/view/${fileId}`
}

/**
 * 拼接文件下载地址（免登录 /file/download/{fileId}）。
 * @param {string|number} fileId
 * @returns {string}
 */
export function fileDownloadUrl(fileId) {
  return `/api/file/download/${fileId}`
}

/**
 * 分页查询文件列表（后端 /file/page，需登录；POST body 为 FilePageQuery record）。
 * @param {object} data { page, pageSize, fileName?, bizType? }
 * @returns {Promise<object>} IPage<SysFile>
 */
export function getFilePage(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/file/page',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
  })
}

/**
 * 删除文件（后端 DELETE /file/{fileId}，需登录）。
 * 物理删除：同时删除数据库记录与磁盘落盘文件；被游戏/后端/部署历史引用的文件会返回失败。
 * @param {string|number} fileId
 * @returns {Promise<object>}
 */
export function deleteFile(fileId) {
  return request({
    url: `/file/${fileId}`,
    method: 'delete'
  })
}
