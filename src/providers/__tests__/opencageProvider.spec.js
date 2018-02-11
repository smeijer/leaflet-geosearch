import test from 'ava';
import Provider from '../openCageProvider';

test.skip('Can fetch results with OpenCage', async (t) => {
  const provider = new Provider({
    params: {
      key: process.env.OPENCAGE_API_KEY,
    },
  });

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

test.skip('Can get localized results', async (t) => {
  const provider = new Provider({
    params: {
      'key': process.env.OPENCAGE_API_KEY,
      'accept-language': 'nl',
    },
  });

  const results = await provider.search({ query: 'nederland' });
  t.is(results[0].label, 'Nederland');
});
