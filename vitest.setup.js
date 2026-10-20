import * as L from 'leaflet';
import { setupServer } from 'msw/node';
import './test/matchers';

globalThis.L = L;

// tests register their handlers with server.use(); unhandled requests fail the test
export const server = setupServer();
globalThis.server = server;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
