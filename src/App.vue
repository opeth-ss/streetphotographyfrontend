<!-- src/App.vue -->
<template>
  <Preloader :loading="loading" />
  <router-view />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Preloader from './components/Preloader.vue';
import ConfirmDialog from 'primevue/confirmdialog';
const loading = ref(true);
onMounted(() => {
    setTimeout(() => {
        loading.value = false;
    }, 2000);
});
</script>
