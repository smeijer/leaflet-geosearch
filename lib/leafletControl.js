'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodentRuntime = require('nodent-runtime');

var _nodentRuntime2 = _interopRequireDefault(_nodentRuntime);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = LeafletControl;

var _lodash = require('lodash.debounce');

var _lodash2 = _interopRequireDefault(_lodash);

var _searchElement = require('./searchElement');

var _searchElement2 = _interopRequireDefault(_searchElement);

var _resultList = require('./resultList');

var _resultList2 = _interopRequireDefault(_resultList);

var _domUtils = require('./domUtils');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = function defaultOptions() {
  return {
    position: 'topleft',
    style: 'button',
    showMarker: true,
    showPopup: false,
    popupFormat: function popupFormat(_ref) {
      var result = _ref.result;
      return '' + result.label;
    },
    marker: {
      icon: new L.Icon.Default(),
      draggable: false
    },
    maxMarkers: 1,
    retainZoomLevel: false,
    animateZoom: true,
    searchLabel: 'Enter address',
    notFoundMessage: 'Sorry, that address could not be found.',
    messageHideDelay: 3000,
    zoomLevel: 18,
    classNames: {
      container: 'leaflet-bar leaflet-control leaflet-control-geosearch',
      button: 'leaflet-bar-part leaflet-bar-part-single',
      resetButton: 'reset',
      msgbox: 'leaflet-bar message',
      form: '',
      input: ''
    },
    autoComplete: true,
    autoCompleteDelay: 250,
    autoClose: false,
    keepResult: false,
  };
};

