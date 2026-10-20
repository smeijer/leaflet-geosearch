import { defineConfig, loadEnv } from 'vite';

const entries = {
  // the full package
  production: {
    entry: 'src/index.ts',
    formats: ['es', 'cjs', 'umd'],
    fileNames: {
      es: 'geosearch.module.js',
      cjs: 'geosearch.js',
      umd: 'geosearch.umd.js',
    },
  },
  // leaflet-geosearch/providers: providers only, doesn't import leaflet so
  // it can run on a server. built separately to keep both entries standalone
  providers: {
    entry: 'src/providers/index.ts',
    formats: ['es', 'cjs'],
    fileNames: {
      es: 'providers.module.js',
      cjs: 'providers.js',
    },
  },
};

export default defineConfig(({ mode }) => {
  const { entry, formats, fileNames } = entries[mode] || entries.production;

  return {
    // @googlemaps/js-api-loader reads process.env.NODE_ENV, which doesn't
    // exist in a browser loading the bundle with a script tag
    define: mode === 'test' ? {} : { 'process.env.NODE_ENV': '"production"' },
    build: {
      // match the syntax level of the previous microbundle output
      target: 'es2016',
      outDir: 'dist',
      // build:css and build:types write into dist in parallel
      emptyOutDir: false,
      sourcemap: true,
      minify: true,
      lib: {
        entry,
        name: 'GeoSearch',
        formats,
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
  };
});
