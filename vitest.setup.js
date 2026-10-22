import { setupServer } from 'msw/node';
import './test/matchers';

// Leaflet needs a DOM. tests in the node environment (like ssr.spec.js)
// run without it
if (typeof window !== 'undefined') {
  globalThis.L = await import('leaflet');
}

// tests register their handlers with server.use(); unhandled requests fail the test
export const server = setupServer();
globalThis.server = server;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
