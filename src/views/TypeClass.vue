<template>
    <div>
      <h2>User Profile</h2>
      <div v-if="user">
        <p>Name: {{ user.fullName }}</p>
        <p>Email: {{ user.email }}</p>
        <p>Age: {{ user.age }}</p>
        <p>Status: {{ user.isActive ? 'Active' : 'Inactive' }}</p>
      </div>
      <button @click="updateUser">Update User</button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  // Define a TypeScript interface for the user object
  interface User {
    id: number;
    fullName: string;
    email: string;
    age: number;
    isActive: boolean;
    // Optional property
    lastLogin?: Date;
  }
  
  export default defineComponent({
    name: 'UserProfile',
    data() {
      return {
        // Initialize user object with type annotation
        user: null as User | null
      };
    },
    created() {
      // Initialize the user object
      this.user = {
        id: 1,
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        age: 30,
        isActive: true,
        lastLogin: new Date()
      };
    },
    methods: {
      updateUser(): void {
        if (this.user) {
          // TypeScript will provide autocomplete and type checking
          this.user = {
            ...this.user,
            age: this.user.age + 1,
            lastLogin: new Date()
          };
        }
      }
    }
  });
  </script>