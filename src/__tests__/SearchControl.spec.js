import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

function createMapInstance(options, id = randomId()) {
  const div = document.createElement('div');
  div.setAttribute('id', id);

  document.body.appendChild(div);
  const map = new L.Map(div, options);

  return { map, div, id };
}

test('Can init leaflet', () => {
  const { div, map } = createMapInstance();

  expect(div._leaflet_id).toBeDefined();
  expect(map._leaflet_id).toBeDefined();
  expect(div._leaflet_id).not.toEqual(map._leaflet_id);
  // Leaflet 1 and 2.0.0-alpha.1 mark the hooks as run, later versions count
  // them down
  expect(map._initHooksCalled ?? map._initHooksLeft === 0).toEqual(true);
});

// 2.0.0-alpha.1 runs inherited hooks once for every class of the chain, for
// any subclass of Control. Later versions mark the fix with Class.initHooks
const runsHooksTwice = L.version.startsWith('2.') && !('initHooks' in L.Class);

test.skipIf(runsHooksTwice)(
  'the init hooks of Control run once for each control',
  () => {
    const seen = [];
    L.Control.addInitHook(function () {
      seen.push({ control: this, ready: !!this.searchElement });
    });

    const control = new SearchControl({ provider: { search: vi.fn() } });

    const own = seen.filter((hook) => hook.control === control);
    expect(own).toHaveLength(1);
    // Leaflet 1 runs them inside super(), Leaflet 2 after the constructor
    expect(own[0].ready).toBe(!L.version.startsWith('1.'));
  },
);

test('Can add geosearch control to leaflet', () => {
  const { div, map } = createMapInstance();

  const provider = { search: vi.fn() };
  const control = new SearchControl({
    provider,
  }).addTo(map);

  expect(div.contains(control.searchElement.container)).toEqual(true);
});

test('It toggles the active class when the search button is clicked', () => {
  const { map } = createMapInstance();

  const provider = { search: vi.fn() };
  const control = new SearchControl({
    provider,
  }).addTo(map);

  const {
    button,
    searchElement: { container },
  } = control;

  button.click(new Event('click'));
  expect(container.className).toEqual(expect.stringMatching(/active/));

  button.click(new Event('click'));
  expect(container.className).not.toEqual(expect.stringMatching(/active/));
});

test('Shows result on submit', async () => {
  const { map } = createMapInstance();

  const query = 'some city';
  const result = [{ x: 0, y: 50 }];

  const provider = { search: vi.fn(async () => result) };

  const control = new SearchControl({
    provider,
  }).addTo(map);

  control.showResult = vi.fn();
  await control.onSubmit('some city');

  expect(control.showResult).toHaveBeenCalledWith(result[0], query);
});

test('Change view on result', () => {
  const { map } = createMapInstance({
    center: [180, 180],
    zoom: 18,
    animateZoom: false,
  });

  map.setView = vi.fn();

  const control = new SearchControl({ provider: vi.fn() }).addTo(map);

  control.showResult({ x: 50, y: 0 }, { query: 'none' });

  expect(map.setView).toHaveBeenCalled();
});

test('Default options are applied', () => {
  const control = new SearchControl({ provider: vi.fn() });

  expect(control.options).toEqual(expect.objectContaining({ style: 'button' }));
});
