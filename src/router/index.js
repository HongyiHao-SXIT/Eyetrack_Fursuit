import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '*',
    redirect: '/home'
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router