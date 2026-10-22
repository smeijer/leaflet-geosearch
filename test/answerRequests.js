import { http, HttpResponse } from 'msw';

// Answers every request with the given JSON body and keeps the requested
// urls, so a test can check what was asked. Handlers added later win, so
// this overrides a mockResponse from beforeAll for the rest of the file.
export default function answerRequests(body) {
  const urls = [];
  globalThis.server.use(
    http.all('*', ({ request }) => {
      urls.push(new URL(request.url));
      return HttpResponse.json(body);
    }),
  );
  return urls;
}
