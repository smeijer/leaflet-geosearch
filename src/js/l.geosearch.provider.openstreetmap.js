/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.OpenStreetMap uses openstreetmap geocoding service
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.GeoSearch.Provider.OpenStreetMap = L.Class.extend({
    options: {

    },

    initialize: function(options) {
        options = L.Util.setOptions(this, options);
    },

    GetServiceUrl: function (qry) {
        var parameters = L.Util.extend({
            q: qry,
            format: 'json'
        }, this.options);

        return 'http://nominatim.openstreetmap.org/search'
            + L.Util.getParamString(parameters);
    },

    ParseJSON: function (data) {
        if (data.length == 0)
            return [];

        var results = [];
        for (var i = 0; i < data.length; i++) 
            results.push(new L.GeoSearch.Result(
                data[i].lon, 
                data[i].lat, 
                data[i].display_name
            ));
        
        return results;
    },

    GetAddresses: function(latlng, callback) {
        var lat = latlng[0];
        var lon = latlng[1];

        var parameters = L.Util.extend({
            lat: lat,
            lon: lon,
            format: 'json'
        }, this.options);

        var url = 'http://nominatim.openstreetmap.org/reverse' + L.Util.getParamString(parameters);
        $.getJSON(url, function (data) {
            var results = [];
            results.push(new L.GeoSearch.Result(
                data.lon, 
                data.lat, 
                data.display_name
            ));
            if(typeof callback == 'function')
                callback(results);
        }.bind(this));
    },
});