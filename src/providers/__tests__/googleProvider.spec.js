import test from 'ava';
import Provider from '../googleProvider';

test('Can fetch results with Google Provider', async (t) => {
  const provider = new Provider();

  const results = await provider.search({ query: 'netherlands' });
  const result = results[0];

  t.truthy(result.label);
  t.true(result.x > 5 && result.x < 6);
  t.true(result.y > 50 && result.y < 55);
  t.true(result.bounds[0][0] > result.bounds[0][1]);
  t.true(result.bounds[1][0] > result.bounds[1][1]);
  t.true(result.bounds[0][0] < result.bounds[1][0]);
  t.true(result.bounds[0][1] < result.bounds[1][1]);
});

test('Can get localized results', async (t) => {
  const provider = new Provider({
    params: {
      language: 'nl',
    },
  });

  const results = await provider.search({ query: 'leeuwarden' });
  t.is(results[0].label, 'Leeuwarden, Nederland');
});

test.skip('Can fetch results with API Key', async (t) => {
  const provider = new Provider({
    params: {
      key: process.env.GOOGLE_API_KEY,
    },
  });

  const results = await provider.search({ query: 'nederland' });
  const result = results[0];

  t.truthy(result.label);
});
