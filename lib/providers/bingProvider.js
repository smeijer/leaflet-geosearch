'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodentRuntime = require('nodent-runtime');

var _nodentRuntime2 = _interopRequireDefault(_nodentRuntime);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _provider = require('./provider');

var _provider2 = _interopRequireDefault(_provider);

var _domUtils = require('../domUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Provider = function (_BaseProvider) {
  _inherits(Provider, _BaseProvider);

  function Provider() {
    _classCallCheck(this, Provider);

    return _possibleConstructorReturn(this, (Provider.__proto__ || Object.getPrototypeOf(Provider)).apply(this, arguments));
  }

  _createClass(Provider, [{
    key: 'endpoint',
    value: function endpoint() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          query = _ref.query,
          protocol = _ref.protocol,
          jsonp = _ref.jsonp;

      var params = this.options.params;


      var paramString = this.getParamString(_extends({}, params, {
        query: query,
        jsonp: jsonp
      }));

      return protocol + '//dev.virtualearth.net/REST/v1/Locations?' + paramString;
    }
  }, {
    key: 'parse',
    value: function parse(_ref2) {
      var data = _ref2.data;

      if (data.resourceSets.length === 0) {
        return [];
      }

      return data.resourceSets[0].resources.map(function (r) {
        return {
          x: r.point.coordinates[1],
          y: r.point.coordinates[0],
          label: r.address.formattedAddress,
          bounds: [[r.bbox[0], r.bbox[1]], // s, w
          [r.bbox[2], r.bbox[3]]],
          raw: r
        };
      });
    }
  }, {
    key: 'search',
    value: function search(_ref3) {
      return new Promise(function ($return, $error) {
        var query, protocol, jsonp, url, json;
        query = _ref3.query;

        protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';

        jsonp = 'BING_JSONP_CB_' + Date.now();
        url = this.endpoint({ query: query, protocol: protocol, jsonp: jsonp });

        return (0, _domUtils.createScriptElement)(url, jsonp).then(function ($await_1) {
          json = $await_1;
          return $return(this.parse({ data: json }));
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }]);

  return Provider;
}(_provider2.default);

exports.default = Provider;