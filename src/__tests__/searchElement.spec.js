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
  const handleSubmit = td.function();
  const control = new SearchElement({
    handleSubmit,
  });

  const { input } = control.elements;
  input.value = 'Nederland';
  input.dispatchEvent(new KeyboardEvent('keypress', {
    keyCode: 13,
  }));

  td.verify(handleSubmit({ query: 'Nederland' }));
});
