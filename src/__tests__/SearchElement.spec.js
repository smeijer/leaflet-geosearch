import SearchElement from '../SearchElement';

test('Can localize texts', () => {
  const searchLabel = 'Lookup address';

  const control = new SearchElement({
    searchLabel,
  });

  expect(control.input.getAttribute('placeholder')).toEqual(searchLabel);
});

test('It will search when enter key is pressed', () => {
  const query = { query: 'Nederland' };

  const handleSubmit = jest.fn(async () => query);

  const control = new SearchElement({
    handleSubmit: handleSubmit(),
  });

  control.onSubmit = jest.fn();

  control.input.dispatchEvent(
    new KeyboardEvent('keypress', {
      keyCode: 13,
    }),
  );

  expect(control.onSubmit).toHaveBeenCalled();
});
