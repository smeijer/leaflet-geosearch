import { createElement, addClassName, removeClassName, cx, stopPropagation, replaceClassName } from './domUtils';
import { ESCAPE_KEY, ENTER_KEY } from './constants';

interface SearchElementProps {
  searchLabel?: string;
  handleSubmit: () => void;
  classNames?: {
    container?: string;
    form?: string;
    input?: string;
  };
}

export default class SearchElement {
  container: HTMLDivElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  handleSubmit: (args: { query: string }) => void;
  hasError = false;

  constructor({ handleSubmit, searchLabel, classNames = {} }: SearchElementProps) {
    this.container = createElement<HTMLDivElement>('div', cx('geosearch', classNames.container));

    this.form = createElement<HTMLFormElement>('form', ['', classNames.form].join(' '), this.container, {
      autocomplete: 'none',
    });

    this.input = createElement<HTMLInputElement>('input', ['glass', classNames.input].join(' '), this.form, {
      type: 'text',
      placeholder: searchLabel || 'search',
      onInput: this.onInput,
      onKeyUp: this.onKeyUp,
      onKeyPress: this.onKeyPress,
      onFocus: this.onFocus,
      onBlur: this.onBlur,
    });

    this.handleSubmit = handleSubmit;
  }

  onFocus(): void {
    addClassName(this.form, 'active');
  }

  onBlur(): void {
    removeClassName(this.form, 'active');
  }

  async onSubmit(event: Event): Promise<void> {
    stopPropagation(event);
    replaceClassName(this.container, 'error', 'pending');

    await this.handleSubmit({ query: this.input.value });
    removeClassName(this.container, 'pending');
  }

  onInput(): void {
    if (!this.hasError) {
      return;
    }

    removeClassName(this.container, 'error');
    this.hasError = false;
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.keyCode !== ESCAPE_KEY) {
      return;
    }

    removeClassName(this.container, ['pending', 'active']);

    this.input.value = '';

    document.body.focus();
    document.body.blur();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.keyCode !== ENTER_KEY) {
      return;
    }

    this.onSubmit(event);
  }

  setQuery(query: string): void {
    this.input.value = query;
  }
}
