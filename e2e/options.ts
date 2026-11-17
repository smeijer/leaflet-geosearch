// The Leaflet version is a project option: playwright.config.ts makes one
// project per browser and Leaflet version
import { test as base } from '@playwright/test';

export interface E2EOptions {
  leaflet: string;
}

export const test = base.extend<E2EOptions>({
  leaflet: ['leaflet', { option: true }],
});
