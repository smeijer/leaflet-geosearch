/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.Google uses google geocoding service
 * https://github.com/smeijer/L.GeoSearch
 */

onLoadGoogleApiCallback = function() {
    L.GeoSearch.Provider.Google.Geocoder = new google.maps.Geocoder();
    document.body.removeChild(document.getElementById('load_google_api'));
};

L.GeoSearch.Provider.Google = L.Class.extend({
    options: {

    },

    initialize: function(options) {
        options = L.Util.setOptions(this, options);
        if (!window.google || !window.google.maps)
          this.loadMapsApi();
    },

    loadMapsApi: function () {
        var url = "https://maps.googleapis.com/maps/api/js?v=3&callback=onLoadGoogleApiCallback&sensor=false";
        var script = document.createElement('script');
        script.id = 'load_google_api';
        script.type = "text/javascript";
        script.src = url;
        document.body.appendChild(script);
    },

    GetLocations: function(qry, callback) {
        var geocoder = L.GeoSearch.Provider.Google.Geocoder;

        var parameters = L.Util.extend({
            address: qry
        }, this.options);

        var results = geocoder.geocode(parameters, function(data){
            data = {results: data};

            var results = [],
                northEastLatLng,
                southWestLatLng,
                bounds;
            for (var i = 0; i < data.results.length; i++) {

                if( data.results[i].geometry.bounds ) {
                    var northEastGoogle = data.results[i].geometry.bounds.getNorthEast(),
                        southWestGoogle = data.results[i].geometry.bounds.getSouthWest();

                    northEastLatLng = new L.LatLng( northEastGoogle.lat(), northEastGoogle.lng() );
                    southWestLatLng = new L.LatLng( southWestGoogle.lat(), southWestGoogle.lng() );
                    bounds = new L.LatLngBounds([ northEastLatLng, southWestLatLng ]);
                }
                else {
                    bounds = undefined;
                }
                results.push(new L.GeoSearch.Result(
                    data.results[i].geometry.location.lng(),
                    data.results[i].geometry.location.lat(),
                    data.results[i].formatted_address,
                    bounds
                ));
            }

            if(typeof callback == 'function')
                callback(results);
        });
    },
});
