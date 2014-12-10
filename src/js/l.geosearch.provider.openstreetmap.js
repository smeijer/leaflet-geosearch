/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.OpenStreetMap uses openstreetmap geocoding service
 * https://github.com/smeijer/L.GeoSearch
 */

L.GeoSearch.Provider.OpenStreetMap = function (options) {

    this._config = options || {};
    var self = this;

    this.GetServiceUrl = function (qry) {
        var countryCode = self._config.countryCode || '';
        return 'http://nominatim.openstreetmap.org/search/?q=' + qry + '&format=json&countrycodes='+countryCode;
    };

    this.ParseJSON = function (data) {
        if (data.length == 0)
            return [];

        var results = [];
        for (var i = 0; i < data.length; i++) 
            results.push(new L.GeoSearch.Result(data[i].lon, data[i].lat, data[i].display_name));
        
        return results;
    };
};