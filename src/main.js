import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { ToastService } from 'primevue'
import ConfirmationService from 'primevue/confirmationservice';

const app = createApp(App)
const pinia = createPinia();

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
    },
  },
})
app.use(pinia);
app.use(ToastService);
app.use(ConfirmationService);
app.mount('#app')
