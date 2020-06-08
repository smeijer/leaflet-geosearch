# Leaflet.GeoSearch
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-11-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

**Demo and Docs: [smeijer.github.io/leaflet-geosearch](https://smeijer.github.io/leaflet-geosearch)**

![animation of geosearch](./docs/assets/img/geosearch.gif)

## Installation

**more docs @** https://smeijer.github.io/leaflet-geosearch/#installation

with npm:

```bash
npm install --save leaflet-geosearch
```

or yarn:

```bash
yarn add leaflet-geosearch
```

## Browser support / Polyfills

**more docs @** https://smeijer.github.io/leaflet-geosearch/#browser-support--polyfills

This library is written with the latest technologies in mind. Thereby it is required to include some polyfills when you wish to support older browsers. These polyfills are recommended for IE and Safari support:

- [babel-polyfill], for `array.includes` support.
- [unfetch], for `fetch` requests.

# About

This library adds support for geocoding _(address lookup, a.k.a. geoseaching)_
to your (web) application. It comes with controls to be embedded in your [Leaflet] map.

Check out the [docs] for various possibilities.

The library uses so-called "providers" to take care of building the correct
service URL and parsing the retrieved data into a uniform format. Thanks to this
architecture, it is pretty easy to add your own providers, so you can use
your own geocoding service(s).

The control comes with a number of default providers:

- [Algolia]
- [Bing]
- [Esri]
- [Google]
- [LocationIQ]
- [OpenCage]
- [OpenStreetMap]

Although this project is still named `leaflet-geosearch`, this library is also
usable without LeafletJS, and does not have any dependencies whatsoever.

# Usage

**more docs @** https://smeijer.github.io/leaflet-geosearch/usage

Let's first start with an little example on how to use this control without
leaflet. For example as an address lookup on a webshop order form. Perhaps to
search for the closest alternative package delivery point? Or to link it to your
own custom map component.

```js
// import
import { OpenStreetMapProvider } from 'leaflet-geosearch';

// setup
const provider = new OpenStreetMapProvider();

// search
const results = await provider.search({ query: input.value });
```

Of course, something like this should be bound to something like a form or
input:

```js
import { OpenStreetMapProvider } from 'leaflet-geosearch';

const form = document.querySelector('form');
const input = form.querySelector('input[type="text"]');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const results = await provider.search({ query: input.value });
  console.log(results); // » [{}, {}, {}, ...]
});
```

Instead of es6 `async` / `await` you can also use promises like:

```js
provider.search({ query: '...' }).then(function (result) {
  // do something with result;
});
```

## Results

The `search` event of all providers return an array of `result objects`. The
base structure is uniform between the providers. It provides a object like:

```js
const result = {
  x: Number, // lon,
  y: Number, // lat,
  label: String, // formatted address
  bounds: [
    [Number, Number], // s, w - lat, lon
    [Number, Number], // n, e - lat, lon
  ],
  raw: {}, // raw provider result
};
```

The contents of the `raw` property differ per provider. This is the unprocessed
result from the 3th party service. This property is included for developer
convenience. `leaflet-geosearch` does not use it. If you need to know the
contents of this property, you should check the 3th party developer docs. (or
use your debugger)

# Providers

When `OpenStreetMap` does not match your needs; you can also choose to use the
`Algolia`, `Bing`, `Esri`, `Google` `LocationIQ`, or `OpenCage` providers. Most of those providers do however require API
keys. See the documentation pages on the relevant organisations on how to obtain
these keys.

In case you decide to write your own provider, please consider submitting a PR
to share your work with us.

Providers are unaware of any options you can give them. They are simple proxies
to their endpoints. There is only one `special property`, and that is the `params`
option. The difference being; that `params` will be included in the endpoint url.
Often being used for `API KEYS`, where as the other attributes can be used for
provider configuration.

# Using with LeafletJS

This project comes with a leaflet control to hook the search providers into
leaflet. The example below uses the `OpenStreetMap Provider`, but you can exchange
this with on of the other included providers as well as your own custom made
providers. Remember to setup the provider with a `key` when required (Google and
Bing for example).

![search control](./docs/assets/img/searchbar.png)

```js
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider();

const searchControl = new GeoSearchControl({
  provider: provider,
});

const map = new L.Map('map');
map.addControl(searchControl);
```

## GeoSearchControl

There are some configurable options like setting the position of the search input
and whether or not a marker should be displayed at the position of the search result.

![search button](./docs/assets/img/searchbutton.png)
There are two visual styles of this control. One is the more 'leaflet-way' by
putting the search control under a button (see image above). And one where the
search control is permanently shown as a search bar (see image under
[using with LeafletJS](#using-with-leafletjs)).

**Render style**

This render style can be set by the optional `style` option.

```js
new GeoSearchControl({
  provider: myProvider, // required
  style: 'bar', // optional: bar|button  - default button
}).addTo(map);
```

**AutoComplete**

Auto complete can be configured by the parameters `autoComplete` and
`autoCompleteDelay`. A little delay is required to not DDOS the server on every
keystroke.

```js
new GeoSearchControl({
  provider: myProvider, // required
  autoComplete: true, // optional: true|false  - default true
  autoCompleteDelay: 250, // optional: number      - default 250
}).addTo(map);
```

**Show result**

There are a number of options to adjust the way results are visualized.

```js
new GeoSearchControl({
  provider: myProvider, // required
  showMarker: true, // optional: true|false  - default true
  showPopup: false, // optional: true|false  - default false
  marker: {
    // optional: L.Marker    - default L.Icon.Default
    icon: new L.Icon.Default(),
    draggable: false,
  },
  popupFormat: ({ query, result }) => result.label, // optional: function    - default returns result label
  maxMarkers: 1, // optional: number      - default 1
  retainZoomLevel: false, // optional: true|false  - default false
  animateZoom: true, // optional: true|false  - default true
  autoClose: false, // optional: true|false  - default false
  searchLabel: 'Enter address', // optional: string      - default 'Enter address'
  keepResult: false, // optional: true|false  - default false
});
```

`showMarker` and `showPopup` determine whether or not to show a marker and/or
open a popup with the location text.

`marker` can be set to any instance of a (custom) `L.Icon`.

`popupFormat` is callback function for displaying text on popup.

`maxMarker` determines how many last results are kept in memory. Default 1, but
perhaps you want to show the last `x` results when searching for new queries as
well.

`retainZoomLevel` is a setting that fixes the zoomlevel. Default behaviour is to
zoom and pan to the search result. With `retainZoomLevel` on `true`, the map is
only panned.

`animateZoom` controls whether or not the pan/zoom moment is being animated.

`autoClose` closes the result list if a result is selected by click/enter.

`keepResult` is used to keep the selected result in the search field. This prevents markers to disappear while using the `autoClose` feature.

**Events**

`geosearch/showlocation` is fired when location is chosen from the result list.

```js
map.on('geosearch/showlocation', yourEventHandler);
```

`geosearch/marker/dragend` is fired when marker has been dragged.

```js
map.on('geosearch/marker/dragend', yourEventHandler);
```

# Development

Checkout the providers to see how easy it is to write your own. For research it
can be interesting to see the difference between Bing and the others; because
Bing does not support `CORS`, and requires `jsonp` to be used instead.

In case you decide to write your own provider, please consider submitting a PR
to share your work with us.

[leaflet]: http://leafletjs.com
[docs]: https://smeijer.github.io/leaflet-geosearch
[babel-polyfill]: https://npmjs.com/babel-polyfill
[unfetch]: https://npmjs.com/unfetch
[algolia]: https://smeijer.github.io/leaflet-geosearch/providers/algolia
[bing]: https://smeijer.github.io/leaflet-geosearch/providers/bing
[esri]: https://smeijer.github.io/leaflet-geosearch/providers/esri
[google]: https://smeijer.github.io/leaflet-geosearch/providers/google
[locationiq]: https://smeijer.github.io/leaflet-geosearch/providers/locationiq
[opencage]: https://smeijer.github.io/leaflet-geosearch/providers/opencage
[openstreetmap]: https://smeijer.github.io/leaflet-geosearch/providers/openstreetmap

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/smeijer"><img src="https://avatars1.githubusercontent.com/u/1196524?v=4" width="100px;" alt=""/><br /><sub><b>Stephan Meijer</b></sub></a><br /><a href="#ideas-smeijer" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/smeijer/leaflet-geosearch/commits?author=smeijer" title="Code">💻</a> <a href="#infra-smeijer" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-smeijer" title="Maintenance">🚧</a> <a href="https://github.com/smeijer/leaflet-geosearch/commits?author=smeijer" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/yuriizinets"><img src="https://avatars2.githubusercontent.com/u/17050536?v=4" width="100px;" alt=""/><br /><sub><b>Yurii Zinets</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=yuriizinets" title="Code">💻</a> <a href="https://github.com/smeijer/leaflet-geosearch/commits?author=yuriizinets" title="Tests">⚠️</a> <a href="#ideas-yuriizinets" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/hubnerd"><img src="https://avatars1.githubusercontent.com/u/2099902?v=4" width="100px;" alt=""/><br /><sub><b>David Hubner</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=hubnerd" title="Code">💻</a></td>
    <td align="center"><a href="https://ninarski.com/"><img src="https://avatars3.githubusercontent.com/u/1941633?v=4" width="100px;" alt=""/><br /><sub><b>Nikolay Ninarski</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=ninio" title="Code">💻</a></td>
    <td align="center"><a href="http://fredrik.computer/"><img src="https://avatars1.githubusercontent.com/u/1101677?v=4" width="100px;" alt=""/><br /><sub><b>Fredrik Ekelund</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=fredrikekelund" title="Code">💻</a></td>
    <td align="center"><a href="https://blog.duraffort.fr/"><img src="https://avatars3.githubusercontent.com/u/2114999?v=4" width="100px;" alt=""/><br /><sub><b>Rémi Duraffort</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=ivoire" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/bung87"><img src="https://avatars2.githubusercontent.com/u/2238294?v=4" width="100px;" alt=""/><br /><sub><b>Bung</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=bung87" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/cajus"><img src="https://avatars3.githubusercontent.com/u/722353?v=4" width="100px;" alt=""/><br /><sub><b>Cajus Pollmeier</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=cajus" title="Code">💻</a></td>
    <td align="center"><a href="https://dandascalescu.com/"><img src="https://avatars3.githubusercontent.com/u/33569?v=4" width="100px;" alt=""/><br /><sub><b>Dan Dascalescu</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=dandv" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/devdattaT"><img src="https://avatars2.githubusercontent.com/u/4159622?v=4" width="100px;" alt=""/><br /><sub><b>Devdatta Tengshe</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=devdattaT" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/emiltem"><img src="https://avatars0.githubusercontent.com/u/2720652?v=4" width="100px;" alt=""/><br /><sub><b>emiltem</b></sub></a><br /><a href="https://github.com/smeijer/leaflet-geosearch/commits?author=emiltem" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!