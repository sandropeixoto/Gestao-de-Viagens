import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Some firewalls block WebSockets used for HMR. 
    // If development is done behind such a firewall, 
    // HMR might fail and require manual refreshes.
    hmr: {
      protocol: 'ws',
    },
  },
})
