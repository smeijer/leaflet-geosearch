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
        L.Util.extend(this.options, options);
        this.setConfig(options);
    },

    setConfig: function (options) {
        this._config = {
            'country': options.country || '',
            'provider': options.provider,
            
            'searchLabel': options.searchLabel || 'search for address...',
            'notFoundMessage' : options.notFoundMessage || 'Sorry, that address could not be found.',
            'messageHideDelay': options.messageHideDelay || 3000,
            'zoomLevel': options.zoomLevel || 18,
            'showAddressTooltip': typeof(options.showAddressTooltip) == "undefined" ? true:options.showAddressTooltip,
            'reverseLookup': typeof(options.reverseLookup) == "undefined" ? false:options.reverseLookup,
        };
    },

    container: function() {
        return this._container;
    },

    positionMarker: function() {
        return this._positionMarker;
    },

    config: function() {
        return this._config;
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

        this._positionMarker = L.marker(this._map.getCenter(),{
            draggable:this._config.reverseLookup && (typeof this._config.provider.GetAddresses == 'function'),
        }).addTo(this._map);
        this._map.removeLayer(this._positionMarker);
        this._positionMarker.on('dragend',this._onMarkerDrop.bind(this));

        return this._container;
    },
    
    geosearch: function (qry) {
        try {
            var provider = this._config.provider;

            if(typeof provider.GetLocations == 'function') {
                var results = provider.GetLocations(qry, function(results) {
                    this._processResults(results);
                }.bind(this));
            }
            else {
                var url = provider.GetServiceUrl(qry);

                $.getJSON(url, function (data) {
                    try {
                        var results = provider.ParseJSON(data);
                        this._processResults(results);
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

    reverse: function (lat,lng) {
        try {
            var provider = this._config.provider;

            if(typeof provider.GetAddresses == 'function') {
                var results = provider.GetAddresses([lat,lng], function(results) {
                    this._processReverseResults(results,lat,lng);
                }.bind(this));
            }
        }
        catch (error) {
            this._printError(error);
        }
    },

    _processResults: function(results) {
        if (results.length == 0)
            throw this._config.notFoundMessage;

        this._map.fireEvent('geosearch_foundlocations', {Locations: results});
        this._showLocation(results[0],results[0].Y,results[0].X);
    },

    _processReverseResults: function(results,lat,lng) {
        if( results.length ) {
            this._map.fireEvent('geosearch_foundaddresses', {Addresses: results});
            this._showLocation(results[0],lat,lng);
        } else {
            this._printError(this._config.notFoundMessage);
        }
    },

    _onMarkerDrop: function(e) {
        var latlng = e.target.getLatLng();
        this.reverse(latlng.lat,latlng.lng);
    },

    _showLocation: function (location,lat,lng) {
        this._map.removeLayer(this._positionMarker);
        this._positionMarker.setLatLng([lat, lng]);
        this._positionMarker.options.draggable = this._config.reverseLookup && (typeof this._config.provider.GetAddresses == 'function');
        if( this._config.showAddressTooltip ) {
            this._positionMarker.options.title = location.Label;
        }
        this._map.addLayer(this._positionMarker);

        this._map.setView([lat, lng], this._config.zoomLevel, false);
        this._map.fireEvent('geosearch_showlocation', {Location: location});
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