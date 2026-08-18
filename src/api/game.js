import request from '@/utils/request'

/**
 * 游戏列表（所有已上线的游戏）
 */
export function getGameList(data) {
  const { page, pageSize, ...rest } = data
  return request({
    url: '/gameInfo/list',
    method: 'post',
    data: { ...rest, page: { current: page, size: pageSize } }
  })
}

/**
 * 游戏详情（按 gameName）
 */
export function getGameDetail(gameName) {
  return request({
    url: `/gameInfo/${gameName}`,
    method: 'get'
  })
}

/**
 * 生成并回显新版本号（level: major=大版本更新 / minor=新增功能 / patch=Bug修复）
 */
export function getNextVersion(gameId, level) {
  return request({
    url: '/gameInfo/version/next',
    method: 'post',
    data: { gameId, level }
  })
}

/**
 * 新增游戏（后端校验 gameName 唯一，重复返回"游戏名重复"）
 */
export function createGame(data) {
  return request({
    url: '/gameInfo/create',
    method: 'post',
    data
  })
}

/**
 * 更新游戏（body 含 gameName，由后端 GameInfoUpdateDTO 接收）
 */
export function updateGame(data) {
  return request({
    url: '/gameInfo/update',
    method: 'put',
    data
  })
}

/**
 * 删除游戏（后端暂无此接口，预留占位）
 */
export function deleteGame(gameName) {
  return request({
    url: `/gameInfo/${gameName}`,
    method: 'delete'
  })
}

/**
 * 修改游戏状态（body 含 gameName/status，由后端 GameStatusDTO 接收）
 */
export function updateGameStatus(gameName, status) {
  return request({
    url: '/gameInfo/status',
    method: 'put',
    data: { gameName, status }
  })
}