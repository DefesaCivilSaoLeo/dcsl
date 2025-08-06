import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: true,
      allowedHosts: [
        '5173-if83337ddk7rsoh6m4363-dabc9ab8.manus.computer',
        '5174-ijgt1qq0jgq52axolpj9q-dabc9ab8.manus.computer',
        '5174-icvoa55xvism3kgm8l7v1-dabc9ab8.manus.computer',
        '5173-icvoa55xvism3kgm8l7v1-dabc9ab8.manus.computer',
        '5174-ifwkp4q7x7142izq5hkwf-dabc9ab8.manus.computer',
        '5175-ifwkp4q7x7142izq5hkwf-dabc9ab8.manus.computer',
        '5173-ifwkp4q7x7142izq5hkwf-dabc9ab8.manus.computer',
        '5174-iktrqvvi35bp4rwn6fadb-dabc9ab8.manus.computer',
        '5176-iktrqvvi35bp4rwn6fadb-dabc9ab8.manus.computer',
        '3000-iktrqvvi35bp4rwn6fadb-dabc9ab8.manus.computer',
        '5179-iktrqvvi35bp4rwn6fadb-dabc9ab8.manus.computer',
        '5173-i66j4q1jgja20lowjxm5s-5416ec11.manusvm.computer',
        '5178-ia52iegl3dvq7xrjhjeg6-dabc9ab8.manus.computer',
        '5174-icp2fmp5my49s5shyud9c-5416ec11.manusvm.computer',
        '5173-icp2fmp5my49s5shyud9c-5416ec11.manusvm.computer'
      ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
