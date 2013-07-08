#Leaflet.GeoSearch
Adds support for address lookup (a.k.a. geocoding / geosearching) to Leaflet.

Check out the [demo](http://smeijer.github.com/GeoSearch/)

#About the control
The control uses so called providers to take care of building the correct service url and parsing the retrieved data into an uniformal format. Thanks to this split-up, it is pretty easy to write your own providers, so you can use your own geocoding service(s).

The control comes with a default set of five providers:

  - L.GeoSearch.Provider.Bing
  - L.GeoSearch.Provider.Esri
  - L.GeoSearch.Provider.Google
  - L.GeoSearch.Provider.Nokia
  - L.GeoSearch.Provider.OpenStreetMap

Using these is pretty simple - see below:

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

Some people are really loving open source and by that I mean OpenStreetMap

````
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.OpenStreetMap()
}).addTo(map);
````

I really can't make it any harder. Checkout the providers to see how easy it is to write your own.
