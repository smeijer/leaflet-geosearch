#Leaflet.GeoSearch
Adds support for address lookup to Leaflet. This fork adds a Leaflet-style widget to the [original repo](https://github.com/smeijer/L.GeoSearch):

![One](/screenshots/one.png)
![Two](/screenshots/two.png)
![Three](/screenshots/three.png)
![Four](/screenshots/four.png)
![Five](/screenshots/five.png)

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

#Using the control

For example, Esri:

```js
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Esri()
}).addTo(map);
```

Google:

```js
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google()
}).addTo(map);
```

OpenStreetMap:

```js
new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.OpenStreetMap()
}).addTo(map);
```
