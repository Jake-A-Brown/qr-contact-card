import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      fallback: 'index.html',   // ← uncomment ONLY if you later need SPA-style 404 handling
      precompress: true          // optional: creates .gz / .br files for faster loading
    }),

    paths: {
      base: '/qr-contact-card'   // ← fix typo! should be your actual repo name
      // if repo = yourusername.github.io → base: ''
    }
  }
};

export default config;