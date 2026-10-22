import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

function containerOf(options) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
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

  // the bar sits at the top of the map whatever the position is (#218), so
  // a list above it would be outside the map
  test.each(['bottomleft', 'bottomright'])(
    "'auto' with the bar style opens below, even with position %s",
    (position) => {
      containerOf({ resultListPosition: 'auto', style: 'bar', position });

      expect(
        document.querySelector('.leaflet-geosearch-bar').classList,
      ).not.toContain('leaflet-geosearch-results-above');
    },
  );
});

describe('theme (#324)', () => {
  test('light by default, without a theme class', () => {
    const classes = containerOf({});

    expect([...classes].some((c) => c.includes('theme'))).toBe(false);
  });

  test.each(['dark', 'auto'])("'%s' adds its class", (theme) => {
    expect(containerOf({ theme })).toContain(
      `leaflet-geosearch-theme-${theme}`,
    );
  });

  test('the bar container gets the theme too', () => {
    containerOf({ theme: 'dark', style: 'bar' });

    expect(
      document.querySelector('.leaflet-geosearch-bar').classList,
    ).toContain('leaflet-geosearch-theme-dark');
  });
});

describe('searchIcon (#156)', () => {
  const svg =
    '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"></circle></svg>';

  test('the magnifying glass by default', () => {
    containerOf({});
    const button = document.querySelector('a.leaflet-bar-part');

    expect(button.classList).not.toContain('leaflet-geosearch-custom-icon');
    expect(button.children).toHaveLength(0);
  });

  test('puts the given html into the button', () => {
    containerOf({ searchIcon: svg });
    const button = document.querySelector('a.leaflet-bar-part');

    expect(button.classList).toContain('leaflet-geosearch-custom-icon');
    expect(button.querySelector('.leaflet-geosearch-icon svg')).not.toBeNull();
    expect(
      button
        .querySelector('.leaflet-geosearch-icon')
        .getAttribute('aria-hidden'),
    ).toEqual('true');
    // the name of the button stays
    expect(button.getAttribute('aria-label')).toEqual('Enter address');
  });
});
