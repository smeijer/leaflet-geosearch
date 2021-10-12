import Provider from '../openCageProvider';

test.skip('Can fetch results with OpenCage', async () => {
  const provider = new Provider({
    params: {
      key: process.env.OPENCAGE_API_KEY,
    },
  });

  const results = await provider.search({ query: 'Madurodam' });
  const result = results[0];

  t.truthy(result.label);
  t.true(result.x > 5 && result.x < 6);
  t.true(result.y > 50 && result.y < 55);
  expect(result.bounds).toBeValidBounds();
});

test.skip('Can get localized results', async () => {
  const provider = new Provider({
    params: {
      key: process.env.OPENCAGE_API_KEY,
      'accept-language': 'nl',
    },
  });

  const results = await provider.search({ query: 'Madurodam' });
  t.is(results[0].label, 'Madurodam');
});
