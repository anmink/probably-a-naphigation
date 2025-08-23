<script setup>
import { useLocationsStore } from '@/stores/locations'

const locationsStore = useLocationsStore()
</script>

<template>
  <h1>You did it!</h1>
  <p>home</p>
  <p>{{ locationsStore.locations }}</p>
</template>

<style scoped></style>
