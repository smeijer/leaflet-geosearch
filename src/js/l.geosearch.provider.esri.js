/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.Esri uses arcgis geocoding service
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.GeoSearch.Provider.Esri = function (options) {
    
    this._config = options || {};
    var self = this;
    
    this.GetServiceUrl = function (qry) {
        var country = self._config.country || '';
        return 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=' + qry + '&sourceCountry=' + country + '&f=json';
    };

    this.ParseJSON = function (data) {
        if (data.locations.length == 0)
            return [];
        
        var results = [];
        for (var i = 0; i < data.locations.length; i++)
            results.push(new L.GeoSearch.Result(data.locations[i].feature.geometry.x, data.locations[i].feature.geometry.y, data.locations[i].name));
        
        return results;
    };
};