export function createElement<T extends HTMLElement = HTMLElement>(
  element: string,
  className: string | null = '',
  parent?: Element | null,
  attributes: { [key: string]: string | ((event: any) => void) } = {},
): T {
  const el = document.createElement(element) as T;

  if (className) {
    el.className = className;
  }

  Object.keys(attributes).forEach((key) => {
    if (typeof attributes[key] === 'function') {
      // IE doesn't support startsWith
      const type = (
        key.indexOf('on') === 0 ? key.substr(2).toLowerCase() : key
      ) as keyof HTMLElementEventMap;
      el.addEventListener(type, attributes[key] as () => void);
    } else if (key === 'html') {
      el.innerHTML = attributes[key] as string;
    } else if (key === 'text') {
      el.innerText = attributes[key] as string;
    } else {
      el.setAttribute(key, attributes[key] as string);
    }
  });

  if (parent) {
    parent.appendChild(el);
  }

  return el;
}

export function stopPropagation(event: Event) {
  event.preventDefault();
  event.stopPropagation();
}

export function createScriptElement<T = object>(
  url: string,
  cb: string,
): Promise<T> {
  const script = createElement('script', null, document.body);
  script.setAttribute('type', 'text/javascript');

  return new Promise((resolve) => {
    (window as any)[cb] = (json: T): void => {
      script.remove();
      delete (window as any)[cb];
      resolve(json);
    };

    script.setAttribute('src', url);
  });
}

export const cx = (...classNames: (string | undefined)[]): string =>
  classNames.filter(Boolean).join(' ').trim();

export function addClassName(
  element: Element | null,
  className: string | string[],
): void {
  if (!element || !element.classList) {
    return;
  }

  // IE doesn't support adding multiple classes at once :(
  const classNames = Array.isArray(className) ? className : [className];
  classNames.forEach((name) => {
    if (!element.classList.contains(name)) {
      element.classList.add(name);
    }
  });
}

export function removeClassName(
  element: Element | null,
  className: string | string[],
): void {
  if (!element || !element.classList) {
    return;
  }

  // IE doesn't support removing multiple classes at once :(
  const classNames = Array.isArray(className) ? className : [className];
  classNames.forEach((name) => {
    if (element.classList.contains(name)) {
      element.classList.remove(name);
    }
  });
}

export function replaceClassName(
  element: Element,
  find: string,
  replace: string,
): void {
  removeClassName(element, find);
  addClassName(element, replace);
}
