import test from 'ava';
import td from 'testdouble';
import LeafletControl from '../leafletControl';
import randomId from '../../test/randomId';

function createMapInstance(options, id = randomId()) {
  const div = document.createElement('div');
  div.setAttribute('id', id);

  document.body.appendChild(div);
  const map = new L.map(div, options); // eslint-disable-line new-cap

  return { map, div, id };
}

test('Can init leaflet', (t) => {
  const { div, map } = createMapInstance();

  t.truthy(div._leaflet_id);
  t.truthy(map._leaflet_id);
  t.not(div._leaflet_id, map._leaflet_id);
  t.true(map._initHooksCalled);
});

test('Can add geosearch control to leaflet', (t) => {
  const { div, map } = createMapInstance();

  const provider = { search: td.function() };
  const control = new LeafletControl({
    provider,
  }).addTo(map);

  t.true(div.contains(control.searchElement.elements.container));
});

test('It toggles the active class when the search button is clicked', (t) => {
  const { map } = createMapInstance();

  const provider = { search: td.function() };
  const control = new LeafletControl({
    provider,
  }).addTo(map);

  const { button } = control.elements;
  const { container } = control.searchElement.elements;

  button.click(new Event('click'));
  t.regex(container.className, /active/);

  button.click(new Event('click'));
  t.notRegex(container.className, /active/);
});

test('Shows result on submit', async () => {
  const { map } = createMapInstance();

  const query = 'some city';
  const result = [{ x: 0, y: 50 }];

  const provider = { search: td.function() };

  td.when(provider.search(query))
    .thenReturn(Promise.resolve(result));

  const control = new LeafletControl({
    provider,
  }).addTo(map);

  control.showResult = td.function();
  await control.onSubmit('some city');

  td.verify(control.showResult(result[0], query));
});

test('Change view on result', () => {
  const { map } = createMapInstance({
    center: [180, 180],
    zoom: 18,
    animateZoom: false,
  });

  map.setView = td.function();

  const control = new LeafletControl({
  }).addTo(map);

  control.showResult({ x: 50, y: 0 }, { query: 'none' });

  td.verify(map.setView(
    td.matchers.isA(L.LatLng),
    td.matchers.isA(Number),
    td.matchers.anything(),
  ));
});
