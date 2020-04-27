import {
  createElement,
  addClassName,
  removeClassName,
  cx,
  stopPropagation,
  replaceClassName,
} from './domUtils';

import { ESCAPE_KEY, ENTER_KEY } from './constants';

interface SearchElementProps {
  searchLabel?: string;
  handleSubmit: (args: { query: string }) => void;
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

  constructor({
    handleSubmit,
    searchLabel,
    classNames = {},
  }: SearchElementProps) {
    this.container = createElement<HTMLDivElement>(
      'div',
      cx('geosearch', classNames.container),
    );

    this.form = createElement<HTMLFormElement>(
      'form',
      ['', classNames.form].join(' '),
      this.container,
      {
        autocomplete: 'none',
        onClick: stopPropagation,
        onDblClick: stopPropagation,
        touchStart: stopPropagation,
        touchEnd: stopPropagation,
      },
    );

    this.input = createElement<HTMLInputElement>(
      'input',
      ['glass', classNames.input].join(' '),
      this.form,
      {
        type: 'text',
        placeholder: searchLabel || 'search',
        onInput: this.onInput,
        onKeyUp: (e) => this.onKeyUp(e),
        onKeyPress: (e) => this.onKeyPress(e),
        onFocus: this.onFocus,
        onBlur: this.onBlur,

        // For some reason, leaflet is blocking the 'touchstart', manually give
        // focus to the input onClick
        // > Ignored attempt to cancel a touchstart event with cancelable=false,
        // > for example because scrolling is in progress and cannot be interrupted.
        onClick: () => {
          this.input.focus();
          this.input.dispatchEvent(new Event('focus'));
        },
      },
    );

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
