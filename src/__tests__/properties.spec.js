// property-based tests: fast-check generates many inputs, also odd ones,
// and shrinks a failing input to the smallest one that still fails
import fc from 'fast-check';
import { escapeHtml } from '../domUtils';
import OpenStreetMapProvider from '../providers/openStreetMapProvider';
import { RequestType } from '../providers/provider';

// any text, and text made of html pieces, the input that matters for escaping
const text = fc.oneof(
  fc.string({ unit: 'grapheme' }),
  fc
    .array(
      fc.constantFrom(
        '<',
        '>',
        '&',
        '"',
        "'",
        '=',
        '/',
        ' ',
        'a',
        '<script>',
        '</div>',
        '<img src=x onerror=alert(1)>',
        '&amp;',
        '&lt;',
        '&#39;',
        'javascript:',
      ),
    )
    .map((pieces) => pieces.join('')),
);

describe('escapeHtml', () => {
  test('leaves no character that starts a tag or ends an attribute', () => {
    fc.assert(
      fc.property(text, (value) => {
        expect(escapeHtml(value)).not.toMatch(/[<>"']/);
      }),
      { numRuns: 500 },
    );
  });

  test('as html it is the same text and no element', () => {
    fc.assert(
      fc.property(text, (value) => {
        const div = document.createElement('div');
        div.innerHTML = escapeHtml(value);

        expect(div.children).toHaveLength(0);
        expect(div.textContent).toEqual(value);
      }),
      { numRuns: 500 },
    );
  });

  test('in an attribute it stays in that attribute', () => {
    fc.assert(
      fc.property(text, (value) => {
        const div = document.createElement('div');
        div.innerHTML = `<span title="${escapeHtml(value)}"></span>`;

        expect(div.children).toHaveLength(1);
        expect(div.children[0].attributes).toHaveLength(1);
        expect(div.children[0].getAttribute('title')).toEqual(value);
      }),
      { numRuns: 500 },
    );
  });
});

describe('provider urls', () => {
  test('the query and the params come back unchanged from the url', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: 'grapheme' }),
        fc.dictionary(
          fc.string({ unit: 'grapheme', minLength: 1 }),
          fc.string({ unit: 'grapheme' }),
        ),
        (query, params) => {
          // q and format are set by the provider itself
          delete params.q;
          delete params.format;
          const provider = new OpenStreetMapProvider({ params });
          const url = new URL(
            provider.endpoint({ query, type: RequestType.SEARCH }),
          );

          expect(url.origin + url.pathname).toEqual(
            'https://nominatim.openstreetmap.org/search',
          );
          expect(url.searchParams.get('q')).toEqual(query);
          for (const [key, value] of Object.entries(params)) {
            expect(url.searchParams.get(key)).toEqual(value);
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
