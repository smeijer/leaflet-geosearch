/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.Google uses google geocoding service
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.GeoSearch.Provider.Google = function (options) {

    this._config = options || {};
    var self = this;

    this.GetServiceUrl = function (qry) {
        var sensor = self._config.sensor || false;
        var region = self._config.region || '';
        return 'http://maps.googleapis.com/maps/api/geocode/json?address='+qry+'&sensor='+ sensor+'&region='+region;
    };

    this.ParseJSON = function (data) {
        if (data.results.length == 0)
            return [];

        var results = [];
        for (var i = 0; i < data.results.length; i++)
            results.push(new L.GeoSearch.Result(data.results[i].geometry.location.lng, data.results[i].geometry.location.lat, data.results[i].formatted_address));

        return results;
    };
};