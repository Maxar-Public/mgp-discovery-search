/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import errorStore from './stores/errorStore';  // Import errorStore


const app = createApp(App)

//Global error handler
app.config.errorHandler = (err, instance, info) => {
    console.error("Error:", err);
    errorStore.addError({ error: err.message, info, timestamp: new Date().toISOString() });
  };

  // Optional: catch promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.error("Unhandled Rejection:", event.reason);
  errorStore.addError({ error: event.reason, info: 'Unhandled Rejection', timestamp: new Date().toISOString() });
});

registerPlugins(app)

app.mount('#app')
