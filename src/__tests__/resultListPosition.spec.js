import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

function containerOf(options) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  const provider = { search: vi.fn(async () => []) };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return control.searchElement.container.classList;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('resultListPosition (#191, #307)', () => {
  test('opens below the input by default', () => {
    expect(containerOf({ position: 'bottomleft' })).not.toContain(
      'leaflet-geosearch-results-above',
    );
  });

  test("'above' opens above the input", () => {
    expect(containerOf({ resultListPosition: 'above' })).toContain(
      'leaflet-geosearch-results-above',
    );
  });

  test("'above' also works with the bar style", () => {
    containerOf({ resultListPosition: 'above', style: 'bar' });

    expect(
      document.querySelector('.leaflet-geosearch-bar').classList,
    ).toContain('leaflet-geosearch-results-above');
  });

  test.each([
    ['bottomleft', true],
    ['bottomright', true],
    ['topleft', false],
    ['topright', false],
  ])("'auto' with position %s opens above: %s", (position, above) => {
    const classes = containerOf({ resultListPosition: 'auto', position });

    expect(classes.contains('leaflet-geosearch-results-above')).toBe(above);
  });
});
