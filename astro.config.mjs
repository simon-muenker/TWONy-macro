// @ts-check
import { defineConfig } from "astro/config";


import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [],
  site: "https://simon-muenker.github.io",
  base: "TWONy-macro",
  vite: {
    plugins: [tailwindcss()],
  },
});
