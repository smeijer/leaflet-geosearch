import test from 'ava';
import td from 'testdouble';
import SearchElement from '../searchElement';

test('Can localize texts', (t) => {
  const searchLabel = 'Lookup address';

  const control = new SearchElement({
    searchLabel,
  });

  const { input } = control.elements;
  t.is(input.getAttribute('placeholder'), searchLabel);
});

test('It will search when enter key is pressed', () => {
  const query = { query: 'Nederland' };

  const handleSubmit = td.function();
  td.when(handleSubmit(query)).thenReturn(Promise.resolve(query));

  const control = new SearchElement({
    handleSubmit: handleSubmit(),
  });
  control.onSubmit = td.function();

  const { input } = control.elements;
  input.dispatchEvent(new KeyboardEvent('keypress', {
    keyCode: 13,
  }));

  td.verify(control.onSubmit(td.matchers.anything()));
});
