<template>
    <div class="layout">
      <!-- Only render NavBar if user is authenticated -->
      <nav-bar v-if="authStore.isAuthenticated" />
      <main>
        <router-view />
      </main>
    </div>
  </template>
  
  <script setup>
  import { useAuthStore } from '../stores/auth';
  import NavBar from '../components/NavBar.vue';
  
  const authStore = useAuthStore();
  </script>
  
  <style scoped>
  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  main {
    flex: 1;
    padding: 1rem;
    margin-top: 60px; /* Ensure content is not overlapped by fixed navbar */
  }
  </style>