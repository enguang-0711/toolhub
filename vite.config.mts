import type { UserConfig, ConfigEnv } from 'vite';
import { loadEnv } from 'vite';
import { resolve } from 'path';
import { wrapperEnv } from './build/utils';
import { createVitePlugins } from './build/vite/plugin';
import { OUTPUT_DIR } from './build/constant';
import { createProxy } from './build/vite/proxy';
import pkg from './package.json';
import { createHtmlPlugin } from 'vite-plugin-html';
import { format } from 'date-fns';
const { dependencies, devDependencies, name, version } = pkg;

const __APP_INFO__ = {
  pkg: { dependencies, devDependencies, name, version },
  lastBuildTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
};

function pathResolve(dir: string) {
  return resolve(process.cwd(), dir);
}

export default ({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = wrapperEnv(env);
  const { VITE_PUBLIC_PATH: configuredPublicPath, VITE_PORT, VITE_PROXY } = viteEnv;
  const VITE_PUBLIC_PATH = process.env.GITHUB_ACTIONS ? '/toolhub/' : configuredPublicPath;
  const isBuild = command === 'build';
  return {
    base: VITE_PUBLIC_PATH,
    esbuild: {},
    resolve: {
      alias: [
        { find: /\/#\//, replacement: pathResolve('types') + '/' },
        { find: /^@\//, replacement: pathResolve('src') + '/' },
      ],
      dedupe: ['vue'],
    },
    plugins: [...createVitePlugins(viteEnv, isBuild), createHtmlPlugin({ inject: { data: { title: 'Toolhub 管理台' } } })],
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      __APP_INFO__: JSON.stringify(__APP_INFO__),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    server: { host: true, port: VITE_PORT, proxy: createProxy(VITE_PROXY) },
    optimizeDeps: { include: [] },
    build: {
      target: 'es2020',
      cssTarget: 'chrome80',
      outDir: OUTPUT_DIR,
      emptyOutDir: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: {
          admin: resolve(root, 'index.html'),
          audioEditor: resolve(root, 'tools/audio-match-editor/index-standalone.html'),
        },
        treeshake: {
          moduleSideEffects: (id) => id.includes('node_modules') ? true : !/[\\/]mock[\\/]/.test(id),
        },
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/node_modules/vue/') || id.includes('/node_modules/@vue/')) return 'vue';
            if (id.includes('/node_modules/vue-router/')) return 'vue-router';
            if (id.includes('/node_modules/pinia/')) return 'pinia';
            if (id.includes('/node_modules/@vueuse/')) return 'vueuse';
            if (id.includes('/node_modules/lodash-es/')) return 'lodash-es';
            if (id.includes('/node_modules/@vicons/')) return 'vicons';
            if (id.includes('/node_modules/echarts/') || id.includes('/node_modules/zrender/')) return 'echarts';
            if (id.includes('/node_modules/vuedraggable/') || id.includes('/node_modules/sortablejs/')) return 'vuedraggable';
            if (id.includes('/node_modules/@vueup/') || id.includes('/node_modules/quill/')) return 'vue-quill';
          },
        },
      },
    },
  };
};
