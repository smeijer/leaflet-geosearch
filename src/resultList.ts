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
}

export default class ResultList {
  handleClick?: (args: { result: SearchResult }) => void;
  selected = -1;
  results: SearchResult[] = [];

  container: HTMLDivElement;
  resultItem: HTMLDivElement;
  notFoundMessage?: HTMLDivElement;
  notFoundClassName?: string;

  constructor({
    handleClick,
    classNames = {},
    notFoundMessage,
  }: ResultListProps) {
    this.handleClick = handleClick;
    this.notFoundClassName = classNames.notfound;
    this.setNotFoundMessage(notFoundMessage);

    this.container = createElement<HTMLDivElement>(
      'div',
      cx('results', classNames.resultlist),
    );
    this.container.addEventListener('click', this.onClick, true);

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
      child.innerHTML = resultFormat({ result });
      this.container.appendChild(child);
    });

    if (results.length > 0) {
      addClassName(this.container.parentElement, 'open');
      addClassName(this.container, 'active');
    } else if (!!this.notFoundMessage) {
      this.container.appendChild(this.notFoundMessage);
      addClassName(this.container.parentElement, 'open');
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
      this.notFoundMessage = createElement<HTMLDivElement>(
        'div',
        cx(this.notFoundClassName),
      );
    }
    this.notFoundMessage.innerHTML = html;
  }

  select(index: number): SearchResult {
    Array.from(this.container.children).forEach((child, idx) =>
      idx === index
        ? addClassName(child, 'active')
        : removeClassName(child, 'active'),
    );

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
