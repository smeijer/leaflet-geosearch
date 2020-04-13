/* eslint-disable import/prefer-default-export */
export const createElement = (element, classNames = '', parent = null, attributes = {}) => {
  const el = document.createElement(element);
  el.className = classNames;

  Object.keys(attributes).forEach((key) => {
    el.setAttribute(key, attributes[key]);
  });

  if (parent) {
    parent.appendChild(el);
  }

  return el;
};

export const createScriptElement = (url, cb) => {
  const script = createElement('script', null, document.body);
  script.setAttribute('type', 'text/javascript');

  return new Promise((resolve) => {
    window[cb] = (json) => {
      script.remove();
      delete window[cb];
      resolve(json);
    };

    script.setAttribute('src', url);
  });
};

export const addClassName = (element, className) => {
  if (element && !element.classList.contains(className)) {
    element.classList.add(className);
  }
};

export const removeClassName = (element, className) => {
  if (element && element.classList.contains(className)) {
    element.classList.remove(className);
  }
};
