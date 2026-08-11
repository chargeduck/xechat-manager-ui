import request from '@/utils/request'

/**
 * 游戏列表（分页）
 */
export function getGameList(params) {
  return request({
    url: '/game/page',
    method: 'get',
    params
  })
}

/**
 * 游戏详情
 */
export function getGameDetail(id) {
  return request({
    url: `/game/${id}`,
    method: 'get'
  })
}

/**
 * 新增游戏
 */
export function createGame(data) {
  return request({
    url: '/game',
    method: 'post',
    data
  })
}

/**
 * 更新游戏
 */
export function updateGame(id, data) {
  return request({
    url: `/game/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除游戏
 */
export function deleteGame(id) {
  return request({
    url: `/game/${id}`,
    method: 'delete'
  })
}

/**
 * 修改游戏状态（上架/下架/维护）
 */
export function updateGameStatus(id, status) {
  return request({
    url: `/game/${id}/status`,
    method: 'put',
    params: { status }
  })
}
