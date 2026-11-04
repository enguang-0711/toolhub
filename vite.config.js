import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_ACTIONS ? '/toolhub/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: 'index.html',
        audioEditor: 'tools/audio-match-editor/index.html',
      },
    },
  },
});
