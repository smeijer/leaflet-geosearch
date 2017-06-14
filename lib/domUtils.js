'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint-disable import/prefer-default-export */
var createElement = exports.createElement = function createElement(element) {
  var classNames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  var el = document.createElement(element);
  el.className = classNames;

  if (parent) {
    parent.appendChild(el);
  }

  return el;
};

var createScriptElement = exports.createScriptElement = function createScriptElement(url, cb) {
  var script = createElement('script', null, document.body);
  script.setAttribute('type', 'text/javascript');

  return new Promise(function (resolve) {
    window[cb] = function (json) {
      script.remove();
      delete window[cb];
      resolve(json);
    };

    script.setAttribute('src', url);
  });
};

var addClassName = exports.addClassName = function addClassName(element, className) {
  if (element && !element.classList.contains(className)) {
    element.classList.add(className);
  }
};

var removeClassName = exports.removeClassName = function removeClassName(element, className) {
  if (element && element.classList.contains(className)) {
    element.classList.remove(className);
  }
};