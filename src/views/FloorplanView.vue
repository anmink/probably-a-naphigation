<template>
  <l-map style="height: 500px; width: 100%" :zoom="2" :center="[0, 0]">
    <l-geo-json
      v-if="floorPlanData"
      :geojson="floorPlanData"
      :options-style="styleFeature"
      :options-on-each-feature="onEachFeature"
    />
  </l-map>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { LMap, LGeoJson } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const floorPlanData = ref(null)

onMounted(async () => {
  const response = await fetch('/floor1.json')
  floorPlanData.value = await response.json()
  console.log(floorPlanData.value)
})

function styleFeature(feature) {
  switch (feature.properties.type) {
    case 'room':
      return { color: 'blue', weight: 1, fillColor: '#cce5ff', fillOpacity: 0.6 }
    case 'corridor':
      return { color: 'gray', weight: 1, fillColor: '#e6e6e6', fillOpacity: 0.5 }
    case 'door':
      return { color: 'red', radius: 6 }
    default:
      return { color: 'black' }
  }
}

function onEachFeature(feature, layer) {
  if (feature.properties.name) {
    layer.bindPopup(feature.properties.name)
  }
}
</script>
