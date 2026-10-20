import Provider from '../pdokNlProvider';
import fixtures from './pdokNlResponse.json';
import { mockResponse } from '../../../test';

describe('PdokNlProvider', () => {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixtures));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();

    const results = await provider.search({ query: '3e Binnenvestgracht' });
    const result = results[0];

    const position = fixtures.response.docs[0].centroide_ll
      .replace(/POINT\(|\)/g, '')
      .trim()
      .split(' ')
      .map(Number);

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(position[0]);
    expect(result.y).toEqual(position[1]);
  });
});
