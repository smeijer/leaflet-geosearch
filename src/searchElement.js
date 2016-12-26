import { createElement, addClassName, removeClassName } from './domUtils';
import { ESCAPE_KEY, ENTER_KEY } from './constants';

export default class SearchElement {
  constructor({ handleSubmit = () => {}, searchLabel = 'search', classNames = {} } = {}) {
    const container = createElement('div', ['geosearch', classNames.container].join(' '));
    const form = createElement('form', ['', classNames.form].join(' '), container);
    const input = createElement('input', ['glass', classNames.input].join(' '), form);

    input.type = 'text';
    input.placeholder = searchLabel;

    input.addEventListener('input', (e) => { this.onInput(e); }, false);
    input.addEventListener('keyup', (e) => { this.onKeyUp(e); }, false);
    input.addEventListener('keypress', (e) => { this.onKeyPress(e); }, false);
    input.addEventListener('focus', (e) => { this.onFocus(e); }, false);
    input.addEventListener('blur', (e) => { this.onBlur(e); }, false);

    this.elements = { container, form, input };
    this.handleSubmit = handleSubmit;
  }

  onFocus() {
    addClassName(this.elements.form, 'active');
  }

  onBlur() {
    removeClassName(this.elements.form, 'active');
  }

  async onSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    const { input, container } = this.elements;
    removeClassName(container, 'error');
    addClassName(container, 'pending');

    await this.handleSubmit({ query: input.value });
    removeClassName(container, 'pending');
  }

  onInput() {
    const { container } = this.elements;

    if (this.hasError) {
      removeClassName(container, 'error');
      this.hasError = false;
    }
  }

  onKeyUp(event) {
    const { container, input } = this.elements;

    if (event.keyCode === ESCAPE_KEY) {
      removeClassName(container, 'pending');
      removeClassName(container, 'active');

      input.value = '';

      document.body.focus();
      document.body.blur();
    }
  }

  onKeyPress(event) {
    if (event.keyCode === ENTER_KEY) {
      this.onSubmit(event);
    }
  }

  setQuery(query) {
    const { input } = this.elements;
    input.value = query;
  }
}
