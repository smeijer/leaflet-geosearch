import { createElement, addClassName, removeClassName } from './domUtils';

const cx = (...classnames) => classnames.join(' ').trim();

export default class ResultList {
  constructor({ handleClick = () => {}, classNames = {} } = {}) {
    this.props = { handleClick, classNames };
    this.selected = -1;

    const container = createElement('div', cx('results', classNames.container));
    const resultItem = createElement('div', cx(classNames.item));

    container.addEventListener('click', this.onClick, true);
    this.elements = { container, resultItem };
  }

  render(results = []) {
    const { container, resultItem } = this.elements;
    this.clear();

    results.forEach((result, idx) => {
      const child = resultItem.cloneNode(true);
      child.setAttribute('data-key', idx);
      child.innerHTML = result.label;
      container.appendChild(child);
    });

    if (results.length > 0) {
      addClassName(container, 'active');
    }

    this.results = results;
  }

  select(index) {
    const { container } = this.elements;

    // eslint-disable-next-line no-confusing-arrow
    Array.from(container.children).forEach((child, idx) => (idx === index)
      ? addClassName(child, 'active')
      : removeClassName(child, 'active'));

    this.selected = index;
    return this.results[index];
  }

  count() {
    return this.results ? this.results.length : 0;
  }

  clear() {
    const { container } = this.elements;
    this.selected = -1;

    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }

    removeClassName(container, 'active');
  }

  onClick = ({ target } = {}) => {
    const { handleClick } = this.props;
    const { container } = this.elements;

    if (target.parentNode !== container || !target.hasAttribute('data-key')) {
      return;
    }

    const idx = target.getAttribute('data-key');
    const result = this.results[idx];
    handleClick({ result });
  };
}
