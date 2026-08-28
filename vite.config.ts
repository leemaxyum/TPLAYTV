import { defineConfig } from "vite";
import { resolve } from "node:path";

// Phase 1: two entry pages, /tv and /controller.
// The dev server itself is created programmatically in server/index.ts
// (Vite runs in middleware mode inside our single Node process/Socket.IO server).
export default defineConfig({
  // "mpa" makes Vite serve/transform any nested index.html (tv/, controller/)
  // automatically — no custom catch-all route needed for Phase 1.
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        tv: resolve(__dirname, "tv/index.html"),
        controller: resolve(__dirname, "controller/index.html"),
      },
    },
  },
});
