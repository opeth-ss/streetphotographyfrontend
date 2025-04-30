<template>
    <div class="admin-links">
      <router-link to="/">User List</router-link>
      <router-link to="/dashboard">Dashboard</router-link>
      <router-link to="/calculator">Calculator</router-link>
      <button @click="$emit('logout')">Logout</button>
    </div>
  </template>
  
  <script setup>
  // No script logic needed since logout is emitted to parent
  </script>
  
  <style scoped>
  .admin-links {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .admin-links a {
    color: #fff;
    text-decoration: none;
    font-weight: 500;
  }
  
  .admin-links a:hover {
    text-decoration: underline;
  }
  
  .admin-links button {
    background-color: #ff4d4f;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .admin-links button:hover {
    background-color: #d9363e;
  }
  </style>