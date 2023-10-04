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

  constructor({
    handleClick,
    classNames = {},
    notFoundMessage,
  }: ResultListProps) {
    this.handleClick = handleClick;
    this.notFoundMessage = !!notFoundMessage
      ? createElement<HTMLDivElement>(
          'div',
          cx(classNames.notfound),
          undefined,
          { html: notFoundMessage! },
        )
      : undefined;

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

  select(index: number): SearchResult {
    // eslint-disable-next-line no-confusing-arrow
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

    const target = event.target as HTMLDivElement;
    if (
      !target ||
      !this.container.contains(target) ||
      !target.hasAttribute('data-key')
    ) {
      return;
    }

    const idx = Number(target.getAttribute('data-key'));
    this.handleClick({ result: this.results[idx] });
  };
}
