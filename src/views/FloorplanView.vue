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
      <!-- Nur GeoJSON der aktuellen Etage -->
      <LGeoJson v-if="floorPlanData" :geojson="filteredFeatures" :options-style="styleFeature" />

      <!-- Labels: permanente Tooltips in Raummitte -->
      <LMarker
        v-for="room in roomLabels"
        :key="room.id"
        :lat-lng="room.latlng"
        :interactive="false"
      >
        <LTooltip :permanent="true" direction="center" class="room-label">
          {{ room.name }}
        </LTooltip>
      </LMarker>

      <!-- Pfad (gesamter Pfad über Etagen) gerendert für aktuell sichtbare Etage -->
      <LPolyline
        v-for="(seg, idx) in pathSegmentsForSelectedFloor"
        :key="idx"
        :lat-lngs="seg"
        :color="'red'"
        :weight="4"
      />
    </LMap>

    <!-- Wegbeschreibung -->
    <div class="instructions" v-if="stepInstructions.length">
      <h3>Wegbeschreibung (ca. {{ totalDistance }} m)</h3>
      <ol>
        <li v-for="(s, i) in stepInstructions" :key="i" class="step-row">
          <span class="icon">{{ s.icon }}</span>
          <div class="step-text">
            <div class="primary">{{ s.text }}</div>
            <div v-if="s.distance !== undefined" class="muted">{{ s.distance.toFixed(1) }} m</div>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { LMap, LGeoJson, LMarker, LTooltip, LPolyline } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Make Leaflet CRS available to template
const CRS = L.CRS.Simple

// ----------------- State -----------------
const floorPlanData = ref(null)
const availableFloors = ref([])
const selectedFloor = ref('EG')
const currentPathCoords = ref([])

const startId = ref('')
const endId = ref('')

const totalDistance = ref(0)
const stepInstructions = ref([])

// map center (leaflet expects [lat,lng] but we use CRS.Simple; default center)
const mapCenter = [8, 8]

// ----------------- Load GeoJSON -----------------
onMounted(async () => {
  const res = await fetch('/floor.json') // deine GeoJSON-Datei
  floorPlanData.value = await res.json()

  // Floors (exclude LINK)
  availableFloors.value = [
    ...new Set(floorPlanData.value.features.map((f) => f.properties.floor)),
  ].filter((f) => f && f !== 'LINK')

  // Default selection: entrance as start, first office as end (fall back to first polygon)
  const entrance = floorPlanData.value.features.find((f) => f.properties.type === 'entrance')
  const anyOffice = floorPlanData.value.features.find(
    (f) => f.properties.type && f.properties.type.includes('office'),
  )
  const firstPolygon = floorPlanData.value.features.find((f) => f.geometry.type === 'Polygon')

  startId.value = entrance?.properties?.id || firstPolygon?.properties?.id || ''
  endId.value = anyOffice?.properties?.id || (firstPolygon && firstPolygon.properties.id) || ''

  // default selected floor
  selectedFloor.value =
    floorPlanData.value.features.find((f) => f.properties.floor && f.properties.floor !== 'LINK')
      ?.properties?.floor || selectedFloor.value
})

// ----------------- Helpers -----------------

// polygonFeatures: list of polygon features (rooms, corridors, stairs, etc.)
const polygonFeatures = computed(() =>
  (floorPlanData.value?.features || []).filter((f) => f.geometry.type === 'Polygon'),
)
console.log(polygonFeatures)

// roomLabels: compute center lat-lng for polygons on selected floor
const roomLabels = computed(() => {
  if (!floorPlanData.value) return []
  return floorPlanData.value.features
    .filter((f) => f.geometry.type === 'Polygon' && f.properties.floor === selectedFloor.value)
    .map((f) => {
      const centerXY = polygonCenterXY(f.geometry.coordinates[0]) // [x,y]
      return {
        id: f.properties.id,
        name: f.properties.name || f.properties.id,
        latlng: xyToLatLng(centerXY),
      }
    })
})

// filteredFeatures for the current floor as GeoJSON (computed)
const filteredFeatures = computed(() => {
  if (!floorPlanData.value) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: floorPlanData.value.features.filter(
      (f) => f.properties.floor === selectedFloor.value,
    ),
  }
})

