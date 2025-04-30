import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',  // Ensure jsdom is set here
    coverage: {
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude:["src/main.js", "vite.config.js", "vitest.config.ts"],
    },
  },
})
