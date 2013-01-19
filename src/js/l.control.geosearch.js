/*
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.GeoSearch = {};
L.GeoSearch.Provider = {};

// MSIE needs cors support
jQuery.support.cors = true;

L.GeoSearch.Result = function (x, y, label) {
    this.X = x;
    this.Y = y;
    this.Label = label;
};

L.Control.GeoSearch = L.Control.extend({
    options: {
        position: 'topcenter'
    },

    initialize: function (options) {
        this._config = {};
        this.setConfig(options);
    },

    setConfig: function (options) {
        this._config = {
            'country': options.country || '',
            'provider': options.provider,
            
            'searchLabel': options.searchLabel || 'search for address...',
            'notFoundMessage' : options.notFoundMessage || 'Sorry, that address could not be found.',
            'messageHideDelay': options.messageHideDelay || 3000,
            'zoomLevel': options.zoomLevel || 18
        };
    },

    onAdd: function (map) {
        var $controlContainer = $(map._controlContainer);

        if ($controlContainer.children('.leaflet-top.leaflet-center').length == 0) {
            $controlContainer.append('<div class="leaflet-top leaflet-center"></div>');
            map._controlCorners.topcenter = $controlContainer.children('.leaflet-top.leaflet-center').first()[0];
        }

        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-geosearch');

        var searchbox = document.createElement('input');
        searchbox.id = 'leaflet-control-geosearch-qry';
        searchbox.type = 'text';
        searchbox.placeholder = this._config.searchLabel;
        this._searchbox = searchbox;

        var msgbox = document.createElement('div');
        msgbox.id = 'leaflet-control-geosearch-msg';
        msgbox.className = 'leaflet-control-geosearch-msg';
        this._msgbox = msgbox;

        var resultslist = document.createElement('ul');
        resultslist.id = 'leaflet-control-geosearch-results';
        this._resultslist = resultslist;

        $(this._msgbox).append(this._resultslist);
        $(this._container).append(this._searchbox, this._msgbox);

        L.DomEvent
          .addListener(this._container, 'click', L.DomEvent.stop)
          .addListener(this._container, 'keypress', this._onKeyUp, this);

        L.DomEvent.disableClickPropagation(this._container);

        return this._container;
    },
    
    geosearch: function (qry) {
        try {
            var provider = this._config.provider;

            if(typeof provider.GetLocations == 'function') {
                var results = provider.GetLocations(qry, function(results) {
                    this._showLocation(results[0].X, results[0].Y);
                }.bind(this));
            }
            else {
                var url = provider.GetServiceUrl(qry);

                $.getJSON(url, function (data) {
                    try {
                        var results = provider.ParseJSON(data);
                        if (results.length == 0)
                            throw this._config.notFoundMessage;

                        this._showLocation(results[0].X, results[0].Y);
                    }
                    catch (error) {
                        this._printError(error);
                    }
                }.bind(this));
            }
        }
        catch (error) {
            this._printError(error);
        }
    },
    
    _showLocation: function (x, y) {
        if (typeof this._positionMarker === 'undefined')
            this._positionMarker = L.marker([y, x]).addTo(this._map);
        else
            this._positionMarker.setLatLng([y, x]);

        this._map.setView([y, x], this._config.zoomLevel, false);
    },

    _printError: function(message) {
        $(this._resultslist)
            .html('<li>'+message+'</li>')
            .fadeIn('slow').delay(this._config.messageHideDelay).fadeOut('slow',
                    function () { $(this).html(''); });
    },
    
    _onKeyUp: function (e) {
        var escapeKey = 27;
        var enterKey = 13;

        if (e.keyCode === escapeKey) {
            $('#leaflet-control-geosearch-qry').val('');
            $(this._map._container).focus();
        }
        else if (e.keyCode === enterKey) {
            this.geosearch($('#leaflet-control-geosearch-qry').val());
        }
    }
});