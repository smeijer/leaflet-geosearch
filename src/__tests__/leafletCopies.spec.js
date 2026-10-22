import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

// #253 / #167: the map is created with another copy of Leaflet than the one
// this package imports. Leaflet objects of one copy fail the instanceof checks
// of the other, so fitBounds used to throw "Bounds are not valid".

const result = {
  x: 4.3,
  y: 52.08,
  label: 'Den Haag',
  bounds: [
    [52.0, 4.2],
    [52.1, 4.4],
  ],
  raw: {},
};

// evaluates the Leaflet bundle once more, like a second <script> tag or a
// second copy in node_modules would
function otherLeaflet() {
  const require = createRequire(import.meta.url);
  const source = readFileSync(
    require.resolve('leaflet/dist/leaflet-src.js'),
    'utf8',
  );
  const module = { exports: {} };
  new Function('exports', 'module', source)(module.exports, module);
  // loading sets window.L to the new copy; give the global back
  return module.exports.noConflict();
}

async function setup(options = {}) {
  const OtherL = otherLeaflet();
  expect(OtherL.LatLngBounds).not.toBe(L.LatLngBounds);

  const div = document.createElement('div');
  div.id = randomId();
  div.style.width = '400px';
  div.style.height = '300px';
  document.body.appendChild(div);

  const map = OtherL.map(div, { center: [0, 0], zoom: 2 });
  const provider = { search: vi.fn(async () => [result]) };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return { map, control };
}

describe('a map from another copy of Leaflet', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('results with bounds move the map without throwing (#253)', async () => {
    const { map, control } = await setup({ animateZoom: false });

    await expect(control.onSubmit({ query: 'den' })).resolves.toBeUndefined();

    const center = map.getCenter();
    expect(center.lat).toBeCloseTo(52.05, 1);
    expect(center.lng).toBeCloseTo(4.3, 1);
  });

  test('results without bounds move the map', async () => {
    const { map, control } = await setup({ animateZoom: false });
    control.options.provider.search.mockResolvedValueOnce([
      { ...result, bounds: null },
    ]);

    await control.onSubmit({ query: 'den' });

    expect(map.getCenter().lat).toBeCloseTo(52.08, 5);
    expect(map.getZoom()).toEqual(18);
  });
});
