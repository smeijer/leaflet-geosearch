/// <reference types="@rsbuild/core/types" />

// replaced with strings at build time, see rspress.config.ts
declare namespace NodeJS {
  interface ProcessEnv {
    AMAP_API_KEY: string;
    BING_API_KEY: string;
    GEOAPIFY_API_KEY: string;
    GEOCODEEARTH_API_KEY: string;
    GOOGLE_API_KEY: string;
    HERE_API_KEY: string;
    LOCATIONIQ_API_KEY: string;
    MAPBOX_API_KEY: string;
    OPENCAGE_API_KEY: string;
    OPENGEOCODING_API_KEY: string;
  }
}
