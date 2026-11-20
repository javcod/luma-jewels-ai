import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    // "forks" pool hangs in some environments; threads works reliably
    pool: "threads",
  },
});
