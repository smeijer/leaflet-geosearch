import { defineConfig, loadEnv } from 'vite';

const fileNames = {
  es: 'geosearch.module.js',
  cjs: 'geosearch.js',
  umd: 'geosearch.umd.js',
};

export default defineConfig(({ mode }) => ({
  build: {
    // match the syntax level of the previous microbundle output
    target: 'es2016',
    outDir: 'dist',
    // build:css and build:types write into dist in parallel
    emptyOutDir: false,
    sourcemap: true,
    minify: true,
    lib: {
      entry: 'src/index.ts',
      name: 'GeoSearch',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => fileNames[format],
    },
    rolldownOptions: {
      external: ['leaflet'],
      output: {
        exports: 'named',
        globals: { leaflet: 'L' },
      },
    },
  },
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        // provider requests are cross-origin; MSW answers them instead
        settings: {
          fetch: { disableSameOriginPolicy: true },
          // JSONP <script> tags are never loaded in tests; don't log an error for them
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
    globals: true,
    include: ['src/**/*.spec.js'],
    setupFiles: ['./vitest.setup.js'],
    // expose all .env variables (not only VITE_*) to tests through process.env
    env: loadEnv(mode, process.cwd(), ''),
  },
}));