// Convert polygon center (simple average) -> returns [x,y]
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
// Convert [x,y] -> [lat,lng] for Leaflet (we map x->lng, y->lat => swap)
function xyToLatLng([x, y]) {
  return [y, x]
}
function latLngToXY([lat, lng]) {
  return [lng, lat]
}

// Euclidean distance between centers (x,y)
function distXY(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}

// helper: produce order mapping for floors (EG=0, 1OG=1, 2OG=2)
function floorOrderMap() {
  const map = {}
  const floors = availableFloors.value.slice().sort() // simple sort might be fine for EG/1OG/2OG
  floors.forEach((f, idx) => (map[f] = idx))
  // ensure EG->0, 1OG->1, 2OG->2 if present
  if ('EG' in map === false && floors.length) {
    /* leave as is */
  }
  return map
}

// ----------------- Graph building -----------------
function buildGraph() {
  const features = floorPlanData.value.features
  // nodes: id -> { id, name, type, floor, center: [x,y], neighbors: Set }
  const nodes = new Map()

  // create nodes for polygon features
  for (const f of features) {
    if (f.geometry.type === 'Polygon') {
      const id = f.properties.id
      const center = polygonCenterXY(f.geometry.coordinates[0])
      nodes.set(id, {
        id,
        name: f.properties.name || id,
        type: f.properties.type || null,
        floor: f.properties.floor || null,
        center,
        neighbors: new Set(),
      })
    }
  }

  // connect corridors to all polygons on same floor (simple model)
  for (const f of features) {
    if (f.properties.type === 'corridor') {
      const corridorId = f.properties.id
      for (const r of features) {
        if (r.geometry.type === 'Polygon' && r.properties.floor === f.properties.floor) {
          const rid = r.properties.id
          if (rid !== corridorId) {
            nodes.get(corridorId)?.neighbors.add(rid)
            nodes.get(rid)?.neighbors.add(corridorId)
          }
        }
      }
    }
  }

  // add vertical connectors (features with type "connector")
  for (const conn of features.filter((f) => f.properties.type === 'connector')) {
    const connects = conn.properties.connects || []
    for (let i = 0; i < connects.length; i++) {
      for (let j = 0; j < connects.length; j++) {
        if (i === j) continue
        const a = connects[i],
          b = connects[j]
        if (nodes.has(a) && nodes.has(b)) {
          nodes.get(a).neighbors.add(b)
          // nodes.get(b).neighbors.add(a); // already handled by pair loops, but safe to add as well
          nodes.get(b).neighbors.add(a)
        }
      }
    }
  }

  // Convert neighbors Sets to arrays for simpler consumption
  const graph = {}
  for (const [id, node] of nodes) {
    graph[id] = {
      id,
      name: node.name,
      type: node.type,
      floor: node.floor,
      center: node.center,
      neighbors: Array.from(node.neighbors),
    }
  }
  return graph
}

// A* implementation using centers (returns array of node ids)
function aStar(graph, startId, goalId) {
  if (!graph[startId] || !graph[goalId]) return []

  const open = new Set([startId])
  const cameFrom = {}
  const gScore = {}
  const fScore = {}

  Object.keys(graph).forEach((k) => {
    gScore[k] = Infinity
    fScore[k] = Infinity
  })
  gScore[startId] = 0
  fScore[startId] = distXY(graph[startId].center, graph[goalId].center)

  while (open.size > 0) {
    // node in open with lowest fScore
    let current = null
    for (const n of open) {
      if (current === null || (fScore[n] ?? Infinity) < (fScore[current] ?? Infinity)) current = n
    }

    if (current === goalId) {
      // reconstruct path
      const path = [current]
      while (cameFrom[current]) {
        current = cameFrom[current]
        path.unshift(current)
      }
      return path
    }

    open.delete(current)

    for (const neighbor of graph[current].neighbors) {
      const tentativeG =
        (gScore[current] ?? Infinity) + distXY(graph[current].center, graph[neighbor].center)
      if (tentativeG < (gScore[neighbor] ?? Infinity)) {
        cameFrom[neighbor] = current
        gScore[neighbor] = tentativeG
        fScore[neighbor] = tentativeG + distXY(graph[neighbor].center, graph[goalId].center)
        open.add(neighbor)
      }
    }
  }

  return [] // no path found
}

