#Leaflet.GeoSearch
Adds support for geocoding (address lookup, a.k.a. geoseaching) to [Leaflet](leafletjs.com).

Check out the [demo](http://smeijer.github.com/GeoSearch/)

#About the control
The control uses so-called "providers" to take care of building the correct service URL and parsing
the retrieved data into a uniform format. Thanks to this architecture, it is pretty easy to write
your own providers, so you can use your own geocoding service(s).

The control comes with a default set of three providers:

  - L.GeoSearch.Provider.Esri
  - L.GeoSearch.Provider.Google
  - L.GeoSearch.Provider.OpenStreetMap

Using these is pretty simple.

#Using the control

For example, to use the Esri provider:

````
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Esri()
}).addTo(map);
````

Or if you prefer using Google

````
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google()
}).addTo(map);
````

Or, for open-source lovers who like OpenStreetMap:

````
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.OpenStreetMap()
}).addTo(map);
````

I really can't make it any easier. Check out the providers to see how easy it is to write your own.
