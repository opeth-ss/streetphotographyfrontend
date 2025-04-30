import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const UserList = () => import('../views/UserList.vue');
const Dashboard = () => import('../views/Dashboard.vue');
const Calculator = () => import('../views/Calculator.vue');
const Class = () => import('../views/TypeClass.vue');


const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: UserList,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true },
      },
      {
        path: '/calculator',
        name: 'Calculator',
        component: Calculator,
        meta: { requiresAuth: true },
      },
      {
        path: '/class',
        name: 'Class',
        component: Class,
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth only if not authenticated
  if (!authStore.isAuthenticated) {
    await authStore.initializeAuth();
  }

  // Handle guest-only routes (login/register)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next(authStore.role === 'admin' ? '/' : '/dashboard');
  }

  // Handle protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  // Handle admin-only routes
  if (to.meta.requiresAdmin && authStore.role !== 'admin') {
    return next('/dashboard');
  }

  // Allow access in all other cases
  next();
});

export default router;