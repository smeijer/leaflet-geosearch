import { createElement, addClassName, removeClassName, cx } from './domUtils';
import { SearchResult } from './providers/provider';

interface ResultListProps {
  handleClick: (args: { result: SearchResult }) => void;
  classNames?: {
    resultlist?: string;
    item?: string;
    notfound?: string;
  };
  notFoundMessage?: string;
  /** the input the list belongs to, it gets the combobox attributes */
  input?: HTMLInputElement;
  /** accessible name of the list */
  label?: string;
}

// ids that are unique on the page, for aria-controls and aria-activedescendant
let lists = 0;

export default class ResultList {
  handleClick?: (args: { result: SearchResult }) => void;
  selected = -1;
  results: SearchResult[] = [];

  container: HTMLDivElement;
  resultItem: HTMLDivElement;
  notFoundMessage?: HTMLDivElement;
  notFoundClassName?: string;
  input?: HTMLInputElement;
  id: string;

  constructor({
    handleClick,
    classNames = {},
    notFoundMessage,
    input,
    label,
  }: ResultListProps) {
    this.handleClick = handleClick;
    this.notFoundClassName = classNames.notfound;
    this.id = `geosearch-results-${(lists += 1)}`;
    this.setNotFoundMessage(notFoundMessage);

    // the combobox pattern of the ARIA authoring practices: the input
    // controls a listbox, arrows move aria-activedescendant
    this.container = createElement<HTMLDivElement>(
      'div',
      cx('results', classNames.resultlist),
      undefined,
      { id: this.id, role: 'listbox' },
    );
    if (label) {
      this.container.setAttribute('aria-label', label);
    }
    this.container.addEventListener('click', this.onClick, true);

    this.input = input;
    if (input) {
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-controls', this.id);
      input.setAttribute('aria-expanded', 'false');
    }

    this.resultItem = createElement<HTMLDivElement>('div', cx(classNames.item));
  }

  render(
    results: SearchResult[] = [],
    resultFormat: (args: { result: SearchResult }) => string,
  ): void {
    this.clear();

    results.forEach((result, idx) => {
      const child = this.resultItem.cloneNode(true) as HTMLDivElement;
      child.setAttribute('data-key', `${idx}`);
      child.id = `${this.id}-${idx}`;
      child.setAttribute('role', 'option');
      child.setAttribute('aria-selected', 'false');
      child.innerHTML = resultFormat({ result });
      this.container.appendChild(child);
    });

    if (results.length > 0) {
      addClassName(this.container.parentElement, 'open');
      addClassName(this.container, 'active');
      this.input?.setAttribute('aria-expanded', 'true');
    } else if (!!this.notFoundMessage) {
      this.container.appendChild(this.notFoundMessage);
      addClassName(this.container.parentElement, 'open');
      this.input?.setAttribute('aria-expanded', 'true');
    }

    this.results = results;
  }

  /** the html shown when a search finds nothing, empty shows nothing */
  setNotFoundMessage(html?: string): void {
    if (!html) {
      this.notFoundMessage?.remove();
      this.notFoundMessage = undefined;
      return;
    }

    if (!this.notFoundMessage) {
      // inside the listbox it has to be an option, a disabled one
      this.notFoundMessage = createElement<HTMLDivElement>(
        'div',
        cx(this.notFoundClassName),
        undefined,
        { role: 'option', 'aria-disabled': 'true' },
      );
    }
    this.notFoundMessage.innerHTML = html;
  }

  select(index: number): SearchResult {
    Array.from(this.container.children).forEach((child, idx) => {
      if (idx === index) {
        addClassName(child, 'active');
      } else {
        removeClassName(child, 'active');
      }
      if (child.getAttribute('role') === 'option' && child.id) {
        child.setAttribute('aria-selected', String(idx === index));
      }
    });

    const option = this.results[index]
      ? (this.container.children[index] as HTMLElement | undefined)
      : undefined;
    if (option) {
      this.input?.setAttribute('aria-activedescendant', option.id);
    } else {
      this.input?.removeAttribute('aria-activedescendant');
    }

    this.selected = index;
    return this.results[index];
  }

  count(): number {
    return this.results ? this.results.length : 0;
  }

  clear(): void {
    this.selected = -1;

    while (this.container.lastChild) {
      this.container.removeChild(this.container.lastChild);
    }

    removeClassName(this.container.parentElement, 'open');
    removeClassName(this.container, 'active');
    this.input?.setAttribute('aria-expanded', 'false');
    this.input?.removeAttribute('aria-activedescendant');
  }

  onClick = (event: Event): void => {
    if (typeof this.handleClick !== 'function') {
      return;
    }

    // the click can land on html inside the item, like the provider name or
    // markup from a custom resultFormat
    const target = (event.target as Element | null)?.closest('[data-key]');
    if (!target || !this.container.contains(target)) {
      return;
    }

    const idx = Number(target.getAttribute('data-key'));
    this.handleClick({ result: this.results[idx] });
  };
}
