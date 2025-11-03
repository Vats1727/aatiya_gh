import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Using 'automatic' JSX runtime which is the default in React 17+
      // This will automatically import React when needed
      jsxRuntime: 'automatic',
      include: '**/*.{jsx,tsx}',
    })
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
