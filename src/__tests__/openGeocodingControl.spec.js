import { http, HttpResponse } from 'msw';
import SearchControl from '../SearchControl';
import { OpenGeocodingProvider } from '../providers/index';
import randomId from '../../test/randomId';
import autocomplete from '../providers/__tests__/openGeocodingAutocompleteResponse.json';
import retrieve from '../providers/__tests__/openGeocodingRetrieveResponse.json';

// OpenGeocoding suggestions have no coordinates, the control looks the
// picked one up again. These run the real provider against recorded answers.

function answerByPath() {
  const paths = [];
  globalThis.server.use(
    http.get('https://api.opengeocoding.com/v1/:endpoint', ({ request }) => {
      const url = new URL(request.url);
      paths.push(url.pathname);
      return HttpResponse.json(
        url.pathname === '/v1/retrieve' ? retrieve : autocomplete,
      );
    }),
  );
  return paths;
}

function setup(options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const provider = new OpenGeocodingProvider({ apiKey: 'og_key' });
  const control = new SearchControl({ provider, ...options }).addTo(map);
  const shown = [];
  map.on('geosearch/showlocation', (e) => shown.push(e));

  return { control, shown, input: control.searchElement.input };
}

const position = ({ x, y }) => [y, x];
const retrieved = [retrieve.geoCoordinates.lat, retrieve.geoCoordinates.lon];

describe('OpenGeocoding with the control', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('enter on typed text looks the first suggestion up', async () => {
    const paths = answerByPath();
    const { control, shown } = setup();

    await control.onSubmit({ query: 'Amsterd' });

    expect(paths).toEqual(['/v1/autocomplete', '/v1/retrieve']);
    expect(shown).toHaveLength(1);
    expect(position(shown[0].location)).toEqual(retrieved);
    expect(control.markers.getLayers()).toHaveLength(1);
  });

  test('a clicked suggestion is looked up by its id', async () => {
    const paths = answerByPath();
    const { control, shown, input } = setup();

    input.value = 'Amsterd';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(() =>
      expect(control.resultList.container.children).toHaveLength(
        autocomplete.suggestions.length,
      ),
    );

    control.resultList.container.children[0].click();
    await vi.waitFor(() => expect(shown).toHaveLength(1));

    expect(paths).toEqual(['/v1/autocomplete', '/v1/retrieve']);
    expect(input.value).toEqual(autocomplete.suggestions[0].displayName);
    expect(position(shown[0].location)).toEqual(retrieved);
  });
});
