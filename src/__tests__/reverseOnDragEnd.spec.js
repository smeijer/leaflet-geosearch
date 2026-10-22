import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

const found = { x: 4.9, y: 52.37, label: 'Amsterdam', bounds: null, raw: {} };
const dam = {
  x: 4.89,
  y: 52.373,
  label: 'Dam 2, Amsterdam',
  bounds: null,
  raw: {},
};

function setup(options = {}, provider) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();

  provider = provider || {
    search: vi.fn(async () => [found]),
    reverse: vi.fn(async () => [dam]),
  };
  const control = new SearchControl({
    provider,
    marker: { draggable: true },
    reverseOnDragEnd: true,
    ...options,
  }).addTo(map);

  const events = { reverse: [], error: [] };
  map.on('geosearch/marker/reverse', (e) => events.reverse.push(e));
  map.on('geosearch/error', (e) => events.error.push(e));

  return { map, control, provider, events };
}

async function dragTo(control, latlng) {
  const [marker] = control.markers.getLayers();
  marker.setLatLng(latlng);
  marker.fire('dragend');
  await vi.waitFor(() => {});
  return marker;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('reverseOnDragEnd', () => {
  test('looks up the address at the new position', async () => {
    const { control, provider, events } = setup();
    await control.onSubmit({ query: 'ams' });

    const marker = await dragTo(control, [52.373, 4.89]);
    await vi.waitFor(() => expect(events.reverse).toHaveLength(1));

    expect(provider.reverse).toHaveBeenCalledWith({ lat: 52.373, lng: 4.89 });
    expect(marker.getPopup().getContent()).toEqual('Dam 2, Amsterdam');
    expect(events.reverse[0].location).toBe(dam);
    expect(events.reverse[0].marker).toBe(marker);
    expect(events.reverse[0].provider.provider).toBe(provider);
  });

  test('is off by default', async () => {
    const { control, provider } = setup({ reverseOnDragEnd: undefined });
    await control.onSubmit({ query: 'ams' });

    await dragTo(control, [52.373, 4.89]);

    expect(provider.reverse).not.toHaveBeenCalled();
  });

  test('keepResult puts the address into the input', async () => {
    const { control, events } = setup({ keepResult: true });
    await control.onSubmit({ query: 'ams' });

    await dragTo(control, [52.373, 4.89]);
    await vi.waitFor(() => expect(events.reverse).toHaveLength(1));

    expect(control.searchElement.input.value).toEqual('Dam 2, Amsterdam');
  });

  test('uses popupFormat with the provider', async () => {
    const popupFormat = vi.fn(({ result }) => `<b>${result.label}</b>`);
    const { control, events } = setup({ popupFormat });
    await control.onSubmit({ query: 'ams' });

    const marker = await dragTo(control, [52.373, 4.89]);
    await vi.waitFor(() => expect(events.reverse).toHaveLength(1));

    expect(popupFormat).toHaveBeenLastCalledWith(
      expect.objectContaining({ result: dam, provider: expect.any(Object) }),
    );
    expect(marker.getPopup().getContent()).toEqual('<b>Dam 2, Amsterdam</b>');
  });

  test('a provider without reverse geocoding fires geosearch/error', async () => {
    const provider = { search: vi.fn(async () => [found]) };
    const { control, events } = setup({}, provider);
    await control.onSubmit({ query: 'ams' });

    await dragTo(control, [52.373, 4.89]);
    await vi.waitFor(() => expect(events.error).toHaveLength(1));

    expect(events.error[0]).toMatchObject({
      source: 'reverse',
      query: '52.373,4.89',
    });
  });

  test('a failed lookup fires geosearch/error and keeps the popup', async () => {
    const error = new Error('down');
    const provider = {
      search: vi.fn(async () => [found]),
      reverse: vi.fn(async () => {
        throw error;
      }),
    };
    const { control, events } = setup({}, provider);
    await control.onSubmit({ query: 'ams' });

    const marker = await dragTo(control, [52.373, 4.89]);
    await vi.waitFor(() => expect(events.error).toHaveLength(1));

    expect(events.error[0].error).toBe(error);
    expect(marker.getPopup().getContent()).toEqual('Amsterdam');
  });

  test('an older lookup that answers last is dropped', async () => {
    const answers = [];
    const provider = {
      search: vi.fn(async () => [found]),
      reverse: vi.fn(() => new Promise((resolve) => answers.push(resolve))),
    };
    const { control, events } = setup({}, provider);
    await control.onSubmit({ query: 'ams' });

    const marker = await dragTo(control, [52.373, 4.89]);
    await dragTo(control, [52.38, 4.9]);
    answers[1]([{ ...dam, label: 'newer' }]);
    answers[0]([{ ...dam, label: 'older' }]);
    await vi.waitFor(() => expect(events.reverse).toHaveLength(1));

    expect(marker.getPopup().getContent()).toEqual('newer');
  });
});