// ----------------- Route calculation and instruction building -----------------
function calculateRoute() {
  stepInstructions.value = []
  totalDistance.value = 0
  if (!floorPlanData.value) {
    console.warn('No GeoJSON loaded yet')
    return
  }
  if (!startId || !endId || !startId.value || !endId.value) {
    alert('Bitte Start- und Zielraum auswählen.')
    return
  }

  const graph = buildGraph()
  const pathIds = aStar(graph, startId.value, endId.value)
  console.log(graph)

  if (!pathIds || pathIds.length === 0) {
    stepInstructions.value = [{ icon: '⚠️', text: 'Keine Route gefunden.' }]
    currentPathCoords.value = []
    return
  }

  // build polyline coordinates (only for rendering: convert centers -> latlng)
  const fullCoords = pathIds.map((id) => xyToLatLng(graph[id].center))
  currentPathCoords.value = fullCoords

  // build turn-by-turn-like instructions
  const steps = []
  let total = 0
  for (let i = 0; i < pathIds.length; i++) {
    const id = pathIds[i]
    const node = graph[id]
    const prevId = pathIds[i - 1]
    const nextId = pathIds[i + 1]

    if (i === 0) {
      steps.push({
        icon: '🚶‍♂️',
        text: `Starte bei ${node.name} (${node.floor})`,
      })
    } else if (i === pathIds.length - 1) {
      // distance from prev to current
      const d = distXY(graph[prevId].center, node.center)
      total += d
      steps.push({
        icon: '🎯',
        text: `Du hast ${node.name} erreicht (${node.floor})`,
        distance: d,
      })
    } else {
      const d = distXY(graph[prevId].center, node.center)
      total += d

      // If floor changes between prev and next via this node => treat as vertical move
      const prev = graph[prevId]
      const next = graph[nextId]
      if (node.type === 'stairs' || node.type === 'elevator') {
        // determine direction up/down using floor order map
        const order = floorOrderMap()
        const prevLevel = order[prev?.floor] ?? 0
        const nextLevel = order[next?.floor] ?? prevLevel
        if ((nextLevel ?? prevLevel) > prevLevel) {
          steps.push({
            icon: '⬆',
            text: `Nimm die Treppe/Aufzug nach ${next?.floor}`,
            distance: d,
          })
        } else if ((nextLevel ?? prevLevel) < prevLevel) {
          steps.push({
            icon: '⬇',
            text: `Nimm die Treppe/Aufzug nach ${next?.floor}`,
            distance: d,
          })
        } else {
          steps.push({
            icon: node.type === 'elevator' ? '🛗' : '⬆',
            text: `Gehe zu ${node.name}`,
            distance: d,
          })
        }
      } else if (node.type === 'corridor') {
        steps.push({
          icon: '➡️',
          text: `Gehe durch ${node.name} (${node.floor})`,
          distance: d,
        })
      } else if (
        (node.type || '').includes('office') ||
        node.type === 'canteen' ||
        node.type === 'kitchen'
      ) {
        steps.push({
          icon: '🏢',
          text: `Gehe zu ${node.name} (${node.floor})`,
          distance: d,
        })
      } else {
        steps.push({
          icon: '➡️',
          text: `Gehe zu ${node.name} (${node.floor})`,
          distance: d,
        })
      }
    }
  }

  // Total meters (assuming 1 unit ~ 1 m)
  totalDistance.value = Math.round(total)
  stepInstructions.value = steps
}

// path segments for selected floor: we split full path (currentPathCoords) by consecutive centers and only show segments where both ends belong to selected floor
const pathSegmentsForSelectedFloor = computed(() => {
  if (!floorPlanData.value || !currentPathCoords.value.length) return []
  const graph = buildGraph()
  // build array of node ids along current path by matching positions (fragile but fine for demo)
  // Instead use A* result again to get node ids; simpler: compute ids from stepInstructions text? Instead, let's recompute pathIds from start/end:
  const pathIds = aStar(buildGraph(), startId.value, endId.value)
  if (!pathIds || pathIds.length < 2) return []

  const segs = []
  for (let i = 0; i < pathIds.length - 1; i++) {
    const a = graph[pathIds[i]]
    const b = graph[pathIds[i + 1]]
    if (!a || !b) continue
    if (a.floor === selectedFloor.value && b.floor === selectedFloor.value) {
      segs.push([xyToLatLng(a.center), xyToLatLng(b.center)])
    }
  }
  return segs
})
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
