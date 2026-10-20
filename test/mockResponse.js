import { http, HttpResponse } from 'msw';

// Answers every request with the given body, like jest-fetch-mock's
// fetch.mockResponse() did. Handlers live until the test file finishes.
export default function mockResponse(body) {
  globalThis.server.use(
    http.all(
      '*',
      () =>
        new HttpResponse(body, {
          headers: { 'Content-Type': 'application/json' },
        }),
    ),
  );
}
