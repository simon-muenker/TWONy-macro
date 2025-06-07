// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  site: "https://simon-muenker.github.io",
  base: "TWONy-macro",

  vite: {
    plugins: [tailwindcss()],
  },
});