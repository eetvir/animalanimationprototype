import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    sveltekit(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@mintplex-labs/piper-tts-web/dist/*.wasm',
          dest: 'assets/tts',
        },
      ],
    }),
  ],
  server: {
    headers: {
      // Enable cross-origin isolation headers
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
