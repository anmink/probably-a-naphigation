import { defineStore } from 'pinia'
import { geolocationService } from '@/utils/geolocation'

export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    currentPosition: null,
    watchId: null,
  }),

  getters: {
    hasCurrentPosition: (state) => state.currentPosition !== null,
  },

  actions: {
    async startPositionTracking() {
      try {
        this.currentPosition = await geolocationService.getCurrentPosition()
        this.watchId = geolocationService.watchPosition(
          (position) => {
            this.currentPosition = position
          },
          (error) => {
            console.error('Position tracking error:', error)
          },
        )
        console.log(this.currentPosition)
      } catch (error) {
        console.error('Failed to start position tracking:', error)
        throw error
      }
    },
  },
})
