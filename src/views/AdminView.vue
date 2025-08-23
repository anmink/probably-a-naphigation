<script setup>
import { ref, onMounted } from 'vue'
import { useGeolocation } from '@vueuse/core'
import { useLocationsStore } from '@/stores/locations'

const locationsStore = useLocationsStore()

const { coords, locatedAt, error } = useGeolocation()
const scanning = ref(false)
const locationName = ref('')
const locationType = ref('meeting_room')
const floor = ref(1)

const scanLocation = async () => {
  scanning.value = true

  try {
    if (!coords.value.latitude) {
      throw new Error('GPS-Position nicht verfügbar')
    }

    const locationData = {
      name: locationName.value,
      type: locationType.value,
      floor: floor.value,
      coordinates: {
        latitude: coords.value.latitude,
        longitude: coords.value.longitude,
        accuracy: coords.value.accuracy,
      },
    }
    await locationsStore.saveLocation(locationData)
    console.log(JSON.stringify(locationsStore.locations))
    console.log(locationData)
    locationName.value = ''
  } catch (err) {
    console.error('Fehler beim Scannen:', err)
  } finally {
    scanning.value = false
  }
}

onMounted(() => {
  locationsStore.loadLocations()
})
</script>

<template>
  <div class="admin-scanner">
    <h2>Standort scannen</h2>
    <form @submit.prevent="scanLocation">
      <input v-model="locationName" placeholder="Standort-Name" required />
      <select v-model="locationType">
        <option value="meeting_room">Konferenzraum</option>
        <option value="office">Büro</option>
        <option value="kitchen">Küche</option>
      </select>
      <input v-model="floor" type="number" placeholder="Stockwerk" required />
      <button type="submit" :disabled="scanning">
        {{ scanning ? 'Scanne...' : 'Standort erfassen' }}
      </button>
    </form>
    <div>
      <li v-for="location in locationsStore.locations" :key="location.id">
        📍 <strong>{{ location.name }}</strong
        ><br />
        Typ: {{ location.type }}<br />
        Etage: {{ location.floor }}<br />
        Koordinaten: {{ location.coordinates.latitude }}, {{ location.coordinates.longitude }}
        <hr />
      </li>
    </div>
  </div>
</template>

<style scoped></style>
