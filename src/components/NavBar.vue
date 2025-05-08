<template>
  <nav class="navbar">
    <img
      class="navbar-logo"
      alt="LY logo"
    />
    <div class="nav-links">
      <user-links v-if="authStore.role === 'user'" @logout="logout" />
      <admin-links v-if="authStore.role === 'admin'" @logout="logout" />
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import UserLinks from './UserLinks.vue';
import AdminLinks from './AdminLinks.vue';

const authStore = useAuthStore();
const router = useRouter();

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, #2c3e50, #1a1a1a);
  color: #ecf0f1;
  padding: 0.75rem 1.5rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.navbar h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.05rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-links p {
  color: #bdc3c7;
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.nav-links p:hover {
  opacity: 1;
}

.navbar-logo {
  height: 100%;
  max-height: 3rem; /* prevents it from becoming too tall on larger screens */
  object-fit: contain; /* preserves aspect ratio without cropping */
}


@media (max-width: 768px) {
  .navbar {
    padding: 0.5rem 1rem;
  }

  .navbar h1 {
    font-size: 1rem;
  }

  .nav-links {
    gap: 0.5rem;
  }

  .nav-links p {
    font-size: 0.8rem;
  }
}
</style>