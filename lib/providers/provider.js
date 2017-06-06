'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodentRuntime = require('nodent-runtime');

var _nodentRuntime2 = _interopRequireDefault(_nodentRuntime);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Provider = function () {
  function Provider() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Provider);

    this.options = options;
  }

  _createClass(Provider, [{
    key: 'getParamString',
    value: function getParamString(params) {
      return Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
    }
  }, {
    key: 'search',
    value: function search(_ref) {
      return new Promise(function ($return, $error) {
        var query, protocol, url, request, json;
        query = _ref.query;

        protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';
        url = this.endpoint({ query: query, protocol: protocol });

        return fetch(url).then(function ($await_1) {
          request = $await_1;
          return request.json().then(function ($await_2) {
            json = $await_2;
            return $return(this.parse({ data: json }));
          }.$asyncbind(this, $error), $error);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }]);

  return Provider;
}();

exports.default = Provider;