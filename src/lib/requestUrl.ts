/**
 * Returns the url of a provider request, or throws if it is not http or
 * https. A url like `javascript:` or `data:` could run code (Bing loads its
 * answer as a script) or answer with made up results, and the urls of the
 * providers can come from options like `host` or `searchUrl`. Relative urls
 * are resolved against the page, the way the browser would.
 */
export default function requestUrl(url: string): string {
  const base =
    typeof location !== 'undefined' ? location.href : 'http://localhost/';
  const { protocol } = new URL(url, base);

  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(
      `A provider url has to be http or https, this one is ${protocol}`,
    );
  }

  return url;
}
