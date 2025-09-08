<script setup></script>

<template>
  <h1>Dashy</h1>
  <p><strong>Current route path:</strong> {{ $route.fullPath }}</p>
  <nav>
    <RouterLink to="/">Go to Home</RouterLink>
    <RouterLink to="/admin">Go to Admin</RouterLink>
    <RouterLink to="/user">Go to User</RouterLink>
    <RouterLink to="/floorplan">Go to Floorplan</RouterLink>
    <RouterLink to="/floor">Go to Floor</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
nav * {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}
</style>
