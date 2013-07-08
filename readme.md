#Leaflet.GeoSearch
Adds support for address lookup (a.k.a. geocoding / geosearching) to Leaflet.

#About the control
The control uses providers to take care of building the correct service url and parsing the retrieved data
into a uniform format.
Thanks to this split-up, it is pretty easy to write your own providers, so you can use your own geocoding service(s).

The control comes with a default set of five providers:

  - L.GeoSearch.Provider.Bing
  - L.GeoSearch.Provider.Esri
  - L.GeoSearch.Provider.Google
  - L.GeoSearch.Provider.Nokia
  - L.GeoSearch.Provider.OpenStreetMap

Using these is pretty simple - see below:

#Using the control

For example, Esri:

````
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Esri()
}).addTo(map);
````

Google:

````
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google()
}).addTo(map);
````

OpenStreetMap:

````
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.OpenStreetMap()
}).addTo(map);
````
