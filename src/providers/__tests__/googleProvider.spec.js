import test from 'ava';
import Provider from '../googleProvider';

async function testFetch(t) {
  const provider = new Provider({
    params: {
      key: process.env.GOOGLE_API_KEY,
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
}

async function testLocalizedResults(t) {
  const provider = new Provider({
    params: {
      key: process.env.GOOGLE_API_KEY,
      language: 'nl',
    },
  });

  const results = await provider.search({ query: 'leeuwarden' });
  t.is(results[0].label, 'Leeuwarden, Nederland');
}

if (process.env.GOOGLE_API_KEY) {
  test('Can fetch results with Google Provider', testFetch);
  test('Can get localized results', testLocalizedResults);
}
else {
  test.skip('Can fetch results with Google Provider', testFetch);
  test.skip('Can get localized results', testLocalizedResults);
}