var Control = {
  initialize: function initialize(options) {
    var _this = this;

    this.markers = new L.FeatureGroup();

    this.options = _extends({}, defaultOptions(), options);

    var _options = this.options,
        style = _options.style,
        classNames = _options.classNames,
        searchLabel = _options.searchLabel,
        autoComplete = _options.autoComplete,
        autoCompleteDelay = _options.autoCompleteDelay;

    if (style !== 'button') {
      this.options.classNames.container += ' ' + options.style;
    }

    this.searchElement = new _searchElement2.default(_extends({}, this.options, {
      handleSubmit: function handleSubmit(query) {
        return _this.onSubmit(query);
      }
    }));

    var _searchElement$elemen = this.searchElement.elements,
        container = _searchElement$elemen.container,
        form = _searchElement$elemen.form,
        input = _searchElement$elemen.input;

    container.addEventListener('dblclick', function (e) {
      e.stopPropagation();
    });

    var button = (0, _domUtils.createElement)('a', classNames.button, container);
    button.title = searchLabel;
    button.href = '#';

    button.addEventListener('click', function (e) {
      _this.onClick(e);
    }, false);

    var resetButton = (0, _domUtils.createElement)('a', classNames.resetButton, form);
    resetButton.innerHTML = 'X';
    button.href = '#';
    resetButton.addEventListener('click', function () {
      _this.clearResults(null, true);
    }, false);

    if (autoComplete) {
      this.resultList = new _resultList2.default({
        handleClick: function handleClick(_ref2) {
          var result = _ref2.result;

          input.value = result.label;
          _this.onSubmit({ query: result.label });
        }
      });

      form.appendChild(this.resultList.elements.container);

      input.addEventListener('keyup', (0, _lodash2.default)(function (e) {
        return _this.autoSearch(e);
      }, autoCompleteDelay), true);
      input.addEventListener('keydown', function (e) {
        return _this.selectResult(e);
      }, true);
      input.addEventListener('keydown', function (e) {
        return _this.clearResults(e, true);
      }, true);
    }

    this.elements = { button: button, resetButton: resetButton };
  },
  onAdd: function onAdd(map) {
    var _options2 = this.options,
        showMarker = _options2.showMarker,
        style = _options2.style;


    this.map = map;
    if (showMarker) {
      this.markers.addTo(map);
    }

    if (style === 'bar') {
      var form = this.searchElement.elements.form;

      var root = map.getContainer().querySelector('.leaflet-control-container');

      var container = (0, _domUtils.createElement)('div', 'leaflet-control-geosearch bar');
      container.appendChild(form);
      root.appendChild(container);
      this.elements.container = container;
    }

    return this.searchElement.elements.container;
  },
  onRemove: function onRemove() {
    var container = this.elements.container;

    if (container) {
      container.remove();
    }

    return this;
  },
  onClick: function onClick(event) {
    event.preventDefault();

    var _searchElement$elemen2 = this.searchElement.elements,
        container = _searchElement$elemen2.container,
        input = _searchElement$elemen2.input;


    if (container.classList.contains('active')) {
      (0, _domUtils.removeClassName)(container, 'active');
      this.clearResults();
    } else {
      (0, _domUtils.addClassName)(container, 'active');
      input.focus();
    }
  },
  selectResult: function selectResult(event) {
    if (![_constants.ENTER_KEY, _constants.ARROW_DOWN_KEY, _constants.ARROW_UP_KEY].includes(event.keyCode)) {
      return;
    }

    event.preventDefault();

    var input = this.searchElement.elements.input;


    var list = this.resultList;
    var max = this.resultList.count() - 1;
    if (max < 0) {
      return;
    }

    // eslint-disable-next-line no-bitwise
    var next = event.code === 'ArrowDown' ? ~~list.selected + 1 : ~~list.selected - 1;
    // eslint-disable-next-line no-nested-ternary
    var idx = next < 0 ? max : next > max ? 0 : next;

    var item = list.select(idx);
    input.value = item.label;

    if (event.keyCode === _constants.ENTER_KEY) {
      this.onSubmit({ query: item.label });
    }
  },
  clearResults: function clearResults(event) {
    var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (event && event.keyCode !== _constants.ESCAPE_KEY) {
      return;
    }

    var input = this.searchElement.elements.input;
    var keepResult = this.options.keepResult;


    if (force || !keepResult) {
      input.value = '';
      this.markers.clearLayers();
    }
    this.resultList.clear();
  },
  autoSearch: function autoSearch(event) {
    return new Promise(function ($return, $error) {
      var query, provider, results;

      if (_constants.SPECIAL_KEYS.includes(event.keyCode)) {
        return $return();
      }

      query = event.target.value;
      provider = this.options.provider;


      if (query.length) {
        return provider.search({ query: query }).then(function ($await_2) {
          results = $await_2;
          this.resultList.render(results);
          return $If_1.call(this);
        }.$asyncbind(this, $error), $error);
      } else {
        this.resultList.clear();
        return $If_1.call(this);
      }

      function $If_1() {
        return $return();
      }
    }.$asyncbind(this));
  },
  onSubmit: function onSubmit(query) {
    return new Promise(function ($return, $error) {
      var provider, results;
      provider = this.options.provider;
      return provider.search(query).then(function ($await_3) {

        results = $await_3;

        if (results && results.length > 0) {
          this.showResult(results[0], query);
        }
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  },
  showResult: function showResult(result, _ref3) {
    var query = _ref3.query;
    var autoClose = this.options.autoClose;


    var markers = Object.keys(this.markers._layers);
    if (markers.length >= this.options.maxMarkers) {
      this.markers.removeLayer(markers[0]);
    }

    var marker = this.addMarker(result, query);
    this.centerMap(result);

    this.map.fireEvent('geosearch/showlocation', {
      location: result,
      marker: marker
    });

    if (autoClose) {
      this.closeResults();
    }
  },
  closeResults: function closeResults() {
    var container = this.searchElement.elements.container;


    if (container.classList.contains('active')) {
      (0, _domUtils.removeClassName)(container, 'active');
    }

    this.clearResults();
  },
  addMarker: function addMarker(result, query) {
    var _this2 = this;

    var _options3 = this.options,
        options = _options3.marker,
        showPopup = _options3.showPopup,
        popupFormat = _options3.popupFormat;

    var marker = new L.Marker([result.y, result.x], options);
    var popupLabel = result.label;

    if (typeof popupFormat === 'function') {
      popupLabel = popupFormat({ query: query, result: result });
    }
    marker.bindPopup(popupLabel);

    this.markers.addLayer(marker);

    if (showPopup) {
      marker.openPopup();
    }

    if (options.draggable) {
      marker.on('dragend', function (args) {
        _this2.map.fireEvent('geosearch/marker/dragend', {
          location: marker.getLatLng(),
          event: args
        });
      });
    }

    return marker;
  },
  centerMap: function centerMap(result) {
    var _options4 = this.options,
        retainZoomLevel = _options4.retainZoomLevel,
        animateZoom = _options4.animateZoom;


    var resultBounds = new L.LatLngBounds(result.bounds);
    var bounds = resultBounds.isValid() ? resultBounds : this.markers.getBounds();

    if (!retainZoomLevel && resultBounds.isValid()) {
      this.map.fitBounds(bounds, { animate: animateZoom });
    } else {
      this.map.setView(bounds.getCenter(), this.getZoom(), { animate: animateZoom });
    }
  },
  getZoom: function getZoom() {
    var _options5 = this.options,
        retainZoomLevel = _options5.retainZoomLevel,
        zoomLevel = _options5.zoomLevel;

    return retainZoomLevel ? this.map.getZoom() : zoomLevel;
  }
};

function LeafletControl() {
  if (!L || !L.Control || !L.Control.extend) {
    throw new Error('Leaflet must be loaded before instantiating the GeoSearch control');
  }

  var LControl = L.Control.extend(Control);

  for (var _len = arguments.length, options = Array(_len), _key = 0; _key < _len; _key++) {
    options[_key] = arguments[_key];
  }

  return new (Function.prototype.bind.apply(LControl, [null].concat(options)))();
}