<script setup>
import { onMounted, computed } from 'vue'
import { useLocationsStore } from '@/stores/locations'
import { useNavigationStore } from '@/stores/navigation'

const locationsStore = useLocationsStore()
const navigationStore = useNavigationStore()

const hasCurrentPosition = computed(() => navigationStore.hasCurrentPosition)
const currentPosition = computed(() => navigationStore.currentPosition)

const formatCoordinates = computed(() => {
  if (!currentPosition.value) return ''
  return `${currentPosition.value.latitude.toFixed(6)}, ${currentPosition.value.longitude.toFixed(6)}`
})

onMounted(async () => {
  await locationsStore.loadLocations()

  try {
    await navigationStore.startPositionTracking()
  } catch (error) {
    console.error('Failed to start navigation:', error)
  }
})
</script>

<template>
  <h1>You did it!</h1>
  <p>user</p>
  <p>your current position:</p>
  <h2>Locations</h2>

  <main class="user-content">
    <div class="position-card">
      <h3>Aktuelle Position</h3>
      <div v-if="hasCurrentPosition" class="position-info">
        <p>Koordinaten: {{ formatCoordinates }}</p>
        <p>Genauigkeiten: {{ currentPosition.accuracy }}m</p>
      </div>
      <div v-else class="position-loading">
        <div class="spinner"></div>
        <p>Position wird ermittelt...</p>
      </div>
      <div class="quick-actions">
        <button
          @click="refreshPosition"
          :disabled="refreshing"
          class="action-button refresh-button"
        >
          <span class="refresh-icon" :class="{ spinning: refreshing }">↻</span>
          Position aktualisieren
        </button>
      </div>
    </div>
    <li v-for="location in locationsStore.locations" :key="location.id">
      📍 <strong>{{ location.name }}</strong
      ><br />
      Typ: {{ location.type }}<br />
      Etage: {{ location.floor }}<br />
      Koordinaten: {{ location.coordinates.latitude }}, {{ location.coordinates.longitude }}
      <hr />
    </li>
  </main>
</template>

<style scoped>
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
