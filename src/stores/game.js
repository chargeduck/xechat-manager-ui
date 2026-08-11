import { defineStore } from 'pinia'
import { getGameList } from '@/api/modules/game'

export const useGameStore = defineStore('game', {
  state: () => ({
    gameList: [],
    total: 0
  }),

  actions: {
    async fetchGameList(params = {}) {
      const res = await getGameList(params)
      this.gameList = res.data.records || res.data.list || []
      this.total = res.data.total || 0
      return res
    }
  }
})
