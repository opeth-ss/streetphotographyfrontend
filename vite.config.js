import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server:{
    host: '0.0.0.0',
    port:5173
  },
  plugins: [vue(), tailwindcss()],
  optimizeDeps: {
    include: [
      'primevue/datatable',
      'primevue/column', 
      'primevue/rating',
      'primevue/button'
    ]
  },
  base: '/',
})
