import test from 'ava';
import Provider from '../algoliaProvider';

test('Can fetch results with Algolia Provider', async (t) => {
  const provider = new Provider();

  const results = await provider.search({ query: 'netherlands' });
  const result = results[0];

  t.truthy(result.label);
  t.true(result.x > 3 && result.x < 9);
  t.true(result.y > 50 && result.y < 55);
});
