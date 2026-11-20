import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  // Minimal Vitest config — reuses this same Vite config (aliases, plugins)
  // rather than a separate vitest.config.js. jsdom only; no coverage
  // tooling/thresholds added — deliberately small footprint, see
  // src/test/README.md for what is/isn't covered and why.
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    // The default "forks" pool hangs in some sandboxed/restricted-process
    // environments (observed in this repo's dev environment); "threads" is
    // the reliable choice here and has no downside for a suite this small.
    pool: "threads",
  },
});
