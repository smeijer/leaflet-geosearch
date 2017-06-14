'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _domUtils = require('./domUtils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var cx = function cx() {
  for (var _len = arguments.length, classnames = Array(_len), _key = 0; _key < _len; _key++) {
    classnames[_key] = arguments[_key];
  }

  return classnames.join(' ').trim();
};

var ResultList = function () {
  function ResultList() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$handleClick = _ref.handleClick,
        handleClick = _ref$handleClick === undefined ? function () {} : _ref$handleClick,
        _ref$classNames = _ref.classNames,
        classNames = _ref$classNames === undefined ? {} : _ref$classNames;

    _classCallCheck(this, ResultList);

    _initialiseProps.call(this);

    this.props = { handleClick: handleClick, classNames: classNames };
    this.selected = -1;

    var container = (0, _domUtils.createElement)('div', cx('results', classNames.container));
    var resultItem = (0, _domUtils.createElement)('div', cx(classNames.item));

    container.addEventListener('click', this.onClick, true);
    this.elements = { container: container, resultItem: resultItem };
  }

  _createClass(ResultList, [{
    key: 'render',
    value: function render() {
      var results = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var _elements = this.elements,
          container = _elements.container,
          resultItem = _elements.resultItem;

      this.clear();

      results.forEach(function (result, idx) {
        var child = resultItem.cloneNode(true);
        child.setAttribute('data-key', idx);
        child.innerHTML = result.label;
        container.appendChild(child);
      });

      if (results.length > 0) {
        (0, _domUtils.addClassName)(container, 'active');
      }

      this.results = results;
    }
  }, {
    key: 'select',
    value: function select(index) {
      var container = this.elements.container;

      // eslint-disable-next-line no-confusing-arrow

      Array.from(container.children).forEach(function (child, idx) {
        return idx === index ? (0, _domUtils.addClassName)(child, 'active') : (0, _domUtils.removeClassName)(child, 'active');
      });

      this.selected = index;
      return this.results[index];
    }
  }, {
    key: 'count',
    value: function count() {
      return this.results ? this.results.length : 0;
    }
  }, {
    key: 'clear',
    value: function clear() {
      var container = this.elements.container;

      this.selected = -1;

      while (container.lastChild) {
        container.removeChild(container.lastChild);
      }

      (0, _domUtils.removeClassName)(container, 'active');
    }
  }]);

  return ResultList;
}();

var _initialiseProps = function _initialiseProps() {
  var _this = this;

  this.onClick = function () {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        target = _ref2.target;

    var handleClick = _this.props.handleClick;
    var container = _this.elements.container;


    if (target.parentNode !== container || !target.hasAttribute('data-key')) {
      return;
    }

    var idx = target.getAttribute('data-key');
    var result = _this.results[idx];
    handleClick({ result: result });
  };
};

exports.default = ResultList;