<template>
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <ProgressSpinner style="width: 100px; height: 100px" strokeWidth="8" fill="transparent" animationDuration=".5s"
            aria-label="Custom ProgressSpinner" />
    </div>
</template>


<script setup>
import ProgressSpinner from 'primevue/progressspinner';
const props = defineProps({
    loading: {
        type: Boolean,
        required: true
    }
});
</script>






