import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AdminView from '../views/AdminView.vue'
import UserView from '../views/UserView.vue'
import FloorplanView from '../views/FloorplanView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
    },
    {
      path: '/user',
      name: 'user',
      component: UserView,
    },
    {
      path: '/floorplan',
      name: 'floorplan',
      component: FloorplanView,
    },
  ],
})

export default router
