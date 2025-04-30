<template>
    <div class="user-links">
      <router-link to="/dashboard">Dashboard</router-link>
      <router-link to="/calculator">Calculator</router-link>
      <button @click="$emit('logout')">Logout</button>
    </div>
  </template>
  
  <script setup>
  // No script logic needed since logout is emitted to parent
  </script>
  
  <style scoped>
  .user-links {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .user-links a {
    color: #fff;
    text-decoration: none;
    font-weight: 500;
  }
  
  .user-links a:hover {
    text-decoration: underline;
  }
  
  .user-links button {
    background-color: #ff4d4f;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .user-links button:hover {
    background-color: #d9363e;
  }
  </style>