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

// 以下为前端管理界面预留函数，后端暂无对应 CRUD 接口

/**
 * 新增游戏（后端暂无此接口，预留占位）
 */
export function createGame(data) {
  return request({
    url: '/gameInfo/create',
    method: 'post',
    data
  })
}

/**
 * 更新游戏（后端暂无此接口，预留占位）
 */
export function updateGame(gameName, data) {
  return request({
    url: `/gameInfo/${gameName}`,
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
 * 修改游戏状态（后端暂无此接口，预留占位）
 */
export function updateGameStatus(gameName, status) {
  return request({
    url: `/gameInfo/${gameName}/status`,
    method: 'put',
    params: { status }
  })
}