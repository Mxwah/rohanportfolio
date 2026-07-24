import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Single-page React app. No SSR, no server — everything renders in the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
