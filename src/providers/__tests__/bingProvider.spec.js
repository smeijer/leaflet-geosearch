import Provider from '../bingProvider';
import fixtures from './bingResponse.json';

describe('BingProvider', () => {
  const RealDate = Date;

  function mockDate(value) {
    global.Date = class extends RealDate {
      constructor() {
        super();
        return new RealDate(value);
      }

      static now() {
        return new RealDate(value).getTime();
      }
    };
  }

  const now = RealDate.now();
  const callbackName = `BING_JSONP_CB_${now}`;

  beforeAll(() => {
    fetch.mockResponse(async () => ({
      body: `${callbackName}(${JSON.stringify(fixtures)})`,
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const domUtils = require('../../domUtils');

    jest
      .spyOn(domUtils, 'createScriptElement')
      .mockImplementation(jest.fn(async () => fixtures));
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  test('Can fetch results', async () => {
    mockDate(now);

    const provider = new Provider({
      params: {
        key: process.env.GATSBY_BING_API_KEY,
      },
    });

    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(
      fixtures.resourceSets[0].resources[0].point.coordinates[1],
    );
    expect(result.y).toEqual(
      fixtures.resourceSets[0].resources[0].point.coordinates[0],
    );
    expect(result.bounds).toBeValidBounds();
  });

  test.skip('Can get localized results', async () => {
    const provider = new Provider({
      params: {
        key: process.env.BING_API_KEY,
        c: 'nl',
      },
    });

    const results = await provider.search({ query: 'Madurodam' });
    t.is(results[0].label, 'Leeuwarden, Nederland');
  });
});
