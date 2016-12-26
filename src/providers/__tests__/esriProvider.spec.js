import test from 'ava';
import Provider from '../esriProvider';

test('Can fetch results with Esri Provider', async (t) => {
  const provider = new Provider();

  const results = await provider.search({ query: 'nederland' });
  const result = results[0];

  t.truthy(result.label);
  t.true(result.x > 5 && result.x < 6);
  t.true(result.y > 50 && result.y < 55);
  t.true(result.bounds[0][0] > result.bounds[0][1]);
  t.true(result.bounds[1][0] > result.bounds[1][1]);
  t.true(result.bounds[0][0] < result.bounds[1][0]);
  t.true(result.bounds[0][1] < result.bounds[1][1]);
});
