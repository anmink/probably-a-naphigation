// src/stores/locations.js
import { defineStore } from 'pinia'
import localforage from 'localforage'

export const useLocationsStore = defineStore('locations', {
  state: () => ({
    locations: [],
    loading: false,
    error: null,
  }),

  getters: {
    getLocationsByFloor: (state) => (floor) => {
      return state.locations.filter((location) => location.floor === floor)
    },

    getLocationById: (state) => (id) => {
      return state.locations.find((location) => location.id === id)
    },
  },

  actions: {
    async loadLocations() {
      this.loading = true
      try {
        const storedLocations = await localforage.getItem('locations')
        this.locations = storedLocations || []
      } catch (error) {
        this.error = 'Fehler beim Laden der Standorte'
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    async saveLocation(locationData) {
      console.log(locationData)
      try {
        const newLocation = {
          id: Date.now().toString(),
          ...locationData,
          createdAt: new Date().toISOString(),
        }

        this.locations.push(newLocation)
        await localforage.setItem('locations', JSON.parse(JSON.stringify(this.locations)))

        return newLocation
      } catch (error) {
        this.error = 'Fehler beim Speichern des Standorts'
        throw error
      }
    },

    async deleteLocation(id) {
      try {
        this.locations = this.locations.filter((location) => location.id !== id)
        await localforage.setItem('locations', this.locations)
      } catch (error) {
        this.error = 'Fehler beim Löschen des Standorts'
        throw error
      }
    },
  },
})
