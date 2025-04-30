import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const UserList = () => import('../views/UserList.vue');
const Dashboard = () => import('../views/Dashboard.vue');
const Calculator = () => import('../views/Calculator.vue');

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
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
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

  // Handle protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  }
  // Redirect authenticated users from /login to appropriate page
  else if (to.path === '/login' && authStore.isAuthenticated) {
    if (authStore.getUser?.role === 'admin') {
      next('/');
    } else {
      next('/dashboard');
    }
  }
  // Redirect unauthenticated users from / to /login
  else if (to.path === '/' && !authStore.isAuthenticated) {
    next('/login');
  }
  // Allow other routes
  else {
    // Ensure admin-only routes are protected
    if (to.meta.requiresAdmin && authStore.getUser?.role !== 'admin') {
      next('/dashboard');
    } else {
      next();
    }
  }
});

export default router;