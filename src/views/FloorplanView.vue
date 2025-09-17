<template>
  <div class="app">
    <div class="controls">
      <label>Start:</label>
      <select v-model="startId">
        <option disabled value="">-- wählen --</option>
        <option v-for="f in polygonFeatures" :key="f.properties.id" :value="f.properties.id">
          {{ f.properties.name || f.properties.id }} ({{ f.properties.floor }})
        </option>
      </select>
      <label>Ziel:</label>
      <select v-model="endId">
        <option disabled value="">-- wählen --</option>
        <option v-for="f in polygonFeatures" :key="f.properties.id" :value="f.properties.id">
          {{ f.properties.name || f.properties.id }} ({{ f.properties.floor }})
        </option>
      </select>

      <button @click="calculateRoute">Route berechnen</button>

      <label>Etage:</label>
      <select v-model="selectedFloor">
        <option v-for="f in availableFloors" :key="f" :value="f">
          {{ f }}
        </option>
      </select>
    </div>
    <LMap style="height: 560px; width: 100%" :zoom="18" :center="mapCenter" :crs="CRS">
      <LGeoJson v-if="floorPlanData" :geojson="filteredFeatures" :options-style="styleFeatures" />
      <LMaker v-for="room in roomLabels" :key="room.id" :lat-lng="room.latlng" :interactive="false">
        <!--  <LTooltip :permanent="true" direction="center" class="room-label">{{ room.name }}</LTooltip> -->
      </LMaker>
      <LPolyline
        v-for="(seg, idx) in pathSegmentsForSelectedFloor"
        :key="idx"
        :lat-lng="seg"
        :color="red"
        :weight="4"
      />
    </LMap>

    <!-- <div class="instructions" v-if="stepInstructions.length">
      <h3>Wegbeschreibung (ca. {{ totalDistance }} m)</h3>
      <ol>
        <li v-for="(s, i) in stepInstructions" :key="i" class="step-row">
          <span class="icon">{{ s.icon }}</span>
          <div class="step-text">
            <div class="primary">{{ s.text }}</div>
            <div v-if="s.distance !== undefinded" class="muted">{{ s.distance.toFixed(1) }} m</div>
          </div>
        </li>
      </ol>
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { LMap, LGeoJson, LTooltip, LPolyline } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const CRS = L.CRS.Simple

const floorPlanData = ref(null)
const availableFloors = ref([])
const selectedFloor = ref('EG')
const currentPathCoords = ref([])

const startId = ref('')
const endId = ref('')

const totalDistance = ref(0)
const stepInstructions = ref([])

const mapCenter = [8, 8]

// --- Load GeoJSON ---
onMounted(async () => {
  const res = await fetch('floor.json')
  floorPlanData.value = await res.json()

  // Floors without LINK
  availableFloors.value = [
    ...new Set(floorPlanData.value.features.map((f) => f.properties.floor)),
  ].filter((f) => f && f !== 'LINK')

  const entrance = floorPlanData.value.features.find((f) => f.properties.type === 'entrance')
  const anyOffice = floorPlanData.value.features.find(
    (f) => f.properties.type && f.properties.type.includes('office'),
  )
  const firstPolygon = floorPlanData.value.features.find((f) => f.geometry.type === 'Polygon')

  startId.value = entrance?.properties?.id || firstPolygon?.properties?.id || ''
  endId.value = anyOffice?.properties?.id || (firstPolygon && firstPolygon.properties.id) || ''

  selectedFloor.value =
    floorPlanData.value.features.find((f) => f.properties.floor && f.properties.floor !== 'LINK')
      ?.properties?.floor || selectedFloor.value
})

// --- Helper functions ---
const polygonFeatures = computed(
  () => floorPlanData.value?.features.filter((f) => f.geometry.type === 'Polygon') || [],
)

const roomLabels = computed(() => {
  if (!floorPlanData.value) return []
  return floorPlanData.value.features
    .filter((f) => f.geometry.type === 'Polygon' && f.properties.floor === selectedFloor.value)
    .map((f) => {
      const centerXY = polygonCenterXY(f.geometry.coordinates[0])
      return {
        id: f.properties.id,
        name: f.properties.name || f.properties.id,
        latlng: xyToLatLng(centerXY),
      }
    })
})

const filteredFeatures = computed(() => {
  if (!floorPlanData.value) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: floorPlanData.value.features.filter(
      (f) => f.properties.floor === selectedFloor.value,
    ),
  }
})

function polygonCenterXY(coordArray) {
  let sx = 0,
    sy = 0,
    n = 0
  coordArray.forEach((c) => {
    sx += c[0]
    sy += c[1]
    n++
  })
  return [sx / n, sy / n]
}

function xyToLatLng([x, y]) {
  return [y, x]
}
</script>

<style>
.app {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.room-label {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
}
.instructions ol {
  list-style: none;
  padding: 0;
}
.step-row {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  align-items: center;
}
.step-row .icon {
  width: 28px;
  font-size: 18px;
  text-align: center;
}
.step-row .muted {
  color: #666;
  font-size: 12px;
}
</style>
