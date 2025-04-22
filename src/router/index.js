import { createRouter, createWebHistory } from 'vue-router'

import Register from '../views/Register.vue'
import Login from '../views/Login.vue'

const routes = [
  { path: '/', name: 'Home', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/login', name: 'Login', component: Login },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router


