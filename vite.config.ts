import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['uuid'],
    include: ['katex', '@matejmazur/react-katex'],
  },
});
