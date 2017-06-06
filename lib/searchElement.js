'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodentRuntime = require('nodent-runtime');

var _nodentRuntime2 = _interopRequireDefault(_nodentRuntime);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _domUtils = require('./domUtils');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SearchElement = function () {
  function SearchElement() {
    var _this = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$handleSubmit = _ref.handleSubmit,
        handleSubmit = _ref$handleSubmit === undefined ? function () {} : _ref$handleSubmit,
        _ref$searchLabel = _ref.searchLabel,
        searchLabel = _ref$searchLabel === undefined ? 'search' : _ref$searchLabel,
        _ref$classNames = _ref.classNames,
        classNames = _ref$classNames === undefined ? {} : _ref$classNames;

    _classCallCheck(this, SearchElement);

    var container = (0, _domUtils.createElement)('div', ['geosearch', classNames.container].join(' '));
    var form = (0, _domUtils.createElement)('form', ['', classNames.form].join(' '), container);
    var input = (0, _domUtils.createElement)('input', ['glass', classNames.input].join(' '), form);

    input.type = 'text';
    input.placeholder = searchLabel;

    input.addEventListener('input', function (e) {
      _this.onInput(e);
    }, false);
    input.addEventListener('keyup', function (e) {
      _this.onKeyUp(e);
    }, false);
    input.addEventListener('keypress', function (e) {
      _this.onKeyPress(e);
    }, false);
    input.addEventListener('focus', function (e) {
      _this.onFocus(e);
    }, false);
    input.addEventListener('blur', function (e) {
      _this.onBlur(e);
    }, false);

    this.elements = { container: container, form: form, input: input };
    this.handleSubmit = handleSubmit;
  }

  _createClass(SearchElement, [{
    key: 'onFocus',
    value: function onFocus() {
      (0, _domUtils.addClassName)(this.elements.form, 'active');
    }
  }, {
    key: 'onBlur',
    value: function onBlur() {
      (0, _domUtils.removeClassName)(this.elements.form, 'active');
    }
  }, {
    key: 'onSubmit',
    value: function onSubmit(event) {
      return new Promise(function ($return, $error) {
        var _elements, input, container;

        event.preventDefault();
        event.stopPropagation();

        _elements = this.elements, input = _elements.input, container = _elements.container;

        (0, _domUtils.removeClassName)(container, 'error');
        (0, _domUtils.addClassName)(container, 'pending');

        return this.handleSubmit({ query: input.value }).then(function ($await_1) {
          (0, _domUtils.removeClassName)(container, 'pending');
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: 'onInput',
    value: function onInput() {
      var container = this.elements.container;


      if (this.hasError) {
        (0, _domUtils.removeClassName)(container, 'error');
        this.hasError = false;
      }
    }
  }, {
    key: 'onKeyUp',
    value: function onKeyUp(event) {
      var _elements2 = this.elements,
          container = _elements2.container,
          input = _elements2.input;


      if (event.keyCode === _constants.ESCAPE_KEY) {
        (0, _domUtils.removeClassName)(container, 'pending');
        (0, _domUtils.removeClassName)(container, 'active');

        input.value = '';

        document.body.focus();
        document.body.blur();
      }
    }
  }, {
    key: 'onKeyPress',
    value: function onKeyPress(event) {
      if (event.keyCode === _constants.ENTER_KEY) {
        this.onSubmit(event);
      }
    }
  }, {
    key: 'setQuery',
    value: function setQuery(query) {
      var input = this.elements.input;

      input.value = query;
    }
  }]);

  return SearchElement;
}();

exports.default = SearchElement;