import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AEROBE frontend — Vite + React.
// Local dev: `npm run dev` (Vite on :3000). Serverless /api/* runs via `npx vercel dev`.
// The API client (src/services/api.ts) degrades to null/offline when /api is unavailable.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
});
