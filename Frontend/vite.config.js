import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: true, // Exposes on local network so second laptop/mobile can connect
    port: 5173,
    open: false
  }
});
