import { defineConfig } from 'vite';

const fileNames = {
  es: 'geosearch.module.js',
  cjs: 'geosearch.js',
  umd: 'geosearch.umd.js',
};

export default defineConfig({
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
});
